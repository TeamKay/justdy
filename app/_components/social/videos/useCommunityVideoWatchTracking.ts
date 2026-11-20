import { useCallback, useEffect, useRef } from "react";
import { recordVideoWatchEvent } from "@/app/actions/video-watch";

type Provider = "YOUTUBE" | "TIKTOK" | "FACEBOOK" | "DIRECT";

type WatchTarget = {
  postId: string;
  provider: Provider;
} | null;

type WatchEvent =
  | "IMPRESSION"
  | "PLAY"
  | "PROGRESS"
  | "COMPLETE"
  | "SKIP";

type WatchSession = {
  postId: string;
  provider: Provider;
  sessionKey: string;
  playSent: boolean;
  completed: boolean;
  lastCurrentTime: number | null;
  unsentWatchedMs: number;
  totalWatchedMs: number;
  lastSentAt: number;
  lastProgressPercent: number;
};

function createSessionKey() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}_${Math.random().toString(36).slice(2, 14)}`;
}

export function useCommunityVideoWatchTracking(target: WatchTarget) {
  const sessionRef = useRef<WatchSession | null>(null);
  const impressionSentSessionKeyRef = useRef<string | null>(null);
  const targetPostId = target?.postId;
  const targetProvider = target?.provider;

  const getSession = useCallback(() => {
    if (!targetPostId || !targetProvider) return null;

    if (
      !sessionRef.current ||
      sessionRef.current.postId !== targetPostId ||
      sessionRef.current.provider !== targetProvider
    ) {
      sessionRef.current = {
        postId: targetPostId,
        provider: targetProvider,
        sessionKey: createSessionKey(),
        playSent: false,
        completed: false,
        lastCurrentTime: null,
        unsentWatchedMs: 0,
        totalWatchedMs: 0,
        lastSentAt: 0,
        lastProgressPercent: 0,
      };
    }

    return sessionRef.current;
  }, [targetPostId, targetProvider]);

  const sendEvent = useCallback(
    (event: WatchEvent, watchedMs = 0, progressPercent = 0) => {
      const session = getSession();
      if (!session) return;

      void recordVideoWatchEvent({
        postId: session.postId,
        sessionKey: session.sessionKey,
        event,
        provider: session.provider,
        watchedMs: Math.min(15_000, Math.max(0, Math.floor(watchedMs))),
        progressPercent: Math.min(
          100,
          Math.max(0, Math.floor(progressPercent)),
        ),
      })
        .then((result) => {
          if (!result.success) {
            console.error(
              `[Justdy video tracking] ${event} was rejected:`,
              result.error,
              {
                postId: session.postId,
                provider: session.provider,
                sessionKey: session.sessionKey,
              },
            );
            return;
          }

          if (event === "IMPRESSION" || event === "PLAY" || event === "COMPLETE") {
            console.info(`[Justdy video tracking] ${event} saved.`, {
              postId: session.postId,
              provider: session.provider,
            });
          }
        })
        .catch((error: unknown) => {
          console.error(
            `[Justdy video tracking] ${event} request failed:`,
            error,
          );
        });
    },
    [getSession],
  );

  useEffect(() => {
    if (!targetPostId || !targetProvider) return;

    const session = getSession();
    if (!session) return;

    // React Strict Mode may replay effects in development. Keep one
    // impression request for this in-memory viewing session.
    if (impressionSentSessionKeyRef.current !== session.sessionKey) {
      impressionSentSessionKeyRef.current = session.sessionKey;
      sendEvent("IMPRESSION");
    }

    // Flush any measured time that has not reached the normal batch threshold
    // when the viewer changes reels or unmounts.
    return () => {
      if (session.completed || session.unsentWatchedMs <= 0) return;

      const pendingWatchedMs = session.unsentWatchedMs;
      session.unsentWatchedMs = 0;

      sendEvent(
        "PROGRESS",
        pendingWatchedMs,
        session.lastProgressPercent,
      );
    };
  }, [targetPostId, targetProvider, getSession, sendEvent]);

  const onPlay = useCallback(
    (event: React.SyntheticEvent<HTMLVideoElement>) => {
      const session = getSession();
      if (!session || session.completed) return;

      session.lastCurrentTime = event.currentTarget.currentTime;

      if (!session.playSent) {
        session.playSent = true;
        sendEvent("PLAY");
      }
    },
    [getSession, sendEvent],
  );

  const onTimeUpdate = useCallback(
    (event: React.SyntheticEvent<HTMLVideoElement>) => {
      const session = getSession();
      if (!session || !session.playSent || session.completed) return;

      const video = event.currentTarget;
      const currentTime = video.currentTime;
      const hasDuration = Number.isFinite(video.duration) && video.duration > 0;
      const progressPercent = hasDuration
        ? (currentTime / video.duration) * 100
        : 0;

      session.lastProgressPercent = progressPercent;

      if (
        session.lastCurrentTime !== null &&
        currentTime >= session.lastCurrentTime
      ) {
        const elapsedMs = (currentTime - session.lastCurrentTime) * 1000;

        // Ignore large jumps caused by seeking. Cap each accepted interval
        // so delayed browser events cannot claim an implausible watch period.
        if (elapsedMs <= 2_500) {
          const creditedDelta = Math.min(elapsedMs, 1_500);
          session.unsentWatchedMs += creditedDelta;
          session.totalWatchedMs += creditedDelta;
        }
      }

      session.lastCurrentTime = currentTime;

      // A looping HTML video normally does not fire `ended`. Determine
      // completion from actively accumulated watch time instead. This means
      // seeking to the end alone cannot complete the viewing session.
      const completionThresholdMs = hasDuration
        ? video.duration * 1_000 * 0.8
        : Number.POSITIVE_INFINITY;

      if (session.totalWatchedMs >= completionThresholdMs) {
        session.completed = true;
        const pendingWatchedMs = session.unsentWatchedMs;
        session.unsentWatchedMs = 0;
        sendEvent("COMPLETE", pendingWatchedMs, 100);
        return;
      }

      const now = Date.now();
      if (
        session.unsentWatchedMs < 5_000 ||
        now - session.lastSentAt < 4_000
      ) {
        return;
      }

      const watchedMs = Math.min(15_000, session.unsentWatchedMs);
      session.unsentWatchedMs -= watchedMs;
      session.lastSentAt = now;

      sendEvent("PROGRESS", watchedMs, progressPercent);
    },
    [getSession, sendEvent],
  );

  const onPause = useCallback(
    (event: React.SyntheticEvent<HTMLVideoElement>) => {
      const session = getSession();
      if (!session || !session.playSent || session.completed) return;

      const video = event.currentTarget;
      const watchedMs = session.unsentWatchedMs;
      session.unsentWatchedMs = 0;
      session.lastCurrentTime = video.currentTime;

      const progressPercent =
        Number.isFinite(video.duration) && video.duration > 0
          ? (video.currentTime / video.duration) * 100
          : session.lastProgressPercent;

      session.lastProgressPercent = progressPercent;

      if (watchedMs > 0) {
        session.lastSentAt = Date.now();
        sendEvent("PROGRESS", watchedMs, progressPercent);
      }
    },
    [getSession, sendEvent],
  );

  const onEnded = useCallback(
    (event: React.SyntheticEvent<HTMLVideoElement>) => {
      const session = getSession();
      if (!session || session.completed) return;

      const video = event.currentTarget;
      const watchedMs = session.unsentWatchedMs;
      session.unsentWatchedMs = 0;

      const progressPercent =
        Number.isFinite(video.duration) && video.duration > 0
          ? (video.currentTime / video.duration) * 100
          : session.lastProgressPercent;

      session.lastProgressPercent = progressPercent;

      // Keep the same active-watch threshold for non-looping videos.
      const completionThresholdMs =
        Number.isFinite(video.duration) && video.duration > 0
          ? video.duration * 1_000 * 0.8
          : Number.POSITIVE_INFINITY;

      if (session.totalWatchedMs >= completionThresholdMs) {
        session.completed = true;
        sendEvent("COMPLETE", watchedMs, 100);
      } else if (watchedMs > 0) {
        sendEvent("PROGRESS", watchedMs, progressPercent);
      }
    },
    [getSession, sendEvent],
  );

  return { onPlay, onTimeUpdate, onPause, onEnded };
}
