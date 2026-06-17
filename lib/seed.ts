// Seed data for the file-based store. Users are simulated (mocked auth):
// there is no password — you pick "who you are" from the user switcher in the UI.

import type { Database } from "./types";

const SEED_TIME = "2026-01-01T09:00:00.000Z";

export function seedData(): Database {
  const users = [
    { id: "user-ada", name: "Ada Lovelace", email: "ada@example.com", color: "#6366f1" },
    { id: "user-grace", name: "Grace Hopper", email: "grace@example.com", color: "#ec4899" },
    { id: "user-alan", name: "Alan Turing", email: "alan@example.com", color: "#0ea5e9" },
  ];

  const documents = [
    {
      id: "doc-welcome",
      title: "Welcome to DocFlow",
      ownerId: "user-ada",
      content:
        "<h1>Welcome to DocFlow</h1>" +
        "<p>DocFlow is a lightweight, collaborative document editor. This document is owned by <strong>Ada Lovelace</strong> and shared with you so you can see how sharing works.</p>" +
        "<h2>What you can do</h2>" +
        "<ul>" +
        "<li>Create and rename documents</li>" +
        "<li>Edit with <strong>bold</strong>, <em>italic</em>, <u>underline</u>, headings and lists</li>" +
        "<li>Upload a .txt, .md or .docx file to turn it into a document</li>" +
        "<li>Share a document with another person as a viewer or editor</li>" +
        "</ul>" +
        "<h2>Try it</h2>" +
        "<ol>" +
        "<li>Switch users with the avatar in the top-right corner</li>" +
        "<li>Open this document and edit it (if you have editor access)</li>" +
        "<li>Create your own document from the dashboard</li>" +
        "</ol>" +
        "<blockquote>Everything you change is saved automatically and survives a refresh.</blockquote>",
      createdAt: SEED_TIME,
      updatedAt: SEED_TIME,
    },
    {
      id: "doc-roadmap",
      title: "Q3 Product Roadmap",
      ownerId: "user-ada",
      content:
        "<h1>Q3 Product Roadmap</h1>" +
        "<p>A private working document owned by Ada. Only Ada can see this one until it is shared.</p>" +
        "<h2>Themes</h2>" +
        "<ul><li>Editor polish</li><li>Sharing &amp; permissions</li><li>Import / export</li></ul>",
      createdAt: SEED_TIME,
      updatedAt: SEED_TIME,
    },
    {
      id: "doc-notes",
      title: "Meeting Notes — Kickoff",
      ownerId: "user-grace",
      content:
        "<h1>Kickoff Notes</h1>" +
        "<p>Owned by <strong>Grace Hopper</strong> and shared with Ada as an editor.</p>" +
        "<ul><li>Agreed on scope</li><li>Picked the editing library</li><li>Next: persistence</li></ul>",
      createdAt: SEED_TIME,
      updatedAt: SEED_TIME,
    },
  ];

  const shares = [
    // Ada shares the welcome doc with everyone so the demo is lively.
    { id: "share-welcome-grace", documentId: "doc-welcome", userId: "user-grace", role: "editor" as const, createdAt: SEED_TIME },
    { id: "share-welcome-alan", documentId: "doc-welcome", userId: "user-alan", role: "viewer" as const, createdAt: SEED_TIME },
    // Grace shares her notes with Ada as an editor.
    { id: "share-notes-ada", documentId: "doc-notes", userId: "user-ada", role: "editor" as const, createdAt: SEED_TIME },
  ];

  return { users, documents, shares };
}
