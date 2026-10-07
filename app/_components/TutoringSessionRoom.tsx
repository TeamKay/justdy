"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  LockKeyhole,
  Pencil,
  Video,
  XCircle,
  Star,
} from "lucide-react";

import dynamic from "next/dynamic";
import type { WhiteboardRealtimeData } from "@/app/_components/Whiteboard";

const VideoCall = dynamic(() => import("@/app/_components/VideoCall"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[420px] items-center justify-center bg-background text-foreground">
      <Loader2 className="h-7 w-7 animate-spin text-violet-400" />
    </div>
  ),
});

const Whiteboard = dynamic(() => import("@/app/_components/Whiteboard"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[520px] items-center justify-center rounded-2xl bg-card text-sm text-muted-foreground">
      Loading whiteboard…
    </div>
  ),
});

type SessionData = {
  id: string;
  bookingId: string;
  role: "customer" | "tutor";

  subject: string;
  gradeLevel: string;
  topic: string | null;
  description: string | null;

  amount: number;
  currency: string;
  status: string;
  tutoringSessionStatus: string | null;
  review: {
    id: string;
    rating: number;
    comment: string | null;
  } | null;

  startTime: string;
  endTime: string;

  videoSessionAvailable: boolean;

  canJoin: boolean;
  beforeJoinWindow: boolean;
  afterSession: boolean;
  joinWindowStart: string;

  tutor: {
    id: string;
    name: string;
    imageUrl: string | null;
  };

  customer: {
    id: string;
    name: string;
    imageUrl: string | null;
  };
};

type VideoCredentials = {
  videoSessionId: string;
  token: string;
  role: "customer" | "tutor";
};


const WHITEBOARD_MESSAGE_CHUNK_SIZE = 2800;
const VIDEO_FILMSTRIP_HEIGHT = 116;
const WHITEBOARD_MESSAGE_MAX_CHUNKS = 512;
const WHITEBOARD_MESSAGE_TTL_MS = 15_000;

type WhiteboardChunkPayload = {
  id: string;
  index: number;
  total: number;
  chunk: string;
};

type WhiteboardChunkBuffer = {
  total: number;
  chunks: Map<number, string>;
  expiresAt: number;
};

function createWhiteboardMessageId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function encodeWhiteboardPayload(value: unknown) {
  const json = JSON.stringify(value);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary);
}

function decodeWhiteboardPayload(value: string): unknown {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatCountdown(value: string) {
  const target = new Date(value).getTime();
  const difference = target - Date.now();

  if (difference <= 0) {
    return "Available now";
  }

  const totalMinutes = Math.ceil(difference / 60000);

  if (totalMinutes < 60) {
    return `Available in ${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / 60);

  const minutes = totalMinutes % 60;

  return minutes > 0
    ? `Available in ${hours}h ${minutes}m`
    : `Available in ${hours}h`;
}

export default function TutoringSessionRoom({
  bookingId,
}: {
  bookingId: string;
}) {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);

  const [videoCredentials, setVideoCredentials] =
    useState<VideoCredentials | null>(null);

  const [loading, setLoading] = useState(true);

  const [joining, setJoining] = useState(false);

  const [error, setError] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [remoteWhiteboardData, setRemoteWhiteboardData] =
    useState<WhiteboardRealtimeData | null>(null);
  const [participantRailWidth, setParticipantRailWidth] = useState(350);
  const whiteboardSendRef = useRef<((type: string, data?: unknown) => void) | null>(null);
  const whiteboardSignalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const whiteboardChunkBuffersRef = useRef<Map<string, WhiteboardChunkBuffer>>(
    new Map(),
  );

  const loadSession = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/tutoring/sessions/${encodeURIComponent(bookingId)}`,
        {
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to load tutoring session.");
      }

      setSession(data.session);
      setError("");
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load tutoring session.",
      );
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSession();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadSession]);


  useEffect(() => {
    return () => {
      if (whiteboardSignalTimerRef.current) {
        clearTimeout(whiteboardSignalTimerRef.current);
      }
      whiteboardChunkBuffersRef.current.clear();
    };
  }, []);

  const sendWhiteboardSnapshot = useCallback((data: WhiteboardRealtimeData) => {
    const sendSignal = whiteboardSendRef.current;
    if (!sendSignal) return;

    try {
      const encoded = encodeWhiteboardPayload(data);
      const total = Math.ceil(encoded.length / WHITEBOARD_MESSAGE_CHUNK_SIZE);

      if (total < 1 || total > WHITEBOARD_MESSAGE_MAX_CHUNKS) {
        console.warn(
          "Whiteboard realtime snapshot is too large for Daily app-message transport.",
        );
        return;
      }

      const id = createWhiteboardMessageId();

      for (let index = 0; index < total; index += 1) {
        const payload: WhiteboardChunkPayload = {
          id,
          index,
          total,
          chunk: encoded.slice(
            index * WHITEBOARD_MESSAGE_CHUNK_SIZE,
            (index + 1) * WHITEBOARD_MESSAGE_CHUNK_SIZE,
          ),
        };

        sendSignal("whiteboard:update:chunk", payload);
      }
    } catch (error) {
      console.error("Failed to send whiteboard realtime snapshot:", error);
    }
  }, []);

  const handleWhiteboardChange = useCallback(
    (data: WhiteboardRealtimeData) => {
      if (whiteboardSignalTimerRef.current) {
        clearTimeout(whiteboardSignalTimerRef.current);
      }

      whiteboardSignalTimerRef.current = setTimeout(() => {
        sendWhiteboardSnapshot(data);
      }, 200);
    },
    [sendWhiteboardSnapshot],
  );

  const handleWhiteboardSignal = useCallback(
    (signal: { type: string; data?: unknown }) => {
      if (signal.type === "whiteboard:update") {
        if (!signal.data || typeof signal.data !== "object") return;
        setRemoteWhiteboardData(signal.data as WhiteboardRealtimeData);
        return;
      }

      if (signal.type !== "whiteboard:update:chunk") return;
      if (!signal.data || typeof signal.data !== "object") return;

      const chunk = signal.data as Partial<WhiteboardChunkPayload>;
      if (
        typeof chunk.id !== "string" ||
        typeof chunk.index !== "number" ||
        typeof chunk.total !== "number" ||
        typeof chunk.chunk !== "string"
      ) {
        return;
      }

      if (
        chunk.total < 1 ||
        chunk.total > WHITEBOARD_MESSAGE_MAX_CHUNKS ||
        chunk.index < 0 ||
        chunk.index >= chunk.total
      ) {
        return;
      }

      const now = Date.now();
      const buffers = whiteboardChunkBuffersRef.current;

      for (const [id, buffer] of buffers) {
        if (buffer.expiresAt <= now) {
          buffers.delete(id);
        }
      }

      let buffer = buffers.get(chunk.id);
      if (!buffer || buffer.total !== chunk.total) {
        buffer = {
          total: chunk.total,
          chunks: new Map(),
          expiresAt: now + WHITEBOARD_MESSAGE_TTL_MS,
        };
        buffers.set(chunk.id, buffer);
      }

      buffer.chunks.set(chunk.index, chunk.chunk);
      buffer.expiresAt = now + WHITEBOARD_MESSAGE_TTL_MS;

      if (buffer.chunks.size !== buffer.total) return;

      try {
        const encoded = Array.from({ length: buffer.total }, (_, index) =>
          buffer?.chunks.get(index) ?? "",
        ).join("");
        const decoded = decodeWhiteboardPayload(encoded);

        if (decoded && typeof decoded === "object") {
          setRemoteWhiteboardData(decoded as WhiteboardRealtimeData);
        }
      } catch (error) {
        console.error("Failed to decode whiteboard realtime snapshot:", error);
      } finally {
        buffers.delete(chunk.id);
      }
    },
    [],
  );

  const otherParticipant = useMemo(() => {
    if (!session) {
      return null;
    }

    return session.role === "tutor" ? session.customer : session.tutor;
  }, [session]);

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session || session.role !== "customer" || reviewRating < 1 || reviewRating > 5) {
      return;
    }

    setReviewSubmitting(true);
    setReviewError("");

    try {
      const response = await fetch("/api/tutoring/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: session.bookingId,
          rating: reviewRating,
          comment: reviewComment.trim(),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Unable to submit your review.");
      }

      setReviewSubmitted(true);
      setReviewComment("");
      setReviewRating(0);
      void loadSession();
    } catch (submitError) {
      setReviewError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to submit your review.",
      );
    } finally {
      setReviewSubmitting(false);
    }
  }

  async function joinSession() {
    if (joining || !session || !session.canJoin) {
      return;
    }

    setJoining(true);
    setError("");

    try {
      const response = await fetch(
        `/api/tutoring/sessions/${encodeURIComponent(bookingId)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to join the tutoring session.");
      }

      setVideoCredentials({
        videoSessionId: data.videoSessionId,
        token: data.token,
        role: data.role,
      });
    } catch (joinError) {
      setError(
        joinError instanceof Error
          ? joinError.message
          : "Unable to join the tutoring session.",
      );
    } finally {
      setJoining(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
          Loading tutoring session…
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-background px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/dashboard/sessions"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sessions
          </Link>

          <div className="mt-8 rounded-3xl border border-destructive/30 bg-destructive/10 p-8">
            <XCircle className="h-7 w-7 text-destructive" />

            <h1 className="mt-4 text-xl font-semibold text-destructive">
              Unable to load session
            </h1>

            <p className="mt-2 text-sm text-destructive">
              {error || "This tutoring session could not be found."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (videoCredentials) {
    return (
      <main className="fixed inset-0 overflow-hidden bg-white text-foreground">
        <div className="absolute inset-0 z-0">
          <Whiteboard
            mode="booking"
            bookingId={bookingId}
            topInset={VIDEO_FILMSTRIP_HEIGHT}
            remoteData={remoteWhiteboardData}
            onRealtimeChange={handleWhiteboardChange}
            onClose={() => {
              router.push("/dashboard/tutoring/sessions");
            }}
          />
        </div>

        <section className="pointer-events-none absolute inset-0 z-[800]">
          <VideoCall
            sessionId={videoCredentials.videoSessionId}
            token={videoCredentials.token}
            role={videoCredentials.role === "tutor" ? "educator" : "student"}
            onSignal={handleWhiteboardSignal}
            onSignalReady={(sendSignal) => {
              whiteboardSendRef.current = sendSignal;
            }}
            onConnected={() => {
              void fetch(
                `/api/tutoring/sessions/${encodeURIComponent(bookingId)}/lifecycle`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "start" }),
                },
              ).then(async (response) => {
                if (!response.ok) {
                  const data = await response.json().catch(() => null);
                  console.error(
                    "Failed to start tutoring lifecycle:",
                    data?.error ?? response.statusText,
                  );
                  return;
                }
                void loadSession();
              });
            }}
            onEndSession={async () => {
              const response = await fetch(
                `/api/tutoring/sessions/${encodeURIComponent(bookingId)}/lifecycle`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "end" }),
                },
              );

              if (!response.ok) {
                const data = await response.json().catch(() => null);
                throw new Error(
                  data?.error || "Unable to complete tutoring session.",
                );
              }
            }}
          />
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/dashboard/sessions"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sessions
        </Link>

        {error && (
          <div className="mt-5 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="rounded-3xl border border-border bg-card p-8 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-violet-600">
                  <Video className="h-4 w-4" />
                  Live tutoring session
                </div>

                <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                  {session.subject}
                </h1>

                <p className="mt-2 text-muted-foreground">
                  {session.topic || `${session.gradeLevel} tutoring`}
                </p>
              </div>

              <div className="rounded-2xl bg-muted/50 px-4 py-3 text-right">
                <div className="text-xs text-muted-foreground">Session</div>

                <div className="mt-1 text-sm font-semibold">
                  {session.status}
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-background p-5">
                <CalendarDays className="h-5 w-5 text-violet-600" />

                <div className="mt-3 text-xs text-muted-foreground">Date</div>

                <div className="mt-1 font-semibold">
                  {formatDate(session.startTime)}
                </div>
              </div>

              <div className="rounded-2xl bg-background p-5">
                <Clock3 className="h-5 w-5 text-violet-600" />

                <div className="mt-3 text-xs text-muted-foreground">Time</div>

                <div className="mt-1 font-semibold">
                  {formatTime(session.startTime)} –{" "}
                  {formatTime(session.endTime)}
                </div>
              </div>
            </div>

            {session.description && (
              <div className="mt-6 rounded-2xl border border-border p-5">
                <div className="text-sm font-semibold">
                  Message for the tutor
                </div>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {session.description}
                </p>
              </div>
            )}

            <div className="mt-8 rounded-3xl bg-background p-6 text-foreground">
              {session.beforeJoinWindow ? (
                <>
                  <div className="flex items-center gap-3">
                    <Clock3 className="h-5 w-5 text-violet-400" />

                    <div>
                      <div className="font-semibold">
                        Your classroom is not open yet
                      </div>

                      <div className="mt-1 text-sm text-muted-foreground">
                        {formatCountdown(session.joinWindowStart)}
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-muted-foreground">
                    The live classroom becomes available 30 minutes before your
                    scheduled tutoring session.
                  </p>
                </>
              ) : session.afterSession ? (
                <>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />

                    <div>
                      <div className="font-semibold">
                        This session has ended
                      </div>

                      <div className="mt-1 text-sm text-muted-foreground">
                        Thank you for using Justdy tutoring.
                      </div>
                    </div>
                  </div>
                </>
              ) : session.canJoin ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10">
                      <Video className="h-5 w-5 text-emerald-400" />
                    </div>

                    <div>
                      <div className="font-semibold">
                        Your classroom is ready
                      </div>

                      <div className="mt-1 text-sm text-muted-foreground">
                        Join your live video classroom and shared whiteboard.
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={joinSession}
                    disabled={joining}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3.5 text-sm font-semibold text-foreground transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {joining ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Connecting…
                      </>
                    ) : (
                      <>
                        <Video className="h-4 w-4" />
                        Join live session
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <LockKeyhole className="h-5 w-5 text-muted-foreground" />

                    <div>
                      <div className="font-semibold">Session unavailable</div>

                      <div className="mt-1 text-sm text-muted-foreground">
                        This classroom is not currently available.
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          {session.role === "customer" &&
            session.tutoringSessionStatus === "COMPLETED" &&
            !session.review && (
              <section className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10">
                    <Star className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Rate your tutor</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Tell us how your tutoring session went. Your feedback helps other learners understand the tutoring experience.
                    </p>
                  </div>
                </div>

                <form onSubmit={submitReview} className="mt-5 space-y-5">
                  <div>
                    <div className="text-sm font-medium">Your rating</div>
                    <div className="mt-2 flex items-center gap-1" aria-label="Choose a rating from 1 to 5 stars">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          aria-label={`${star} star${star === 1 ? "" : "s"}`}
                          className="rounded-lg p-1 transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <Star
                            className={`h-7 w-7 ${
                              star <= reviewRating
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="tutor-review" className="text-sm font-medium">
                      Written feedback <span className="font-normal text-muted-foreground">(optional)</span>
                    </label>
                    <textarea
                      id="tutor-review"
                      value={reviewComment}
                      onChange={(event) => setReviewComment(event.target.value)}
                      maxLength={2000}
                      rows={4}
                      placeholder="What did you find helpful about the session?"
                      className="mt-2 w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <div className="mt-1 text-right text-xs text-muted-foreground">
                      {reviewComment.length}/2000
                    </div>
                  </div>

                  {reviewError && (
                    <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                      {reviewError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={reviewSubmitting || reviewRating === 0}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {reviewSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      "Submit review"
                    )}
                  </button>
                </form>
              </section>
            )}

          {session.role === "customer" &&
            session.tutoringSessionStatus === "COMPLETED" &&
            (session.review || reviewSubmitted) && (
              <section className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <div>
                    <h2 className="font-semibold">Thank you for your feedback</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Your tutor review has been submitted.</p>
                  </div>
                </div>
              </section>
            )}

          </section>

          <aside className="space-y-5">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="text-sm font-medium text-muted-foreground">
                {session.role === "tutor" ? "Customer" : "Your tutor"}
              </div>

              <div className="mt-4 flex items-center gap-4">
                {otherParticipant?.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={otherParticipant.imageUrl}
                    alt={otherParticipant.name}
                    className="h-14 w-14 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-lg font-semibold text-violet-700">
                    {otherParticipant?.name?.charAt(0).toUpperCase()}
                  </div>
                )}

                <div>
                  <div className="font-semibold">{otherParticipant?.name}</div>

                  <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Confirmed participant
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Pencil className="h-4 w-4 text-violet-600" />
                Shared classroom
              </div>

              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                During the live session, both participants can work from the
                same shared whiteboard.
              </p>

              <div className="mt-5 space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Live video and audio
                </div>

                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Shared whiteboard
                </div>

                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Private session access
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Session details
              </div>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Grade</span>

                  <span className="font-medium">{session.gradeLevel}</span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Amount</span>

                  <span className="font-medium">
                    ${(session.amount / 100).toFixed(2)}
                  </span>
                </div>

                {session.topic && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Topic</span>

                    <span className="text-right font-medium">
                      {session.topic}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
