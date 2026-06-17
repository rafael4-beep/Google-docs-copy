// GET  /api/documents -> { owned, shared } for the current user
// POST /api/documents { title?, content? } -> create a document owned by current user

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listDocumentsForUser, createDocument, MAX_TITLE_LENGTH } from "@/lib/repo";

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json(listDocumentsForUser(user.id));
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  let body: { title?: string; content?: string } = {};
  try {
    body = (await request.json()) || {};
  } catch {
    // empty body is fine — creates an untitled doc
  }
  if (body.title !== undefined && String(body.title).length > MAX_TITLE_LENGTH) {
    return NextResponse.json({ error: "Title is too long" }, { status: 400 });
  }
  const doc = createDocument({
    title: body.title,
    content: body.content,
    ownerId: user.id,
  });
  return NextResponse.json({ document: doc }, { status: 201 });
}
