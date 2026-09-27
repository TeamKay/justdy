"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Download, Maximize2 } from "lucide-react";

interface ImageLearnerProps {
  resourceId: string;
  slug: string;
  title: string;
  description?: string | null;
  imageUrl: string;
  mimeType?: string | null;
}

export default function ImageLearner({
  resourceId,
  slug,
  title,
  description,
  imageUrl,
  mimeType,
}: ImageLearnerProps) {
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `${slug || "image"}.png`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFullscreen = () => {
    const image = document.getElementById(
      `resource-image-${resourceId}`,
    ) as HTMLImageElement | null;

    if (!image) return;

    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }

    void image.requestFullscreen?.();
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link
            href={`/resources/${encodeURIComponent(slug)}`}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to resource
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleFullscreen}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
              title="View fullscreen"
            >
              <Maximize2 className="h-4 w-4" />
              <span className="hidden sm:inline">Fullscreen</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Resource heading */}
        <section className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {title}
          </h1>

          {description ? (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
              {description}
            </p>
          ) : null}
        </section>

        {/* Image */}
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex min-h-[420px] items-center justify-center bg-muted/30 p-4 sm:p-8">
            <div className="relative flex w-full items-center justify-center">
              <img
                id={`resource-image-${resourceId}`}
                src={imageUrl}
                alt={title}
                className="max-h-[75vh] w-auto max-w-full rounded-lg object-contain shadow-sm"
                loading="eager"
                decoding="async"
              />
            </div>
          </div>

          {/* Image information */}
          <div className="border-t border-border px-4 py-4 sm:px-6">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span>
                <span className="font-medium text-foreground">Type:</span>{" "}
                {mimeType || "Image"}
              </span>

              <span>
                <span className="font-medium text-foreground">Resource:</span>{" "}
                {resourceId}
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}