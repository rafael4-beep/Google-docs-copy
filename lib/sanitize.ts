// Minimal HTML sanitizer for content coming from file uploads (and as a second
// line of defense for saved content). It allow-lists a small set of formatting
// tags that the editor itself produces and strips everything else — notably
// <script>, event handlers, and javascript: URLs.
//
// For a production app you would use a vetted library (DOMPurify / sanitize-html).
// This is intentionally small and dependency-free for the take-home scope.

const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "b", "em", "i", "u", "s", "h1", "h2", "h3",
  "ul", "ol", "li", "blockquote", "code", "pre", "a",
]);

export function sanitizeHtml(input: unknown): string {
  let html = String(input ?? "");

  // Drop script/style blocks entirely (including their contents).
  html = html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, "");

  // Walk every tag; keep allow-listed ones (attributes stripped, except safe
  // href on <a>), drop the rest.
  html = html.replace(/<\/?([a-zA-Z0-9]+)([^>]*)>/g, (match, rawName: string, attrs: string) => {
    const name = rawName.toLowerCase();
    if (!ALLOWED_TAGS.has(name)) return "";
    const closing = match.startsWith("</");
    if (closing) return `</${name}>`;
    if (name === "a") {
      const hrefMatch = /href\s*=\s*("([^"]*)"|'([^']*)')/i.exec(attrs);
      const href = hrefMatch ? hrefMatch[2] ?? hrefMatch[3] : "";
      if (href && /^(https?:|mailto:|\/)/i.test(href.trim())) {
        return `<a href="${href.trim().replace(/"/g, "&quot;")}" rel="noopener noreferrer" target="_blank">`;
      }
      return "<a>";
    }
    return `<${name}>`;
  });

  return html;
}
