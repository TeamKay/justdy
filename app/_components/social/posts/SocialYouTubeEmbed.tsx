
type SocialYouTubeEmbedProps = {
  videoId: string;
  isShort?: boolean;
};

export default function SocialYouTubeEmbed({
  videoId,
  isShort = false,
}: SocialYouTubeEmbedProps) {
  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return null;
  }

  return (
    <div
      className={`mt-4 w-full overflow-hidden rounded-2xl bg-black ${
        isShort
          ? "mx-auto max-w-[400px] aspect-[9/16]"
          : "aspect-video"
      }`}
    >
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0`}
        title="YouTube video"
        className="h-full w-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}
