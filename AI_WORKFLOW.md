# AI-Native Workflow Note

The prompt asks for an honest account of *practical* AI usage — not volume. Here
is how AI tools were used to build DocFlow, what they accelerated, what I changed
or rejected, and how I verified the result.

> _Note for the submitter: this reflects the AI-assisted build of this project.
> Adjust the wording to match your own process and the specific tools you used._

## Which AI tools I used

- **Claude (Claude Code / Opus)** as the primary coding assistant — scaffolding,
  writing the persistence/repository layer, API routes, React components, the
  TipTap integration, tests, and these docs.
- The assistant ran in an agentic loop: it read the task brief, generated code,
  **ran the production build, started the server, and exercised the API with real
  HTTP requests**, then iterated on what it found.

## Where AI materially sped up the work

1. **Boilerplate and wiring.** App Router route handlers, the file-store with
   atomic writes, the cookie-based mock auth, and the repetitive CRUD/share
   endpoints were generated quickly and consistently.
2. **Library integration.** Getting TipTap configured correctly for Next.js
   (the `immediatelyRender: false` SSR requirement, the extension set, toolbar
   active-state wiring) would have meant reading several docs pages; AI got it
   right and explained *why* each piece was needed.
3. **Edge cases I might have deferred.** HTML sanitization for uploads, content
   size caps, role upsert-on-reshare, and cascading share deletion were all
   surfaced and handled early rather than as afterthoughts.
4. **Test coverage.** The access-control test matrix (viewer can't edit,
   non-collaborator can't read, owner-only delete, etc.) was enumerated and
   implemented fast, which let me trust the authorization logic.

## What AI-generated output I changed or rejected

- **Rejected a heavier persistence choice.** An early instinct was to reach for
  SQLite via a native driver. On the target Node version that risked native-build
  friction and wouldn't survive serverless anyway, so I deliberately chose a
  documented JSON file store with a clean swap seam instead. (Captured in
  `ARCHITECTURE.md`.)
- **Fixed a real UX bug AI's first version had.** The editor briefly showed
  "Unsaved changes" on load because TipTap emits a normalizing transaction when it
  parses the initial HTML. I caught this by screenshotting the running app, then
  changed the update handler to ignore transactions that fire while the editor
  isn't focused. (See [`components/RichTextEditor.tsx`](./components/RichTextEditor.tsx).)
- **Tightened sanitization.** The first sanitizer was more permissive than I
  wanted; I narrowed it to a strict allow-list and added tests proving
  `<script>`, `onclick=`, and `javascript:` URLs are stripped.
- **Trimmed scope.** I declined suggestions that would have broadened surface
  area (images, comments, real auth) to keep the slice deep and coherent, per the
  prompt's guidance.

## How I verified correctness, UX quality, and reliability

- **Automated tests** (`npm test`, 21 passing) for the authorization/sharing core
  and the upload/sanitization boundary.
- **A full production build** (`npm run build`) with no type/lint errors, to catch
  server/client boundary mistakes that don't show up in dev.
- **Live end-to-end API verification** with a cookie jar: created and renamed a
  document, edited content, shared it, switched users, confirmed the shared doc
  appeared with the correct role, and confirmed `403`s for a non-collaborator and
  for a viewer attempting to edit.
- **Real file uploads** — a `.md` file and an actual `.docx` (converted via
  mammoth) — confirming they become editable documents, and that unsupported
  types are rejected with a clear message.
- **Visual checks** — headless screenshots of the dashboard and editor to confirm
  the design renders as intended (and to catch the autosave-status bug above).

The throughline: I let AI move fast on implementation, but treated every output
as a draft to be **run, tested, and reviewed** — the engineering standard didn't
change, the speed did.
