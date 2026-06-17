"use client";

// Formatting toolbar for the TipTap editor. Each button reflects the current
// selection's active state and toggles a mark/node.

import type { ReactNode } from "react";
import type { Editor } from "@tiptap/react";

function Btn({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()} // keep editor selection
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={`flex h-8 min-w-8 items-center justify-center rounded-md px-1.5 text-sm transition disabled:opacity-40 ${
        active ? "bg-brand text-white" : "text-foreground hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-border" />;
}

export default function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-0.5">
      <Btn title="Heading 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
        <span className="font-semibold">H1</span>
      </Btn>
      <Btn title="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        <span className="font-semibold">H2</span>
      </Btn>
      <Btn title="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        <span className="font-semibold">H3</span>
      </Btn>

      <Divider />

      <Btn title="Bold (Ctrl+B)" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <span className="font-bold">B</span>
      </Btn>
      <Btn title="Italic (Ctrl+I)" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <span className="italic font-serif">I</span>
      </Btn>
      <Btn title="Underline (Ctrl+U)" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <span className="underline">U</span>
      </Btn>
      <Btn title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <span className="line-through">S</span>
      </Btn>

      <Divider />

      <Btn title="Bulleted list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <svg width="17" height="17" viewBox="0 0 20 20" fill="none"><circle cx="4" cy="6" r="1.3" fill="currentColor"/><circle cx="4" cy="10" r="1.3" fill="currentColor"/><circle cx="4" cy="14" r="1.3" fill="currentColor"/><path d="M8 6h9M8 10h9M8 14h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
      </Btn>
      <Btn title="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <svg width="17" height="17" viewBox="0 0 20 20" fill="none"><text x="1.5" y="8" fontSize="6" fill="currentColor">1.</text><text x="1.5" y="16" fontSize="6" fill="currentColor">2.</text><path d="M8 6h9M8 14h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
      </Btn>
      <Btn title="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <span className="font-serif text-base leading-none">&ldquo;</span>
      </Btn>
      <Btn title="Code block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
        <span className="font-mono text-xs">{"</>"}</span>
      </Btn>

      <Divider />

      <Btn title="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
        <svg width="17" height="17" viewBox="0 0 20 20" fill="none"><path d="M3 5h14M3 9h9M3 13h14M3 17h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
      </Btn>
      <Btn title="Align center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
        <svg width="17" height="17" viewBox="0 0 20 20" fill="none"><path d="M3 5h14M5.5 9h9M3 13h14M5.5 17h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
      </Btn>
      <Btn title="Align right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
        <svg width="17" height="17" viewBox="0 0 20 20" fill="none"><path d="M3 5h14M8 9h9M3 13h14M8 17h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
      </Btn>

      <Divider />

      <Btn title="Undo (Ctrl+Z)" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
        <svg width="17" height="17" viewBox="0 0 20 20" fill="none"><path d="M7 7H12.5a4 4 0 010 8H7M7 7L4 4M7 7L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </Btn>
      <Btn title="Redo (Ctrl+Y)" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
        <svg width="17" height="17" viewBox="0 0 20 20" fill="none"><path d="M13 7H7.5a4 4 0 000 8H13M13 7l3-3M13 7l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </Btn>
    </div>
  );
}
