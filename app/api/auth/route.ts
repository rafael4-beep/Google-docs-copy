// GET  /api/auth  -> current user + full user list (for the switcher)
// POST /api/auth  { userId } -> switch the active (mocked) user via cookie

import { NextResponse } from "next/server";
import { getCurrentUser, AUTH_COOKIE } from "@/lib/auth";
import { listUsers, getUser } from "@/lib/repo";

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({ user, users: listUsers() });
}

export async function POST(request: Request) {
  let body: { userId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const target = getUser(body?.userId);
  if (!target) {
    return NextResponse.json({ error: "Unknown user" }, { status: 400 });
  }
  const res = NextResponse.json({ user: target });
  res.cookies.set(AUTH_COOKIE, target.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
