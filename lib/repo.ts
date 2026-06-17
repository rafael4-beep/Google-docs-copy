// Domain operations on top of the JSON store. Every mutation re-reads the DB,
// applies the change, and writes it back. Access control lives here so it is
// enforced in one place regardless of which route calls it.

import crypto from "node:crypto";
import { readDb, writeDb } from "./db";
import type {
  AccessLevel,
  Database,
  DocumentRecord,
  DocumentResult,
  DocumentSummary,
  DeleteError,
  Role,
  ShareError,
  ShareView,
  UpdateError,
  User,
} from "./types";

export const MAX_TITLE_LENGTH = 200;
export const MAX_CONTENT_BYTES = 2_000_000; // ~2MB of HTML, generous for a doc

// ---------- users ----------

export function listUsers(): User[] {
  return readDb().users;
}

export function getUser(id: string | undefined): User | null {
  return readDb().users.find((u) => u.id === id) || null;
}

export function getUserByEmail(email: string | undefined): User | null {
  if (!email) return null;
  const target = String(email).trim().toLowerCase();
  return readDb().users.find((u) => u.email.toLowerCase() === target) || null;
}

// ---------- access helpers ----------

function accessFor(db: Database, doc: DocumentRecord | undefined, userId: string): AccessLevel {
  if (!doc) return null;
  if (doc.ownerId === userId) return "owner";
  const share = db.shares.find((s) => s.documentId === doc.id && s.userId === userId);
  return share ? share.role : null;
}

export function canEdit(access: AccessLevel): boolean {
  return access === "owner" || access === "editor";
}

// ---------- document reads ----------

function excerpt(html: string, max = 160): string {
  const text = String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? text.slice(0, max).trimEnd() + "…" : text;
}

function summarize(
  db: Database,
  doc: DocumentRecord,
  userId: string,
  userMap: Record<string, User>
): DocumentSummary {
  const owner = userMap[doc.ownerId];
  return {
    id: doc.id,
    title: doc.title,
    ownerId: doc.ownerId,
    ownerName: owner ? owner.name : "Unknown",
    access: accessFor(db, doc, userId),
    excerpt: excerpt(doc.content),
    sharedCount: db.shares.filter((s) => s.documentId === doc.id).length,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

// Returns { owned, shared } for the dashboard.
export function listDocumentsForUser(userId: string): {
  owned: DocumentSummary[];
  shared: DocumentSummary[];
} {
  const db = readDb();
  const userMap: Record<string, User> = Object.fromEntries(db.users.map((u) => [u.id, u]));

  const owned = db.documents
    .filter((d) => d.ownerId === userId)
    .map((d) => summarize(db, d, userId, userMap));

  const sharedDocIds = new Set(
    db.shares.filter((s) => s.userId === userId).map((s) => s.documentId)
  );
  const shared = db.documents
    .filter((d) => d.ownerId !== userId && sharedDocIds.has(d.id))
    .map((d) => summarize(db, d, userId, userMap));

  const byUpdated = (a: DocumentSummary, b: DocumentSummary) =>
    b.updatedAt.localeCompare(a.updatedAt);
  return { owned: owned.sort(byUpdated), shared: shared.sort(byUpdated) };
}

// Full document + access info for the editor. Returns null if it does not exist,
// or { access: null } if the user has no access.
export function getDocumentForUser(id: string, userId: string): DocumentResult {
  const db = readDb();
  const doc = db.documents.find((d) => d.id === id);
  if (!doc) return null;
  const access = accessFor(db, doc, userId);
  if (!access) return { id: doc.id, access: null };

  const owner = db.users.find((u) => u.id === doc.ownerId);
  const shares: ShareView[] = db.shares
    .filter((s) => s.documentId === id)
    .map((s) => {
      const u = db.users.find((x) => x.id === s.userId);
      return { userId: s.userId, name: u?.name, email: u?.email, role: s.role };
    });

  return {
    id: doc.id,
    title: doc.title,
    content: doc.content,
    ownerId: doc.ownerId,
    ownerName: owner?.name || "Unknown",
    access,
    shares,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

// ---------- document mutations ----------

export function createDocument({
  title,
  content,
  ownerId,
}: {
  title?: string;
  content?: string;
  ownerId: string;
}): DocumentRecord {
  const db = readDb();
  const now = new Date().toISOString();
  const doc: DocumentRecord = {
    id: crypto.randomUUID(),
    title: (title && title.trim()) || "Untitled document",
    content: content || "<p></p>",
    ownerId,
    createdAt: now,
    updatedAt: now,
  };
  db.documents.push(doc);
  writeDb(db);
  return doc;
}

export function updateDocument(
  id: string,
  userId: string,
  patch: { title?: string; content?: string }
): { doc: DocumentRecord } | { error: UpdateError } {
  const db = readDb();
  const doc = db.documents.find((d) => d.id === id);
  if (!doc) return { error: "not_found" };
  const access = accessFor(db, doc, userId);
  if (!canEdit(access)) return { error: "forbidden" };

  if (patch.title !== undefined) {
    const t = String(patch.title).trim();
    if (t.length === 0) return { error: "invalid_title" };
    if (t.length > MAX_TITLE_LENGTH) return { error: "title_too_long" };
    doc.title = t;
  }
  if (patch.content !== undefined) {
    const content = String(patch.content);
    if (Buffer.byteLength(content, "utf-8") > MAX_CONTENT_BYTES) {
      return { error: "content_too_large" };
    }
    doc.content = content;
  }
  doc.updatedAt = new Date().toISOString();
  writeDb(db);
  return { doc };
}

export function deleteDocument(
  id: string,
  userId: string
): { ok: true } | { error: DeleteError } {
  const db = readDb();
  const doc = db.documents.find((d) => d.id === id);
  if (!doc) return { error: "not_found" };
  if (doc.ownerId !== userId) return { error: "forbidden" }; // only owners delete
  db.documents = db.documents.filter((d) => d.id !== id);
  db.shares = db.shares.filter((s) => s.documentId !== id);
  writeDb(db);
  return { ok: true };
}

// ---------- sharing ----------

export function shareDocument(
  id: string,
  ownerId: string,
  { email, role }: { email?: string; role?: string }
):
  | { ok: true; user: { id: string; name: string; email: string }; role: Role }
  | { error: ShareError } {
  const db = readDb();
  const doc = db.documents.find((d) => d.id === id);
  if (!doc) return { error: "not_found" };
  if (doc.ownerId !== ownerId) return { error: "forbidden" }; // only owners share

  const target = db.users.find(
    (u) => u.email.toLowerCase() === String(email || "").trim().toLowerCase()
  );
  if (!target) return { error: "user_not_found" };
  if (target.id === doc.ownerId) return { error: "cannot_share_with_owner" };

  const normalizedRole: Role = role === "editor" ? "editor" : "viewer";
  const existing = db.shares.find((s) => s.documentId === id && s.userId === target.id);
  if (existing) {
    existing.role = normalizedRole;
  } else {
    db.shares.push({
      id: crypto.randomUUID(),
      documentId: id,
      userId: target.id,
      role: normalizedRole,
      createdAt: new Date().toISOString(),
    });
  }
  writeDb(db);
  return {
    ok: true,
    user: { id: target.id, name: target.name, email: target.email },
    role: normalizedRole,
  };
}

export function unshareDocument(
  id: string,
  ownerId: string,
  targetUserId: string
): { ok: true } | { error: DeleteError } {
  const db = readDb();
  const doc = db.documents.find((d) => d.id === id);
  if (!doc) return { error: "not_found" };
  if (doc.ownerId !== ownerId) return { error: "forbidden" };
  db.shares = db.shares.filter(
    (s) => !(s.documentId === id && s.userId === targetUserId)
  );
  writeDb(db);
  return { ok: true };
}
