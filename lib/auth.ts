// Mocked authentication.
//
// There is no real login. The "current user" is whichever seeded user id is in
// the `docflow_user` cookie. The user switcher in the top bar sets this cookie.
// This keeps the sharing demo realistic (each request acts as a specific user)
// without the scope of a real auth system. See ARCHITECTURE.md.

import { cookies } from "next/headers";
import { readDb } from "./db";
import type { User } from "./types";

export const AUTH_COOKIE = "docflow_user";

export async function getCurrentUser(): Promise<User> {
  const store = await cookies();
  const id = store.get(AUTH_COOKIE)?.value;
  const db = readDb();
  if (id) {
    const user = db.users.find((u) => u.id === id);
    if (user) return user;
  }
  // Default to the first seeded user when no/invalid cookie is present.
  return db.users[0];
}
