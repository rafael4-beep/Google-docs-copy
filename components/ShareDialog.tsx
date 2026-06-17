"use client";

import { useState, useEffect } from "react";
import Avatar from "./Avatar";
import type { DocumentView, ShareView, User } from "@/lib/types";

// Owner-only sharing modal: grant a seeded user viewer/editor access, change a
// role, or revoke access. All actions hit /api/documents/:id/share.
export default function ShareDialog({
  doc,
  users,
  currentUserId,
  onClose,
  onSharesChange,
}: {
  doc: DocumentView;
  users: User[];
  currentUserId: string;
  onClose: () => void;
  onSharesChange?: (next: ShareView[]) => void;
}) {
  const [shares, setShares] = useState<ShareView[]>(doc.shares || []);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // People who can still be added: everyone except the owner and existing collaborators.
  const sharedIds = new Set(shares.map((s) => s.userId));
  const candidates = users.filter((u) => u.id !== doc.ownerId && !sharedIds.has(u.id));

  useEffect(() => {
    if (candidates.length && !email) setEmail(candidates[0].email);
  }, [candidates, email]);

  function publish(next: ShareView[]) {
    setShares(next);
    onSharesChange?.(next);
  }

  async function addShare(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/documents/${doc.id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not share");
      const user = users.find((u) => u.id === data.user.id);
      const next: ShareView[] = [
        ...shares.filter((s) => s.userId !== data.user.id),
        { userId: data.user.id, name: user?.name, email: user?.email, role: data.role },
      ];
      publish(next);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not share");
    } finally {
      setBusy(false);
    }
  }

  async function changeRole(userId: string, newRole: string) {
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: target.email, role: newRole }),
      });
      if (res.ok) {
        publish(
          shares.map((s) =>
            s.userId === userId ? { ...s, role: newRole as ShareView["role"] } : s
          )
        );
      }
    } finally {
      setBusy(false);
    }
  }

  async function removeShare(userId: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}/share`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) publish(shares.filter((s) => s.userId !== userId));
    } finally {
      setBusy(false);
    }
  }

  const owner = users.find((u) => u.id === doc.ownerId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="animate-fade-in w-full max-w-md rounded-2xl bg-surface p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Share document</h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted hover:bg-gray-100" aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          </button>
        </div>
        <p className="mb-4 truncate text-sm text-muted">&ldquo;{doc.title}&rdquo;</p>

        {candidates.length > 0 ? (
          <form onSubmit={addShare} className="mb-5 flex gap-2">
            <select
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none"
            >
              {candidates.map((u) => (
                <option key={u.id} value={u.email}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="rounded-lg border border-border bg-surface px-2 py-2 text-sm focus:border-brand focus:outline-none"
            >
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
            >
              Add
            </button>
          </form>
        ) : (
          <p className="mb-5 rounded-lg bg-gray-50 px-3 py-2 text-sm text-muted">
            Shared with everyone available.
          </p>
        )}

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">People with access</p>
        <ul className="space-y-1">
          <li className="flex items-center gap-3 rounded-lg px-2 py-2">
            <Avatar user={owner} size={34} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">
                {owner?.name} {owner?.id === currentUserId && "(you)"}
              </span>
              <span className="block truncate text-xs text-muted">{owner?.email}</span>
            </span>
            <span className="text-xs font-medium text-brand-dark">Owner</span>
          </li>

          {shares.map((s) => {
            const user = users.find((u) => u.id === s.userId);
            return (
              <li key={s.userId} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-gray-50">
                <Avatar user={user} size={34} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{user?.name}</span>
                  <span className="block truncate text-xs text-muted">{user?.email}</span>
                </span>
                <select
                  value={s.role}
                  onChange={(e) => changeRole(s.userId, e.target.value)}
                  disabled={busy}
                  className="rounded-md border border-border bg-surface px-1.5 py-1 text-xs focus:border-brand focus:outline-none"
                >
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button
                  onClick={() => removeShare(s.userId)}
                  disabled={busy}
                  className="rounded-md p-1.5 text-muted hover:bg-red-50 hover:text-red-600"
                  aria-label={`Remove ${user?.name}`}
                >
                  <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M5 6h10M8 6V4.5A1.5 1.5 0 019.5 3h1A1.5 1.5 0 0112 4.5V6m2 0v9a1 1 0 01-1 1H7a1 1 0 01-1-1V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
