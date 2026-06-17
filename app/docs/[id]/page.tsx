import Link from "next/link";
import EditorClient from "@/components/EditorClient";
import { getCurrentUser } from "@/lib/auth";
import { getDocumentForUser, listUsers } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  const doc = getDocumentForUser(id, currentUser.id);

  if (!doc || doc.access === null) {
    return <AccessError missing={!doc} />;
  }

  return <EditorClient doc={doc} currentUser={currentUser} users={listUsers()} />;
}

function AccessError({ missing }: { missing: boolean }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="max-w-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 8v5M12 16.5h.01M10.3 3.9L2.5 18a1.8 1.8 0 001.6 2.7h15.8A1.8 1.8 0 0021.5 18L13.7 3.9a1.9 1.9 0 00-3.4 0z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <h1 className="mb-2 text-lg font-semibold">
          {missing ? "Document not found" : "You don't have access"}
        </h1>
        <p className="mb-6 text-sm text-muted">
          {missing
            ? "This document may have been deleted."
            : "This document hasn't been shared with you. Try switching to a user who owns or has access to it."}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Back to documents
        </Link>
      </div>
    </div>
  );
}
