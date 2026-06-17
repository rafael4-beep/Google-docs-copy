"use client";

// Mocked-auth user switcher. Picking a user POSTs to /api/auth (sets the cookie)
// then reloads so server components re-render as that user.

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Avatar from "./Avatar";
import type { User } from "@/lib/types";

export default function UserSwitcher({
  currentUser,
  users,
}: {
  currentUser: User;
  users: User[];
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function switchTo(userId: string) {
    if (userId === currentUser.id) {
      setOpen(false);
      return;
    }
    setBusy(true);
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    setOpen(false);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-border bg-surface py-1 pl-1 pr-3 shadow-sm transition hover:shadow-md disabled:opacity-60"
        disabled={busy}
      >
        <Avatar user={currentUser} size={32} />
        <span className="hidden text-sm font-medium sm:block">{currentUser.name}</span>
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className="text-muted">
          <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="animate-fade-in absolute right-0 z-30 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
          <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Switch user (mock auth)
          </p>
          {users.map((u) => (
            <button
              key={u.id}
              onClick={() => switchTo(u.id)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-brand-soft"
            >
              <Avatar user={u} size={34} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{u.name}</span>
                <span className="block truncate text-xs text-muted">{u.email}</span>
              </span>
              {u.id === currentUser.id && (
                <svg className="ml-auto text-brand" width="16" height="16" viewBox="0 0 20 20" fill="none">
                  <path d="M5 10l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          ))}
          <p className="border-t border-border px-4 py-2 text-xs text-muted">
            No passwords — this simulates signing in as different people to demo sharing.
          </p>
        </div>
      )}
    </div>
  );
}
