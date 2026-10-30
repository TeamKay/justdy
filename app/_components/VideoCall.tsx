"use client";

import DailyIframe from "@daily-co/daily-js";
import { useRouter } from "next/navigation";
import {
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
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
  MessageSquare,
  Move,
  LayoutGrid,
  RotateCcw,
  LayoutDashboard,
  GalleryHorizontal,
  GalleryVertical,
  Grid2X2,
  Presentation,
  Volume2,
  ChevronRight,
  MoreHorizontal,
  FileText,
  AppWindow,
  Monitor,
  Presentation as PresentationIcon,
  Columns2,
  UserRound,
  Captions,
  Settings,
  Info,
  Grid3X3,
} from "lucide-react";

// --- Types ---

export type TutoringSignal = {
  type: string;
  data?: unknown;
};

type DailyCall = ReturnType<typeof DailyIframe.createCallObject>;

type DailyParticipant = ReturnType<DailyCall["participants"]>[string];

type DailyParticipantMap = Record<string, DailyParticipant>;

type VideoDisplayMode =
  "gallery" | "horizontal" | "vertical" | "speaker" | "free" | "whiteboard";

// Daily keeps a browser-level registry of call objects. The cleanup lock
// prevents React Strict Mode, Fast Refresh, or a rapid remount from creating
// a second DailyIframe before the previous call has completely finished
// destroying itself.
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

  role: "educator" | "student";

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
      connectionId: string | null;
    },
  ) => void;

  onParticipantChange?: (participant: {
    connectionId: string;
    joined: boolean;
  }) => void;

  onConnected?: () => void;

  onDisconnected?: () => void;

  /**
   * Keeps the whiteboard's right edge aligned with the participant rail.
   * The tutoring room passes this value through to the whiteboard so the
   * board expands when the video sidebar is collapsed.
   */
  onParticipantRailWidthChange?: (width: number) => void;

  onSignalReady?: (sendSignal: (type: string, data?: unknown) => void) => void;

  onEndSession?: () => Promise<void> | void;
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
  const videoRef = useRef<HTMLVideoElement>(null);

  const audioRef = useRef<HTMLAudioElement>(null);

  /*
   * Keep the media elements stable while Daily updates the
   * participant object. Recreating a MediaStream whenever the
   * participant object changes can introduce avoidable audio
   * interruptions and perceived latency.
   *
   * We therefore depend only on the actual persistent tracks.
   */
  const videoTrack = screen
    ? participant.tracks.screenVideo?.persistentTrack
    : participant.tracks.video?.persistentTrack;

  const audioTrack = screen
    ? participant.tracks.screenAudio?.persistentTrack
    : participant.tracks.audio?.persistentTrack;

  useEffect(() => {
    const element = videoRef.current;

    if (!element) {
      return;
    }

    if (!videoTrack) {
      element.srcObject = null;
      return;
    }

    const stream = new MediaStream([videoTrack]);

    element.srcObject = stream;
    element.autoplay = true;
    element.playsInline = true;

    const playPromise = element.play();

    if (playPromise) {
      playPromise.catch(() => {
        /* Browser playback may require prior user interaction. */
      });
    }

    return () => {
      if (element.srcObject === stream) {
        element.srcObject = null;
      }
    };
  }, [videoTrack]);

  useEffect(() => {
    const element = audioRef.current;

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
    const stream = new MediaStream([audioTrack]);

    element.srcObject = stream;
    element.autoplay = true;
    element.muted = false;

    const playPromise = element.play();

    if (playPromise) {
      playPromise.catch(() => {
        /* Browser playback may require prior user interaction. */
      });
    }

    return () => {
      if (element.srcObject === stream) {
        element.srcObject = null;
      }
    };
  }, [audioTrack, muted]);

  const hasVideo = Boolean(videoTrack);

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
              {(participant.user_name || "P").slice(0, 1).toUpperCase()}
            </div>

            <span className="max-w-[220px] truncate text-sm text-slate-300">
              {participant.user_name || "Participant"}
            </span>
          </div>
        </div>
      )}
    </>
  );
}

function ControlButton({
  label,
  icon,
  onClick,
  active = false,
  danger = false,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-w-[58px] flex-col items-center gap-1 text-[10px] font-medium text-white"
      aria-label={label}
      title={label}
    >
      <span
        className={`flex size-11 items-center justify-center rounded-xl border transition ${
          danger
            ? "border-rose-500/60 bg-rose-600 text-white hover:bg-rose-500"
            : active
              ? "border-violet-300/50 bg-violet-600 text-white"
              : "border-white/10 bg-white/10 text-white hover:bg-white/15"
        }`}
      >
        {icon}
      </span>
      <span className="max-w-[72px] truncate">{label}</span>
    </button>
  );
}

function VideoDisplayMenu({
  mode,
  onChange,
}: {
  mode: VideoDisplayMode;
  onChange: (mode: VideoDisplayMode) => void;
}) {
  const options: Array<{
    id: VideoDisplayMode;
    label: string;
    description: string;
    icon: ReactNode;
  }> = [
    {
      id: "gallery",
      label: "Gallery",
      description: "Everyone in rows and columns",
      icon: <Grid2X2 className="size-5" />,
    },
    {
      id: "speaker",
      label: "Speaker",
      description: "Active speaker fills the stage",
      icon: <Volume2 className="size-5" />,
    },
    {
      id: "horizontal",
      label: "Horizontal",
      description: "Scroll participants left to right",
      icon: <GalleryHorizontal className="size-5" />,
    },
    {
      id: "vertical",
      label: "Vertical",
      description: "Scroll participants top to bottom",
      icon: <GalleryVertical className="size-5" />,
    },
    {
      id: "free",
      label: "Free arrange",
      description: "Drag every video anywhere",
      icon: <Move className="size-5" />,
    },
    {
      id: "whiteboard",
      label: "Whiteboard",
      description: "Use the teaching canvas",
      icon: <Presentation className="size-5" />,
    },
  ];

  return (
    <div className="pointer-events-auto absolute bottom-[112px] left-1/2 z-[1200] w-[min(430px,calc(100vw-24px))] -translate-x-1/2 overflow-hidden rounded-[20px] border border-white/10 bg-[#1d1f22]/98 p-3 text-white shadow-[0_24px_80px_rgba(0,0,0,.65)] backdrop-blur-2xl">
      <div className="flex items-center justify-between px-2 pb-3">
        <div>
          <p className="text-sm font-semibold">Video display</p>
          <p className="mt-0.5 text-[10px] text-slate-500">
            Choose how participant videos fill your screen.
          </p>
        </div>
        <span className="rounded-lg bg-white/5 px-2 py-1 text-[9px] font-semibold text-slate-400">
          View
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={() => onChange(option.id)}
            className={`group rounded-xl border p-2.5 text-left transition ${mode === option.id ? "border-violet-500 bg-violet-600/15" : "border-white/8 bg-white/[.025] hover:border-white/20 hover:bg-white/[.06]"}`}
          >
            <div
              className={`relative flex h-[62px] items-center justify-center overflow-hidden rounded-lg border ${mode === option.id ? "border-violet-400/40 bg-violet-600/15" : "border-white/8 bg-black/25"}`}
            >
              {option.id === "gallery" ? (
                <div className="grid w-14 grid-cols-2 gap-1">
                  <span className="aspect-video rounded bg-white/20" />
                  <span className="aspect-video rounded bg-white/10" />
                  <span className="aspect-video rounded bg-white/10" />
                  <span className="aspect-video rounded bg-white/20" />
                </div>
              ) : null}
              {option.id === "speaker" ? (
                <div className="h-9 w-14 rounded bg-white/15 p-1">
                  <div className="h-full rounded bg-white/20" />
                </div>
              ) : null}
              {option.id === "horizontal" ? (
                <div className="flex w-20 gap-1 overflow-hidden">
                  <span className="h-8 w-11 shrink-0 rounded bg-white/20" />
                  <span className="h-8 w-11 shrink-0 rounded bg-white/10" />
                  <span className="h-8 w-11 shrink-0 rounded bg-white/15" />
                </div>
              ) : null}
              {option.id === "vertical" ? (
                <div className="flex h-12 flex-col gap-1 overflow-hidden">
                  <span className="h-7 w-16 rounded bg-white/20" />
                  <span className="h-7 w-16 rounded bg-white/10" />
                </div>
              ) : null}
              {option.id === "free" ? (
                <div className="relative h-10 w-16">
                  <span className="absolute left-0 top-0 h-5 w-7 rounded bg-white/20" />
                  <span className="absolute bottom-0 right-0 h-5 w-7 rounded bg-white/10" />
                </div>
              ) : null}
              {option.id === "whiteboard" ? (
                <div className="flex h-9 w-14 items-center justify-center rounded bg-white/10">
                  <Presentation className="size-4" />
                </div>
              ) : null}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${mode === option.id ? "bg-violet-600 text-white" : "bg-white/8 text-slate-300"}`}
              >
                {option.icon}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[11px] font-semibold">
                  {option.label}
                </span>
                <span className="mt-0.5 block truncate text-[9px] text-slate-500">
                  {option.description}
                </span>
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

type ShareLayout = "content" | "background" | "over-shoulder" | "side-by-side";

function ShareSourceModal({
  shareLayout,
  onLayoutChange,
  shareSound,
  onShareSoundChange,
  optimizeVideo,
  onOptimizeVideoChange,
  onStartShare,
  onWhiteboard,
  onClose,
}: {
  shareLayout: ShareLayout;
  onLayoutChange: (layout: ShareLayout) => void;
  shareSound: boolean;
  onShareSoundChange: (value: boolean) => void;
  optimizeVideo: boolean;
  onOptimizeVideoChange: (value: boolean) => void;
  onStartShare: () => void;
  onWhiteboard: () => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"screens" | "files" | "more">("screens");

  const layouts: Array<{
    id: ShareLayout;
    label: string;
    description: string;
    icon: ReactNode;
  }> = [
    {
      id: "content",
      label: "Content only",
      description: "Keep your video out of the shared content",
      icon: <Monitor className="size-5" />,
    },
    {
      id: "background",
      label: "As background",
      description: "Place your camera in front of the shared screen",
      icon: <UserRound className="size-5" />,
    },
    {
      id: "over-shoulder",
      label: "Over the shoulder",
      description: "Screen with your video beside it",
      icon: <Columns2 className="size-5" />,
    },
    {
      id: "side-by-side",
      label: "Side by side",
      description: "Shared content and participant video together",
      icon: <Grid3X3 className="size-5" />,
    },
  ];

  return (
    <div className="pointer-events-auto absolute inset-0 z-[1400] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <div className="flex max-h-[min(760px,calc(100vh-32px))] w-[min(1040px,calc(100vw-32px))] overflow-hidden rounded-[22px] border border-white/10 bg-[#242424] text-white shadow-[0_30px_100px_rgba(0,0,0,.65)]">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold">Share your screen</h2>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Choose what you want everyone in the classroom to see.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
              aria-label="Close share dialog"
            >
              ×
            </button>
          </div>

          <div className="flex gap-1 px-5 pt-4">
            {(
              [
                ["screens", "Screens"],
                ["files", "Files"],
                ["more", "More"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`rounded-lg px-5 py-2 text-xs font-semibold transition ${tab === id ? "bg-violet-600 text-white" : "text-slate-400 hover:bg-white/8 hover:text-white"}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {tab === "screens" ? (
              <div>
                <div className="mb-3 text-xs font-semibold text-slate-300">
                  Choose a screen or window
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={onStartShare}
                    className="group rounded-2xl border border-violet-500/60 bg-violet-500/10 p-4 text-left transition hover:bg-violet-500/15"
                  >
                    <div className="flex aspect-video items-center justify-center rounded-xl border border-white/10 bg-[#111315]">
                      <Monitor className="size-10 text-slate-300" />
                    </div>
                    <div className="mt-3 text-sm font-semibold">
                      Entire screen
                    </div>
                    <div className="mt-1 text-[10px] text-slate-500">
                      Share your desktop, including other applications.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={onStartShare}
                    className="group rounded-2xl border border-white/10 bg-white/[.03] p-4 text-left transition hover:border-white/20 hover:bg-white/[.06]"
                  >
                    <div className="grid aspect-video grid-cols-2 gap-2 rounded-xl border border-white/10 bg-[#111315] p-3">
                      <div className="rounded-lg bg-white/5" />
                      <div className="rounded-lg bg-white/10" />
                    </div>
                    <div className="mt-3 text-sm font-semibold">
                      Application window
                    </div>
                    <div className="mt-1 text-[10px] text-slate-500">
                      Use the browser picker to choose a specific app.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={onStartShare}
                    className="group rounded-2xl border border-white/10 bg-white/[.03] p-4 text-left transition hover:border-white/20 hover:bg-white/[.06]"
                  >
                    <div className="flex aspect-video items-center justify-center rounded-xl border border-white/10 bg-[#111315]">
                      <AppWindow className="size-10 text-slate-300" />
                    </div>
                    <div className="mt-3 text-sm font-semibold">
                      Browser tab
                    </div>
                    <div className="mt-1 text-[10px] text-slate-500">
                      Select a tab from your browser&apos;s share picker.
                    </div>
                  </button>
                </div>

                <div className="mt-5 flex flex-wrap gap-4 text-xs text-slate-300">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={shareSound}
                      onChange={(e) => onShareSoundChange(e.target.checked)}
                      className="size-4 accent-violet-500"
                    />{" "}
                    Share sound
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={optimizeVideo}
                      onChange={(e) => onOptimizeVideoChange(e.target.checked)}
                      className="size-4 accent-violet-500"
                    />{" "}
                    Optimize for video sharing
                  </label>
                </div>
              </div>
            ) : null}

            {tab === "files" ? (
              <div className="flex min-h-[330px] items-center justify-center">
                <div className="max-w-sm text-center">
                  <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-white/8">
                    <FileText className="size-7 text-slate-300" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold">Present a file</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Choose a PDF, image, or document from your device. The
                    selected file can then be opened and presented through
                    screen sharing.
                  </p>
                  <label className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-violet-500">
                    <FileText className="size-4" /> Choose file
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg,.webp,.ppt,.pptx,.doc,.docx"
                      onChange={() => {
                        onClose();
                        toast.info(
                          "Open the selected file and use Share screen to present it.",
                        );
                      }}
                    />
                  </label>
                </div>
              </div>
            ) : null}

            {tab === "more" ? (
              <div className="grid min-h-[330px] grid-cols-2 gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={onWhiteboard}
                  className="rounded-2xl border border-white/10 bg-white/[.03] p-4 text-left hover:bg-white/[.07]"
                >
                  <PresentationIcon className="size-6 text-slate-300" />
                  <div className="mt-3 text-xs font-semibold">Whiteboard</div>
                  <div className="mt-1 text-[10px] text-slate-500">
                    Open the teaching board.
                  </div>
                </button>
                <div className="rounded-2xl border border-white/10 bg-white/[.03] p-4">
                  <Captions className="size-6 text-slate-300" />
                  <div className="mt-3 text-xs font-semibold">Captions</div>
                  <div className="mt-1 text-[10px] text-slate-500">
                    Ready for future live captions.
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[.03] p-4">
                  <Settings className="size-6 text-slate-300" />
                  <div className="mt-3 text-xs font-semibold">
                    Share settings
                  </div>
                  <div className="mt-1 text-[10px] text-slate-500">
                    Configure presentation behavior.
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <aside className="hidden w-[300px] shrink-0 border-l border-white/10 bg-[#1d1f22] p-5 lg:block">
          <div className="text-xs font-semibold text-slate-300">
            Presenter layout
          </div>
          <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black">
            <div className="aspect-video bg-gradient-to-br from-slate-900 via-black to-slate-800 p-3">
              <div className="h-full rounded-lg border border-white/10 bg-black/60 p-2">
                <div
                  className={`h-full rounded-md bg-slate-800/80 ${shareLayout === "background" ? "p-2" : "p-3"}`}
                >
                  <div className="flex h-full items-center justify-center text-[9px] text-slate-500">
                    Shared content preview
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {layouts.map((layout) => (
              <button
                key={layout.id}
                type="button"
                onClick={() => onLayoutChange(layout.id)}
                className={`min-h-[82px] rounded-xl border p-2 text-left transition ${shareLayout === layout.id ? "border-violet-500 bg-violet-500/10" : "border-white/10 bg-white/[.02] hover:bg-white/[.06]"}`}
              >
                <div
                  className={`flex size-8 items-center justify-center rounded-lg ${shareLayout === layout.id ? "bg-violet-600" : "bg-white/8"}`}
                >
                  {layout.icon}
                </div>
                <div className="mt-2 text-[10px] font-semibold">
                  {layout.label}
                </div>
              </button>
            ))}
          </div>
          <div className="mt-6 flex items-start gap-2 text-[10px] leading-4 text-slate-500">
            <Info className="mt-0.5 size-3.5 shrink-0" /> Your browser will show
            its secure screen-selection dialog after you choose a screen or
            window.
          </div>
        </aside>
      </div>
    </div>
  );
}

function MoreToolsMenu({
  role,
  onRecording,
  onWhiteboard,
  onClose,
}: {
  role: "educator" | "student";
  onRecording: () => void;
  onWhiteboard: () => void;
  onClose: () => void;
}) {
  return (
    <div className="pointer-events-auto absolute bottom-[112px] left-1/2 z-[1200] w-[min(310px,calc(100vw-28px))] -translate-x-1/2 rounded-2xl border border-white/10 bg-[#17191d]/98 p-3 text-white shadow-[0_22px_70px_rgba(0,0,0,.6)] backdrop-blur-2xl">
      <div className="grid grid-cols-3 gap-2">
        {role === "educator" ? (
          <button
            type="button"
            onClick={() => {
              onRecording();
              onClose();
            }}
            className="flex min-h-[72px] flex-col items-center justify-center rounded-xl bg-white/[.04] text-[10px] hover:bg-white/[.09]"
          >
            <CircleDot className="size-5" />
            <span className="mt-2">Record</span>
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => {
            onWhiteboard();
            onClose();
          }}
          className="flex min-h-[72px] flex-col items-center justify-center rounded-xl bg-white/[.04] text-[10px] hover:bg-white/[.09]"
        >
          <PresentationIcon className="size-5" />
          <span className="mt-2">Whiteboard</span>
        </button>
        <div className="flex min-h-[72px] flex-col items-center justify-center rounded-xl bg-white/[.04] text-[10px] text-slate-400">
          <Captions className="size-5" />
          <span className="mt-2">Captions</span>
        </div>
        <div className="flex min-h-[72px] flex-col items-center justify-center rounded-xl bg-white/[.04] text-[10px] text-slate-400">
          <Info className="size-5" />
          <span className="mt-2">Meeting info</span>
        </div>
        <div className="flex min-h-[72px] flex-col items-center justify-center rounded-xl bg-white/[.04] text-[10px] text-slate-400">
          <Settings className="size-5" />
          <span className="mt-2">Settings</span>
        </div>
        <div className="flex min-h-[72px] flex-col items-center justify-center rounded-xl bg-white/[.04] text-[10px] text-slate-400">
          <MoreHorizontal className="size-5" />
          <span className="mt-2">More</span>
        </div>
      </div>
    </div>
  );
}

function VideoDisplayStage({
  participants,
  screenShareParticipant,
  mode,
  activeSpeakerId,
  shareLayout,
  positions,
  onPositionChange,
  onReset,
}: {
  participants: DailyParticipant[];
  screenShareParticipant: DailyParticipant | null;
  mode: Exclude<VideoDisplayMode, "whiteboard">;
  activeSpeakerId: string | null;
  shareLayout: ShareLayout;
  positions: Record<string, { x: number; y: number }>;
  onPositionChange: (id: string, x: number, y: number) => void;
  onReset: () => void;
}) {
  if (mode === "free") {
    return (
      <DraggableVideoStage
        participants={participants}
        positions={positions}
        onPositionChange={onPositionChange}
        onReset={onReset}
      />
    );
  }

  const participantVideos = participants.filter(
    (participant) =>
      participant.session_id !== screenShareParticipant?.session_id,
  );

  const speaker =
    participantVideos.find(
      (participant) => participant.session_id === activeSpeakerId,
    ) ??
    participantVideos.find((participant) => !participant.local) ??
    participantVideos[0] ??
    null;

  const renderTile = (participant: DailyParticipant, compact = false) => (
    <div
      key={participant.session_id}
      className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-[#111418] shadow-[0_18px_55px_rgba(0,0,0,0.28)] ${compact ? "h-full w-full" : "h-full w-full"}`}
    >
      <ParticipantVideo
        participant={participant}
        muted={Boolean(participant.local)}
        className="object-cover"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent px-3 pb-2.5 pt-10">
        <div className="flex items-center gap-2 text-[10px] font-semibold text-white">
          <span
            className={`size-1.5 rounded-full ${participant.local ? "bg-emerald-400" : "bg-white/80"}`}
          />
          <span className="min-w-0 truncate">
            {participant.local ? "You" : participant.user_name || "Participant"}
          </span>
        </div>
      </div>
    </div>
  );

  const renderScreenShare = () => {
    if (!screenShareParticipant) return null;
    return (
      <div className="pointer-events-auto absolute inset-0 z-[905] bg-[#080a0d] p-2 sm:p-3">
        <div className="relative h-full w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
          <ParticipantVideo
            participant={screenShareParticipant}
            screen
            muted={Boolean(screenShareParticipant.local)}
            className="object-contain"
          />
          <div className="pointer-events-none absolute left-4 top-4 rounded-xl border border-white/10 bg-black/55 px-3 py-2 text-[10px] font-medium text-white backdrop-blur-md">
            <span className="mr-1.5 inline-block size-1.5 rounded-full bg-emerald-400" />
            {screenShareParticipant.local
              ? "You are sharing your screen"
              : `${screenShareParticipant.user_name || "Participant"} is sharing`}
          </div>
        </div>
      </div>
    );
  };

  if (screenShareParticipant) {
    const nonSharerVideos = participantVideos.filter(
      (participant) =>
        participant.session_id !== screenShareParticipant.session_id,
    );
    const localParticipant =
      participants.find((participant) => participant.local) ?? null;

    if (shareLayout === "background") {
      return (
        <div className="pointer-events-auto absolute inset-0 z-[920] overflow-hidden bg-black">
          <div className="absolute inset-0">{renderScreenShare()}</div>
          {localParticipant ? (
            <div className="absolute bottom-24 right-5 z-[960] h-[min(24vh,190px)] w-[min(26vw,300px)] overflow-hidden rounded-2xl border-2 border-white/20 bg-black shadow-2xl">
              {renderTile(localParticipant)}
            </div>
          ) : null}
        </div>
      );
    }

    if (shareLayout === "over-shoulder") {
      return (
        <div className="pointer-events-auto absolute inset-0 z-[920] flex gap-2 overflow-hidden bg-[#090b0e] p-2 sm:p-3">
          <div className="relative min-w-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-black">
            {renderScreenShare()}
          </div>
          {localParticipant ? (
            <div className="relative hidden w-[min(30vw,360px)] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-[#111418] md:block">
              {renderTile(localParticipant)}
            </div>
          ) : null}
        </div>
      );
    }

    if (shareLayout === "side-by-side") {
      return (
        <div className="pointer-events-auto absolute inset-0 z-[920] flex gap-2 overflow-hidden bg-[#090b0e] p-2 sm:p-3">
          <div className="relative min-w-0 flex-[2] overflow-hidden rounded-2xl border border-white/10 bg-black">
            {renderScreenShare()}
          </div>
          <div className="flex w-[min(34vw,390px)] shrink-0 flex-col gap-2 overflow-y-auto rounded-2xl border border-white/10 bg-[#111418]/80 p-2">
            {(nonSharerVideos.length
              ? nonSharerVideos
              : localParticipant
                ? [localParticipant]
                : []
            ).map((participant) => (
              <div
                key={participant.session_id}
                className="h-[min(28vh,220px)] min-h-[150px] shrink-0"
              >
                {renderTile(participant)}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="pointer-events-auto absolute inset-0 z-[920] overflow-hidden">
        {renderScreenShare()}
        {participantVideos.length > 0 ? (
          <div className="pointer-events-auto absolute bottom-24 left-1/2 z-[940] flex max-w-[calc(100vw-32px)] -translate-x-1/2 gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-[#111418]/90 p-2 shadow-2xl backdrop-blur-xl">
            {participantVideos.map((participant) => (
              <div
                key={participant.session_id}
                className="h-[86px] w-[132px] shrink-0"
              >
                {renderTile(participant, true)}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  if (mode === "speaker") {
    return (
      <div className="pointer-events-auto absolute inset-0 z-[920] bg-[#090b0e] p-2 sm:p-3">
        {speaker ? (
          <div className="relative h-full w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
            {renderTile(speaker)}
            <div className="pointer-events-none absolute left-4 top-4 rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-[10px] font-semibold text-white backdrop-blur-md">
              <Volume2 className="mr-1.5 inline-block size-3.5" /> Active
              speaker
            </div>
          </div>
        ) : (
          <EmptyVideoState />
        )}
      </div>
    );
  }

  if (mode === "horizontal") {
    return (
      <div className="pointer-events-auto absolute inset-0 z-[920] overflow-hidden bg-[#090b0e] px-2 py-2 sm:px-3">
        <div className="flex h-full w-full items-center gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
          {participantVideos.map((participant) => (
            <div
              key={participant.session_id}
              className="h-[min(62vh,430px)] w-[min(72vw,620px)] shrink-0 snap-center"
            >
              {renderTile(participant)}
            </div>
          ))}
          {participantVideos.length === 0 ? <EmptyVideoState /> : null}
        </div>
      </div>
    );
  }

  if (mode === "vertical") {
    return (
      <div className="pointer-events-auto absolute inset-0 z-[920] overflow-hidden bg-[#090b0e] px-2 py-2 sm:px-3">
        <div className="mx-auto flex h-full w-[min(92vw,620px)] flex-col gap-3 overflow-y-auto py-1">
          {participantVideos.map((participant) => (
            <div
              key={participant.session_id}
              className="h-[min(34vh,300px)] min-h-[190px] shrink-0"
            >
              {renderTile(participant)}
            </div>
          ))}
          {participantVideos.length === 0 ? <EmptyVideoState /> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-auto absolute inset-0 z-[920] overflow-hidden bg-[#090b0e] p-2 sm:p-3">
      <div
        className={`grid h-full w-full gap-3 ${participantVideos.length <= 1 ? "grid-cols-1" : participantVideos.length <= 4 ? "grid-cols-2" : participantVideos.length <= 9 ? "grid-cols-3" : "grid-cols-4"} auto-rows-fr`}
      >
        {participantVideos.map((participant) => renderTile(participant))}
        {participantVideos.length === 0 ? <EmptyVideoState /> : null}
      </div>
    </div>
  );
}

function EmptyVideoState() {
  return (
    <div className="flex h-full min-h-[180px] w-full items-center justify-center rounded-2xl border border-white/10 bg-[#111418] text-center text-xs text-slate-500">
      Waiting for participants to join…
    </div>
  );
}

function DraggableVideoStage({
  participants,
  positions,
  onPositionChange,
  onReset,
}: {
  participants: DailyParticipant[];
  positions: Record<string, { x: number; y: number }>;
  onPositionChange: (id: string, x: number, y: number) => void;
  onReset: () => void;
}) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const handlePointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
    participant: DailyParticipant,
  ) => {
    if (event.button !== 0) return;
    const stage = stageRef.current;
    if (!stage) return;

    const position = positions[participant.session_id] ?? { x: 50, y: 50 };
    dragRef.current = {
      id: participant.session_id,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const stage = stageRef.current;
    if (!drag || !stage) return;

    const rect = stage.getBoundingClientRect();
    const deltaX = ((event.clientX - drag.startX) / rect.width) * 100;
    const deltaY = ((event.clientY - drag.startY) / rect.height) * 100;

    // Keep the tiles comfortably inside the classroom while still allowing
    // placement along every edge, corner, and the center of the stage.
    const nextX = Math.max(5, Math.min(95, drag.originX + deltaX));
    const nextY = Math.max(9, Math.min(88, drag.originY + deltaY));
    onPositionChange(drag.id, nextX, nextY);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div
      ref={stageRef}
      className="pointer-events-auto absolute inset-0 z-[920] overflow-hidden"
    >
      <div className="pointer-events-none absolute left-4 top-20 rounded-xl border border-white/10 bg-black/45 px-3 py-2 text-[10px] font-medium text-white/75 backdrop-blur-md">
        <span className="mr-1.5 inline-flex size-1.5 rounded-full bg-violet-400" />
        Drag videos anywhere to arrange your classroom
      </div>

      {participants.map((participant, index) => {
        const position = positions[participant.session_id] ?? {
          x: 18 + (index % 3) * 32,
          y: 24 + Math.floor(index / 3) * 27,
        };
        const isSharing = participant.tracks.screenVideo?.state === "playable";

        return (
          <div
            key={participant.session_id}
            className="absolute w-[min(30vw,360px)] min-w-[220px] touch-none select-none"
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
              transform: "translate(-50%, -50%)",
              zIndex: participant.local ? 940 : 930 + index,
            }}
            onPointerDown={(event) => handlePointerDown(event, participant)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <div className="overflow-hidden rounded-2xl border border-white/15 bg-[#111418]/90 p-1.5 shadow-[0_22px_70px_rgba(0,0,0,0.5)] backdrop-blur-xl">
              <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
                <ParticipantVideo
                  participant={participant}
                  screen={isSharing}
                  muted={Boolean(participant.local)}
                />

                <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/75 to-transparent px-2.5 pb-8 pt-2.5">
                  <div className="flex items-center gap-2 text-[10px] font-semibold text-white">
                    <span
                      className={`size-1.5 rounded-full ${participant.local ? "bg-emerald-400" : "bg-white/80"}`}
                    />
                    {participant.local
                      ? "You"
                      : participant.user_name || "Participant"}
                  </div>
                  <span className="rounded-lg border border-white/10 bg-black/45 p-1.5 text-white/80">
                    <Move className="size-3" />
                  </span>
                </div>

                {isSharing ? (
                  <div className="pointer-events-none absolute bottom-2 left-2 rounded-lg bg-emerald-500/90 px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-white">
                    Sharing screen
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={onReset}
        className="pointer-events-auto absolute bottom-24 left-4 flex items-center gap-2 rounded-xl border border-white/10 bg-[#111418]/85 px-3 py-2 text-[10px] font-semibold text-white shadow-xl backdrop-blur-xl transition hover:bg-[#1c2128]"
        title="Reset video positions"
      >
        <RotateCcw className="size-3.5" />
        Reset positions
      </button>
    </div>
  );
}

function SessionHeader({
  role,
  isConnected,
}: {
  role: "educator" | "student";
  isConnected: boolean;
}) {
  return (
    <header className="pointer-events-auto absolute left-4 right-4 top-4 z-[990] flex items-center justify-between gap-3 sm:left-6 sm:right-6">
      <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-[#111418]/88 px-3 py-2.5 text-white shadow-xl backdrop-blur-xl">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-black text-slate-950">
          j
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-bold">justdy</p>
          <div className="mt-0.5 flex items-center gap-1.5 text-[9px] text-slate-400">
            <span
              className={`size-1.5 rounded-full ${isConnected ? "bg-emerald-400" : "bg-amber-400"}`}
            />
            {isConnected ? "Live tutoring" : "Connecting…"}
            <span className="text-slate-600">•</span>
            <span className="capitalize">{role}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center rounded-2xl border border-white/10 bg-[#111418]/88 px-3 py-2.5 text-white shadow-xl backdrop-blur-xl">
        <span className="text-[10px] font-semibold text-slate-400">
          Video classroom
        </span>
      </div>
    </header>
  );
}

function BottomDock({
  role,
  isAudioEnabled,
  isVideoEnabled,
  isScreenSharing,
  isRecording,
  showChat,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleRecording,
  onToggleChat,
  onToggleDisplayMenu,
  onOpenWhiteboard,
  onOpenShare,
  onToggleMore,
  videoDisplayMode,
  showDisplayMenu,
  onExit,
  visible,
}: {
  role: "educator" | "student";
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  isRecording: boolean;
  showChat: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleRecording: () => void;
  onToggleChat: () => void;
  onToggleDisplayMenu: () => void;
  onOpenWhiteboard: () => void;
  onOpenShare: () => void;
  onToggleMore: () => void;
  videoDisplayMode: VideoDisplayMode;
  showDisplayMenu: boolean;
  onExit: () => void;
  visible: boolean;
}) {
  return (
    <footer
      className={`pointer-events-auto absolute inset-x-0 bottom-0 z-[1000] flex h-[104px] items-center justify-center px-3 pb-4 transition-all duration-300 ease-out ${visible ? "translate-y-0 opacity-100" : "translate-y-[88px] opacity-0"}`}
      aria-hidden={!visible}
    >
      <div className="flex w-[calc(100vw-16px)] max-w-[860px] items-center justify-start overflow-x-auto rounded-3xl border border-white/10 bg-[#17191d]/96 px-2 py-2 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:justify-center sm:gap-2 sm:px-3">
        <ControlButton
          label={isAudioEnabled ? "Mute" : "Unmute"}
          icon={isAudioEnabled ? <Mic size={18} /> : <MicOff size={18} />}
          onClick={onToggleAudio}
          active={!isAudioEnabled}
        />
        <ControlButton
          label={isVideoEnabled ? "Stop video" : "Start video"}
          icon={isVideoEnabled ? <Video size={18} /> : <VideoOff size={18} />}
          onClick={onToggleVideo}
          active={!isVideoEnabled}
        />
        {role === "educator" ? (
          <ControlButton
            label={isRecording ? "Stop recording" : "Record"}
            icon={
              isRecording ? (
                <StopCircle size={18} className="text-rose-400" />
              ) : (
                <CircleDot size={18} />
              )
            }
            onClick={onToggleRecording}
            active={isRecording}
          />
        ) : null}

        <ControlButton
          label={showChat ? "Close chat" : "Chat"}
          icon={<MessageSquare size={18} />}
          onClick={onToggleChat}
          active={showChat}
        />

        <ControlButton
          label={isScreenSharing ? "Stop share" : "Share"}
          icon={<MonitorUp size={18} />}
          onClick={isScreenSharing ? onToggleScreenShare : onOpenShare}
          active={isScreenSharing}
        />

        <ControlButton
          label="Whiteboard"
          icon={<Presentation size={18} />}
          onClick={onOpenWhiteboard}
          active={videoDisplayMode === "whiteboard"}
        />

        <ControlButton
          label="Display"
          icon={<LayoutDashboard size={18} />}
          onClick={onToggleDisplayMenu}
          active={showDisplayMenu}
        />

        <ControlButton
          label="More"
          icon={<MoreHorizontal size={18} />}
          onClick={onToggleMore}
          active={false}
        />

        <div className="mx-0.5 hidden h-9 w-px bg-white/10 sm:block" />

        <ControlButton
          label={role === "educator" ? "End" : "Leave"}
          icon={<PhoneOff size={18} />}
          onClick={onExit}
          danger
        />
      </div>
    </footer>
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
  const [isConnected, setIsConnected] = useState(false);

  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const [isRecording, setIsRecording] = useState(false);

  // Recording saves use the browser's native file picker directly.
  // There is intentionally no Justdy save-settings popup.
  const recordingSettings: RecordingSettings = {
    name: "justdy-recording",
    format: "webm",
  };
  const recordingSaveHandleRef = useRef<RecordingFileHandle | null>(null);
  const screenRecorderRef = useRef<MediaRecorder | null>(null);
  const mp4RecorderRef = useRef<MediaRecorder | null>(null);
  const recordingResultsRef = useRef<{ webm?: Blob; mp4?: Blob }>({});
  const recordingExpectedResultsRef = useRef(0);
  const recordingCompletedResultsRef = useRef(0);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordingSourceStreamRef = useRef<MediaStream | null>(null);
  // Recording and Daily screen sharing use completely separate browser
  // display-capture streams. Starting Record never starts Daily screen
  // sharing, and starting Share Screen never starts local recording.
  const recordingDisplayStreamRef = useRef<MediaStream | null>(null);
  const screenShareCaptureStreamRef = useRef<MediaStream | null>(null);
  const dailyScreenShareStreamRef = useRef<MediaStream | null>(null);
  const recordingMicStreamRef = useRef<MediaStream | null>(null);
  const recordingAudioContextRef = useRef<AudioContext | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingMimeTypeRef = useRef<string>("");
  const recordingScreenEndedRef = useRef(false);

  const [videoDisplayMode, setVideoDisplayMode] =
    useState<VideoDisplayMode>("gallery");
  const [showDisplayMenu, setShowDisplayMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [shareLayout, setShareLayout] = useState<ShareLayout>("content");
  const [shareSound, setShareSound] = useState(false);
  const [optimizeShareVideo, setOptimizeShareVideo] = useState(false);
  const [showBottomDock, setShowBottomDock] = useState(true);
  const dockHideTimerRef = useRef<number | null>(null);

  const revealBottomDock = useCallback(() => {
    setShowBottomDock(true);
    if (dockHideTimerRef.current) window.clearTimeout(dockHideTimerRef.current);
    dockHideTimerRef.current = window.setTimeout(
      () => setShowBottomDock(false),
      4000,
    );
  }, []);

  useEffect(() => {
    dockHideTimerRef.current = window.setTimeout(
      () => setShowBottomDock(false),
      4000,
    );
    return () => {
      if (dockHideTimerRef.current)
        window.clearTimeout(dockHideTimerRef.current);
    };
  }, []);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const [videoPositions, setVideoPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});

  const defaultVideoPosition = (index: number) => ({
    x: 18 + (index % 3) * 32,
    y: 24 + Math.floor(index / 3) * 27,
  });

  const updateVideoPosition = (id: string, x: number, y: number) => {
    setVideoPositions((current) => ({ ...current, [id]: { x, y } }));
  };

  // The whiteboard is rendered underneath this overlay by
  // TutoringSessionRoom. Keep its left inset synchronized with the
  // actual video rail width so collapsing the rail immediately gives the
  // board the newly available writing area.
  useEffect(() => {
    // There is no permanent participant sidebar anymore. Give the whiteboard
    // the full classroom width from the moment the video room mounts.
    onParticipantRailWidthChange?.(0);
  }, [onParticipantRailWidthChange]);

  const [showChat, setShowChat] = useState(false);
  const [hasUnreadChat, setHasUnreadChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<
    Array<{ id: string; text: string; local: boolean; name: string }>
  >([]);

  const [participants, setParticipants] = useState<DailyParticipantMap>({});

  const callRef = useRef<DailyCall | null>(null);

  // Component-local reference retained for the existing lifecycle, while the
  // module-level lock above also protects against duplicate component mounts.
  const dailyCleanupPromiseRef = useRef<Promise<void> | null>(null);

  const callbacksRef = useRef({
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

  const participantIdsNotifiedRef = useRef<Set<string>>(new Set());

  const router = useRouter();

  /*
   * If the API caller eventually passes roomUrl,
   * it wins.
   *
   * Otherwise use the public Daily domain + room name.
   */
  const resolvedRoomUrl = useMemo(() => {
    if (roomUrl) {
      return roomUrl;
    }

    const domainUrl = process.env.NEXT_PUBLIC_DAILY_DOMAIN_URL;

    if (!domainUrl) {
      return "";
    }

    return `${domainUrl.replace(/\/$/, "")}/${sessionId}`;
  }, [roomUrl, sessionId]);

  /**
   * Preserves the signaling interface used by
   * the rest of the tutoring application.
   *
   * Vonage signal() → Daily sendAppMessage().
   */
  const sendSignal = (type: string, data?: unknown) => {
    const call = callRef.current;

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
      console.error("Daily app-message error:", error);
    }
  };

  /*
   * Create and join the Daily call.
   */
  useEffect(() => {
    if (!resolvedRoomUrl || !sessionId || !token) {
      if (!resolvedRoomUrl) {
        toast.error(
          "Daily room URL is not configured. Set NEXT_PUBLIC_DAILY_DOMAIN_URL.",
        );
      }

      return;
    }

    let cancelled = false;

    const createCall = async () => {
      // React Strict Mode, Fast Refresh, and rapid remounts can run this
      // effect again before Daily has finished destroying the previous call.
      // Always wait on the global cleanup lock first.
      const previousCleanup =
        activeDailyCleanupPromise ?? dailyCleanupPromiseRef.current;

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

      const call = DailyIframe.createCallObject({
        subscribeToTracksAutomatically: true,
        startVideoOff: false,
        startAudioOff: false,
      });

      callRef.current = call;

      /*
       * Refresh the React representation of
       * Daily's participant store.
       */
      const refreshParticipants = () => {
        if (cancelled) {
          return;
        }

        const current = call.participants();

        setParticipants({
          ...current,
        });

        const localParticipant = current.local;

        if (localParticipant) {
          setIsVideoEnabled(
            localParticipant.tracks.video?.state !== "off" &&
              localParticipant.video !== false,
          );

          setIsAudioEnabled(
            localParticipant.tracks.audio?.state !== "off" &&
              localParticipant.audio !== false,
          );

          setIsScreenSharing(
            localParticipant.tracks.screenVideo?.state === "playable",
          );
        }
      };

      const notifyParticipantJoined = (participant: DailyParticipant) => {
        if (participant.local) {
          return;
        }

        const id = participant.session_id;

        if (!id || participantIdsNotifiedRef.current.has(id)) {
          return;
        }

        participantIdsNotifiedRef.current.add(id);

        callbacksRef.current.onParticipantChange?.({
          connectionId: id,
          joined: true,
        });
      };

      const notifyParticipantLeft = (participant: DailyParticipant) => {
        const id = participant.session_id;

        if (!id) {
          return;
        }

        participantIdsNotifiedRef.current.delete(id);

        callbacksRef.current.onParticipantChange?.({
          connectionId: id,
          joined: false,
        });
      };

      const handleJoinedMeeting = () => {
        if (cancelled) {
          return;
        }

        setIsConnected(true);

        refreshParticipants();

        callbacksRef.current.onConnected?.();

        callbacksRef.current.onSignalReady?.(sendSignal);
      };

      const handleLeftMeeting = () => {
        setIsConnected(false);

        setParticipants({});

        setIsRecording(false);

        setIsScreenSharing(false);

        callbacksRef.current.onDisconnected?.();
      };

      const handleParticipantJoined = (event: unknown) => {
        const participant = (
          event as {
            participant?: DailyParticipant;
          }
        ).participant;

        if (participant) {
          notifyParticipantJoined(participant);
        }

        refreshParticipants();
      };

      const handleParticipantUpdated = () => {
        refreshParticipants();
      };

      const handleParticipantLeft = (event: unknown) => {
        const participant = (
          event as {
            participant?: DailyParticipant;
          }
        ).participant;

        if (participant) {
          notifyParticipantLeft(participant);
        }

        refreshParticipants();
      };

      /*
       * Daily app-message replaces the old Vonage
       * signal event.
       */
      const handleAppMessage = (event: unknown) => {
        const message = event as {
          data?: unknown;

          from?:
            | string
            | {
                session_id?: string;
              }
            | null;
        };

        if (!message.data || typeof message.data !== "object") {
          return;
        }

        const payload = message.data as {
          type?: unknown;
          data?: unknown;
        };

        if (typeof payload.type !== "string") {
          return;
        }

        const from =
          typeof message.from === "string"
            ? message.from
            : (message.from?.session_id ?? null);

        if (payload.type === "chat:message") {
          const chatData = payload.data as
            { text?: unknown } | null | undefined;
          const textValue =
            typeof chatData?.text === "string" ? chatData.text.trim() : "";

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

      const handleActiveSpeakerChange = (event: unknown) => {
        const payload = event as {
          activeSpeaker?: { peerId?: string; session_id?: string } | null;
        } | null;
        const speakerId =
          payload?.activeSpeaker?.peerId ??
          payload?.activeSpeaker?.session_id ??
          null;
        setActiveSpeakerId(speakerId);
      };

      const handleScreenShareStarted = () => {
        setIsScreenSharing(true);

        refreshParticipants();
      };

      const handleScreenShareStopped = () => {
        setIsScreenSharing(false);

        refreshParticipants();
      };

      const handleError = (event: unknown) => {
        console.error("Daily call error:", event);

        toast.error("Video connection error");
      };

      call.on("joined-meeting", handleJoinedMeeting);

      call.on("left-meeting", handleLeftMeeting);

      call.on("participant-joined", handleParticipantJoined);

      call.on("participant-updated", handleParticipantUpdated);

      call.on("participant-left", handleParticipantLeft);

      call.on("app-message", handleAppMessage);

      call.on("active-speaker-change", handleActiveSpeakerChange);

      call.on("local-screen-share-started", handleScreenShareStarted);

      call.on("local-screen-share-stopped", handleScreenShareStopped);

      call.on("local-screen-share-canceled", handleScreenShareStopped);

      call.on("error", handleError);

      const join = async () => {
        try {
          await call.join({
            url: resolvedRoomUrl,
            token,
          });
        } catch (error) {
          console.error("Daily connection failed:", error);

          toast.error("Connection failed");

          setIsConnected(false);
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

      const activeCall = callRef.current;

      if (!activeCall) {
        participantIdsNotifiedRef.current.clear();
        return;
      }

      const cleanup = async () => {
        try {
          await activeCall.leave();
        } catch (error) {
          console.debug("Unable to leave Daily call during cleanup:", error);
        } finally {
          try {
            await activeCall.destroy();
          } catch (error) {
            console.debug("Unable to destroy Daily call:", error);
          }

          if (callRef.current === activeCall) {
            callRef.current = null;
          }

          participantIdsNotifiedRef.current.clear();
        }
      };

      const cleanupPromise = cleanup();

      dailyCleanupPromiseRef.current = cleanupPromise;
      activeDailyCleanupPromise = cleanupPromise;

      void cleanupPromise.finally(() => {
        if (dailyCleanupPromiseRef.current === cleanupPromise) {
          dailyCleanupPromiseRef.current = null;
        }

        if (activeDailyCleanupPromise === cleanupPromise) {
          activeDailyCleanupPromise = null;
        }
      });
    };
  }, [resolvedRoomUrl, sessionId, token]);

  /*
   * Microphone.
   */
  const toggleAudio = useCallback(async () => {
    const call = callRef.current;

    if (!call) {
      return;
    }

    try {
      const next = !isAudioEnabled;

      await call.setLocalAudio(next);

      setIsAudioEnabled(next);
    } catch (error) {
      console.error("Unable to toggle microphone:", error);

      toast.error("Unable to change microphone state");
    }
  }, [isAudioEnabled]);

  /*
   * Camera.
   */
  const toggleVideo = useCallback(async () => {
    const call = callRef.current;

    if (!call) {
      return;
    }

    try {
      const next = !isVideoEnabled;

      await call.setLocalVideo(next);

      setIsVideoEnabled(next);
    } catch (error) {
      console.error("Unable to toggle camera:", error);

      toast.error("Unable to change camera state");
    }
  }, [isVideoEnabled]);

  /*
   * Screen sharing.
   *
   * Share Screen and Record are intentionally independent. Share Screen owns
   * its own browser display-capture stream and is the only action that ever
   * calls Daily's startScreenShare(). Record owns a separate capture stream
   * and never changes Daily's screen-share state.
   */
  const toggleScreenShare = useCallback(async () => {
    const call = callRef.current;

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
        toast.error("Screen sharing is not supported in this browser");
        return;
      }

      // IMPORTANT: this stream belongs only to Share Screen. It is never
      // reused by Record, so clicking Record cannot publish a Daily screen
      // share as a side effect.
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: shareSound,
      });

      const displayVideoTrack = displayStream
        .getVideoTracks()
        .find((track) => track.readyState === "live");

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
      console.error("Unable to toggle screen sharing:", error);

      dailyScreenShareStreamRef.current
        ?.getTracks()
        .forEach((track) => track.stop());
      dailyScreenShareStreamRef.current = null;

      screenShareCaptureStreamRef.current
        ?.getTracks()
        .forEach((track) => track.stop());
      screenShareCaptureStreamRef.current = null;

      if (error instanceof DOMException && error.name === "NotAllowedError") {
        toast.info("Screen sharing was cancelled");
      } else {
        toast.error("Screen sharing is not supported or was denied");
      }

      setIsScreenSharing(false);
    }
  }, [isScreenSharing, shareSound]);

  const getRecordingMimeType = (format: RecordingFormat) => {
    const candidates =
      format === "mp4"
        ? ["video/mp4;codecs=avc1.42E01E,mp4a.40.2", "video/mp4"]
        : [
            "video/webm;codecs=vp9,opus",
            "video/webm;codecs=vp8,opus",
            "video/webm",
          ];

    return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
  };

  const getRecordingFilename = (
    format: RecordingFormat = recordingSettings.format,
  ) => {
    const cleanName =
      recordingSettings.name
        .trim()
        .replace(/[^a-zA-Z0-9._-]+/g, "-")
        .replace(/^-+|-+$/g, "") || "justdy-recording";

    return `${cleanName}.${format}`;
  };

  const cleanupRecordingStreams = () => {
    recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
    recordingStreamRef.current = null;

    recordingSourceStreamRef.current
      ?.getTracks()
      .forEach((track) => track.stop());
    recordingSourceStreamRef.current = null;

    // The recording display capture is owned by the recording lifecycle and
    // is stopped explicitly when the recording finishes.

    recordingMicStreamRef.current?.getTracks().forEach((track) => track.stop());
    recordingMicStreamRef.current = null;

    recordingAudioContextRef.current?.close().catch(() => undefined);
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
    if (typeof window === "undefined" || !navigator.mediaDevices) {
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
      let displayStream = recordingDisplayStreamRef.current;

      let displayVideoTrack = displayStream
        ?.getVideoTracks()
        .find((track) => track.readyState === "live");

      /*
       * Record can be started directly. The Record button itself becomes the
       * browser's required user gesture for getDisplayMedia(). The resulting
       * display stream stays local to the recording and is never handed to
       * Daily.
       */
      if (!displayStream || !displayVideoTrack) {
        if (!navigator.mediaDevices.getDisplayMedia) {
          toast.error("Screen recording is not supported in this browser");
          return;
        }

        try {
          displayStream = await navigator.mediaDevices.getDisplayMedia({
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
            toast.error("Unable to capture the screen for recording");
          }
          return;
        }

        displayVideoTrack = displayStream
          .getVideoTracks()
          .find((track) => track.readyState === "live");

        if (!displayVideoTrack) {
          displayStream.getTracks().forEach((track) => track.stop());
          toast.error("No screen video track was provided");
          return;
        }

        recordingDisplayStreamRef.current = displayStream;

        displayVideoTrack.addEventListener(
          "ended",
          () => {
            recordingScreenEndedRef.current = true;

            if (screenRecorderRef.current || mp4RecorderRef.current) {
              void stopLocalRecording(false);
            }

            recordingDisplayStreamRef.current = null;
          },
          { once: true },
        );
      }

      if (!displayStream || !displayVideoTrack) {
        toast.error("Unable to access the screen capture for recording");
        return;
      }

      recordingScreenEndedRef.current = false;
      const localParticipant = call.participants().local;
      const dailyAudioTrack = localParticipant?.tracks.audio?.persistentTrack;

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
        ...(dailyAudioTrack?.readyState === "live" ? [dailyAudioTrack] : []),
        ...participantAudioTracks,
      ];

      const uniqueAudioTracks = audioTracks.filter(
        (track, index, tracks) =>
          tracks.findIndex((candidate) => candidate.id === track.id) === index,
      );

      if (uniqueAudioTracks.length) {
        const AudioContextConstructor =
          window.AudioContext ||
          (
            window as Window & {
              webkitAudioContext?: typeof AudioContext;
            }
          ).webkitAudioContext;

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
              console.warn("Unable to add audio source to recording:", error);
            }
          });

          const mixedAudioTrack = destination.stream.getAudioTracks()[0];

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
          const recordingDisplayStream = recordingDisplayStreamRef.current;
          if (recordingDisplayStream) {
            recordingDisplayStream.getTracks().forEach((track) => track.stop());
            recordingDisplayStreamRef.current = null;
          }

          setIsRecording(false);

          const results = { ...recordingResultsRef.current };
          recordingResultsRef.current = {};

          // Save immediately using the file handle selected when the tutor
          // clicked Stop. There is no second Justdy save-settings popup.
          const preferredFormat = recordingSettings.format;
          const preferredBlob =
            results[preferredFormat] ?? results.webm ?? results.mp4;
          const actualFormat = results[preferredFormat]
            ? preferredFormat
            : results.webm
              ? "webm"
              : "mp4";
          const saveHandle = recordingSaveHandleRef.current;
          recordingSaveHandleRef.current = null;

          if (preferredBlob) {
            void saveRecordingBlob(preferredBlob, actualFormat, saveHandle);
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

      if (error instanceof DOMException && error.name === "NotAllowedError") {
        toast.info("Screen capture was cancelled");
        return;
      }

      console.error("Unable to start whole-screen recording:", error);
      toast.error("Unable to start whole-screen recording");
    }
  };

  const stopLocalRecording = async (openSavePicker = false) => {
    const recorders = [screenRecorderRef.current, mp4RecorderRef.current];

    if (
      !recorders.some((recorder) => recorder && recorder.state !== "inactive")
    ) {
      return;
    }

    // The native file picker must only be opened from the actual Stop
    // button gesture. A display-track "ended" event is not a user gesture.
    recordingSaveHandleRef.current = null;

    const fileWindow = window as RecordingWindow;

    if (openSavePicker && fileWindow.showSaveFilePicker) {
      try {
        const saveFormat = getRecordingMimeType("webm") ? "webm" : "mp4";
        const saveMimeType = saveFormat === "mp4" ? "video/mp4" : "video/webm";

        const handle = await fileWindow.showSaveFilePicker({
          suggestedName: getRecordingFilename(saveFormat),
          excludeAcceptAllOption: true,
          types: [
            {
              description: saveFormat === "mp4" ? "MP4 Video" : "WebM Video",
              accept: {
                [saveMimeType]: [`.${saveFormat}`],
              },
            },
          ],
        });

        recordingSaveHandleRef.current = handle;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          toast.info(
            "Recording save cancelled; the recording will be downloaded",
          );
        } else {
          console.error("Unable to open recording save location:", error);
          toast.info(
            "Recording will be downloaded to the browser's download location",
          );
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

  const resetVideoPositions = () => {
    const next: Record<string, { x: number; y: number }> = {};
    allParticipants.forEach((participant, index) => {
      next[participant.session_id] = defaultVideoPosition(index);
    });
    setVideoPositions(next);
  };

  const screenShareParticipant = useMemo(
    () =>
      allParticipants.find(
        (participant) => participant.tracks.screenVideo?.state === "playable",
      ) ?? null,
    [allParticipants],
  );

  const featuredParticipant = useMemo(
    () =>
      screenShareParticipant ??
      allParticipants.find((participant) => !participant.local) ??
      allParticipants[0] ??
      null,
    [allParticipants, screenShareParticipant],
  );

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

  const renderChatPanel = () => {
    if (!showChat) return null;

    return (
      <div
        className="pointer-events-auto absolute bottom-[104px] z-[980] flex h-[min(460px,62vh)] w-[min(360px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl shadow-black/30"
        style={{
          right: 24,
        }}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <div className="text-sm font-bold">Session chat</div>
            <div className="text-[10px] text-slate-500">
              Messages are shared with everyone in the session.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowChat(false)}
            className="flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close chat"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-slate-50 p-3">
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
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs ${
                    message.local
                      ? "rounded-br-md bg-violet-600 text-white"
                      : "rounded-bl-md bg-white text-slate-700 shadow-sm ring-1 ring-slate-200"
                  }`}
                >
                  <div className="mb-0.5 text-[9px] font-bold opacity-60">
                    {message.name}
                  </div>
                  <div className="break-words leading-5">{message.text}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-white p-2.5">
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
              className="min-h-10 flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400 focus:bg-white"
            />
            <button
              type="button"
              onClick={sendChatMessage}
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white transition hover:bg-violet-500"
              aria-label="Send chat message"
              title="Send message"
            >
              <MessageSquare className="size-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

 const handleSessionExit = useCallback(async () => {
  if (role === "educator") {
    try {
      // Only leave and navigate after the server confirms the session ended.
      await onEndSession?.();

      try {
        await callRef.current?.leave();
      } catch (error) {
        console.debug("Unable to leave Daily call:", error);
      }

      router.push("/tutoring/session-complete?role=educator");
    } catch (error) {
      console.error("Failed to end tutoring session:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to end the tutoring session. Please try again.",
      );
    }

    return;
  }

  // A learner leaves the call without ending the tutor's session lifecycle.
  try {
    await callRef.current?.leave();
  } catch (error) {
    console.debug("Unable to leave Daily call:", error);
  } finally {
    router.push("/tutoring/session-complete?role=student");
  }
}, [onEndSession, role, router]);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[900] overflow-hidden bg-transparent font-sans"
      onPointerMove={(event) => {
        if (event.clientY >= window.innerHeight - 90) revealBottomDock();
      }}
      onPointerLeave={() => {
        // Keep the dock/menu on their own timers so moving between controls
        // does not make them disappear unexpectedly.
      }}
    >
      {!isConnected ? (
        <div className="pointer-events-auto absolute inset-0 z-[1100] flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md">
          <div className="relative">
            <div className="absolute inset-0 animate-pulse rounded-full bg-emerald-500/20 blur-2xl" />
            <Loader2 className="relative size-10 animate-spin text-emerald-400" />
          </div>
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
            Connecting to secure classroom
          </p>
        </div>
      ) : null}

      <SessionHeader role={role} isConnected={isConnected} />

      {showDisplayMenu ? (
        <VideoDisplayMenu
          mode={videoDisplayMode}
          onChange={(mode) => {
            setVideoDisplayMode(mode);
            setShowDisplayMenu(false);
          }}
        />
      ) : null}

      {videoDisplayMode !== "whiteboard" ? (
        <VideoDisplayStage
          participants={allParticipants}
          screenShareParticipant={screenShareParticipant}
          mode={videoDisplayMode}
          activeSpeakerId={activeSpeakerId}
          shareLayout={shareLayout}
          positions={videoPositions}
          onPositionChange={updateVideoPosition}
          onReset={resetVideoPositions}
        />
      ) : (
        <div className="pointer-events-none absolute inset-0 z-[910]">
          <div className="pointer-events-auto absolute bottom-[104px] left-1/2 -translate-x-1/2 rounded-full border border-slate-200 bg-white/95 px-4 py-2 text-[10px] font-semibold text-slate-600 shadow-xl backdrop-blur-xl">
            Whiteboard mode • choose Display → Gallery to return to video
          </div>
        </div>
      )}

      {showShareModal ? (
        <ShareSourceModal
          shareLayout={shareLayout}
          onLayoutChange={setShareLayout}
          shareSound={shareSound}
          onShareSoundChange={setShareSound}
          optimizeVideo={optimizeShareVideo}
          onOptimizeVideoChange={setOptimizeShareVideo}
          onStartShare={() => {
            setShowShareModal(false);
            void toggleScreenShare();
            revealBottomDock();
          }}
          onWhiteboard={() => {
            setShowShareModal(false);
            setVideoDisplayMode("whiteboard");
            revealBottomDock();
          }}
          onClose={() => setShowShareModal(false)}
        />
      ) : null}

      {showMoreMenu ? (
        <MoreToolsMenu
          role={role}
          onRecording={() => void toggleRecording()}
          onWhiteboard={() => setVideoDisplayMode("whiteboard")}
          onClose={() => setShowMoreMenu(false)}
        />
      ) : null}

      {renderChatPanel()}

      <BottomDock
        role={role}
        isAudioEnabled={isAudioEnabled}
        isVideoEnabled={isVideoEnabled}
        isScreenSharing={isScreenSharing}
        isRecording={isRecording}
        showChat={showChat}
        onToggleAudio={() => void toggleAudio()}
        onToggleVideo={() => void toggleVideo()}
        onToggleScreenShare={() => void toggleScreenShare()}
        onOpenShare={() => {
          setShowDisplayMenu(false);
          setShowMoreMenu(false);
          setShowShareModal(true);
          revealBottomDock();
        }}
        onToggleRecording={() => void toggleRecording()}
        onToggleChat={() => {
          if (!showChat) setHasUnreadChat(false);
          setShowChat((value) => !value);
        }}
        onToggleDisplayMenu={() => {
          setShowMoreMenu(false);
          setShowShareModal(false);
          setShowDisplayMenu((value) => !value);
          revealBottomDock();
        }}
        onToggleMore={() => {
          setShowDisplayMenu(false);
          setShowShareModal(false);
          setShowMoreMenu((value) => !value);
          revealBottomDock();
        }}
        onOpenWhiteboard={() => {
          setVideoDisplayMode((current) =>
            current === "whiteboard" ? "gallery" : "whiteboard",
          );
          revealBottomDock();
        }}
        videoDisplayMode={videoDisplayMode}
        showDisplayMenu={showDisplayMenu}
        onExit={handleSessionExit}
        visible={showBottomDock}
      />
    </div>
  );
}
