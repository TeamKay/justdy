"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Menubar } from "./Menubar";
import TextAlign from "@tiptap/extension-text-align";
import { ControllerRenderProps, FieldValues, Path } from "react-hook-form";

type RichTextEditorProps<T extends FieldValues, TName extends Path<T>> = {
  field: ControllerRenderProps<T, TName>;
};

export function RichTextEditor<T extends FieldValues, TName extends Path<T>>({
  field,
}: RichTextEditorProps<T, TName>) {
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

    // SAVE HTML
    onUpdate: ({ editor }) => {
      field.onChange(editor.getHTML());
    },

    // LOAD HTML
    content: field.value || "",

    immediatelyRender: false,
  });

  return (
    <div className="w-full border border-input rounded-lg overflow-hidden dark:bg-input/30">
      <Menubar editor={editor} />

      <EditorContent editor={editor} />
    </div>
  );
}

// "use client"

// import { EditorContent, useEditor } from '@tiptap/react'
// import StarterKit from '@tiptap/starter-kit'
// import { Menubar } from './Menubar';
// import TextAlign from '@tiptap/extension-text-align';
// import { ControllerRenderProps, FieldValues, Path } from "react-hook-form";

// type RichTextEditorProps<T extends FieldValues, TName extends Path<T>> = {
//   field: ControllerRenderProps<T, TName>;
// };

// export function RichTextEditor< T extends FieldValues, TName extends Path<T>>({ field }: RichTextEditorProps<T, TName>) {
//   const editor = useEditor({
//     extensions: [
//       StarterKit,
//       TextAlign.configure({
//         types: ["heading", "paragraph"],
//       }),
//     ],

//         editorProps: {
//             attributes: {
//                 class: "min-h-[300px] p-4 focus: outline-none prose prose-sm sm:prose lg:prose-lg xl:prose-xl dark:prose-invert !w-full !max-w-none",
//             },
//         },

//         onUpdate: ({editor}) => {
//             field.onChange(JSON.stringify(editor.getJSON()));
//         },
//         content: field.value ? JSON.parse(field.value) : "",

//         immediatelyRender: false,
//     });

//     return (
//         <div className='w-full border border-input rounded-lg overflow-hidden dark:bg-input/30'>
//             <Menubar editor={editor} />
//             <EditorContent editor={editor} />
//         </div>
//     );
// }
