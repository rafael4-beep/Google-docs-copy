"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import RichTextEditor from "./RichTextEditor";
import ShareDialog from "./ShareDialog";
import UserSwitcher from "./UserSwitcher";
import AccessBadge from "./AccessBadge";
import type { DocumentView, User } from "@/lib/types";

const SAVE_DEBOUNCE_MS = 800;

type SaveState = "saved" | "unsaved" | "saving" | "error";

export default function EditorClient({
  doc,
  currentUser,
  users,
}: {
  doc: DocumentView;
  currentUser: User;
  users: User[];
}) {
  const canEdit = doc.access === "owner" || doc.access === "editor";
  const isOwner = doc.access === "owner";

  const [title, setTitle] = useState(doc.title);
  const [status, setStatus] = useState<SaveState>("saved");
  const [shareOpen, setShareOpen] = useState(false);
  const [shareCount, setShareCount] = useState((doc.shares || []).length);

  const titleRef = useRef(doc.title);
  const contentRef = useRef(doc.content);
  const dirtyRef = useRef({ title: false, content: false });
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const save = useCallback(async () => {
    const payload: { title?: string; content?: string } = {};
    if (dirtyRef.current.title) payload.title = titleRef.current;
    if (dirtyRef.current.content) payload.content = contentRef.current;
    if (Object.keys(payload).length === 0) return;

    setStatus("saving");
    try {
      const res = await fetch(`/api/documents/${doc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "save_failed");
      }
      dirtyRef.current = { title: false, content: false };
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }, [doc.id]);

  const scheduleSave = useCallback(() => {
    setStatus("unsaved");
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(save, SAVE_DEBOUNCE_MS);
  }, [save]);

  function onTitleChange(value: string) {
    setTitle(value);
    titleRef.current = value;
    dirtyRef.current.title = true;
    scheduleSave();
  }

  function onContentChange(html: string) {
    contentRef.current = html;
    dirtyRef.current.content = true;
    scheduleSave();
  }

  // Warn before leaving with unsaved changes; flush pending save on unmount.
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (status === "unsaved" || status === "saving") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
      clearTimeout(timerRef.current);
    };
  }, [status]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-surface/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4 sm:px-6">
          <Link href="/" className="rounded-md p-1.5 text-muted hover:bg-gray-100" title="Back to documents">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12 5l-5 5 5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>

          <div className="flex min-w-0 flex-1 items-center gap-3">
            {canEdit ? (
              <input
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="Untitled document"
                aria-label="Document title"
                className="min-w-0 flex-1 truncate rounded-md border border-transparent bg-transparent px-2 py-1 text-base font-semibold hover:border-border focus:border-brand focus:bg-surface focus:outline-none"
                maxLength={200}
              />
            ) : (
              <span className="truncate px-2 py-1 text-base font-semibold">{title}</span>
            )}
            <SaveStatus status={status} canEdit={canEdit} />
          </div>

          {!isOwner && <AccessBadge access={doc.access} />}

          {isOwner && (
            <button
              onClick={() => setShareOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
            >
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M7 11l6-3M7 9l6 3" stroke="currentColor" strokeWidth="1.5"/><circle cx="5" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.5"/><circle cx="15" cy="6" r="2.2" stroke="currentColor" strokeWidth="1.5"/><circle cx="15" cy="14" r="2.2" stroke="currentColor" strokeWidth="1.5"/></svg>
              Share{shareCount > 0 ? ` (${shareCount})` : ""}
            </button>
          )}

          <UserSwitcher currentUser={currentUser} users={users} />
        </div>
      </header>

      {/* Ownership / sharing context line */}
      <div className="mx-auto max-w-5xl px-4 pt-4 sm:px-6">
        <p className="text-xs text-muted">
          {isOwner ? (
            <>You own this document.</>
          ) : (
            <>
              Shared by <span className="font-medium text-foreground">{doc.ownerName}</span> ·{" "}
              {canEdit ? "you can edit" : "you can view only"}
            </>
          )}
        </p>
      </div>

      {/* Document "page" */}
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-4 sm:px-6">
        <div className="rounded-2xl border border-border bg-surface px-5 py-6 shadow-sm sm:px-10 sm:py-10">
          <RichTextEditor
            initialContent={doc.content}
            editable={canEdit}
            onChange={onContentChange}
          />
        </div>
      </main>

      {shareOpen && (
        <ShareDialog
          doc={doc}
          users={users}
          currentUserId={currentUser.id}
          onClose={() => setShareOpen(false)}
          onSharesChange={(next) => setShareCount(next.length)}
        />
      )}
    </div>
  );
}

function SaveStatus({ status, canEdit }: { status: SaveState; canEdit: boolean }) {
  if (!canEdit) return null;
  const map: Record<SaveState, { label: string; color: string }> = {
    saved: { label: "All changes saved", color: "text-muted" },
    unsaved: { label: "Unsaved changes…", color: "text-amber-600" },
    saving: { label: "Saving…", color: "text-muted" },
    error: { label: "Save failed — retrying on next edit", color: "text-red-600" },
  };
  const s = map[status] || map.saved;
  return <span className={`hidden whitespace-nowrap text-xs sm:block ${s.color}`}>{s.label}</span>;
}
