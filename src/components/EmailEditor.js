'use client';

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List, ListOrdered, Undo, Redo } from "lucide-react";

const MenuBar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 border-b border-gray-200 p-2 bg-gray-50 rounded-t-lg">
      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }}
        className={`p-2 rounded-md transition-colors ${editor.isActive("bold") ? "bg-green-100 text-green-700" : "hover:bg-gray-200 text-gray-700"}`}
        title="Bold"
      >
        <Bold size={18} />
      </button>
      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }}
        className={`p-2 rounded-md transition-colors ${editor.isActive("italic") ? "bg-green-100 text-green-700" : "hover:bg-gray-200 text-gray-700"}`}
        title="Italic"
      >
        <Italic size={18} />
      </button>
      <div className="w-[1px] h-6 bg-gray-300 self-center mx-1"></div>
      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); }}
        className={`p-2 rounded-md transition-colors ${editor.isActive("bulletList") ? "bg-green-100 text-green-700" : "hover:bg-gray-200 text-gray-700"}`}
        title="Bullet List"
      >
        <List size={18} />
      </button>
      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run(); }}
        className={`p-2 rounded-md transition-colors ${editor.isActive("orderedList") ? "bg-green-100 text-green-700" : "hover:bg-gray-200 text-gray-700"}`}
        title="Ordered List"
      >
        <ListOrdered size={18} />
      </button>
      <div className="w-[1px] h-6 bg-gray-300 self-center mx-1"></div>
      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().undo().run(); }}
        disabled={!editor.can().undo()}
        className="p-2 rounded-md hover:bg-gray-200 text-gray-700 disabled:opacity-50 transition-colors"
        title="Undo"
      >
        <Undo size={18} />
      </button>
      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().redo().run(); }}
        disabled={!editor.can().redo()}
        className="p-2 rounded-md hover:bg-gray-200 text-gray-700 disabled:opacity-50 transition-colors"
        title="Redo"
      >
        <Redo size={18} />
      </button>
    </div>
  );
};

export default function EmailEditor({ content, onChange }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "min-h-[250px] p-4 focus:outline-none text-gray-800 leading-relaxed",
        spellcheck: "false",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent transition-all">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
