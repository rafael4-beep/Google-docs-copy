"use client";

import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import DocumentCard from "./DocumentCard";
import { SUPPORTED_LABEL } from "@/lib/constants";
import type { DocumentSummary, User } from "@/lib/types";

export default function DashboardClient({
  owned,
  shared,
  currentUser,
}: {
  owned: DocumentSummary[];
  shared: DocumentSummary[];
  currentUser: User;
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function createBlank() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled document" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create document");
      router.push(`/docs/${data.document.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create document");
      setBusy(false);
    }
  }

  async function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      router.push(`/docs/${data.document.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      setBusy(false);
    }
  }

  async function deleteDoc(id: string) {
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else setError("Could not delete document");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your documents</h1>
          <p className="mt-1 text-sm text-muted">
            Signed in as <span className="font-medium text-foreground">{currentUser.name}</span>. Create,
            edit, upload and share rich-text documents.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInput}
            type="file"
            accept=".txt,.md,.docx"
            className="hidden"
            onChange={onFilePicked}
          />
          <button
            onClick={() => fileInput.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-medium shadow-sm transition hover:border-brand/40 hover:shadow disabled:opacity-60"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M10 13V4m0 0L6.5 7.5M10 4l3.5 3.5M4 14v1.5A1.5 1.5 0 005.5 17h9a1.5 1.5 0 001.5-1.5V14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Upload file
          </button>
          <button
            onClick={createBlank}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-60"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M10 5v10M5 10h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            New document
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <p className="mb-6 -mt-3 text-xs text-muted">{SUPPORTED_LABEL}</p>

      <Section title="Owned by you" count={owned.length} emptyHint="Create your first document to get started.">
        {owned.map((doc) => (
          <DocumentCard key={doc.id} doc={doc} onDelete={deleteDoc} />
        ))}
      </Section>

      <Section
        title="Shared with you"
        count={shared.length}
        emptyHint="Documents other people share with you will appear here. Try switching users."
      >
        {shared.map((doc) => (
          <DocumentCard key={doc.id} doc={doc} onDelete={deleteDoc} />
        ))}
      </Section>
    </div>
  );
}

function Section({
  title,
  count,
  emptyHint,
  children,
}: {
  title: string;
  count: number;
  emptyHint: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted">
        {title}
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-muted">{count}</span>
      </h2>
      {count === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface/60 px-6 py-10 text-center text-sm text-muted">
          {emptyHint}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
      )}
    </section>
  );
}
