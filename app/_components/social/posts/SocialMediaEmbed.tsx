"use client";

import { getSocialMediaProvider } from "@/lib/social/media-providers";
import SocialYouTubeEmbed from "./SocialYouTubeEmbed";

type Props = {
  url: string;
};

export default function SocialMediaEmbed({ url }: Props) {
  const media = getSocialMediaProvider(url);

  if (!media) return null;

  return (
    <div className="w-full">
      {media.provider === "youtube" && (
        <SocialYouTubeEmbed videoId={media.videoId} isShort={media.isShort} />
      )}

      {media.provider === "tiktok" && (
        <div className="mx-auto mt-4 aspect-[9/16] w-full max-w-[400px] overflow-hidden rounded-2xl bg-black">
          <iframe
            src={`https://www.tiktok.com/player/v1/${media.videoId}?music_info=1&description=1`}
            title="TikTok video"
            className="h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      )}

      {media.provider === "facebook" && (
        <div className="mt-4 aspect-video w-full overflow-hidden rounded-2xl bg-black">
          <iframe
            src={(() => {
              const embedUrl = new URL(
                "https://www.facebook.com/plugins/video.php",
              );

              embedUrl.searchParams.set("href", media.url);
              embedUrl.searchParams.set("show_text", "false");
              embedUrl.searchParams.set("width", "560");

              return embedUrl.toString();
            })()}
            title="Facebook video"
            className="h-full w-full border-0"
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      )}
    </div>
  );
}
