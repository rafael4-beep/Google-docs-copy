// GET /api/users -> all (seeded) users. Used to populate the share dialog's
// "people you can share with" list. In a real app this would be a search
// endpoint scoped to your organization.

import { NextResponse } from "next/server";
import { listUsers } from "@/lib/repo";

export async function GET() {
  return NextResponse.json({ users: listUsers() });
}
