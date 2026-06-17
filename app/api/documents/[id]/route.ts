// GET    /api/documents/:id        -> full document (if accessible)
// PATCH  /api/documents/:id { title?, content? } -> update (owner/editor only)
// DELETE /api/documents/:id        -> delete (owner only)

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDocumentForUser, updateDocument, deleteDocument } from "@/lib/repo";

type RouteContext = { params: Promise<{ id: string }> };

const ERROR_STATUS: Record<string, number> = {
  not_found: 404,
  forbidden: 403,
  invalid_title: 400,
  title_too_long: 400,
  content_too_large: 413,
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const user = await getCurrentUser();
  const doc = getDocumentForUser(id, user.id);
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });
  if (doc.access === null)
    return NextResponse.json({ error: "You do not have access to this document" }, { status: 403 });
  return NextResponse.json({ document: doc });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const user = await getCurrentUser();
  let body: { title?: string; content?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const patch: { title?: string; content?: string } = {};
  if (body.title !== undefined) patch.title = body.title;
  if (body.content !== undefined) patch.content = body.content;
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const result = updateDocument(id, user.id, patch);
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: ERROR_STATUS[result.error] || 400 }
    );
  }
  return NextResponse.json({ document: result.doc });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const user = await getCurrentUser();
  const result = deleteDocument(id, user.id);
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: ERROR_STATUS[result.error] || 400 }
    );
  }
  return NextResponse.json({ ok: true });
}
