import Link from "next/link";
import type { ReactNode } from "react";
import UserSwitcher from "./UserSwitcher";
import type { User } from "@/lib/types";

// App header. `children` lets pages inject contextual controls (e.g. the editor's
// save status and Share button) between the logo and the user switcher.
export default function TopBar({
  currentUser,
  users,
  children,
}: {
  currentUser: User;
  users: User[];
  children?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M6 3h8l4 4v14H6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M14 3v4h4M9 12h6M9 16h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="text-lg tracking-tight">DocFlow</span>
        </Link>

        <div className="flex-1">{children}</div>

        <UserSwitcher currentUser={currentUser} users={users} />
      </div>
    </header>
  );
}
