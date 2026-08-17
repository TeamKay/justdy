"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Menubar } from "./Menubar";
import TextAlign from "@tiptap/extension-text-align";
import { ControllerRenderProps, FieldValues, Path } from "react-hook-form";
import { useEffect, useRef } from "react";

type FlexibleFieldProps<
  T extends FieldValues = FieldValues,
  TName extends Path<T> = Path<T>,
> = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  name?: TName;
  ref?: React.Ref<unknown>;
};

type RichTextEditorProps<T extends FieldValues, TName extends Path<T>> = {
  field: ControllerRenderProps<T, TName> | FlexibleFieldProps<T, TName>;
};

export function RichTextEditor<
  T extends FieldValues = FieldValues,
  TName extends Path<T> = Path<T>,
>({ field }: RichTextEditorProps<T, TName>) {
  const isSettingContent = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit,

      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],

    content: field.value || "",

    editorProps: {
      attributes: {
        class:
          "min-h-[300px] w-full max-w-none p-4 focus:outline-none prose prose-sm sm:prose-base dark:prose-invert",
      },
    },

    immediatelyRender: false,

    onUpdate({ editor }) {
      if (isSettingContent.current) {
        return;
      }

      field.onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const currentHTML = editor.getHTML();
    const nextHTML = field.value || "";

    if (currentHTML === nextHTML) {
      return;
    }

    isSettingContent.current = true;

    editor.commands.setContent(nextHTML, {
      emitUpdate: false,
    });

    isSettingContent.current = false;
  }, [editor, field.value]);

  return (
    <div className="w-full overflow-hidden rounded-lg border border-input dark:bg-input/30">
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

// // Flexible interface accommodating both React Hook Form bindings and structural standard fields

// type FlexibleFieldProps<
//   T extends FieldValues = FieldValues,
//   TName extends Path<T> = Path<T>,
// > = {
//   value: string;
//   onChange: (value: string) => void;
//   onBlur?: () => void;
//   name?: TName;
//   ref?: React.Ref<unknown>; // ✅ Fixed: Swapped 'any' for 'unknown' to eliminate the linter warning
// };

// type RichTextEditorProps<T extends FieldValues, TName extends Path<T>> = {
//   // Accepts a standard React Hook Form Controller mapping or our custom structural binding
//   field: ControllerRenderProps<T, TName> | FlexibleFieldProps<T, TName>;
// };

// export function RichTextEditor<
//   T extends FieldValues = FieldValues,
//   TName extends Path<T> = Path<T>,
// >({ field }: RichTextEditorProps<T, TName>) {
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

//   // Load RHF or manual value into editor instance
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
