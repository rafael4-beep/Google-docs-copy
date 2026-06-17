// Convert an uploaded file into editor-ready HTML.
//
// Supported types (stated in the UI and README):
//   .txt  — plain text, newlines become paragraphs
//   .md   — Markdown, rendered to HTML
//   .docx — Word document, converted with mammoth
//
// Returns { title, html } or throws an Error with a user-friendly message.

import { marked } from "marked";
import mammoth from "mammoth";
import { sanitizeHtml } from "./sanitize";

export const SUPPORTED_EXTENSIONS = [".txt", ".md", ".docx"];
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB

function extOf(name: string): string {
  const i = String(name || "").lastIndexOf(".");
  return i === -1 ? "" : name.slice(i).toLowerCase();
}

function titleFromFilename(name: string): string {
  const base = String(name || "Untitled").replace(/\.[^.]+$/, "");
  return base.trim() || "Untitled document";
}

function textToHtml(text: string): string {
  const blocks = String(text)
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((b) => `<p>${escapeHtml(b).replace(/\n/g, "<br>")}</p>`);
  return blocks.join("") || "<p></p>";
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function importFile({
  filename,
  buffer,
}: {
  filename: string;
  buffer: Buffer;
}): Promise<{ title: string; html: string }> {
  const ext = extOf(filename);
  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    throw new Error(
      `Unsupported file type "${ext || "unknown"}". Supported types: ${SUPPORTED_EXTENSIONS.join(", ")}.`
    );
  }
  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw new Error("File is too large (max 5MB).");
  }

  let html: string;
  if (ext === ".docx") {
    const result = await mammoth.convertToHtml({ buffer });
    html = result.value;
  } else if (ext === ".md") {
    html = marked.parse(buffer.toString("utf-8"), { async: false }) as string;
  } else {
    html = textToHtml(buffer.toString("utf-8"));
  }

  html = sanitizeHtml(html).trim() || "<p></p>";
  return { title: titleFromFilename(filename), html };
}
