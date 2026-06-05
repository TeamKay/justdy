"use client";

import { useState, useTransition, MouseEvent } from "react";
import Image from "next/image";
import { deleteCommunity } from "../actions/admin-communities";
import Link from "next/link";

interface Community {
  id: string;
  name: string;
  smallDescription: RichTextDoc | string | null;
  description: RichTextDoc | string | null;
  category: string;
  memberCount: number;
  fileKey: string | null;
  price: number | null;
}

type RichTextTextNode = {
  type: string;
  text?: string;
};

type RichTextBlock = {
  type: string;
  content?: RichTextTextNode[];
};

type RichTextDoc = {
  type: string;
  content?: RichTextBlock[];
};

function extractTextFromRichContent(description: RichTextDoc | string) {
  try {
    const doc: RichTextDoc =
      typeof description === "string" ? JSON.parse(description) : description;

    return (
      doc.content
        ?.map((block: RichTextBlock) =>
          block.content?.map((c: RichTextTextNode) => c.text ?? "").join(""),
        )
        .join(" ") || ""
    );
  } catch {
    return typeof description === "string" ? description : "";
  }
}

/* ✅ UPDATED IMAGE COMPONENT */
function CommunityImage({ src, alt }: { src?: string | null; alt: string }) {
  const fallback = "/placeholder.png";

  // If the src is an UploadThing fileKey, append the standard UploadThing domain.
  // If it's already a full URL or an empty string, leave it as is.
  const imageUrl = src
    ? src.startsWith("http")
      ? src
      : `https://utfs.io/f/${src}`
    : fallback;

  return (
    <div className="relative w-12 h-12 shrink-0 rounded-md overflow-hidden border">
      <Image
        src={imageUrl}
        alt={alt}
        fill
        sizes="48px"
        className="object-cover"
        // Prevent crashing if the image fails to resolve
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = fallback;
        }}
      />
    </div>
  );
}

export function AdminCommunityTable({ data }: { data: Community[] }) {
  const [, startTransition] = useTransition();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [menuCoords, setMenuCoords] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  const handleDelete = (id: string) => {
    if (confirm("Delete this community?")) {
      startTransition(async () => {
        await deleteCommunity(id);
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
          <td colSpan={5} className="py-20 px-6">
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
                    d="M3.75 21h16.5M4.5 3h15a1.5 1.5 0 011.5 1.5v10.5A1.5 1.5 0 0119.5 16.5h-15A1.5 1.5 0 013 15V4.5A1.5 1.5 0 014.5 3zm3 18v-4.5m10.5 4.5v-4.5"
                  />
                </svg>
              </div>

              <h3 className="text-xl font-semibold tracking-tight">
                No Communities Yet
              </h3>

              <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
                Create your first learning community to start connecting tutors
                and learners in one collaborative space.
              </p>

              <Link
                href="/admin/communities/create"
                className="mt-6 inline-flex items-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-all"
              >
                + Create Community
              </Link>
            </div>
          </td>
        </tr>
      ) : (
        data.map((item) => (
          <tr key={item.id} className="hover:bg-muted/30 transition-colors">
            {/* COMMUNITY */}
            <td className="px-6 py-4 max-w-xs md:max-w-md lg:max-w-lg">
              <div className="flex items-center gap-4">
                <CommunityImage src={item.fileKey} alt={item.name} />

                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-foreground truncate">
                    {item.name}
                  </p>

                  <p className="text-xs text-muted-foreground italic line-clamp-1 md:line-clamp-1 mt-0.5 whitespace-normal wrap-break-word">
                    {extractTextFromRichContent(item.smallDescription || "")}
                  </p>
                </div>
              </div>
            </td>

            {/* CATEGORY */}
            <td className="px-6 py-4">
              <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-muted text-muted-foreground">
                {item.category}
              </span>
            </td>

            {/* PRICE */}
            <td className="px-6 py-4 text-sm">
              {item.price !== null ? (
                <span className="font-medium">${item.price}/mo</span>
              ) : (
                <span className="text-muted-foreground">Free</span>
              )}
            </td>

            {/* MEMBERS */}
            <td className="px-6 py-4 text-sm text-muted-foreground">
              {item.memberCount.toLocaleString()}
            </td>

            {/* ACTIONS */}
            <td className="px-6 py-4 text-right">
              <button
                onClick={(e) => handleToggleMenu(e, item.id)}
                className="p-2 rounded-md hover:bg-muted transition"
              >
                ⋮
              </button>

              {openMenuId === item.id && (
                <>
                  <div
                    className="fixed inset-0 z-9998"
                    onClick={() => setOpenMenuId(null)}
                  />

                  <div
                    className="fixed w-44 bg-background border rounded-lg shadow-xl z-9999 overflow-hidden"
                    style={{
                      top: `${menuCoords.top}px`,
                      left: `${menuCoords.left}px`,
                    }}
                  >
                    <Link
                      href={`/admin/communities/${item.id}/edit`}
                      className="w-full block text-left px-3 py-2 text-sm hover:bg-muted"
                    >
                      Edit
                    </Link>

                    <button
                      onClick={() => {
                        handleDelete(item.id);
                        setOpenMenuId(null);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-muted"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </td>
          </tr>
        ))
      )}
    </tbody>
  );
}
