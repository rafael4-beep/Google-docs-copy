# DocFlow

A lightweight, collaborative document editor — create, edit, upload and share
rich-text documents. Built as a focused full-stack product slice with **Next.js
(App Router)** and **TypeScript**.

> **Why it exists:** a take-home prompt asked for a small Google-Docs-style app
> with document editing, file upload, sharing, persistence, tests and a clear
> deployment story. DocFlow prioritizes a coherent, polished end-to-end flow over
> breadth of features. See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the
> reasoning behind every scope decision.

---

## ✨ Features

| Area | What works |
| --- | --- |
| **Documents** | Create, rename, edit and delete documents. Open/reopen by URL. |
| **Rich text** | Headings (H1–H3), **bold**, *italic*, <u>underline</u>, strikethrough, bulleted & numbered lists, blockquote, code block, text alignment, undo/redo. Built on TipTap/ProseMirror. |
| **Autosave** | Every edit is debounced and saved automatically, with a live "saving / all changes saved" status. Survives refresh. |
| **File upload** | Upload a `.txt`, `.md`, or `.docx` file → it becomes a new editable document. `.docx` is converted with `mammoth`, Markdown with `marked`. |
| **Sharing** | Document owners can grant another user **viewer** or **editor** access, change roles, or revoke access. Owned vs. shared documents are visually separated on the dashboard, with per-document access badges. |
| **Access control** | Enforced server-side: viewers can't edit, non-collaborators can't read, only owners can share/delete. |
| **Persistence** | A simple, well-documented JSON file store, seeded on first run. |

---

## 🧑‍🤝‍🧑 Seeded accounts (mock auth)

There is **no password**. Authentication is mocked: you pick "who you are" from
the **user switcher** in the top-right corner. This keeps the sharing demo
realistic (each request acts as a specific user) without the scope of a real
auth system.

| Name | Email | Starts with |
| --- | --- | --- |
| **Ada Lovelace** (default) | `ada@example.com` | Owns *Welcome to DocFlow* & *Q3 Product Roadmap*; editor on *Meeting Notes* |
| **Grace Hopper** | `grace@example.com` | Owns *Meeting Notes*; editor on *Welcome* |
| **Alan Turing** | `alan@example.com` | **Viewer** on *Welcome* (great for testing read-only mode) |

**To demo sharing end to end:** open *Welcome to DocFlow* as Ada → click **Share**
→ add/adjust a collaborator → switch to that user via the avatar menu → see the
document appear under "Shared with you" with the right access level.

---

## 🚀 Getting started (local)

**Requirements:** Node.js 18.18+ (developed on Node 20+). No database server needed.

```bash
# 1. install dependencies
npm install

# 2. run the dev server
npm run dev
# open http://localhost:3000

# (or run a production build)
npm run build && npm start
```

On first run the app seeds a JSON database at `data/db.json`. Delete that file
any time to reset to the seeded state.

### Run the tests / type-check

```bash
npm test        # 21 Vitest tests
npm run typecheck   # tsc --noEmit (the build also type-checks)
```

The tests cover the access-control / sharing logic and the upload + HTML
sanitization boundary. See [`tests/`](./tests).

---

## 📁 Supported upload types

`.txt`, `.md`, `.docx` only, up to **5 MB**. This limit is stated in the UI
(dashboard) and enforced server-side in [`lib/import.ts`](./lib/import.ts).
Unsupported types return a clear error message.

---

## 🗂️ Project structure

```
app/
  app/
    page.tsx                    # dashboard (server component)
    docs/[id]/page.tsx          # editor page (server component + access check)
    api/
      auth/route.ts             # GET current user / POST switch user
      users/route.ts            # GET seeded users (for the share dialog)
      documents/route.ts        # GET list (owned+shared) / POST create
      documents/[id]/route.ts   # GET / PATCH (rename+content) / DELETE
      documents/[id]/share/route.ts  # POST grant/update share / DELETE revoke
      upload/route.ts           # POST file -> new document
  components/                   # React UI (.tsx: TopBar, editor, toolbar, share dialog, cards…)
  lib/
    types.ts                    # shared domain types (User, DocumentRecord, Share, …)
    db.ts                       # JSON file store (atomic writes, auto-seed)
    repo.ts                     # domain logic + access control (the heart)
    auth.ts                     # mock current-user via cookie
    import.ts                   # file -> HTML conversion
    sanitize.ts                 # allow-list HTML sanitizer (XSS boundary)
    seed.ts                     # seeded users/documents/shares
  tests/                        # Vitest suite (.ts)
  data/db.json                  # local database (git-ignored, auto-created)
```

---

## ☁️ Deployment

The app is a standard Next.js server app. The only stateful piece is the JSON
file at `DB_PATH` (default `./data/db.json`), so it deploys cleanly anywhere with
a **persistent writable disk**:

- **Render / Railway / Fly.io / a VPS** — attach a persistent volume and set
  `DB_PATH` to a path on it, e.g. `DB_PATH=/data/db.json`. A `Dockerfile` is
  included for one-command container builds.
- **Vercel** — works for the demo, but note the serverless filesystem is
  ephemeral, so saved documents won't persist between cold starts. For a durable
  Vercel deploy, swap `lib/db.ts` for a hosted database (the repository layer in
  `lib/repo.ts` is the only thing that would change — see `ARCHITECTURE.md`).

```bash
# build & run with Docker
docker build -t docflow .
docker run -p 3000:3000 -v docflow-data:/data -e DB_PATH=/data/db.json docflow
```

### Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `DB_PATH` | `./data/db.json` | Where the JSON database lives. |
| `PORT` | `3000` | Server port. |

See [`.env.example`](./.env.example).

---

## 🔌 API reference (quick)

| Method & path | Description |
| --- | --- |
| `GET /api/auth` | Current user + all seeded users |
| `POST /api/auth` `{ userId }` | Switch active user (sets cookie) |
| `GET /api/documents` | `{ owned, shared }` for current user |
| `POST /api/documents` `{ title?, content? }` | Create document |
| `GET /api/documents/:id` | Full document (403 if no access) |
| `PATCH /api/documents/:id` `{ title?, content? }` | Update (owner/editor) |
| `DELETE /api/documents/:id` | Delete (owner only) |
| `POST /api/documents/:id/share` `{ email, role }` | Grant/update access (owner) |
| `DELETE /api/documents/:id/share` `{ userId }` | Revoke access (owner) |
| `POST /api/upload` (multipart `file`) | Import a file as a new document |

---

## 📌 Scope & status

Implemented in depth: document editing, autosave, file upload, sharing with
roles, server-enforced access control, persistence, tests, and a polished UI.

**Intentionally deprioritized** (and why) is documented in
[`ARCHITECTURE.md`](./ARCHITECTURE.md) — real auth, real-time collaboration, and
a production database were out of scope for a focused slice. That file also lists
what I'd build next with another 2–4 hours.

See also: [`AI_WORKFLOW.md`](./AI_WORKFLOW.md) (how AI tools were used) and
[`SUBMISSION.md`](./SUBMISSION.md) (exactly what's included).
