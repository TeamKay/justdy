"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";

type PostMenuProps = {
  postId: string;
  isOwner: boolean;
  onEdit: (postId: string) => void;
  onDelete: (postId: string) => void;
};

export default function PostMenu({
  postId,
  isOwner,
  onEdit,
  onDelete,
}: PostMenuProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="p-1.5 rounded-md hover:bg-slate-800 transition"
          aria-label="Post options"
        >
          <MoreVertical className="w-4 h-4 text-slate-400" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          side="bottom"
          align="end"
          sideOffset={8}
          className="
            z-9999
            min-w-40
            rounded-md
            border border-slate-800
            bg-emerald-900/10
            shadow-xl
            overflow-hidden
            text-sm
          "
        >
          <DropdownMenu.Item
            onClick={() => onEdit(postId)}
            className="
              flex items-center gap-2 px-3 py-2
              text-slate-300
              hover:bg-slate-900
              cursor-pointer
              outline-none
            "
          >
            <Pencil className="w-4 h-4" />
            Edit
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="h-px bg-slate-800" />

          <DropdownMenu.Item
            // 1. Natively disable the item if the user is not the owner
            disabled={!isOwner}
            onClick={() => onDelete(postId)}
            className={`
            flex items-center gap-2 px-3 py-2
            outline-none transition-colors
            ${
              isOwner
                ? "text-red-400 hover:bg-slate-900 cursor-pointer"
                : "text-slate-600 opacity-50 cursor-not-allowed pointer-events-none"
            }
          `}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
