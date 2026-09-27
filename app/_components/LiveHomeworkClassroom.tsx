"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  CameraOff,
  Clock3,
  FileText,
  Loader2,
  MessageCircle,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  Send,
  ShieldCheck,
  Sparkles,
  VideoOff,
  Wifi,
  X,
} from "lucide-react";

type ClassroomUser = {
  id: string;
  name: string;
  role: string | null;
};

type ClassroomSession = {
  id: string;
  requestId: string;
  learnerId: string;
  teacherId: string;
  status: string;
  startedAt: string | null;
  endedAt: string | null;
  durationSeconds: number;
};

type HomeworkRequest = {
  id: string;
  subject: string;
  gradeLevel: string | null;
  topic: string | null;
  description: string;
  assignmentUrl: string | null;
  assignmentName: string | null;
  assignmentType: string | null;
};

type Props = {
  user: ClassroomUser;
  session: ClassroomSession;
  request: HomeworkRequest;
};

/**
 * The Vonage browser SDK exposes OpenTok-compatible objects.
 *
 * We intentionally keep these local interfaces instead of augmenting
 * Window.OT globally. The project already contains opentok.d.ts, and
 * globally declaring OT here creates incompatible duplicate SDK types.
 */

type VonageStream = object;

type VonagePublisher = {
  destroy?: () => void;
  publishAudio: (enabled: boolean) => void;
  publishVideo: (enabled: boolean) => void;
};

type VonageSignalEvent = {
  type?: string;
  data?: string;
  from?: { connectionId?: string };
};

type VonageSessionEventMap = {
  streamCreated: {
    stream: VonageStream;
  };
  streamDestroyed: {
    stream?: VonageStream;
  };
  sessionDisconnected: {
    reason?: string;
  };
  exception: Error;
  signal: VonageSignalEvent;
};

type VonageSession = {
  connect: (token: string, callback: (error?: Error) => void) => void;

  publish: (
    publisher: VonagePublisher,
    callback?: (error?: Error) => void,
  ) => void;

  unpublish?: (publisher: VonagePublisher) => void;

  signal?: (
    type: string,
    data: string,
    callback?: (error?: Error) => void,
  ) => void;

  subscribe: (
    stream: VonageStream,
    element: HTMLElement,
    options?: Record<string, unknown>,
    callback?: (error?: Error) => void,
  ) => unknown;

  disconnect: () => void;

  on: <K extends keyof VonageSessionEventMap>(
    event: K,
    callback: (event: VonageSessionEventMap[K]) => void,
  ) => void;

  off?: <K extends keyof VonageSessionEventMap>(
    event: K,
    callback: (event: VonageSessionEventMap[K]) => void,
  ) => void;
};

type VonageOT = {
  initSession: (applicationId: string, sessionId: string) => VonageSession;

  initPublisher: (
    targetElement: HTMLElement,
    options: Record<string, unknown>,
    callback?: (error?: Error) => void,
  ) => VonagePublisher;

  checkSystemRequirements?: () => number;
};

type ChatMessage = {
  id: string;
  sender: "me" | "other";
  text: string;
  createdAt: number;
};

const VONAGE_SCRIPT =
  "https://unpkg.com/@vonage/client-sdk-video@2.28.2/dist/js/opentok.js";

function getVonageSDK(): VonageOT | undefined {
  return (
    window as unknown as {
      OT?: VonageOT;
    }
  ).OT;
}

function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds,
  ).padStart(2, "0")}`;
}

function loadVonageScript(): Promise<VonageOT> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Vonage can only be loaded in a browser."));
  }

  const existingSDK = getVonageSDK();

  if (existingSDK) {
    return Promise.resolve(existingSDK);
  }

  return new Promise<VonageOT>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-justdy-vonage="true"]',
    );

    if (existing) {
      const handleLoad = () => {
        const loadedSDK = getVonageSDK();

        if (loadedSDK) {
          resolve(loadedSDK);
        } else {
          reject(new Error("Vonage Video SDK failed to initialize."));
        }
      };

      const handleError = () => {
        reject(new Error("Unable to load Vonage Video SDK."));
      };

      existing.addEventListener("load", handleLoad, {
        once: true,
      });

      existing.addEventListener("error", handleError, {
        once: true,
      });

      return;
    }

    const script = document.createElement("script");

    script.src = VONAGE_SCRIPT;
    script.async = true;
    script.dataset.justdyVonage = "true";

    script.onload = () => {
      const loadedSDK = getVonageSDK();

      if (loadedSDK) {
        resolve(loadedSDK);
      } else {
        reject(new Error("Vonage Video SDK failed to initialize."));
      }
    };

    script.onerror = () => {
      reject(new Error("Unable to load Vonage Video SDK."));
    };

    document.head.appendChild(script);
  });
}

export default function LiveHomeworkClassroom({
  user,
  session,
  request,
}: Props) {
  const publisherContainerRef = useRef<HTMLDivElement | null>(null);

  const subscriberContainerRef = useRef<HTMLDivElement | null>(null);

  const vonageSessionRef = useRef<VonageSession | null>(null);

  const publisherRef = useRef<VonagePublisher | null>(null);

  const screenSharePublisherRef = useRef<VonagePublisher | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const initializationTimerRef = useRef<number | null>(null);

  const [connectionState, setConnectionState] = useState<
    "loading" | "connecting" | "connected" | "error"
  >("loading");

  const [connectionError, setConnectionError] = useState<string | null>(null);

  const [micEnabled, setMicEnabled] = useState(true);

  const [cameraEnabled, setCameraEnabled] = useState(true);

  const [screenSharing, setScreenSharing] = useState(false);

  const [sessionStatus, setSessionStatus] = useState(session.status);

  const [startedAt, setStartedAt] = useState<string | null>(session.startedAt);

  const [elapsedSeconds, setElapsedSeconds] = useState(session.durationSeconds);

  const [showAssignment, setShowAssignment] = useState(true);

  const [showChat, setShowChat] = useState(true);

  const [chatInput, setChatInput] = useState("");

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [showEndDialog, setShowEndDialog] = useState(false);

  const [ending, setEnding] = useState(false);

  const isTeacher =
    user.id === session.teacherId || user.role?.toLowerCase() === "admin";

  const otherPersonLabel = isTeacher ? "Learner" : "Teacher";

  const startOfficialSession = useCallback(async () => {
    const response = await fetch(
      `/api/live-homework-help/session/${session.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "START",
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error ?? "Unable to start classroom session.");
    }

    setSessionStatus(data.session.status);
    setStartedAt(data.session.startedAt);

    return data.session;
  }, [session.id]);

  const initializeVonage = useCallback(async () => {
    try {
      setConnectionState("loading");
      setConnectionError(null);

      const vonage = await loadVonageScript();

      if (
        vonage.checkSystemRequirements &&
        vonage.checkSystemRequirements() !== 1
      ) {
        throw new Error(
          "This browser does not support the required live classroom video features.",
        );
      }

      const response = await fetch(
        `/api/live-homework-help/session/${session.id}/vonage`,
        {
          method: "POST",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ?? "Unable to initialize the live classroom.",
        );
      }

      if (!publisherContainerRef.current || !subscriberContainerRef.current) {
        throw new Error("Classroom video containers are not ready.");
      }

      const vonageSession = vonage.initSession(
        data.applicationId,
        data.sessionId,
      );

      vonageSessionRef.current = vonageSession;

      const handleStreamCreated = (
        event: VonageSessionEventMap["streamCreated"],
      ) => {
        const subscriber = subscriberContainerRef.current;

        if (!subscriber) {
          return;
        }

        subscriber.innerHTML = "";

        vonageSession.subscribe(
          event.stream,
          subscriber,
          {
            insertMode: "append",
            width: "100%",
            height: "100%",
          },
          (error?: Error) => {
            if (error) {
              console.error("Vonage subscription error:", error);
            }
          },
        );
      };

      const handleStreamDestroyed = () => {
        const subscriber = subscriberContainerRef.current;

        if (subscriber) {
          subscriber.innerHTML = "";
        }
      };

      const handleSessionDisconnected = () => {
        setConnectionState("error");
        setConnectionError("The live classroom connection was disconnected.");
      };

      const handleException = (error: VonageSessionEventMap["exception"]) => {
        console.error("Vonage classroom exception:", error);

        setConnectionError(
          error?.message ?? "A video classroom error occurred.",
        );
      };

      const handleSignal = (event: VonageSessionEventMap["signal"]) => {
        if (event.type !== "justdy-chat" || !event.data) {
          return;
        }

        try {
          const payload = JSON.parse(event.data) as {
            senderId?: string;
            text?: string;
            createdAt?: number;
          };

          if (!payload.text || payload.senderId === user.id) {
            return;
          }

          const text = payload.text;
          if (!text) {
            return;
          }

          setMessages((current) => [
            ...current,
            {
              id: crypto.randomUUID(),
              sender: "other",
              text,
              createdAt: payload.createdAt ?? Date.now(),
            },
          ]);
        } catch (error) {
          console.error("Unable to read classroom chat message:", error);
        }
      };

      vonageSession.on("streamCreated", handleStreamCreated);

      vonageSession.on("streamDestroyed", handleStreamDestroyed);

      vonageSession.on("sessionDisconnected", handleSessionDisconnected);

      vonageSession.on("exception", handleException);

      vonageSession.on("signal", handleSignal);

      const publisher = vonage.initPublisher(
        publisherContainerRef.current,
        {
          insertMode: "replace",
          width: "100%",
          height: "100%",
          resolution: "1280x720",
          publishAudio: true,
          publishVideo: true,
          name: user.name,
        },
        (error?: Error) => {
          if (error) {
            console.error("Vonage publisher error:", error);
          }
        },
      );

      publisherRef.current = publisher;

      setConnectionState("connecting");

      await new Promise<void>((resolve, reject) => {
        vonageSession.connect(data.token, (error?: Error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });

      await new Promise<void>((resolve, reject) => {
        vonageSession.publish(publisher, (error?: Error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });

      /*
       * Only after the actual Vonage connection and
       * publishing succeed do we mark the Justdy
       * session ACTIVE.
       */
      if (sessionStatus !== "ACTIVE" && sessionStatus !== "ENDED") {
        const started = await startOfficialSession();

        setElapsedSeconds(started.durationSeconds ?? 0);
      }

      setConnectionState("connected");
    } catch (error) {
      console.error("Live Homework Help Vonage initialization failed:", error);

      setConnectionState("error");

      setConnectionError(
        error instanceof Error
          ? error.message
          : "Unable to connect to the live classroom.",
      );
    }
  }, [session.id, user.id, sessionStatus, startOfficialSession, user.name]);

  useEffect(() => {
    initializationTimerRef.current = window.setTimeout(() => {
      void initializeVonage();
    }, 0);

    return () => {
      if (initializationTimerRef.current) {
        window.clearTimeout(initializationTimerRef.current);
        initializationTimerRef.current = null;
      }

      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }

      try {
        vonageSessionRef.current?.disconnect();
      } catch (error) {
        console.error("Unable to disconnect Vonage classroom:", error);
      }

      try {
        if (
          screenSharePublisherRef.current &&
          vonageSessionRef.current?.unpublish
        ) {
          vonageSessionRef.current.unpublish(screenSharePublisherRef.current);
        }
      } catch (error) {
        console.error("Unable to unpublish screen share:", error);
      }

      try {
        screenSharePublisherRef.current?.destroy?.();
      } catch (error) {
        console.error("Unable to destroy screen-share publisher:", error);
      }

      try {
        publisherRef.current?.destroy?.();
      } catch (error) {
        console.error("Unable to destroy Vonage publisher:", error);
      }

      vonageSessionRef.current = null;
      publisherRef.current = null;
      screenSharePublisherRef.current = null;
    };
  }, [initializeVonage]);

  useEffect(() => {
    if (sessionStatus !== "ACTIVE" || !startedAt) {
      return;
    }

    const updateTimer = () => {
      const started = new Date(startedAt).getTime();

      const seconds = Math.max(0, Math.floor((Date.now() - started) / 1000));

      setElapsedSeconds(seconds);
    };

    updateTimer();

    const timer = window.setInterval(updateTimer, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [sessionStatus, startedAt]);

  const toggleMic = () => {
    const publisher = publisherRef.current;

    if (!publisher) {
      return;
    }

    const next = !micEnabled;

    publisher.publishAudio(next);
    setMicEnabled(next);
  };

  const toggleCamera = () => {
    const publisher = publisherRef.current;

    if (!publisher) {
      return;
    }

    const next = !cameraEnabled;

    publisher.publishVideo(next);
    setCameraEnabled(next);
  };

  const toggleScreenShare = async () => {
    const classroom = vonageSessionRef.current;

    if (!classroom) {
      return;
    }

    if (screenSharing) {
      const screenPublisher = screenSharePublisherRef.current;

      if (screenPublisher) {
        try {
          classroom.unpublish?.(screenPublisher);
          screenPublisher.destroy?.();
        } catch (error) {
          console.error("Unable to stop screen sharing:", error);
        }
      }

      screenSharePublisherRef.current = null;
      setScreenSharing(false);
      return;
    }

    const container = publisherContainerRef.current;

    if (!container) {
      setConnectionError("The classroom video area is not ready.");
      return;
    }

    try {
      const vonage = getVonageSDK();

      if (!vonage) {
        throw new Error("The Vonage Video SDK is not ready.");
      }

      const screenPublisher = vonage.initPublisher(
        container,
        {
          insertMode: "append",
          width: "100%",
          height: "100%",
          videoSource: "screen",
          publishAudio: false,
          publishVideo: true,
          name: `${user.name} screen`,
        },
        (error?: Error) => {
          if (error) {
            console.error("Vonage screen-share publisher error:", error);
          }
        },
      );

      screenSharePublisherRef.current = screenPublisher;

      await new Promise<void>((resolve, reject) => {
        classroom.publish(screenPublisher, (error?: Error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });

      setScreenSharing(true);
    } catch (error) {
      screenSharePublisherRef.current = null;
      setScreenSharing(false);

      setConnectionError(
        error instanceof Error
          ? error.message
          : "Unable to start screen sharing.",
      );
    }
  };

  const sendChatMessage = () => {
    const text = chatInput.trim();

    if (!text) {
      return;
    }

    const message = {
      id: crypto.randomUUID(),
      sender: "me" as const,
      text,
      createdAt: Date.now(),
    };

    setMessages((current) => [...current, message]);

    const classroom = vonageSessionRef.current;

    if (classroom?.signal) {
      const payload = JSON.stringify({
        senderId: user.id,
        text,
        createdAt: message.createdAt,
      });

      classroom.signal("justdy-chat", payload, (error?: Error) => {
        if (error) {
          console.error("Unable to send classroom chat message:", error);
        }
      });
    }

    setChatInput("");
  };

  const endSession = async () => {
    if (ending) {
      return;
    }

    setEnding(true);

    try {
      const response = await fetch(
        `/api/live-homework-help/session/${session.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "END",
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to end the classroom session.");
      }

      setSessionStatus("ENDED");

      try {
        vonageSessionRef.current?.disconnect();
      } catch (error) {
        console.error("Unable to disconnect Vonage session:", error);
      }

      window.location.href = `/live-help?completed=${session.id}`;
    } catch (error) {
      console.error("Unable to end Live Homework Help session:", error);

      alert(
        error instanceof Error ? error.message : "Unable to end the session.",
      );
    } finally {
      setEnding(false);
      setShowEndDialog(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1800px] items-center justify-between px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
              <Sparkles className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                Justdy Live Homework Help
              </p>

              <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>Private 1-on-1 classroom</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs sm:flex">
              <span
                className={`h-2 w-2 rounded-full ${
                  connectionState === "connected"
                    ? "bg-emerald-400"
                    : connectionState === "error"
                      ? "bg-red-400"
                      : "bg-amber-400"
                }`}
              />

              <span className="text-slate-300">
                {connectionState === "connected"
                  ? "Connected"
                  : connectionState === "connecting"
                    ? "Connecting"
                    : connectionState === "loading"
                      ? "Loading"
                      : "Connection issue"}
              </span>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              <Clock3 className="h-3.5 w-3.5 text-violet-300" />

              <span className="font-mono text-sm tabular-nums">
                {formatDuration(elapsedSeconds)}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1800px] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="flex min-h-[calc(100vh-4rem)] min-w-0 flex-col">
          <div className="relative flex-1 p-3 sm:p-5">
            <div className="relative h-full min-h-[520px] overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl">
              <div
                ref={subscriberContainerRef}
                className="absolute inset-0 bg-slate-900"
              />

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/50 px-3 py-2 text-xs backdrop-blur">
                <Wifi className="h-3.5 w-3.5 text-emerald-400" />
                <span>{otherPersonLabel}</span>
              </div>

              <div
                ref={publisherContainerRef}
                className="absolute bottom-4 right-4 h-36 w-52 overflow-hidden rounded-2xl border border-white/20 bg-slate-800 shadow-xl sm:h-44 sm:w-64"
              />

              {connectionState !== "connected" && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
                  <div className="max-w-sm px-6 text-center">
                    {connectionState === "error" ? (
                      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-300">
                        <VideoOff className="h-6 w-6" />
                      </div>
                    ) : (
                      <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-violet-300" />
                    )}

                    <h2 className="text-lg font-semibold">
                      {connectionState === "error"
                        ? "Unable to connect"
                        : "Connecting you to the classroom"}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {connectionError ??
                        "Please allow camera and microphone access when your browser asks."}
                    </p>

                    {connectionState === "error" && (
                      <button
                        type="button"
                        onClick={() => {
                          void initializeVonage();
                        }}
                        className="mt-5 rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-400"
                      >
                        Try again
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-white/10 bg-slate-950 px-4 py-4 sm:px-6">
            <div className="mx-auto flex max-w-3xl items-center justify-center gap-2 sm:gap-3">
              <ControlButton
                label={micEnabled ? "Mute" : "Unmute"}
                active={micEnabled}
                onClick={toggleMic}
                icon={
                  micEnabled ? (
                    <Mic className="h-5 w-5" />
                  ) : (
                    <MicOff className="h-5 w-5" />
                  )
                }
              />

              <ControlButton
                label={cameraEnabled ? "Camera" : "Camera off"}
                active={cameraEnabled}
                onClick={toggleCamera}
                icon={
                  cameraEnabled ? (
                    <Camera className="h-5 w-5" />
                  ) : (
                    <CameraOff className="h-5 w-5" />
                  )
                }
              />

              <ControlButton
                label={screenSharing ? "Stop sharing" : "Share screen"}
                active={screenSharing}
                onClick={() => {
                  void toggleScreenShare();
                }}
                icon={<MonitorUp className="h-5 w-5" />}
              />

              <button
                type="button"
                onClick={() => setShowEndDialog(true)}
                className="ml-2 flex h-12 items-center gap-2 rounded-full bg-red-500 px-5 text-sm font-semibold text-white transition hover:bg-red-400"
              >
                <PhoneOff className="h-5 w-5" />

                <span className="hidden sm:inline">End session</span>
              </button>
            </div>
          </div>
        </section>

        <aside className="flex min-h-0 flex-col border-t border-white/10 bg-slate-900 lg:border-l lg:border-t-0">
          <div className="border-b border-white/10 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-300">
                  Homework help
                </p>

                <h1 className="mt-1 text-lg font-semibold">
                  {request.subject}
                </h1>
              </div>

              <div className="rounded-xl bg-white/5 p-2">
                <FileText className="h-5 w-5 text-slate-300" />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {request.gradeLevel && (
                <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">
                  {request.gradeLevel}
                </span>
              )}

              {request.topic && (
                <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">
                  {request.topic}
                </span>
              )}
            </div>
          </div>

          <div className="border-b border-white/10 p-5">
            <button
              type="button"
              onClick={() => setShowAssignment((current) => !current)}
              className="flex w-full items-center justify-between text-left"
            >
              <span className="text-sm font-semibold">Assignment</span>

              <span className="text-xs text-slate-500">
                {showAssignment ? "Hide" : "Show"}
              </span>
            </button>

            {showAssignment && (
              <div className="mt-4">
                {request.assignmentName && (
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                    <FileText className="h-4 w-4 text-violet-300" />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {request.assignmentName}
                      </p>

                      {request.assignmentType && (
                        <p className="mt-0.5 text-xs text-slate-500">
                          {request.assignmentType}
                        </p>
                      )}
                    </div>

                    {request.assignmentUrl && (
                      <a
                        href={request.assignmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/15"
                      >
                        Open
                      </a>
                    )}
                  </div>
                )}

                <div className="mt-3 rounded-xl bg-black/20 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Learner&apos;s question
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {request.description}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-violet-300" />

                <span className="text-sm font-semibold">Classroom chat</span>
              </div>

              <button
                type="button"
                onClick={() => setShowChat((current) => !current)}
                className="text-xs text-slate-500 hover:text-slate-300"
              >
                {showChat ? "Hide" : "Show"}
              </button>
            </div>

            {showChat && (
              <>
                <div className="flex-1 overflow-y-auto p-5">
                  {messages.length === 0 ? (
                    <div className="flex h-full min-h-40 flex-col items-center justify-center text-center">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5">
                        <MessageCircle className="h-5 w-5 text-slate-500" />
                      </div>

                      <p className="mt-3 text-sm text-slate-400">
                        Use chat for quick notes, questions, or links.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.sender === "me"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                              message.sender === "me"
                                ? "bg-violet-500 text-white"
                                : "bg-white/5 text-slate-300"
                            }`}
                          >
                            {message.text}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-white/10 p-4">
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2">
                    <input
                      value={chatInput}
                      onChange={(event) => setChatInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          sendChatMessage();
                        }
                      }}
                      placeholder="Message..."
                      className="min-w-0 flex-1 bg-transparent px-2 text-sm text-white outline-none placeholder:text-slate-600"
                    />

                    <button
                      type="button"
                      onClick={sendChatMessage}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500 text-white transition hover:bg-violet-400"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </aside>
      </div>

      {showEndDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">End this session?</h2>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Justdy will record the official session duration. Billing and
                  the learning record will use the server-side session
                  timestamps.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowEndDialog(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 rounded-2xl bg-white/5 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Session time</span>

                <span className="font-mono font-semibold">
                  {formatDuration(elapsedSeconds)}
                </span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowEndDialog(false)}
                className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-white/5"
              >
                Continue
              </button>

              <button
                type="button"
                disabled={ending}
                onClick={() => {
                  void endSession();
                }}
                className="flex-1 rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {ending ? "Ending..." : "End session"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function ControlButton({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
        active
          ? "bg-white/10 text-white hover:bg-white/15"
          : "bg-red-500/15 text-red-300 hover:bg-red-500/25"
      }`}
    >
      {icon}
    </button>
  );
}
