"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { useEffect, useRef } from "react";
import Toolbar from "./Toolbar";

// Rich-text editor built on TipTap/ProseMirror.
// - `editable` toggles between editing and read-only (viewer) mode.
// - `onChange(html)` fires on every edit; the parent debounces it for autosave.
export default function RichTextEditor({
  initialContent,
  editable,
  onChange,
}: {
  initialContent?: string;
  editable: boolean;
  onChange?: (html: string) => void;
}) {
  // When TipTap parses the initial HTML it may emit a normalizing transaction.
  // We capture the post-parse HTML as a baseline and ignore any update that
  // matches it, so the document isn't marked "unsaved" before the user types.
  const baselineRef = useRef<string | null>(null);

  const editor = useEditor({
    editable,
    // Required in Next.js / SSR to avoid hydration mismatches.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "Start writing your document…" }),
    ],
    content: initialContent || "<p></p>",
    editorProps: {
      attributes: { class: "doc-content min-h-[55vh] outline-none" },
    },
    onCreate: ({ editor }) => {
      baselineRef.current = editor.getHTML();
    },
    onUpdate: ({ editor }) => {
      // Ignore transactions that fire while the editor isn't focused: those are
      // ProseMirror normalizing the initial HTML on mount, not user edits.
      // (Toolbar actions call .focus() first, so real edits are always focused.)
      if (!editor.isFocused) return;
      const html = editor.getHTML();
      if (html === baselineRef.current) return; // genuine no-op
      onChange?.(html);
    },
  });

  useEffect(() => {
    if (editor) editor.setEditable(editable);
  }, [editable, editor]);

  return (
    <div>
      {editable && (
        <div className="sticky top-14 z-10 -mx-4 mb-4 border-b border-border bg-surface/90 px-4 py-2 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
          <Toolbar editor={editor} />
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
