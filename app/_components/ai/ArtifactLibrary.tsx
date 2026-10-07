"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Download,
  ExternalLink,
  FileText,
  ImageIcon,
  LibraryBig,
  Loader2,
  MoreVertical,
  Palette,
  Trash2,
  Play,
  RefreshCw,
  Search,
  Sparkles,
  Video,
  X,
} from "lucide-react";
import Image from "next/image";

type Resource = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string | null;
  visibility: string | null;
  subject: string | null;
  topic: string | null;
  grade: string | null;
  thumbnailUrl: string | null;
  content: unknown;
  metadata: unknown;
  createdAt: string;
  updatedAt: string;
  slug: string | null;
};

type PreviewResource = Resource & {
  answerKey?: unknown;
  accessType?: string | null;
  versionId?: string | null;
  versionNumber?: number | null;
  generationId?: string | null;
};

type ResourceResponse = {
  resources?: Resource[];
  error?: string;
};

type PreviewResponse = {
  resource?: PreviewResource;
  error?: string;
};

const FILTERS = [
  ["", "All"],
  ["ASSESSMENT", "Assessments"],
  ["IMAGE", "Images"],
  ["VIDEO", "Videos"],
  ["COLORING_PAGE", "Coloring Pages"],
] as const;

const record = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;

const str = (v: unknown) => (typeof v === "string" ? v : null);

const num = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

const typeOf = (v: string) => v.trim().toUpperCase();

function label(type: string) {
  switch (typeOf(type)) {
    case "ASSESSMENT":
      return "Assessment";
    case "COLORING_PAGE":
      return "Coloring Page";
    case "IMAGE":
      return "Image";
    case "VIDEO":
      return "Video";
    default:
      return typeOf(type)
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

function icon(type: string) {
  switch (typeOf(type)) {
    case "IMAGE":
      return ImageIcon;
    case "VIDEO":
      return Video;
    case "COLORING_PAGE":
      return Palette;
    default:
      return FileText;
  }
}

function date(v: string) {
  const d = new Date(v);

  return Number.isFinite(d.getTime())
    ? new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(d)
    : "";
}

function href(r: { slug: string | null; metadata?: unknown }) {
  const p = str(record(r.metadata)?.editorPath);

  return p?.startsWith("/")
    ? p
    : r.slug
      ? `/resources/${encodeURIComponent(r.slug)}`
      : "/dashboard/library";
}

function AssessmentPreview({ content }: { content: unknown }) {
  const d = record(content);

  if (!d) return <EmptyPreview />;

  const questions = Array.isArray(d.questions) ? d.questions : [];

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className="rounded-lg border bg-background p-5">
        <h2 className="text-xl font-semibold">
          {str(d.title) || str(d.name) || "Assessment"}
        </h2>

        <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
          {[
            str(d.gradeLevel) || str(d.grade),
            str(d.subject),
            str(d.topic),
          ]
            .filter(Boolean)
            .map((v, i) => (
              <span
                key={i}
                className="rounded-lg bg-muted px-2.5 py-1"
              >
                {v}
              </span>
            ))}
        </div>

        {str(d.instructions) || str(d.directions) ? (
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            {str(d.instructions) || str(d.directions)}
          </p>
        ) : null}
      </div>

      {questions.length ? (
        questions.map((raw, i) => {
          const q = record(raw);

          if (!q) return null;

          const options = Array.isArray(q.options) ? q.options : [];

          return (
            <div
              key={i}
              className="rounded-lg border bg-background p-5"
            >
              <div className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                  {i + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-6">
                    {str(q.question) ||
                      str(q.prompt) ||
                      str(q.text) ||
                      `Question ${i + 1}`}
                  </p>

                  {options.length ? (
                    <div className="mt-3 space-y-2">
                      {options.map((o, j) => (
                        <div
                          key={j}
                          className="rounded-lg border bg-muted/20 px-3 py-2 text-sm"
                        >
                          <b className="mr-2 text-xs text-muted-foreground">
                            {String.fromCharCode(65 + j)}.
                          </b>
                          {typeof o === "string" ? o : JSON.stringify(o)}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <EmptyPreview text="The assessment is saved, but no questions are available for inline preview." />
      )}
    </div>
  );
}

function ColoringPreview({ content }: { content: unknown }) {
  const d = record(content);
  const raw = Array.isArray(d?.pages) ? d.pages : [];
  const pages = raw
    .map((p) => {
      const x = record(p);
      const u = str(x?.url) || str(x?.imageUrl);
      return u ? u : null;
    })
    .filter((x): x is string => Boolean(x));

  const one = str(d?.imageUrl);

  if (!pages.length && one) {
    return (
      <div className="flex justify-center">
        <Image
          src={one}
          alt="Coloring page"
          className="max-h-[76vh] max-w-full rounded-lg bg-white object-contain shadow-lg"
        />
      </div>
    );
  }

  if (!pages.length) {
    return <EmptyPreview text="This coloring page has no previewable image." />;
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {pages.map((u, i) => (
        <figure
          key={`${u}-${i}`}
          className="overflow-hidden rounded-lg border bg-white"
        >
          <Image
            src={u}
            alt={`Coloring page ${i + 1}`}
            className="aspect-square w-full object-contain"
          />
          <figcaption className="border-t px-4 py-2 text-center text-xs text-muted-foreground">
            Page {i + 1}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

function EmptyPreview({
  text = "This resource has no inline preview.",
}: {
  text?: string;
}) {
  return (
    <div className="rounded-lg border bg-muted/30 p-6 text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function PreviewModal({
  resource,
  onClose,
}: {
  resource: PreviewResource;
  onClose: () => void;
}) {
  const type = typeOf(resource.type);
  const c = record(resource.content);
  const image = str(c?.imageUrl) || resource.thumbnailUrl;
  const video = str(c?.videoUrl);
  const link = href(resource);

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg border bg-background shadow-2xl">
        <header className="flex shrink-0 items-center justify-between gap-4 border-b px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
              {label(type)}
            </span>
            <h2 className="mt-1 truncate text-base font-semibold sm:text-lg">
              {resource.title}
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            {link !== "/dashboard/library" ? (
              <Link
                href={link}
                className="hidden h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium hover:bg-muted sm:inline-flex"
              >
                <ExternalLink className="size-4" />
                Open
              </Link>
            ) : null}

            {type === "IMAGE" && image ? (
              <a
                href={image}
                download
                className="hidden h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium hover:bg-muted sm:inline-flex"
              >
                <Download className="size-4" />
                Download
              </a>
            ) : null}

            <button
              type="button"
              onClick={onClose}
              className="inline-flex size-9 items-center justify-center rounded-lg border hover:bg-muted"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-auto bg-muted/40 p-4 sm:p-6">
          {type === "IMAGE" && image ? (
          <div className="flex min-h-[60vh] items-center justify-center overflow-auto p-4 sm:p-8">
            <div className="relative aspect-[210/297] w-full max-w-[794px] overflow-hidden bg-white shadow-2xl">
              <Image
                src={image}
                alt={resource.title}
                fill
                sizes="(max-width: 840px) 100vw, 794px"
                className="object-contain"
                priority
              />
            </div>
          </div>
          ) : type === "VIDEO" && video ? (
            <div className="flex min-h-[60vh] items-center justify-center">
              <video
                src={video}
                controls
                playsInline
                preload="metadata"
                className="max-h-[76vh] w-full max-w-5xl rounded-lg bg-black shadow-lg"
              >
                Your browser does not support video playback.
              </video>
            </div>
          ) : type === "COLORING_PAGE" ? (
            <ColoringPreview content={resource.content} />
          ) : type === "ASSESSMENT" || type === "WORKSHEET" ? (
            <AssessmentPreview content={resource.content} />
          ) : (
            <EmptyPreview />
          )}
        </div>

        <footer className="shrink-0 border-t px-4 py-3 text-xs text-muted-foreground sm:px-5">
          {resource.description || `Saved ${date(resource.createdAt)}`}
        </footer>
      </div>
    </div>
  );
}


function downloadResource(resource: Resource) {
  const content = record(resource.content);
  const type = typeOf(resource.type);

  const directUrl =
    str(content?.imageUrl) ||
    str(content?.videoUrl) ||
    (type === "COLORING_PAGE" &&
      Array.isArray(content?.pages) &&
      (() => {
        const first = record(content.pages[0]);
        return str(first?.url) || str(first?.imageUrl);
      })());

  if (directUrl) {
    const a = document.createElement("a");
    a.href = directUrl;
    a.download = resource.title || "download";
    a.target = "_blank";
    a.rel = "noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();
    return;
  }

  // Assessments and other non-file resources are downloaded as JSON.
  const blob = new Blob(
    [
      JSON.stringify(
        {
          title: resource.title,
          description: resource.description,
          type: resource.type,
          subject: resource.subject,
          topic: resource.topic,
          grade: resource.grade,
          content: resource.content,
          metadata: resource.metadata,
        },
        null,
        2,
      ),
    ],
    { type: "application/json" },
  );

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(resource.title || "resource")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || "resource"}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function ArtifactLibrary() {
  const [filter, setFilter] = useState("");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewResource | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Resource | null>(null);

  const load = useCallback(async () => {
    setError(null);

    try {
      const p = new URLSearchParams({ limit: "100" });

      if (filter) p.set("type", filter);

      const r = await fetch(`/api/resources?${p}`, {
        cache: "no-store",
        credentials: "include",
      });
      const d = (await r.json()) as ResourceResponse;

      if (!r.ok) {
        throw new Error(d.error || "Unable to load your library.");
      }

      setItems(d.resources || []);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to load your library.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  const openPreview = useCallback((id: string) => {
    setPreview(null);
    setPreviewError(null);
    setPreviewLoading(true);
    setPreviewId(id);
  }, []);

  const closePreview = useCallback(() => {
    setPreviewId(null);
    setPreview(null);
    setPreviewError(null);
    setPreviewLoading(false);
  }, []);

  const deleteResource = useCallback(async (resource: Resource) => {
    setDeletingId(resource.id);
    setError(null);

    try {
      const response = await fetch(
        `/api/resources/${encodeURIComponent(resource.id)}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        },
      );

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Unable to delete this resource.");
      }

      setItems((current) => current.filter((item) => item.id !== resource.id));

      if (previewId === resource.id) {
        closePreview();
      }

      setDeleteTarget(null);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to delete this resource.",
      );
    } finally {
      setDeletingId(null);
    }
  }, [closePreview, previewId]);

  useEffect(() => {
    const closeMenu = () => setMenuId(null);
    window.addEventListener("click", closeMenu);

    return () => window.removeEventListener("click", closeMenu);
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 0);

    const refresh = () => {
      setRefreshing(true);
      void load();
    };

    window.addEventListener("justdy:resource-created", refresh);
    window.addEventListener("justdy:artifact-created", refresh);

    return () => {
      window.clearTimeout(t);
      window.removeEventListener("justdy:resource-created", refresh);
      window.removeEventListener("justdy:artifact-created", refresh);
    };
  }, [load]);

  useEffect(() => {
    if (!previewId) return;

    let cancelled = false;

    void fetch(`/api/resources/${encodeURIComponent(previewId)}/preview`, {
      cache: "no-store",
      credentials: "include",
    })
      .then(async (r) => {
        const d = (await r.json()) as PreviewResponse;

        if (!r.ok || !d.resource) {
          throw new Error(d.error || "Unable to load this preview.");
        }

        if (!cancelled) setPreview(d.resource);
      })
      .catch((e) => {
        if (!cancelled) {
          setPreviewError(
            e instanceof Error ? e.message : "Unable to load this preview.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [previewId]);

  useEffect(() => {
    if (!previewId) return;

    const f = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePreview();
    };

    window.addEventListener("keydown", f);

    return () => window.removeEventListener("keydown", f);
  }, [previewId, closePreview]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();

    return items.filter(
      (r) =>
        (!filter || typeOf(r.type) === typeOf(filter)) &&
        (!q ||
          [r.title, r.description, r.subject, r.topic, r.grade, r.type]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(q)),
    );
  }, [filter, items, query]);

  return (
    <div className="space-y-7 bg-white">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            My Library
          </h1>

          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
            Manage all your files in one place
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setRefreshing(true);
              void load();
            }}
            disabled={refreshing}
            className="inline-flex h-10 items-center gap-2 rounded-lg border bg-card px-3.5 text-sm font-medium hover:bg-muted disabled:opacity-60"
          >
            <RefreshCw
              className={`size-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>

          <Link
            href="/dashboard/create"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#181818] px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Sparkles className="size-4" />
            Create
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your library..."
              className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>

          <div className="flex gap-1 overflow-x-auto">
            {FILTERS.map(([v, l]) => (
              <button
                key={v}
                type="button"
                onClick={() => setFilter(v)}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
                  filter === v
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex min-h-80 items-center justify-center rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            Loading your library…
          </div>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-7">
          <p className="font-medium text-destructive">
            We couldn&apos;t load your library.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          <button
            type="button"
            onClick={() => {
              setRefreshing(true);
              void load();
            }}
            className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium"
          >
            <RefreshCw className="size-4" />
            Try again
          </button>
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
          <LibraryBig className="mx-auto size-8 text-muted-foreground" />
          <h2 className="mt-4 font-semibold">
            {query || filter ? "No matching creations" : "Your library is empty"}
          </h2>
          <p className="mx-auto mt-1.5 max-w-md text-sm leading-6 text-muted-foreground">
            {query || filter
              ? "Try a different search or filter."
              : "Create an assessment, image, video, or coloring page and save it. It will appear here automatically."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((r) => {
            const I = icon(r.type);
            const c = record(r.content);
            const image = r.thumbnailUrl || str(c?.imageUrl);

            return (
              <article
                key={r.id}
                className="group relative overflow-visible rounded-xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
              >
                <button
                  type="button"
                  onClick={() => openPreview(r.id)}
                  className="block w-full overflow-hidden rounded-xl text-left focus:outline-none focus:ring-2 focus:ring-ring/40"
                  aria-label={`Open ${r.title}`}
                >
                  <div className="relative aspect-4/3 overflow-hidden bg-slate-50">
                    {image ? (
                      <img
                        src={image}
                        alt={r.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-white">
                        <I className="size-10 text-slate-400" />
                      </div>
                    )}

                    <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm">
                      {typeOf(r.type) === "VIDEO" ? (
                        <Play className="size-3" />
                      ) : null}
                      {label(r.type)}
                    </span>
                  </div>

                  <div className="p-4 pr-12">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {r.title}
                    </p>
                    <p className="mt-1.5 text-xs text-slate-500">
                      <CalendarDays className="mr-1 inline size-3" />
                      {date(r.updatedAt)}
                    </p>

                    {r.subject || r.grade ? (
                      <p className="mt-2 truncate text-[11px] text-slate-500">
                        {[r.subject, r.grade].filter(Boolean).join(" · ")}
                      </p>
                    ) : null}
                  </div>
                </button>

                <div className="absolute right-3 top-3 z-20">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuId((current) => (current === r.id ? null : r.id));
                    }}
                    disabled={deletingId === r.id}
                    className="flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white/95 text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label={`More options for ${r.title}`}
                    aria-haspopup="menu"
                    aria-expanded={menuId === r.id}
                  >
                    <MoreVertical className="size-4" />
                  </button>

                  {menuId === r.id ? (
                    <div
                      role="menu"
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 top-11 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMenuId(null);
                          openPreview(r.id);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <ExternalLink className="size-4" />
                        Open
                      </button>

                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMenuId(null);
                          downloadResource(r);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <Download className="size-4" />
                        Download
                      </button>

                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMenuId(null);
                          setDeleteTarget(r);
                        }}
                        disabled={deletingId === r.id}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </button>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {deleteTarget ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-resource-title"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !deletingId) {
              setDeleteTarget(null);
            }
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                <Trash2 className="size-5" />
              </div>

              <div className="min-w-0 flex-1">
                <h2
                  id="delete-resource-title"
                  className="text-lg font-semibold text-slate-900"
                >
                  Delete this resource?
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  You are about to permanently delete{" "}
                  <span className="font-semibold text-slate-900">
                    “{deleteTarget.title}”
                  </span>
                  . The resource and its associated uploaded files will be
                  removed. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={Boolean(deletingId)}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void deleteResource(deleteTarget)}
                disabled={Boolean(deletingId)}
                className="inline-flex h-10 min-w-24 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingId ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {previewId ? (
        previewLoading ? (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
            <div className="rounded-lg border bg-background px-5 py-4 text-sm shadow-xl">
              <Loader2 className="mr-2 inline size-5 animate-spin" />
              Loading preview…
            </div>
          </div>
        ) : previewError ? (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-xl">
              <div className="flex justify-between gap-4">
                <div>
                  <h2 className="font-semibold">Preview unavailable</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {previewError}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closePreview}
                  className="size-9 rounded-xl border"
                >
                  <X className="mx-auto size-4" />
                </button>
              </div>
            </div>
          </div>
        ) : preview ? (
          <PreviewModal
            resource={preview}
            onClose={closePreview}
          />
        ) : null
      ) : null}
    </div>
  );
}
