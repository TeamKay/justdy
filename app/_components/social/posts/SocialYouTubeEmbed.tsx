"use client";

import { useEffect, useRef } from "react";

type SocialYouTubeEmbedProps = {
  videoId: string;
  isShort?: boolean;
  isActive?: boolean;
};

type YouTubePlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  mute: () => void;
  destroy: () => void;
};

type YouTubeEvent = {
  target: YouTubePlayer;
  data: number;
};

type YouTubePlayerOptions = {
  videoId: string;
  playerVars?: Record<string, string | number>;
  events?: {
    onReady?: (event: YouTubeEvent) => void;
    onStateChange?: (event: YouTubeEvent) => void;
  };
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement,
        options: YouTubePlayerOptions,
      ) => YouTubePlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Browser unavailable"));
  }

  if (window.YT?.Player) {
    return Promise.resolve();
  }

  if (!youtubeApiPromise) {
    youtubeApiPromise = new Promise((resolve) => {
      const previousCallback = window.onYouTubeIframeAPIReady;

      window.onYouTubeIframeAPIReady = () => {
        previousCallback?.();
        resolve();
      };

      const existingScript = document.querySelector(
        'script[src="https://www.youtube.com/iframe_api"]',
      );

      if (!existingScript) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        script.async = true;
        document.head.appendChild(script);
      }
    });
  }

  return youtubeApiPromise;
}

export default function SocialYouTubeEmbed({
  videoId,
  isShort = false,
  isActive = false,
}: SocialYouTubeEmbedProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);

  const isActiveRef = useRef(isActive);
  const manuallyPausedRef = useRef(false);
  const programmaticPauseRef = useRef(false);

  useEffect(() => {
    isActiveRef.current = isActive;

    if (!playerRef.current) return;

    if (isActive) {
      if (!manuallyPausedRef.current) {
        playerRef.current.mute();
        playerRef.current.playVideo();
      }
    } else {
      programmaticPauseRef.current = true;
      playerRef.current.pauseVideo();

      window.setTimeout(() => {
        programmaticPauseRef.current = false;
      }, 500);
    }
  }, [isActive]);

  useEffect(() => {
    let cancelled = false;

    async function initializePlayer() {
      try {
        await loadYouTubeApi();

        if (cancelled || !mountRef.current || !window.YT) {
          return;
        }

        const player = new window.YT.Player(mountRef.current, {
          videoId,
          playerVars: {
            autoplay: 0,
            controls: 1,
            enablejsapi: 1,
            playsinline: 1,
            rel: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: (event) => {
              playerRef.current = event.target;

              if (isActiveRef.current) {
                event.target.mute();

                if (!manuallyPausedRef.current) {
                  event.target.playVideo();
                }
              }
            },

            onStateChange: (event) => {
              // YouTube state 2 means paused.
              if (event.data === 2) {
                if (programmaticPauseRef.current) {
                  programmaticPauseRef.current = false;
                } else {
                  manuallyPausedRef.current = true;
                }
              }

              // YouTube state 1 means playing.
              // If playback was manually paused, don't
              // automatically restart it while focused.
              if (event.data === 1) {
                manuallyPausedRef.current = false;
              }
            },
          },
        });

        if (cancelled) {
          player.destroy();
          return;
        }

        playerRef.current = player;
      } catch (error) {
        console.error("YouTube player initialization failed:", error);
      }
    }

    void initializePlayer();

    return () => {
      cancelled = true;

      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [videoId]);

  return (
    <div
      className={`mt-4 w-full overflow-hidden rounded-2xl bg-black ${
        isShort ? "mx-auto aspect-[9/16] max-w-[400px]" : "aspect-video"
      }`}
    >
      <div ref={mountRef} className="h-full w-full" />
    </div>
  );
}
