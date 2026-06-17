# Architecture Note

This document explains **what I prioritized, why, and the tradeoffs I made** for
the DocFlow take-home. The guiding principle from the prompt was *depth in a few
important areas over shallow coverage everywhere* — so this is as much a record of
deliberate scope **cuts** as of what was built.

## What I prioritized (and why)

1. **A coherent end-to-end product slice.** The most important thing a reviewer
   can do is *use the product*: create a doc, format it, upload a file, share it,
   switch users, and watch access change. I made sure that single thread works
   flawlessly before adding anything else.
2. **Correct, server-enforced access control.** Sharing is the feature most
   likely to be done superficially (hiding buttons in the UI). I put all
   authorization in one place ([`lib/repo.ts`](./lib/repo.ts)) and enforced it on
   every API route, then wrote tests against it. UI affordances (read-only mode,
   owner-only Share button) are a convenience layer on top, not the security
   boundary.
3. **A genuinely usable editing experience.** I used TipTap/ProseMirror rather
   than a `contentEditable` toy, so formatting, lists, undo/redo and serialization
   are robust. Autosave with visible status makes "save and reopen" feel real.
4. **Clarity over cleverness.** A JSON file store, a thin repository, plain
   route handlers. Easy to read in five minutes; easy to swap a layer later.

## High-level shape

```
Browser (React client components)
  │   fetch() JSON
  ▼
Next.js App Router
  ├─ Server Components (app/page.tsx, app/docs/[id]/page.tsx)
  │     read current user + data directly from the repo for first paint
  └─ Route Handlers (app/api/**/route.ts)
        validate input → call repo → return JSON
              │
              ▼
        lib/repo.ts  ── all domain logic + access control
              │
              ▼
        lib/db.ts    ── atomic JSON file persistence (data/db.json)
```

- **Server components** do the initial data fetch (no loading spinner on first
  paint, and the current-user cookie is read server-side).
- **Client components** handle interactivity: the TipTap editor, autosave,
  the share dialog, the user switcher.
- **Route handlers** are the only writers; they delegate every decision to the
  repository so logic isn't duplicated across the UI and API.

## Data model

Three collections in one JSON document:

```jsonc
{
  "users":     [{ "id", "name", "email", "color" }],
  "documents": [{ "id", "title", "content" /* HTML */, "ownerId", "createdAt", "updatedAt" }],
  "shares":    [{ "id", "documentId", "userId", "role": "viewer" | "editor", "createdAt" }]
}
```

Access for `(document, user)` resolves to `owner` → `editor` → `viewer` → `null`,
computed in one function (`accessFor`). Everything else (can this user edit?
share? delete?) derives from that.

## Key decisions & tradeoffs

| Decision | Why | Tradeoff / what I'd change for production |
| --- | --- | --- |
| **JSON file store** instead of SQLite/Postgres | Zero native dependencies and zero setup — `npm install && npm run dev` just works, and reviewers can read the entire "database" in one file. The prompt explicitly allowed a documented file store. | Not safe for high concurrency and not durable on serverless. `lib/db.ts`/`lib/repo.ts` are a clean seam: swapping in Prisma + SQLite/Postgres touches only those files. |
| **Mocked auth via a user switcher** | The prompt allows simulated users. Real auth (sessions, passwords, OAuth) is a large surface that adds little to *demonstrating sharing logic*. | No real identity or security. I kept the cookie + "current user" abstraction so a real auth provider could replace `lib/auth.ts` without touching routes. |
| **Store content as HTML** | TipTap round-trips HTML cleanly, it renders directly, and it makes `.docx`/Markdown import trivial (both convert *to* HTML). | HTML is harder to diff than a structured JSON doc. For version history or real-time collab I'd store ProseMirror JSON instead. |
| **Autosave (debounced PATCH)** over an explicit Save button | Matches the "Google-Docs feel" the prompt asks for and removes a failure mode (forgetting to save). | More write traffic. Debounced to 800ms and a single combined request keeps it cheap. |
| **Allow-list HTML sanitizer** (`lib/sanitize.ts`) | Uploaded `.docx`/`.md` is untrusted; I strip `<script>`, event handlers and `javascript:` URLs rather than trust the converters. | A hand-rolled sanitizer is intentionally small; production should use DOMPurify/`sanitize-html`. The seam is one function. |
| **Server components for reads, route handlers for writes** | Fast first paint with no client fetch waterfall; a single place that mutates state. | Slightly more moving parts than an all-client SPA, but cleaner separation. |

## Validation & error handling

- Input is validated at the route boundary and again in the repo (empty/oversized
  titles, content size cap, unknown share target, JSON parse failures).
- The repo returns typed error codes (`forbidden`, `not_found`, `invalid_title`,
  …) that routes map to proper HTTP statuses (400/403/404/413).
- The editor surfaces a "save failed" state and retries on the next edit; the
  dashboard surfaces upload/create errors inline.
- Inaccessible or missing documents render a friendly page, not a stack trace.

## Testing strategy

The most valuable thing to test is the logic that protects user data, so the
suite ([`tests/repo.test.ts`](./tests/repo.test.ts)) focuses on **access control
and sharing**: viewers can't edit, non-collaborators can't read, only owners can
share/delete, role upserts work, deletion cascades to shares, and the owned-vs-
shared split is correct. A second file ([`tests/import.test.ts`](./tests/import.test.ts))
covers the upload conversion and the XSS sanitization boundary. Tests run against
an isolated DB file so they never touch real data.

## Intentionally deprioritized

- **Real authentication** — mocked, as discussed above.
- **Real-time collaboration** — single-writer autosave only; no presence/CRDT.
- **A production database** — file store, with a clear swap path.
- **Granular permissions** (link sharing, org roles) — just viewer/editor.
- **Rich media** (images, tables, comments) — kept the editor focused on the
  required formatting set.

## What I'd build next with another 2–4 hours

1. **Swap the file store for SQLite (better-sqlite3 or Prisma).** Same repo API,
   real durability and concurrency — the single highest-leverage change.
2. **Document version history.** Store ProseMirror JSON snapshots on save and add
   a "restore" view (the schema already has `updatedAt`).
3. **Share-by-link + a real login.** Replace the mock cookie with NextAuth and add
   read-only share links.
4. **Presence indicators.** Lightweight "who's viewing" via polling or SSE before
   committing to full CRDT collaboration.
5. **Export to Markdown/PDF**, closing the import/export loop.
