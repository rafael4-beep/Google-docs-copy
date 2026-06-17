"use client";

import Link from "next/link";
import { useState } from "react";
import AccessBadge from "./AccessBadge";
import { timeAgo } from "@/lib/format";
import type { DocumentSummary } from "@/lib/types";

export default function DocumentCard({
  doc,
  onDelete,
}: {
  doc: DocumentSummary;
  onDelete: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const isOwner = doc.access === "owner";

  return (
    <div className="group relative flex flex-col rounded-xl border border-border bg-surface p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md">
      <Link href={`/docs/${doc.id}`} className="flex flex-1 flex-col">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 font-semibold leading-snug">{doc.title}</h3>
          <AccessBadge access={doc.access} />
        </div>
        <p className="mb-4 line-clamp-3 min-h-[3.5rem] text-sm text-muted">
          {doc.excerpt || "No content yet."}
        </p>
        <div className="mt-auto flex items-center gap-2 text-xs text-muted">
          <span>{isOwner ? "You" : doc.ownerName}</span>
          <span aria-hidden>·</span>
          <span suppressHydrationWarning>Edited {timeAgo(doc.updatedAt)}</span>
          {isOwner && doc.sharedCount > 0 && (
            <>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                  <circle cx="7" cy="6" r="2.4" stroke="currentColor" strokeWidth="1.4" />
                  <circle cx="13.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M3 15c0-2.2 1.8-3.6 4-3.6s4 1.4 4 3.6M11.5 13.2c1.8 0 3.5 1 3.5 2.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                Shared with {doc.sharedCount}
              </span>
            </>
          )}
        </div>
      </Link>

      {isOwner &&
        (confirming ? (
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-lg border border-border bg-surface p-1 shadow-md">
            <button
              onClick={() => onDelete(doc.id)}
              className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
            >
              Delete
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="rounded-md px-2 py-1 text-xs text-muted hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            aria-label="Delete document"
            className="absolute right-2 top-2 hidden rounded-md p-1.5 text-muted opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 sm:block"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M5 6h10M8 6V4.5A1.5 1.5 0 019.5 3h1A1.5 1.5 0 0112 4.5V6m2 0v9a1 1 0 01-1 1H7a1 1 0 01-1-1V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ))}
    </div>
  );
}
