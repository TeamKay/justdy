"use client";

import DailyIframe from "@daily-co/daily-js";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import {
  Loader2,
  Mic,
  MicOff,
  PhoneOff,
  Video,
  VideoOff,
  MonitorUp,
  CircleDot,
  StopCircle,
  Users,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// --- Types ---

export type TutoringSignal = {
  type: string;
  data?: unknown;
};

type DailyCall =
  ReturnType<
    typeof DailyIframe.createCallObject
  >;

type DailyParticipant =
  ReturnType<
    DailyCall["participants"]
  >[string];

type DailyParticipantMap =
  Record<
    string,
    DailyParticipant
  >;

// Daily keeps a browser-level registry of call objects. A module-level
// singleton/cleanup lock prevents React Strict Mode, Fast Refresh, or a
// rapid remount from creating a second DailyIframe before the first one has
// completely finished destroying itself.
let activeDailyCall: DailyCall | null = null;
let activeDailyCleanupPromise: Promise<void> | null = null;


type RecordingFormat = "webm" | "mp4";

type RecordingSettings = {
  name: string;
  format: RecordingFormat;
};

type RecordingWindow = Window & {
  showSaveFilePicker?: (options?: {
    suggestedName?: string;
    types?: Array<{
      description?: string;
      accept: Record<string, string[]>;
    }>;
    excludeAcceptAllOption?: boolean;
  }) => Promise<{
    name: string;
    createWritable: () => Promise<{
      write: (data: Blob) => Promise<void>;
      close: () => Promise<void>;
    }>;
  }>;
};

type RecordingFileHandle = {
  name: string;
  createWritable: () => Promise<{
    write: (data: Blob) => Promise<void>;
    close: () => Promise<void>;
  }>;
};

interface VideoCallProps {
  /**
   * Daily room name.
   *
   * We keep the existing prop name so the
   * rest of the tutoring UI does not have
   * to change during the migration.
   */
  sessionId: string;

  token: string;

  role:
    | "educator"
    | "student";

  /**
   * Optional because the current caller
   * only passes sessionId + token.
   *
   * If provided, this is used directly.
   *
   * Otherwise the component builds the
   * URL from NEXT_PUBLIC_DAILY_DOMAIN_URL.
   */
  roomUrl?: string;

  onSignal?: (
    signal: TutoringSignal & {
      connectionId:
        | string
        | null;
    },
  ) => void;

  onParticipantChange?: (
    participant: {
      connectionId: string;
      joined: boolean;
    },
  ) => void;

  onConnected?: () => void;

  onDisconnected?: () => void;

  /**
   * Keeps the whiteboard's right edge aligned with the participant rail.
   * The tutoring room passes this value through to the whiteboard so the
   * board expands when the video sidebar is collapsed.
   */
  onParticipantRailWidthChange?: (width: number) => void;

  onSignalReady?: (
    sendSignal: (
      type: string,
      data?: unknown,
    ) => void,
  ) => void;

  onEndSession?: () =>
    | Promise<void>
    | void;

}

interface ControlButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  danger?: boolean;
}

interface ActionButtonProps {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

interface ParticipantVideoProps {
  participant: DailyParticipant;
  screen?: boolean;
  muted?: boolean;
  className?: string;
}

/**
 * Renders one Daily participant.
 *
 * Daily exposes the participant's persistent
 * MediaStreamTrack objects through:
 *
 * tracks.video.persistentTrack
 * tracks.audio.persistentTrack
 * tracks.screenVideo.persistentTrack
 * tracks.screenAudio.persistentTrack
 *
 * We attach those tracks to normal HTML video
 * elements so the existing JustDy UI remains
 * completely custom.
 */
function ParticipantVideo({
  participant,
  screen = false,
  muted = false,
  className = "",
}: ParticipantVideoProps) {
  const videoRef =
    useRef<HTMLVideoElement>(
      null,
    );

  const audioRef =
    useRef<HTMLAudioElement>(
      null,
    );

  /*
   * Keep the media elements stable while Daily updates the
   * participant object. Recreating a MediaStream whenever the
   * participant object changes can introduce avoidable audio
   * interruptions and perceived latency.
   *
   * We therefore depend only on the actual persistent tracks.
   */
  const videoTrack =
    screen
      ? participant.tracks
          .screenVideo
          ?.persistentTrack
      : participant.tracks
          .video
          ?.persistentTrack;

  const audioTrack =
    screen
      ? participant.tracks
          .screenAudio
          ?.persistentTrack
      : participant.tracks
          .audio
          ?.persistentTrack;

  useEffect(() => {
    const element =
      videoRef.current;

    if (!element) {
      return;
    }

    if (!videoTrack) {
      element.srcObject = null;
      return;
    }

    const stream =
      new MediaStream([
        videoTrack,
      ]);

    element.srcObject = stream;
    element.autoplay = true;
    element.playsInline = true;

    const playPromise =
      element.play();

    if (playPromise) {
      playPromise.catch(() => {
        /* Browser playback may require prior user interaction. */
      });
    }

    return () => {
      if (
        element.srcObject ===
        stream
      ) {
        element.srcObject = null;
      }
    };
  }, [videoTrack]);

  useEffect(() => {
    const element =
      audioRef.current;

    if (!element) {
      return;
    }

    if (!audioTrack || muted) {
      element.srcObject = null;
      return;
    }

    /*
     * Keep remote audio separate from the video element. This prevents
     * video rendering/state updates from repeatedly touching the audio
     * playback path.
     */
    const stream =
      new MediaStream([
        audioTrack,
      ]);

    element.srcObject = stream;
    element.autoplay = true;
    element.muted = false;

    const playPromise =
      element.play();

    if (playPromise) {
      playPromise.catch(() => {
        /* Browser playback may require prior user interaction. */
      });
    }

    return () => {
      if (
        element.srcObject ===
        stream
      ) {
        element.srcObject = null;
      }
    };
  }, [audioTrack, muted]);

  const hasVideo =
    Boolean(videoTrack);

  return (
    <>
      <audio
        ref={audioRef}
        autoPlay
        playsInline
        aria-hidden="true"
        className="hidden"
      />

      {hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 h-full w-full object-cover ${className}`}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-white/10 text-2xl font-semibold">
              {(
                participant.user_name ||
                "P"
              )
                .slice(0, 1)
                .toUpperCase()}
            </div>

            <span className="max-w-[220px] truncate text-sm text-slate-300">
              {participant.user_name ||
                "Participant"}
            </span>
          </div>
        </div>
      )}
    </>
  );
}

export default function VideoCall({
  sessionId,
  token,
  role,
  roomUrl,
  onSignal,
  onParticipantChange,
  onConnected,
  onDisconnected,
  onParticipantRailWidthChange,
  onSignalReady,
  onEndSession,
}: VideoCallProps) {
  const [
    isConnected,
    setIsConnected,
  ] = useState(false);

  const [
    isVideoEnabled,
    setIsVideoEnabled,
  ] = useState(true);

  const [
    isAudioEnabled,
    setIsAudioEnabled,
  ] = useState(true);

  const [
    isScreenSharing,
    setIsScreenSharing,
  ] = useState(false);

  const [
    isRecording,
    setIsRecording,
  ] = useState(false);

  // Recording saves use the browser's native file picker directly.
  // There is intentionally no Justdy save-settings popup.
  const recordingSettings: RecordingSettings = {
    name: "justdy-recording",
    format: "webm",
  };
  const recordingSaveHandleRef =
    useRef<RecordingFileHandle | null>(null);
  const screenRecorderRef =
    useRef<MediaRecorder | null>(null);
  const mp4RecorderRef =
    useRef<MediaRecorder | null>(null);
  const recordingResultsRef =
    useRef<{ webm?: Blob; mp4?: Blob }>({});
  const recordingExpectedResultsRef =
    useRef(0);
  const recordingCompletedResultsRef =
    useRef(0);
  const recordingStreamRef =
    useRef<MediaStream | null>(null);
  const recordingSourceStreamRef =
    useRef<MediaStream | null>(null);
  // Recording and Daily screen sharing use completely separate browser
  // display-capture streams. Starting Record never starts Daily screen
  // sharing, and starting Share Screen never starts local recording.
  const recordingDisplayStreamRef =
    useRef<MediaStream | null>(null);
  const screenShareCaptureStreamRef =
    useRef<MediaStream | null>(null);
  const dailyScreenShareStreamRef =
    useRef<MediaStream | null>(null);
  const recordingMicStreamRef =
    useRef<MediaStream | null>(null);
  const recordingAudioContextRef =
    useRef<AudioContext | null>(null);
  const recordingChunksRef =
    useRef<Blob[]>([]);
  const recordingMimeTypeRef =
    useRef<string>("");
  const recordingScreenEndedRef =
    useRef(false);

  const [isParticipantRailCollapsed, setIsParticipantRailCollapsed] =
    useState(false);

  // The whiteboard is rendered underneath this overlay by
  // TutoringSessionRoom. Keep its right inset synchronized with the
  // actual video rail width so collapsing the rail immediately gives the
  // board the newly available writing area.
  useEffect(() => {
    onParticipantRailWidthChange?.(
      isParticipantRailCollapsed ? 76 : 350,
    );
  }, [
    isParticipantRailCollapsed,
    onParticipantRailWidthChange,
  ]);

  const [showChat, setShowChat] = useState(false);
  const [hasUnreadChat, setHasUnreadChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<
    Array<{ id: string; text: string; local: boolean; name: string }>
  >([]);

  const [
    participants,
    setParticipants,
  ] =
    useState<DailyParticipantMap>(
      {},
    );

  const callRef =
    useRef<DailyCall | null>(
      null,
    );

  // Component-local reference retained for the existing lifecycle, while the
  // module-level lock above also protects against duplicate component mounts.
  const dailyCleanupPromiseRef =
    useRef<Promise<void> | null>(null);

  const callbacksRef =
    useRef({
      onSignal,
      onParticipantChange,
      onConnected,
      onDisconnected,
      onSignalReady,
    });

  useEffect(() => {
    callbacksRef.current = {
      onSignal,
      onParticipantChange,
      onConnected,
      onDisconnected,
      onSignalReady,
    };
  }, [
    onSignal,
    onParticipantChange,
    onConnected,
    onDisconnected,
    onSignalReady,
  ]);

  const participantIdsNotifiedRef =
    useRef<Set<string>>(
      new Set(),
    );

  const router =
    useRouter();

  /*
   * If the API caller eventually passes roomUrl,
   * it wins.
   *
   * Otherwise use the public Daily domain + room name.
   */
  const resolvedRoomUrl =
    useMemo(() => {
      if (roomUrl) {
        return roomUrl;
      }

      const domainUrl =
        process.env
          .NEXT_PUBLIC_DAILY_DOMAIN_URL;

      if (!domainUrl) {
        return "";
      }

      return `${domainUrl.replace(
        /\/$/,
        "",
      )}/${sessionId}`;
    }, [
      roomUrl,
      sessionId,
    ]);

  /**
   * Preserves the signaling interface used by
   * the rest of the tutoring application.
   *
   * Vonage signal() → Daily sendAppMessage().
   */
  const sendSignal = (
    type: string,
    data?: unknown,
  ) => {
    const call =
      callRef.current;

    if (!call) {
      return;
    }

    try {
      call.sendAppMessage(
        {
          type,
          data,
        },
        "*",
      );
    } catch (error) {
      console.error(
        "Daily app-message error:",
        error,
      );
    }
  };

  /*
   * Create and join the Daily call.
   */
  useEffect(() => {
    if (
      !resolvedRoomUrl ||
      !sessionId ||
      !token
    ) {
      if (!resolvedRoomUrl) {
        toast.error(
          "Daily room URL is not configured. Set NEXT_PUBLIC_DAILY_DOMAIN_URL.",
        );
      }

      return;
    }

    let cancelled =
      false;

    const createCall =
      async () => {
        // React Strict Mode, Fast Refresh, and rapid remounts can run this
        // effect again before Daily has finished destroying the previous call.
        // Always wait on the global cleanup lock first.
        const previousCleanup =
          activeDailyCleanupPromise ??
          dailyCleanupPromiseRef.current;

        if (previousCleanup) {
          try {
            await previousCleanup;
          } catch {
            // Cleanup errors are handled by the cleanup routine below.
          }
        }

        if (cancelled || callRef.current) {
          return;
        }

        // Another mount may have completed while this effect was waiting.
        // Reuse that active call instead of asking Daily for a second one.
        if (activeDailyCall) {
          callRef.current =
            activeDailyCall;
          return;
        }

        const call =
          DailyIframe.createCallObject({
            subscribeToTracksAutomatically:
              true,
            startVideoOff:
              false,
            startAudioOff:
              false,
          });

        activeDailyCall =
          call;
        callRef.current =
          call;

    /*
     * Refresh the React representation of
     * Daily's participant store.
     */
    const refreshParticipants =
      () => {
        if (cancelled) {
          return;
        }

        const current =
          call.participants();

        setParticipants({
          ...current,
        });

        const localParticipant =
          current.local;

        if (
          localParticipant
        ) {
          setIsVideoEnabled(
            localParticipant
              .tracks
              .video
              ?.state !==
              "off" &&
              localParticipant.video !==
                false,
          );

          setIsAudioEnabled(
            localParticipant
              .tracks
              .audio
              ?.state !==
              "off" &&
              localParticipant.audio !==
                false,
          );

          setIsScreenSharing(
            localParticipant
              .tracks
              .screenVideo
              ?.state ===
              "playable",
          );

        }
      };

    const notifyParticipantJoined =
      (
        participant: DailyParticipant,
      ) => {
        if (
          participant.local
        ) {
          return;
        }

        const id =
          participant.session_id;

        if (
          !id ||
          participantIdsNotifiedRef.current.has(
            id,
          )
        ) {
          return;
        }

        participantIdsNotifiedRef.current.add(
          id,
        );

        callbacksRef.current.onParticipantChange?.({
          connectionId: id,
          joined: true,
        });
      };

    const notifyParticipantLeft =
      (
        participant: DailyParticipant,
      ) => {
        const id =
          participant.session_id;

        if (!id) {
          return;
        }

        participantIdsNotifiedRef.current.delete(
          id,
        );

        callbacksRef.current.onParticipantChange?.({
          connectionId: id,
          joined: false,
        });
      };

    const handleJoinedMeeting =
      () => {
        if (cancelled) {
          return;
        }

        setIsConnected(
          true,
        );

        refreshParticipants();

        callbacksRef.current.onConnected?.();

        callbacksRef.current.onSignalReady?.(
          sendSignal,
        );
      };

    const handleLeftMeeting =
      () => {
        setIsConnected(
          false,
        );

        setParticipants({});

        setIsRecording(
          false,
        );

        setIsScreenSharing(
          false,
        );

        callbacksRef.current.onDisconnected?.();
      };

    const handleParticipantJoined =
      (event: unknown) => {
        const participant =
          (
            event as {
              participant?: DailyParticipant;
            }
          ).participant;

        if (
          participant
        ) {
          notifyParticipantJoined(
            participant,
          );
        }

        refreshParticipants();
      };

    const handleParticipantUpdated =
      () => {
        refreshParticipants();
      };

    const handleParticipantLeft =
      (event: unknown) => {
        const participant =
          (
            event as {
              participant?: DailyParticipant;
            }
          ).participant;

        if (
          participant
        ) {
          notifyParticipantLeft(
            participant,
          );
        }

        refreshParticipants();
      };

    /*
     * Daily app-message replaces the old Vonage
     * signal event.
     */
    const handleAppMessage =
      (event: unknown) => {
        const message =
          event as {
            data?: unknown;

            from?:
              | string
              | {
                  session_id?: string;
                }
              | null;
          };

        if (
          !message.data ||
          typeof message.data !==
            "object"
        ) {
          return;
        }

        const payload =
          message.data as {
            type?: unknown;
            data?: unknown;
          };

        if (
          typeof payload.type !==
          "string"
        ) {
          return;
        }

        const from =
          typeof message.from ===
          "string"
            ? message.from
            : message.from
                ?.session_id ??
              null;

        if (payload.type === "chat:message") {
          const chatData =
            payload.data as { text?: unknown } | null | undefined;
          const textValue =
            typeof chatData?.text === "string"
              ? chatData.text.trim()
              : "";

          if (textValue) {
            setHasUnreadChat(true);

            const sender =
              (from ? participants[from]?.user_name : undefined) ||
              "Participant";

            setChatMessages((current) => [
              ...current.slice(-49),
              {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                text: textValue,
                local: false,
                name: sender,
              },
            ]);
          }

          return;
        }

        callbacksRef.current.onSignal?.({
          type: payload.type,

          data: payload.data,

          connectionId: from,
        });
      };

    const handleScreenShareStarted =
      () => {
        setIsScreenSharing(
          true,
        );

        refreshParticipants();
      };

    const handleScreenShareStopped =
      () => {
        setIsScreenSharing(
          false,
        );

        refreshParticipants();
      };

    const handleError =
      (event: unknown) => {
        console.error(
          "Daily call error:",
          event,
        );

        toast.error(
          "Video connection error",
        );
      };

    call.on(
      "joined-meeting",
      handleJoinedMeeting,
    );

    call.on(
      "left-meeting",
      handleLeftMeeting,
    );

    call.on(
      "participant-joined",
      handleParticipantJoined,
    );

    call.on(
      "participant-updated",
      handleParticipantUpdated,
    );

    call.on(
      "participant-left",
      handleParticipantLeft,
    );

    call.on(
      "app-message",
      handleAppMessage,
    );

    call.on(
      "local-screen-share-started",
      handleScreenShareStarted,
    );

    call.on(
      "local-screen-share-stopped",
      handleScreenShareStopped,
    );

    call.on(
      "local-screen-share-canceled",
      handleScreenShareStopped,
    );

    call.on(
      "error",
      handleError,
    );

    const join =
      async () => {
        try {
          await call.join({
            url: resolvedRoomUrl,
            token,
          });
        } catch (error) {
          console.error(
            "Daily connection failed:",
            error,
          );

          toast.error(
            "Connection failed",
          );

          setIsConnected(
            false,
          );
        }
      };

        void join();
      };

    void createCall();

    return () => {
      cancelled = true;

      recordingDisplayStreamRef.current
        ?.getTracks()
        .forEach((track) => track.stop());
      recordingDisplayStreamRef.current = null;

      screenShareCaptureStreamRef.current
        ?.getTracks()
        .forEach((track) => track.stop());
      screenShareCaptureStreamRef.current = null;

      dailyScreenShareStreamRef.current
        ?.getTracks()
        .forEach((track) => track.stop());
      dailyScreenShareStreamRef.current = null;

      const activeCall =
        callRef.current;

      if (!activeCall) {
        participantIdsNotifiedRef.current.clear();
        return;
      }

      const cleanup =
        async () => {
          try {
            await activeCall.leave();
          } catch (error) {
            console.debug(
              "Unable to leave Daily call during cleanup:",
              error,
            );
          } finally {
            try {
              await activeCall.destroy();
            } catch (error) {
              console.debug(
                "Unable to destroy Daily call:",
                error,
              );
            }

            if (callRef.current === activeCall) {
              callRef.current = null;
            }

            if (activeDailyCall === activeCall) {
              activeDailyCall = null;
            }

            participantIdsNotifiedRef.current.clear();
          }
        };

      const cleanupPromise =
        cleanup();

      dailyCleanupPromiseRef.current =
        cleanupPromise;
      activeDailyCleanupPromise =
        cleanupPromise;

      void cleanupPromise.finally(() => {
        if (dailyCleanupPromiseRef.current === cleanupPromise) {
          dailyCleanupPromiseRef.current = null;
        }

        if (activeDailyCleanupPromise === cleanupPromise) {
          activeDailyCleanupPromise = null;
        }
      });
    };
  }, [
    resolvedRoomUrl,
    sessionId,
    token,
  ]);

  /*
   * Microphone.
   */
  const toggleAudio =
    async () => {
      const call =
        callRef.current;

      if (!call) {
        return;
      }

      try {
        const next =
          !isAudioEnabled;

        await call.setLocalAudio(
          next,
        );

        setIsAudioEnabled(
          next,
        );
      } catch (error) {
        console.error(
          "Unable to toggle microphone:",
          error,
        );

        toast.error(
          "Unable to change microphone state",
        );
      }
    };

  /*
   * Camera.
   */
  const toggleVideo =
    async () => {
      const call =
        callRef.current;

      if (!call) {
        return;
      }

      try {
        const next =
          !isVideoEnabled;

        await call.setLocalVideo(
          next,
        );

        setIsVideoEnabled(
          next,
        );
      } catch (error) {
        console.error(
          "Unable to toggle camera:",
          error,
        );

        toast.error(
          "Unable to change camera state",
        );
      }
    };

  /*
   * Screen sharing.
   *
   * Share Screen and Record are intentionally independent. Share Screen owns
   * its own browser display-capture stream and is the only action that ever
   * calls Daily's startScreenShare(). Record owns a separate capture stream
   * and never changes Daily's screen-share state.
   */
  const toggleScreenShare =
    async () => {
      const call =
        callRef.current;

      if (!call) {
        return;
      }

      try {
        if (isScreenSharing) {
          await call.stopScreenShare();

          dailyScreenShareStreamRef.current
            ?.getTracks()
            .forEach((track) => track.stop());
          dailyScreenShareStreamRef.current = null;

          screenShareCaptureStreamRef.current
            ?.getTracks()
            .forEach((track) => track.stop());
          screenShareCaptureStreamRef.current = null;

          setIsScreenSharing(false);
          return;
        }

        if (!navigator.mediaDevices?.getDisplayMedia) {
          toast.error(
            "Screen sharing is not supported in this browser",
          );
          return;
        }

        // IMPORTANT: this stream belongs only to Share Screen. It is never
        // reused by Record, so clicking Record cannot publish a Daily screen
        // share as a side effect.
        const displayStream =
          await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true,
          });

        const displayVideoTrack =
          displayStream.getVideoTracks().find(
            (track) => track.readyState === "live",
          );

        if (!displayVideoTrack) {
          displayStream.getTracks().forEach((track) => track.stop());
          toast.error("No screen video track was provided");
          return;
        }

        screenShareCaptureStreamRef.current = displayStream;

        displayVideoTrack.addEventListener(
          "ended",
          () => {
            // This callback belongs ONLY to the Share Screen capture.
            // Never stop or modify the independent recording capture here.
            if (screenShareCaptureStreamRef.current === displayStream) {
              screenShareCaptureStreamRef.current = null;
            }

            dailyScreenShareStreamRef.current
              ?.getTracks()
              .forEach((track) => track.stop());
            dailyScreenShareStreamRef.current = null;

            setIsScreenSharing(false);
          },
          { once: true },
        );

        const dailyStream = new MediaStream(
          displayStream
            .getTracks()
            .filter((track) => track.readyState === "live")
            .map((track) => track.clone()),
        );

        if (!dailyStream.getVideoTracks().length) {
          displayStream.getTracks().forEach((track) => track.stop());
          screenShareCaptureStreamRef.current = null;
          dailyStream.getTracks().forEach((track) => track.stop());
          toast.error("No live screen video track is available");
          return;
        }

        dailyScreenShareStreamRef.current = dailyStream;

        await call.startScreenShare({
          mediaStream: dailyStream,
        });

        setIsScreenSharing(true);
      } catch (error) {
        console.error(
          "Unable to toggle screen sharing:",
          error,
        );

        dailyScreenShareStreamRef.current
          ?.getTracks()
          .forEach((track) => track.stop());
        dailyScreenShareStreamRef.current = null;

        screenShareCaptureStreamRef.current
          ?.getTracks()
          .forEach((track) => track.stop());
        screenShareCaptureStreamRef.current = null;

        if (
          error instanceof DOMException &&
          error.name === "NotAllowedError"
        ) {
          toast.info("Screen sharing was cancelled");
        } else {
          toast.error(
            "Screen sharing is not supported or was denied",
          );
        }

        setIsScreenSharing(false);
      }
    };

  const getRecordingMimeType = (format: RecordingFormat) => {
    const candidates =
      format === "mp4"
        ? [
            "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
            "video/mp4",
          ]
        : [
            "video/webm;codecs=vp9,opus",
            "video/webm;codecs=vp8,opus",
            "video/webm",
          ];

    return candidates.find((type) =>
      MediaRecorder.isTypeSupported(type),
    ) ?? "";
  };

  const getRecordingFilename = (format: RecordingFormat = recordingSettings.format) => {
    const cleanName =
      recordingSettings.name
        .trim()
        .replace(/[^a-zA-Z0-9._-]+/g, "-")
        .replace(/^-+|-+$/g, "") ||
      "justdy-recording";

    return `${cleanName}.${format}`;
  };

  const cleanupRecordingStreams = () => {
    recordingStreamRef.current
      ?.getTracks()
      .forEach((track) => track.stop());
    recordingStreamRef.current = null;

    recordingSourceStreamRef.current
      ?.getTracks()
      .forEach((track) => track.stop());
    recordingSourceStreamRef.current = null;

    // The recording display capture is owned by the recording lifecycle and
    // is stopped explicitly when the recording finishes.

    recordingMicStreamRef.current
      ?.getTracks()
      .forEach((track) => track.stop());
    recordingMicStreamRef.current = null;

    recordingAudioContextRef.current
      ?.close()
      .catch(() => undefined);
    recordingAudioContextRef.current = null;
  };

  const saveRecordingBlob = async (
    blob: Blob,
    format: RecordingFormat,
    fileHandle?: RecordingFileHandle | null,
  ) => {
    if (!blob.size) {
      toast.error("The recording is empty");
      return;
    }

    const filename = getRecordingFilename(format);

    try {
      if (fileHandle) {
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        toast.success("Recording saved successfully");
        return;
      }

      // If the native picker was unavailable or the tutor cancelled it,
      // save directly to the browser's normal download location. This keeps
      // the recording flow free of any Justdy save-settings popup.
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("Recording downloaded");
    } catch (error) {
      console.error("Unable to save recording:", error);
      toast.error("Unable to save the recording");
    }
  };

  const startLocalRecording = async () => {
    if (
      typeof window === "undefined" ||
      !navigator.mediaDevices
    ) {
      toast.error("Recording is not supported in this browser");
      return;
    }

    const webmMimeType = getRecordingMimeType("webm");
    const mp4MimeType = getRecordingMimeType("mp4");

    if (!webmMimeType && !mp4MimeType) {
      toast.error("This browser cannot record video");
      return;
    }

    const call = callRef.current;

    if (!call) {
      toast.error("The video session is not connected yet");
      return;
    }

    try {
      /*
       * Whole-class recording uses its own browser display stream. It is
       * completely separate from the Daily screen-share stream, so clicking
       * Record can never start/publish a Daily screen share.
       */
      let displayStream =
        recordingDisplayStreamRef.current;

      let displayVideoTrack =
        displayStream?.getVideoTracks().find(
          (track) => track.readyState === "live",
        );

      /*
       * Record can be started directly. The Record button itself becomes the
       * browser's required user gesture for getDisplayMedia(). The resulting
       * display stream stays local to the recording and is never handed to
       * Daily.
       */
      if (!displayStream || !displayVideoTrack) {
        if (!navigator.mediaDevices.getDisplayMedia) {
          toast.error(
            "Screen recording is not supported in this browser",
          );
          return;
        }

        try {
          displayStream =
            await navigator.mediaDevices.getDisplayMedia({
              video: true,
              audio: true,
            });
        } catch (error) {
          if (
            error instanceof DOMException &&
            error.name === "NotAllowedError"
          ) {
            toast.info("Screen recording was cancelled");
          } else {
            console.error(
              "Unable to capture the display for recording:",
              error,
            );
            toast.error(
              "Unable to capture the screen for recording",
            );
          }
          return;
        }

        displayVideoTrack =
          displayStream.getVideoTracks().find(
            (track) => track.readyState === "live",
          );

        if (!displayVideoTrack) {
          displayStream
            .getTracks()
            .forEach((track) => track.stop());
          toast.error("No screen video track was provided");
          return;
        }

        recordingDisplayStreamRef.current =
          displayStream;

        displayVideoTrack.addEventListener(
          "ended",
          () => {
            recordingScreenEndedRef.current = true;

            if (
              screenRecorderRef.current ||
              mp4RecorderRef.current
            ) {
              void stopLocalRecording(false);
            }

            recordingDisplayStreamRef.current = null;
          },
          { once: true },
        );
      }

      if (!displayStream || !displayVideoTrack) {
        toast.error(
          "Unable to access the screen capture for recording",
        );
        return;
      }

      recordingScreenEndedRef.current = false;
      const localParticipant = call.participants().local;
      const dailyAudioTrack =
        localParticipant?.tracks.audio?.persistentTrack;

      const recordingSourceTracks: MediaStreamTrack[] = [
        displayVideoTrack.clone(),
      ];

      /*
       * Include browser-provided display audio when available. This can
       * contain tab/system audio depending on the source selected in the
       * browser capture dialog.
       */
      const displayAudioTracks = displayStream
        .getAudioTracks()
        .filter((track) => track.readyState === "live");

      /*
       * Mix the Daily microphone, participant audio, and any browser
       * capture audio into one recording audio track.
       */
      const participantAudioTracks = Object.values(call.participants())
        .map((participant) => participant.tracks.audio?.persistentTrack)
        .filter(
          (track): track is MediaStreamTrack =>
            track !== undefined && track.readyState === "live",
        );

      const audioTracks = [
        ...displayAudioTracks,
        ...(dailyAudioTrack?.readyState === "live"
          ? [dailyAudioTrack]
          : []),
        ...participantAudioTracks,
      ];

      const uniqueAudioTracks = audioTracks.filter(
        (track, index, tracks) =>
          tracks.findIndex((candidate) => candidate.id === track.id) === index,
      );

      if (uniqueAudioTracks.length) {
        const AudioContextConstructor =
          window.AudioContext ||
          (window as Window & {
            webkitAudioContext?: typeof AudioContext;
          }).webkitAudioContext;

        if (AudioContextConstructor) {
          const audioContext = new AudioContextConstructor();
          await audioContext.resume().catch(() => undefined);
          recordingAudioContextRef.current = audioContext;

          const destination = audioContext.createMediaStreamDestination();

          uniqueAudioTracks.forEach((track) => {
            try {
              audioContext
                .createMediaStreamSource(new MediaStream([track]))
                .connect(destination);
            } catch (error) {
              console.warn(
                "Unable to add audio source to recording:",
                error,
              );
            }
          });

          const mixedAudioTrack =
            destination.stream.getAudioTracks()[0];

          if (mixedAudioTrack) {
            recordingSourceTracks.push(mixedAudioTrack);
          }
        } else {
          const firstAudioTrack = uniqueAudioTracks[0];
          if (firstAudioTrack) {
            recordingSourceTracks.push(firstAudioTrack.clone());
          }
        }
      }

      const recordingStream = new MediaStream(recordingSourceTracks);
      recordingSourceStreamRef.current = recordingStream;
      recordingStreamRef.current = recordingStream;

      const videoTracks = recordingStream.getVideoTracks();

      if (!videoTracks.length) {
        cleanupRecordingStreams();
        toast.error("No video track is available for recording");
        return;
      }

      recordingResultsRef.current = {};
      recordingCompletedResultsRef.current = 0;
      recordingExpectedResultsRef.current =
        Number(Boolean(webmMimeType)) + Number(Boolean(mp4MimeType));

      const handleRecorderResult = (
        format: RecordingFormat,
        chunks: Blob[],
      ) => {
        const mimeType =
          format === "mp4"
            ? mp4MimeType || "video/mp4"
            : webmMimeType || "video/webm";
        const blob = new Blob(chunks, { type: mimeType });

        if (blob.size > 0) {
          recordingResultsRef.current[format] = blob;
        }

        recordingCompletedResultsRef.current += 1;

        if (
          recordingCompletedResultsRef.current >=
          recordingExpectedResultsRef.current
        ) {
          screenRecorderRef.current = null;
          mp4RecorderRef.current = null;
          cleanupRecordingStreams();

          // Recording owns its own display capture. Only release that stream
          // here; never touch the independent Share Screen capture.
          const recordingDisplayStream =
            recordingDisplayStreamRef.current;
          if (recordingDisplayStream) {
            recordingDisplayStream
              .getTracks()
              .forEach((track) => track.stop());
            recordingDisplayStreamRef.current = null;
          }

          setIsRecording(false);

          const results = { ...recordingResultsRef.current };
          recordingResultsRef.current = {};

          // Save immediately using the file handle selected when the tutor
          // clicked Stop. There is no second Justdy save-settings popup.
          const preferredFormat = recordingSettings.format;
          const preferredBlob =
            results[preferredFormat] ??
            results.webm ??
            results.mp4;
          const actualFormat =
            results[preferredFormat]
              ? preferredFormat
              : results.webm
                ? "webm"
                : "mp4";
          const saveHandle = recordingSaveHandleRef.current;
          recordingSaveHandleRef.current = null;

          if (preferredBlob) {
            void saveRecordingBlob(
              preferredBlob,
              actualFormat,
              saveHandle,
            );
          } else {
            toast.error("The recording is empty");
          }
        }
      };

      const recorders: Array<{
        format: RecordingFormat;
        mimeType: string;
        ref: { current: MediaRecorder | null };
      }> = [];

      if (webmMimeType) {
        recorders.push({
          format: "webm",
          mimeType: webmMimeType,
          ref: screenRecorderRef,
        });
      }

      if (mp4MimeType) {
        recorders.push({
          format: "mp4",
          mimeType: mp4MimeType,
          ref: mp4RecorderRef,
        });
      }

      for (const entry of recorders) {
        const chunks: Blob[] = [];
        const recorder = new MediaRecorder(recordingStream, {
          mimeType: entry.mimeType,
        });

        entry.ref.current = recorder;
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) chunks.push(event.data);
        };
        recorder.onerror = (event) => {
          console.error(`${entry.format} recorder error:`, event);
        };
        recorder.onstop = () => handleRecorderResult(entry.format, chunks);
        recorder.start(1000);
      }

      setIsRecording(true);
      toast.success("Whole-screen recording started");
    } catch (error) {
      cleanupRecordingStreams();
      screenRecorderRef.current = null;
      mp4RecorderRef.current = null;

      if (
        error instanceof DOMException &&
        error.name === "NotAllowedError"
      ) {
        toast.info("Screen capture was cancelled");
        return;
      }

      console.error("Unable to start whole-screen recording:", error);
      toast.error("Unable to start whole-screen recording");
    }
  };

  const stopLocalRecording = async (openSavePicker = false) => {
    const recorders = [
      screenRecorderRef.current,
      mp4RecorderRef.current,
    ];

    if (!recorders.some((recorder) => recorder && recorder.state !== "inactive")) {
      return;
    }

    // The native file picker must only be opened from the actual Stop
    // button gesture. A display-track "ended" event is not a user gesture.
    recordingSaveHandleRef.current = null;

    const fileWindow = window as RecordingWindow;

    if (openSavePicker && fileWindow.showSaveFilePicker) {
      try {
        const saveFormat =
          getRecordingMimeType("webm")
            ? "webm"
            : "mp4";
        const saveMimeType =
          saveFormat === "mp4"
            ? "video/mp4"
            : "video/webm";

        const handle = await fileWindow.showSaveFilePicker({
          suggestedName: getRecordingFilename(saveFormat),
          excludeAcceptAllOption: true,
          types: [
            {
              description:
                saveFormat === "mp4"
                  ? "MP4 Video"
                  : "WebM Video",
              accept: {
                [saveMimeType]: [`.${saveFormat}`],
              },
            },
          ],
        });

        recordingSaveHandleRef.current = handle;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          toast.info("Recording save cancelled; the recording will be downloaded");
        } else {
          console.error("Unable to open recording save location:", error);
          toast.info("Recording will be downloaded to the browser's download location");
        }
      }
    }

    recorders.forEach((recorder) => {
      if (recorder && recorder.state !== "inactive") {
        recorder.stop();
      }
    });
  };

  const toggleRecording = async () => {
    if (role !== "educator") {
      return;
    }

    if (isRecording) {
      await stopLocalRecording(true);
      return;
    }

    await startLocalRecording();
  };

  const allParticipants = useMemo(
    () => Object.values(participants),
    [participants],
  );

  const participantColumns =
    allParticipants.length <= 4
      ? "grid-cols-1"
      : allParticipants.length <= 9
        ? "grid-cols-2"
        : "grid-cols-3";

  const sendChatMessage = () => {
    const text = chatInput.trim();
    if (!text) return;

    sendSignal("chat:message", { text });

    setChatMessages((current) => [
      ...current.slice(-49),
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        text,
        local: true,
        name: "You",
      },
    ]);

    setChatInput("");
  };

  const renderExpandedParticipant = (participant: DailyParticipant) => (
    <div
      key={participant.session_id}
      className="relative min-h-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-950 shadow-sm"
    >
      <div className="relative aspect-video w-full overflow-hidden">
        <ParticipantVideo
          participant={participant}
          screen={
            participant.tracks.screenVideo?.state ===
            "playable"
          }
          muted={Boolean(participant.local)}
        />
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/85 via-black/30 to-transparent px-2.5 pb-2 pt-8">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-white">
          <span className="size-1.5 shrink-0 rounded-full bg-emerald-400" />
          <span className="min-w-0 truncate">
            {participant.local
              ? "You"
              : participant.user_name || "Participant"}
          </span>
        </div>
      </div>
    </div>
  );

  const renderCollapsedParticipant = (participant: DailyParticipant) => (
    <div
      key={participant.session_id}
      className="group relative flex shrink-0 items-center justify-center"
      title={
        participant.local
          ? "You"
          : participant.user_name || "Participant"
      }
    >
      <div className="relative size-12 overflow-hidden rounded-full border-2 border-white bg-slate-950 shadow-md ring-1 ring-slate-200">
        <ParticipantVideo
          participant={participant}
          screen={
            participant.tracks.screenVideo?.state ===
            "playable"
          }
          muted={Boolean(participant.local)}
        />
      </div>

      <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white bg-emerald-500" />
    </div>
  );

  const renderSidebarControls = () => (
    <div className="relative shrink-0 border-t border-slate-200 bg-white px-2.5 py-2.5">
      {showChat && (
        <div className="absolute bottom-[74px] right-2 z-[220] flex h-[min(440px,55vh)] w-[min(320px,calc(100vw-24px))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-3 py-2.5">
            <div>
              <div className="text-xs font-bold text-slate-900">Chat</div>
              <div className="text-[9px] text-slate-400">
                Messages are shared with everyone in the session.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowChat(false)}
              className="flex size-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close chat"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
            {chatMessages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center text-xs text-slate-400">
                No messages yet.
              </div>
            ) : (
              chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.local ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                      message.local
                        ? "rounded-br-md bg-emerald-600 text-white"
                        : "rounded-bl-md bg-slate-100 text-slate-800"
                    }`}
                  >
                    <div className="mb-0.5 text-[9px] font-bold opacity-60">
                      {message.name}
                    </div>
                    <div className="break-words text-xs leading-5">
                      {message.text}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="shrink-0 border-t border-slate-200 p-2">
            <div className="flex items-end gap-2">
              <textarea
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendChatMessage();
                  }
                }}
                rows={2}
                placeholder="Write a message…"
                className="min-h-10 flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-emerald-400 focus:bg-white"
              />
              <button
                type="button"
                onClick={sendChatMessage}
                className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white transition hover:bg-emerald-700"
                aria-label="Send chat message"
                title="Send message"
              >
                <MessageSquare className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className={
          isParticipantRailCollapsed
            ? "flex flex-col items-center justify-center gap-1.5"
            : "flex items-center justify-center gap-1.5"
        }
      >
        <button
          type="button"
          onClick={() => void toggleAudio()}
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition ${
            isAudioEnabled
              ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
              : "bg-rose-50 text-rose-600 hover:bg-rose-100"
          }`}
          aria-label={
            isAudioEnabled
              ? "Mute microphone"
              : "Unmute microphone"
          }
          title={
            isAudioEnabled
              ? "Mute microphone"
              : "Unmute microphone"
          }
        >
          {isAudioEnabled ? (
            <Mic size={17} />
          ) : (
            <MicOff size={17} />
          )}
        </button>

        <button
          type="button"
          onClick={() => void toggleVideo()}
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition ${
            isVideoEnabled
              ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
              : "bg-rose-50 text-rose-600 hover:bg-rose-100"
          }`}
          aria-label={
            isVideoEnabled
              ? "Turn camera off"
              : "Turn camera on"
          }
          title={
            isVideoEnabled
              ? "Turn camera off"
              : "Turn camera on"
          }
        >
          {isVideoEnabled ? (
            <Video size={17} />
          ) : (
            <VideoOff size={17} />
          )}
        </button>

        <ActionButton
          label="Share"
          icon={<MonitorUp size={17} />}
          active={isScreenSharing}
          onClick={() => void toggleScreenShare()}
        />

        {role === "educator" && (
          <ActionButton
            label={isRecording ? "Stop" : "Record"}
            icon={
              isRecording ? (
                <StopCircle size={17} className="text-red-500" />
              ) : (
                <CircleDot size={17} />
              )
            }
            active={isRecording}
            onClick={() => void toggleRecording()}
          />
        )}

        <button
          type="button"
          onClick={() => {
            if (!showChat) {
              setHasUnreadChat(false);
            }
            setShowChat((value) => !value);
          }}
          className={`relative flex size-10 shrink-0 items-center justify-center rounded-xl transition ${
            hasUnreadChat && !showChat
              ? "bg-emerald-100 text-emerald-700 shadow-[0_0_16px_rgba(16,185,129,0.75)] ring-2 ring-emerald-300"
              : showChat
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
          aria-label={showChat ? "Close chat" : "Open chat"}
          title={
            hasUnreadChat && !showChat
              ? "New chat message"
              : showChat
                ? "Close chat"
                : "Open chat"
          }
        >
          <MessageSquare size={17} />
          {hasUnreadChat && !showChat && (
            <span
              aria-hidden="true"
              className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-white bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.95)] animate-pulse"
            />
          )}
        </button>

        {role === "educator" ? (
          <button
            type="button"
            onClick={async () => {
              try {
                await onEndSession?.();
              } catch (error) {
                console.error(
                  "Failed to end tutoring session:",
                  error,
                );
              } finally {
                try {
                  await callRef.current?.leave();
                } catch (error) {
                  console.debug(
                    "Unable to leave Daily call:",
                    error,
                  );
                }
                router.push("/tutoring/sessions");
              }
            }}
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-sm transition hover:bg-rose-500"
            aria-label="End session"
            title="End session"
          >
            <PhoneOff size={17} />
          </button>
        ) : (
          <button
            type="button"
            onClick={async () => {
              try {
                await callRef.current?.leave();
              } catch (error) {
                console.debug(
                  "Unable to leave Daily call:",
                  error,
                );
              } finally {
                router.push("/tutoring/sessions");
              }
            }}
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm transition hover:bg-slate-800"
            aria-label="Leave session"
            title="Leave session"
          >
            <PhoneOff size={17} />
          </button>
        )}
      </div>
    </div>
  );

  const renderParticipantRail = () => {
    if (isParticipantRailCollapsed) {
      return (
        <aside className="pointer-events-auto absolute inset-y-0 right-0 z-[200] flex w-[76px] flex-col border-l border-slate-200 bg-white shadow-xl">
          <div className="flex shrink-0 items-center justify-center border-b border-slate-100 px-2 py-2">
            <button
              type="button"
              onClick={() => setIsParticipantRailCollapsed(false)}
              className="flex size-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="Expand participant sidebar"
              title="Expand sidebar"
            >
              <ChevronLeft className="size-5" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
            <div className="flex flex-col items-center gap-3">
              {allParticipants.length > 0 ? (
                allParticipants.map(renderCollapsedParticipant)
              ) : (
                <div className="pt-4 text-center text-[9px] text-slate-400">
                  Waiting
                </div>
              )}
            </div>
          </div>

          {renderSidebarControls()}
        </aside>
      );
    }

    return (
      <aside className="pointer-events-auto absolute inset-y-0 right-0 z-[200] flex w-[min(350px,88vw)] flex-col border-l border-slate-200 bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-3 py-3">
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-900">
              Participants
            </div>
            <div className="mt-0.5 text-[10px] text-slate-400">
              {allParticipants.length}{" "}
              {allParticipants.length === 1
                ? "person"
                : "people"}{" "}
              in the session
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsParticipantRailCollapsed(true)}
            className="flex size-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Minimize participant sidebar"
            title="Minimize sidebar"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2.5">
          {allParticipants.length > 0 ? (
            <div className={`grid ${participantColumns} auto-rows-max gap-2.5`}>
              {allParticipants.map(renderExpandedParticipant)}
            </div>
          ) : (
            <div className="flex h-full min-h-24 items-center justify-center text-xs text-slate-400">
              Waiting for participants…
            </div>
          )}
        </div>

        {renderSidebarControls()}
      </aside>
    );
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-[200] overflow-hidden font-sans">
      {!isConnected && (
        <div className="pointer-events-auto absolute inset-0 z-[240] flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="relative">
            <div className="absolute inset-0 animate-pulse rounded-full bg-emerald-500/20 blur-xl" />
            <Loader2 className="relative size-10 animate-spin text-emerald-500" />
          </div>
          <p className="mt-6 text-xs font-light uppercase tracking-widest text-slate-400">
            Establishing Secure Connection
          </p>
        </div>
      )}

      {renderParticipantRail()}
    </div>
  );
}


function ControlButton({
  active,
  onClick,
  icon,
  danger,
}: ControlButtonProps) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={`size-12 rounded-2xl transition-all duration-300 ${
        danger
          ? "border border-rose-500/20 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
          : "text-slate-300 hover:bg-white/10"
      } ${
        active && !danger
          ? "bg-white/5 text-white"
          : ""
      }`}
    >
      {icon}
    </Button>
  );
}

function ActionButton({
  label,
  icon,
  active,
  disabled,
  onClick,
}: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-1.5 transition-all duration-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? "text-emerald-400"
          : "text-slate-400"
      }`}
    >
      {icon}

      <span className="text-[10px] font-medium uppercase tracking-wider">
        {label}
      </span>
    </button>
  );
}