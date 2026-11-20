"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Link2, X } from "lucide-react";
import { getSocialMediaProvider } from "@/lib/social/media-providers";
import SocialMediaEmbed from "./SocialMediaEmbed";

type LinkPreviewMetadata = {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  domain: string;
};

type CachedPreview = {
  metadata: LinkPreviewMetadata;
  expiresAt: number;
};

// Shared browser cache: reused by the feed, create modal and edit modal.
const previewCache = new Map<string, CachedPreview>();
const pendingRequests = new Map<string, Promise<LinkPreviewMetadata>>();

const CACHE_DURATION = 5 * 60 * 1000;

async function fetchPreview(url: string): Promise<LinkPreviewMetadata> {
  const cached = previewCache.get(url);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.metadata;
  }

  const existingRequest = pendingRequests.get(url);

  if (existingRequest) {
    return existingRequest;
  }

  const request = (async () => {
    const response = await fetch(
      `/api/social/link-preview?url=${encodeURIComponent(url)}`,
    );

    if (!response.ok) {
      throw new Error("Preview unavailable");
    }

    const metadata = (await response.json()) as LinkPreviewMetadata;

    if (!metadata || !metadata.domain) {
      throw new Error("Invalid preview metadata");
    }

    previewCache.set(url, {
      metadata,
      expiresAt: Date.now() + CACHE_DURATION,
    });

    return metadata;
  })();

  pendingRequests.set(url, request);

  try {
    return await request;
  } finally {
    pendingRequests.delete(url);
  }
}

type PreviewCardProps = {
  url: string;
  onRemove?: (url: string) => void;
};

function PreviewCard({ url, onRemove }: PreviewCardProps) {
  const socialVideo = getSocialMediaProvider(url);
  const isSocialVideo = Boolean(socialVideo);

  const [metadata, setMetadata] = useState<LinkPreviewMetadata | null>(() => {
    if (isSocialVideo) return null;

    const cached = previewCache.get(url);

    return cached && cached.expiresAt > Date.now() ? cached.metadata : null;
  });

  const [loading, setLoading] = useState(!isSocialVideo && !metadata);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    if (isSocialVideo) return;

    let cancelled = false;

    async function loadPreview() {
      try {
        setLoading(true);
        setUnavailable(false);

        const data = await fetchPreview(url);

        if (!cancelled) {
          setMetadata(data);
        }
      } catch {
        if (!cancelled) {
          setUnavailable(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPreview();

    return () => {
      cancelled = true;
    };
  }, [url, isSocialVideo]);

  return (
    <div className="relative">
      {socialVideo ? (
        <SocialMediaEmbed url={url} />
      ) : loading ? (
        <div className="overflow-hidden rounded-xl border border-[#E5EAE3] bg-white">
          <div className="h-36 animate-pulse bg-[#EEF2ED] sm:h-48" />
          <div className="space-y-2 p-3.5">
            <div className="h-3 w-2/5 animate-pulse rounded bg-[#E9EEE8]" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-[#E9EEE8]" />
            <div className="h-3 w-full animate-pulse rounded bg-[#E9EEE8]" />
          </div>
        </div>
      ) : unavailable || !metadata ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="flex items-center gap-2 rounded-xl border border-[#E5EAE3] bg-white p-3 text-sm text-[#52745D] transition hover:bg-[#F4F7F3]"
        >
          <Link2 className="h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate">{url}</span>
          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
        </a>
      ) : (
        <a
          href={metadata.url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="group block overflow-hidden rounded-xl border border-[#E3E9E1] bg-white transition duration-200 hover:border-[#C9D8C9] hover:shadow-sm"
          aria-label={`Open ${metadata.title ?? metadata.domain}`}
        >
          {metadata.image && (
            <div className="relative flex h-40 items-center justify-center overflow-hidden bg-[#F0F3EF] sm:h-52">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={metadata.image}
                alt=""
                loading="lazy"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            </div>
          )}

          <div className="p-3.5 sm:p-4">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#89968A]">
              <Link2 className="h-3.5 w-3.5" />
              <span className="truncate">{metadata.domain}</span>
              <ExternalLink className="ml-auto h-3.5 w-3.5 shrink-0 opacity-0 transition group-hover:opacity-100" />
            </div>

            {metadata.title && (
              <h3 className="mt-2 line-clamp-2 text-sm font-bold leading-5 text-[#173B2F] transition group-hover:text-[#52745D]">
                {metadata.title}
              </h3>
            )}

            {metadata.description && (
              <p className="mt-1.5 line-clamp-3 text-xs leading-5 text-[#788579]">
                {metadata.description}
              </p>
            )}
          </div>
        </a>
      )}

      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(url)}
          aria-label={isSocialVideo ? "Remove video" : "Remove link preview"}
          title="Remove preview"
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#87938A] transition hover:bg-[#F3F6F2] hover:text-[#315C43]"
        >
          <X className="h-3.5 w-3.5" />
          {isSocialVideo ? "Remove video" : "Remove preview"}
        </button>
      )}
    </div>
  );
}

export default function SocialLinkPreview({
  urls,
  onRemove,
}: {
  urls: string[];
  onRemove?: (url: string) => void;
}) {
  const uniqueUrls = Array.from(new Set(urls)).slice(0, 3);

  if (uniqueUrls.length === 0) return null;

  return (
    <div className="space-y-3">
      {uniqueUrls.map((url) => (
        <PreviewCard key={url} url={url} onRemove={onRemove} />
      ))}
    </div>
  );
}
