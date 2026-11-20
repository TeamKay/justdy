"use client";

import { useEffect, useId, useRef, useState } from "react";
type VideoCandidate = {
  ratio: number;
  setActive: (active: boolean) => void;
};

const candidates = new Map<string, VideoCandidate>();

let activeVideoId: string | null = null;

function updateActiveVideo() {
  const visible = [...candidates.entries()]
    .filter(([, candidate]) => candidate.ratio >= 0.55)
    .sort((a, b) => b[1].ratio - a[1].ratio);

  const current = activeVideoId ? candidates.get(activeVideoId) : undefined;

  // Avoid unnecessary switching when two videos have
  // almost identical visibility.
  const next =
    current &&
    current.ratio >= 0.55 &&
    visible.length > 0 &&
    current.ratio >= visible[0][1].ratio - 0.05
      ? activeVideoId
      : (visible[0]?.[0] ?? null);

  activeVideoId = next;

  candidates.forEach((candidate, id) => {
    candidate.setActive(id === activeVideoId);
  });
}

function registerVideo(id: string, setActive: (active: boolean) => void) {
  candidates.set(id, {
    ratio: 0,
    setActive,
  });

  return {
    updateRatio(ratio: number) {
      const candidate = candidates.get(id);
      if (!candidate) return;

      candidate.ratio = ratio;
      updateActiveVideo();
    },

    unregister() {
      candidates.delete(id);

      if (activeVideoId === id) {
        activeVideoId = null;
      }

      updateActiveVideo();
    },
  };
}

export function useFeedVideoFocus() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);

  const id = useId();

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const registration = registerVideo(id, setIsActive);

    if (!("IntersectionObserver" in window)) {
      registration.updateRatio(1);

      return () => registration.unregister();
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        registration.updateRatio(
          entry.isIntersecting ? entry.intersectionRatio : 0,
        );
      },
      {
        root: null,
        threshold: [0, 0.25, 0.4, 0.55, 0.7, 0.85, 1],
      },
    );

    observer.observe(element);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        registration.updateRatio(0);
      } else {
        observer.observe(element);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      observer.disconnect();

      document.removeEventListener("visibilitychange", handleVisibilityChange);

      registration.unregister();
    };
  }, [id]);

  return {
    containerRef,
    isActive,
  };
}
