// Tests for the repository layer: the access-control and sharing logic that the
// whole product depends on. Runs against an isolated DB file (see vitest.config).

import { describe, it, expect, beforeEach } from "vitest";
import { resetDb } from "../lib/db";
import {
  listDocumentsForUser,
  getDocumentForUser,
  createDocument,
  updateDocument,
  deleteDocument,
  shareDocument,
  unshareDocument,
} from "../lib/repo";
import type { DocumentView } from "../lib/types";

const ADA = "user-ada";
const GRACE = "user-grace";
const ALAN = "user-alan";

// Helper: assert we got a full (accessible) document view back, narrowing the type.
function asView(result: ReturnType<typeof getDocumentForUser>): DocumentView {
  if (!result || result.access === null) throw new Error("expected an accessible document");
  return result;
}

beforeEach(() => {
  resetDb(); // restore the seeded users/documents/shares before each test
});

describe("document creation & ownership", () => {
  it("creates a document owned by the given user with sensible defaults", () => {
    const doc = createDocument({ ownerId: ALAN });
    expect(doc.ownerId).toBe(ALAN);
    expect(doc.title).toBe("Untitled document");
    expect(doc.content).toBe("<p></p>");

    const view = getDocumentForUser(doc.id, ALAN);
    expect(view?.access).toBe("owner");
  });

  it("lists a new document under the owner's 'owned' bucket only", () => {
    const doc = createDocument({ ownerId: ALAN, title: "Alan's doc" });
    const alan = listDocumentsForUser(ALAN);
    const grace = listDocumentsForUser(GRACE);
    expect(alan.owned.map((d) => d.id)).toContain(doc.id);
    expect(grace.owned.map((d) => d.id)).not.toContain(doc.id);
    expect(grace.shared.map((d) => d.id)).not.toContain(doc.id);
  });
});

describe("access control", () => {
  it("denies access to a document that is neither owned nor shared", () => {
    const doc = createDocument({ ownerId: ADA, title: "Private" });
    const view = getDocumentForUser(doc.id, ALAN);
    expect(view?.access).toBe(null);
  });

  it("prevents a non-collaborator from editing", () => {
    const doc = createDocument({ ownerId: ADA });
    const result = updateDocument(doc.id, ALAN, { content: "<p>hax</p>" });
    expect(result).toEqual({ error: "forbidden" });
  });

  it("lets a viewer read but not edit", () => {
    const doc = createDocument({ ownerId: ADA });
    shareDocument(doc.id, ADA, { email: "alan@example.com", role: "viewer" });

    expect(getDocumentForUser(doc.id, ALAN)?.access).toBe("viewer");
    const result = updateDocument(doc.id, ALAN, { content: "<p>nope</p>" });
    expect(result).toEqual({ error: "forbidden" });
  });

  it("lets an editor edit", () => {
    const doc = createDocument({ ownerId: ADA, content: "<p>original</p>" });
    shareDocument(doc.id, ADA, { email: "alan@example.com", role: "editor" });

    const result = updateDocument(doc.id, ALAN, { content: "<p>edited</p>" });
    expect("doc" in result).toBe(true);
    expect(asView(getDocumentForUser(doc.id, ADA)).content).toBe("<p>edited</p>");
  });
});

describe("sharing", () => {
  it("shows a shared document in the recipient's 'shared' bucket, not 'owned'", () => {
    const doc = createDocument({ ownerId: ADA, title: "Shared one" });
    shareDocument(doc.id, ADA, { email: "grace@example.com", role: "editor" });

    const grace = listDocumentsForUser(GRACE);
    expect(grace.shared.map((d) => d.id)).toContain(doc.id);
    expect(grace.owned.map((d) => d.id)).not.toContain(doc.id);
    expect(grace.shared.find((d) => d.id === doc.id)?.access).toBe("editor");
  });

  it("only the owner can share", () => {
    const doc = createDocument({ ownerId: ADA });
    const result = shareDocument(doc.id, GRACE, { email: "alan@example.com", role: "editor" });
    expect(result).toEqual({ error: "forbidden" });
  });

  it("rejects sharing with an unknown email", () => {
    const doc = createDocument({ ownerId: ADA });
    const result = shareDocument(doc.id, ADA, { email: "nobody@example.com", role: "editor" });
    expect(result).toEqual({ error: "user_not_found" });
  });

  it("upserts the role when re-sharing with the same person", () => {
    const doc = createDocument({ ownerId: ADA });
    shareDocument(doc.id, ADA, { email: "alan@example.com", role: "viewer" });
    shareDocument(doc.id, ADA, { email: "alan@example.com", role: "editor" });

    const shares = asView(getDocumentForUser(doc.id, ADA)).shares;
    const alanShares = shares.filter((s) => s.userId === ALAN);
    expect(alanShares).toHaveLength(1);
    expect(alanShares[0].role).toBe("editor");
  });

  it("revokes access on unshare", () => {
    const doc = createDocument({ ownerId: ADA });
    shareDocument(doc.id, ADA, { email: "alan@example.com", role: "editor" });
    expect(getDocumentForUser(doc.id, ALAN)?.access).toBe("editor");

    unshareDocument(doc.id, ADA, ALAN);
    expect(getDocumentForUser(doc.id, ALAN)?.access).toBe(null);
  });
});

describe("validation & deletion", () => {
  it("rejects an empty title", () => {
    const doc = createDocument({ ownerId: ADA });
    expect(updateDocument(doc.id, ADA, { title: "   " })).toEqual({ error: "invalid_title" });
  });

  it("persists a renamed title", () => {
    const doc = createDocument({ ownerId: ADA, title: "Old" });
    updateDocument(doc.id, ADA, { title: "New name" });
    expect(asView(getDocumentForUser(doc.id, ADA)).title).toBe("New name");
  });

  it("only the owner can delete, and deletion also removes shares", () => {
    const doc = createDocument({ ownerId: ADA });
    shareDocument(doc.id, ADA, { email: "grace@example.com", role: "editor" });

    expect(deleteDocument(doc.id, GRACE)).toEqual({ error: "forbidden" });
    expect(deleteDocument(doc.id, ADA)).toEqual({ ok: true });
    expect(getDocumentForUser(doc.id, ADA)).toBe(null);
    expect(listDocumentsForUser(GRACE).shared.map((d) => d.id)).not.toContain(doc.id);
  });
});
