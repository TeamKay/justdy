"use client";

import { useState, useTransition, MouseEvent } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { RichTextRenderer } from "./RichTextRenderer";
import { deleteSubject } from "../actions/admin-subjects";

interface Subject {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function AdminSubjectTable({ data }: { data: Subject[] }) {
  const [, startTransition] = useTransition();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuCoords, setMenuCoords] = useState<{
    top: number;
    left: number;
  }>({
    top: 0,
    left: 0,
  });

  const handleDelete = (id: string) => {
    if (confirm("Delete this subject?")) {
      startTransition(async () => {
        await deleteSubject(id);
      });
    }
  };

  const handleToggleMenu = (e: MouseEvent<HTMLButtonElement>, id: string) => {
    if (openMenuId === id) {
      setOpenMenuId(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();

      setMenuCoords({
        top: rect.bottom + window.scrollY + 8,

        left: rect.right + window.scrollX - 176,
      });

      setOpenMenuId(id);
    }
  };

  return (
    <tbody className="divide-y divide-border bg-background">
      {data.length === 0 ? (
        <tr>
          <td colSpan={4} className="py-20 px-6">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6 shadow-inner">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-10 h-10 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                  />
                </svg>
              </div>

              <h3 className="text-xl font-semibold">No Subjects Yet</h3>

              <p className="mt-2 text-sm text-muted-foreground">
                Create your first subject profile.
              </p>

              <Link
                href="/admin/subjects/create"
                className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
              >
                + Create Subject
              </Link>
            </div>
          </td>
        </tr>
      ) : (
        data.map((item) => {
          // Extract the first letter and fallback to "?" if empty
          const initial = item.name ? item.name.charAt(0).toUpperCase() : "?";

          return (
            <tr key={item.id} className="hover:bg-muted/30 transition-colors">
              {/* NAME WITH ROUNDED INITIAL */}
              <td className="px-6 py-4 font-medium text-sm max-w-xs">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-200 border border-zinc-700 select-none">
                    {initial}
                  </div>
                  <span className="truncate">{item.name}</span>
                </div>
              </td>

              {/* DESCRIPTION */}
              <td className="px-6 py-4 text-xs text-muted-foreground max-w-sm">
                {item.description ? (
                  <RichTextRenderer content={item.description} />
                ) : (
                  <span className="italic text-muted-foreground/60">
                    No description provided
                  </span>
                )}
              </td>

              {/* ACTIONS */}
              <td className="px-6 py-4 text-right">
                <button
                  onClick={(e) => handleToggleMenu(e, item.id)}
                  className="p-2 rounded-md hover:bg-muted"
                >
                  ⋮
                </button>

                {openMenuId === item.id &&
                  createPortal(
                    <>
                      {/* CLICK OUTSIDE */}
                      <div
                        className="fixed inset-0 z-9998"
                        onClick={() => setOpenMenuId(null)}
                      />

                      {/* DROPDOWN */}

                      <div
                        className="fixed w-44 bg-background border rounded-lg shadow-xl z-9999 overflow-hidden"
                        style={{
                          top: `${menuCoords.top}px`,
                          left: `${menuCoords.left}px`,
                        }}
                      >
                        <Link
                          href={`/admin/subjects/${item.id}/edit`}
                          className="block w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted"
                          onClick={() => setOpenMenuId(null)}
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => {
                            handleDelete(item.id);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-muted border-t border-border"
                        >
                          Delete
                        </button>
                      </div>
                    </>,

                    document.body,
                  )}
              </td>
            </tr>
          );
        })
      )}
    </tbody>
  );
}
