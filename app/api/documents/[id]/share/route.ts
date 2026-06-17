// POST   /api/documents/:id/share { email, role } -> grant/update access (owner only)
// DELETE /api/documents/:id/share { userId }       -> revoke access (owner only)

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { shareDocument, unshareDocument } from "@/lib/repo";

type RouteContext = { params: Promise<{ id: string }> };

const ERROR_STATUS: Record<string, number> = {
  not_found: 404,
  forbidden: 403,
  user_not_found: 404,
  cannot_share_with_owner: 400,
};

const ERROR_MESSAGE: Record<string, string> = {
  not_found: "Document not found",
  forbidden: "Only the owner can manage sharing",
  user_not_found: "No user found with that email",
  cannot_share_with_owner: "That person already owns this document",
};

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const user = await getCurrentUser();
  let body: { email?: string; role?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body?.email) {
    return NextResponse.json({ error: "An email is required" }, { status: 400 });
  }

  const result = shareDocument(id, user.id, { email: body.email, role: body.role });
  if ("error" in result) {
    return NextResponse.json(
      { error: ERROR_MESSAGE[result.error] || result.error },
      { status: ERROR_STATUS[result.error] || 400 }
    );
  }
  return NextResponse.json({ ok: true, user: result.user, role: result.role });
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const user = await getCurrentUser();
  let body: { userId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body?.userId) {
    return NextResponse.json({ error: "A userId is required" }, { status: 400 });
  }

  const result = unshareDocument(id, user.id, body.userId);
  if ("error" in result) {
    return NextResponse.json(
      { error: ERROR_MESSAGE[result.error] || result.error },
      { status: ERROR_STATUS[result.error] || 400 }
    );
  }
  return NextResponse.json({ ok: true });
}
