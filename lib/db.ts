// Low-level file-based persistence.
//
// The entire database is a single JSON file ({ users, documents, shares }).
// This is a deliberate scope choice for a take-home: zero native dependencies,
// trivial to inspect, and easy to seed/reset. See ARCHITECTURE.md for the
// tradeoffs and how to swap this layer for SQLite/Postgres in production.

import fs from "node:fs";
import path from "node:path";
import { seedData } from "./seed";
import type { Database } from "./types";

const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(process.cwd(), "data", "db.json");

function ensureDir(): void {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function readDb(): Database {
  ensureDir();
  if (!fs.existsSync(DB_PATH)) {
    const fresh = seedData();
    writeDb(fresh);
    return fresh;
  }
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, "utf-8")) as Database;
  } catch {
    // Corrupt file — reset to a clean seed rather than crashing the app.
    const fresh = seedData();
    writeDb(fresh);
    return fresh;
  }
}

export function writeDb(db: Database): void {
  ensureDir();
  // Atomic write: write to a temp file then rename so a crash mid-write can
  // never leave a half-written database on disk.
  const tmp = `${DB_PATH}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), "utf-8");
  fs.renameSync(tmp, DB_PATH);
}

export function resetDb(): Database {
  const fresh = seedData();
  writeDb(fresh);
  return fresh;
}

export function dbPath(): string {
  return DB_PATH;
}
