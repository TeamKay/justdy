"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Menubar } from "./Menubar";
import TextAlign from "@tiptap/extension-text-align";
import { ControllerRenderProps, FieldValues, Path } from "react-hook-form";
import { useEffect } from "react";

// Flexible interface accommodating both React Hook Form bindings and structural standard fields

type FlexibleFieldProps<
  T extends FieldValues = FieldValues,
  TName extends Path<T> = Path<T>,
> = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  name?: TName;
  ref?: React.Ref<unknown>; // ✅ Fixed: Swapped 'any' for 'unknown' to eliminate the linter warning
};

type RichTextEditorProps<T extends FieldValues, TName extends Path<T>> = {
  // Accepts a standard React Hook Form Controller mapping or our custom structural binding
  field: ControllerRenderProps<T, TName> | FlexibleFieldProps<T, TName>;
};

export function RichTextEditor<
  T extends FieldValues = FieldValues,
  TName extends Path<T> = Path<T>,
>({ field }: RichTextEditorProps<T, TName>) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],

    editorProps: {
      attributes: {
        class:
          "min-h-[300px] p-4 focus:outline-none prose prose-sm sm:prose lg:prose-lg xl:prose-xl dark:prose-invert !w-full !max-w-none",
      },
    },

    immediatelyRender: false,

    onUpdate({ editor }) {
      field.onChange(editor.getHTML());
    },
  });

  // Load RHF or manual value into editor instance
  useEffect(() => {
    if (!editor) return;

    if (field.value !== editor.getHTML()) {
      editor.commands.setContent(field.value || "");
    }
  }, [field.value, editor]);

  return (
    <div className="w-full border border-input rounded-lg overflow-hidden dark:bg-input/30">
      <Menubar editor={editor} />

      <EditorContent editor={editor} />
    </div>
  );
}

// "use client";

// import { EditorContent, useEditor } from "@tiptap/react";
// import StarterKit from "@tiptap/starter-kit";
// import { Menubar } from "./Menubar";
// import TextAlign from "@tiptap/extension-text-align";
// import { ControllerRenderProps, FieldValues, Path } from "react-hook-form";
// import { useEffect } from "react";

// type RichTextEditorProps<T extends FieldValues, TName extends Path<T>> = {
//   field: ControllerRenderProps<T, TName>;
// };

// export function RichTextEditor<T extends FieldValues, TName extends Path<T>>({
//   field,
// }: RichTextEditorProps<T, TName>) {
//   const editor = useEditor({
//     extensions: [
//       StarterKit,
//       TextAlign.configure({
//         types: ["heading", "paragraph"],
//       }),
//     ],

//     editorProps: {
//       attributes: {
//         class:
//           "min-h-[300px] p-4 focus:outline-none prose prose-sm sm:prose lg:prose-lg xl:prose-xl dark:prose-invert !w-full !max-w-none",
//       },
//     },

//     immediatelyRender: false,

//     onUpdate({ editor }) {
//       field.onChange(editor.getHTML());
//     },
//   });

//   // Load RHF value into editor
//   useEffect(() => {
//     if (!editor) return;

//     if (field.value !== editor.getHTML()) {
//       editor.commands.setContent(field.value || "");
//     }
//   }, [field.value, editor]);

//   return (
//     <div className="w-full border border-input rounded-lg overflow-hidden dark:bg-input/30">
//       <Menubar editor={editor} />

//       <EditorContent editor={editor} />
//     </div>
//   );
// }
