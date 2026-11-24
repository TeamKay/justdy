
import Link from "next/link";

export type HomepageAnnouncement = {
  id: string;
  message: string;
  linkLabel: string | null;
  linkUrl: string | null;
};

interface AnnouncementsProps {
  announcement: HomepageAnnouncement | null;
}

export default function Announcements({
  announcement,
}: AnnouncementsProps) {
  if (!announcement) return null;

  const linkUrl = announcement.linkUrl;
  const isExternal = linkUrl?.startsWith("https://") ?? false;

  return (
    <div className="relative z-20 flex justify-center px-4 pt-5 sm:pt-7">
      <div
        role="status"
        className="inline-flex max-w-full flex-wrap items-center justify-center gap-3 rounded-lg border border-amber-200 bg-[#151a21]/75 px-5 py-2.5 text-white shadow-lg shadow-black/10 backdrop-blur-md"
      >
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#9EE66B] opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#9EE66B] shadow-[0_0_10px_3px_rgba(158,230,107,0.55)]" />
        </span>

        <span className="text-center text-xs font-semibold leading-relaxed tracking-wide sm:text-sm">
          {announcement.message}
        </span>

        {linkUrl && announcement.linkLabel && (
          isExternal ? (
            <a
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center justify-center rounded-md px-2 py-1 text-xs font-bold text-[#d7f60b] transition hover:text-white"
            >
              {announcement.linkLabel}
            </a>
          ) : (
            <Link
              href={linkUrl}
              className="inline-flex shrink-0 items-center justify-center rounded-md px-2 py-1 text-xs font-bold text-[#d7f60b] transition hover:text-white"
            >
              {announcement.linkLabel}
            </Link>
          )
        )}
      </div>
    </div>
  );
}
