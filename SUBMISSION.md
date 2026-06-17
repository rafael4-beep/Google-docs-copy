# Submission

A quick map of everything in this submission so reviewers can evaluate fast.

## ⚠️ Fill these in before submitting

- **Live product URL:** `<add your deployed URL here>`
- **Walkthrough video (unlisted Loom/YouTube):** `<add link>` — also in [`VIDEO.txt`](./VIDEO.txt)
- **Google Drive folder:** `<add the shared folder link>`

## Credentials / test accounts

No login or passwords. Authentication is **mocked** — use the **user switcher** in
the top-right corner to act as any seeded person:

| Name | Email |
| --- | --- |
| Ada Lovelace (default) | `ada@example.com` |
| Grace Hopper | `grace@example.com` |
| Alan Turing | `alan@example.com` (viewer on *Welcome*, for read-only testing) |

## What's included

| Item | Location |
| --- | --- |
| Source code | this repository |
| Setup & run instructions | [`README.md`](./README.md) |
| Architecture note | [`ARCHITECTURE.md`](./ARCHITECTURE.md) |
| AI workflow note | [`AI_WORKFLOW.md`](./AI_WORKFLOW.md) |
| This submission index | `SUBMISSION.md` |
| Automated tests (21, Vitest) | [`tests/`](./tests) |
| Dockerfile + env template | [`Dockerfile`](./Dockerfile), [`.env.example`](./.env.example) |
| Walkthrough video link | [`VIDEO.txt`](./VIDEO.txt) |

## Feature checklist (against the prompt)

| Requirement | Status |
| --- | --- |
| Create / rename / edit / save / reopen documents | ✅ Complete |
| Rich-text formatting (bold, italic, underline, headings, lists) | ✅ Complete (+ strikethrough, quote, code, alignment, undo/redo) |
| File upload → editable document (`.txt`/`.md`/`.docx`) | ✅ Complete (5 MB limit, stated in UI) |
| Sharing: owner, grant access, owned-vs-shared distinction | ✅ Complete (viewer/editor roles, role changes, revoke) |
| Persistence across refresh; formatting preserved | ✅ Complete (JSON file store) |
| Setup/run instructions | ✅ `README.md` |
| Deployment reviewers can access | ✅ Dockerfile + deploy guide; **paste live URL above** |
| Basic validation & error handling | ✅ Complete (server + client) |
| At least one meaningful automated test | ✅ 21 tests, focused on access control + sanitization |
| Architecture note | ✅ `ARCHITECTURE.md` |
| AI workflow note | ✅ `AI_WORKFLOW.md` |

## What's working vs. incomplete

**Working end to end:** document lifecycle, rich-text editing with autosave,
file upload (incl. real `.docx`), sharing with roles, server-enforced access
control, persistence, and a polished responsive UI.

**Intentionally out of scope** (with rationale in `ARCHITECTURE.md`): real
authentication, real-time collaboration, and a production database. The
**"what I'd build next with 2–4 hours"** list is also in `ARCHITECTURE.md` —
top item is swapping the file store for SQLite behind the same repository API.

## Verify locally in 60 seconds

```bash
npm install
npm test          # 21 passing (Vitest)
npm run typecheck # TypeScript, no errors
npm run dev       # http://localhost:3000
```

> Stack: **Next.js 15 (App Router) + TypeScript**, TipTap editor, Tailwind CSS,
> Vitest. Fully typed across the API ↔ repository ↔ UI boundary.
