// Tests for upload conversion + HTML sanitization (the XSS boundary for any
// content that enters the system from a file).

import { describe, it, expect } from "vitest";
import { sanitizeHtml } from "../lib/sanitize";
import { importFile } from "../lib/import";

describe("sanitizeHtml", () => {
  it("removes <script> tags and their contents", () => {
    const out = sanitizeHtml('<p>ok</p><script>alert(1)</script>');
    expect(out).toContain("<p>ok</p>");
    expect(out.toLowerCase()).not.toContain("script");
    expect(out).not.toContain("alert(1)");
  });

  it("strips event-handler attributes", () => {
    const out = sanitizeHtml('<p onclick="evil()">hi</p>');
    expect(out).toBe("<p>hi</p>");
  });

  it("drops javascript: links but keeps safe href", () => {
    expect(sanitizeHtml('<a href="javascript:alert(1)">x</a>')).toBe("<a>x</a>");
    const safe = sanitizeHtml('<a href="https://example.com">x</a>');
    expect(safe).toContain('href="https://example.com"');
  });

  it("keeps allow-listed formatting tags", () => {
    const out = sanitizeHtml("<h1>T</h1><strong>b</strong><em>i</em><ul><li>x</li></ul>");
    expect(out).toBe("<h1>T</h1><strong>b</strong><em>i</em><ul><li>x</li></ul>");
  });
});

describe("importFile", () => {
  it("converts plain text into paragraphs and derives a title from the filename", async () => {
    const result = await importFile({
      filename: "notes.txt",
      buffer: Buffer.from("First line\n\nSecond paragraph"),
    });
    expect(result.title).toBe("notes");
    expect(result.html).toContain("<p>First line</p>");
    expect(result.html).toContain("<p>Second paragraph</p>");
  });

  it("converts Markdown to HTML", async () => {
    const result = await importFile({
      filename: "readme.md",
      buffer: Buffer.from("# Heading\n\n- item one\n- item two"),
    });
    expect(result.html).toContain("<h1>Heading</h1>");
    expect(result.html).toContain("<li>item one</li>");
  });

  it("rejects unsupported file types", async () => {
    await expect(
      importFile({ filename: "photo.png", buffer: Buffer.from("x") })
    ).rejects.toThrow(/Unsupported file type/);
  });
});
