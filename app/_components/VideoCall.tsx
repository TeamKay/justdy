"use client";

import { useRouter } from "next/navigation";
import Script from "next/script";
import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Mic,
  MicOff,
  PhoneOff,
  Video,
  VideoOff,
  LayoutTemplate,
  MonitorUp,
  CircleDot,
  StopCircle,
} from "lucide-react";

// --- Types ---
interface VideoCallProps {
  sessionId: string;
  token: string;
  role: "educator" | "student";
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
  onClick: () => void;
}

export default function VideoCall({ sessionId, token, role }: VideoCallProps) {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLessonMode, setIsLessonMode] = useState(true);
  const [showControls, setShowControls] = useState(true);

  // Replace 'any' with specific Vonage types
  const sessionRef = useRef<OT.Session | null>(null);
  const publisherRef = useRef<OT.Publisher | null>(null);
  const screenPublisherRef = useRef<OT.Publisher | null>(null);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioEnabledRef = useRef(isAudioEnabled);
  const videoEnabledRef = useRef(isVideoEnabled);
  const router = useRouter();
  const appId = process.env.NEXT_PUBLIC_VONAGE_APPLICATION_ID;

  const endSessionRedirect = useCallback(() => {
    if (role === "educator") {
      router.push("/educator/appointments");
    } else {
      router.push("/student/appointments");
    }
  }, [router, role]);

  useEffect(() => {
    audioEnabledRef.current = isAudioEnabled;
    videoEnabledRef.current = isVideoEnabled;
  }, [isAudioEnabled, isVideoEnabled]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 4000);
  };

  const initializeSession = useCallback(() => {
    // window.OT is now recognized thanks to the 'declare global' above
    if (
      typeof window === "undefined" ||
      !window.OT ||
      !appId ||
      sessionRef.current
    )
      return;

    try {
      const OT = window.OT;
      sessionRef.current = OT.initSession(appId, sessionId);

      sessionRef.current.on("streamCreated", (event) => {
        // We cast the event to includes the stream property
        // Using the library's base event type + the stream requirement
        const streamEvent = event as OT.OTEvent & { stream: OT.Stream };

        if (sessionRef.current && streamEvent.stream) {
          sessionRef.current.subscribe(
            streamEvent.stream,
            "subscriber-container",
            {
              insertMode: "append",
              width: "100%",
              height: "100%",
              style: { buttonDisplayMode: "off" },
            },
          );
        }
      });

      sessionRef.current.on("sessionConnected", () => {
        setIsConnected(true);

        publisherRef.current = OT.initPublisher("publisher-container", {
          insertMode: "replace",
          width: "100%",
          height: "100%",
          publishAudio: audioEnabledRef.current,
          publishVideo: videoEnabledRef.current,
          style: { buttonDisplayMode: "off" },
        });

        if (publisherRef.current) {
          sessionRef.current?.publish(publisherRef.current);
        }
      });

      // 🔴 WHEN SESSION ENDS REMOTELY
      sessionRef.current.on("sessionDisconnected", () => {
        endSessionRedirect();
      });

      sessionRef.current.connect(token, (err) => {
        if (err) toast.error("Connection failed");
      });
    } catch (error) {
      console.error("SDK Error:", error);
    }
  }, [appId, sessionId, token, endSessionRedirect]);

  useEffect(() => {
    if (publisherRef.current) publisherRef.current.publishAudio(isAudioEnabled);
  }, [isAudioEnabled]);

  useEffect(() => {
    if (publisherRef.current) publisherRef.current.publishVideo(isVideoEnabled);
  }, [isVideoEnabled]);

  const toggleScreenShare = () => {
    if (typeof window === "undefined" || !window.OT) return;
    const OT = window.OT;

    if (!isScreenSharing) {
      screenPublisherRef.current = OT.initPublisher(
        "publisher-container",
        {
          videoSource: "screen",
          insertMode: "append",
          width: "100%",
          height: "100%",
        },
        (error) => {
          if (error) {
            toast.error("Screen sharing not supported or denied");
          } else if (sessionRef.current && screenPublisherRef.current) {
            sessionRef.current.publish(screenPublisherRef.current);
            setIsScreenSharing(true);
          }
        },
      );

      screenPublisherRef.current.on("streamDestroyed", () => {
        setIsScreenSharing(false);
      });
    } else {
      if (sessionRef.current && screenPublisherRef.current) {
        sessionRef.current.unpublish(screenPublisherRef.current);
        screenPublisherRef.current.destroy();
        setIsScreenSharing(false);
      }
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    toast.info(!isRecording ? "Recording started" : "Recording saved");
  };

  useEffect(() => {
    if (scriptLoaded && appId && sessionId && token) initializeSession();
    return () => {
      sessionRef.current?.disconnect();
    };
  }, [scriptLoaded, appId, sessionId, token, initializeSession]);

  return (
    <div
      ref={constraintsRef}
      className="fixed inset-0 bg-[#020617] text-slate-100 overflow-hidden font-sans"
      onMouseMove={handleMouseMove}
    >
      <Script
        src="https://unpkg.com/@vonage/client-sdk-video@2.28.2/dist/js/opentok.js"
        onLoad={() => setScriptLoaded(true)}
      />

      {/* Loading State */}
      {!isConnected && (
        <div className="absolute inset-0 z-100 flex flex-col items-center justify-center bg-slate-950">
          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-xl bg-emerald-500/20 animate-pulse" />
            <Loader2 className="size-10 text-emerald-500 animate-spin relative" />
          </div>
          <p className="mt-6 text-slate-400 font-light tracking-widest uppercase text-xs">
            Establishing Secure Connection
          </p>
        </div>
      )}

      {/* Video Canvas */}
      <div className="relative flex h-full w-full">
        {/* PUBLISHER (Self) - Takes 100% in Lesson, 50% in Grid */}
        <div
          className={`relative bg-slate-950 transition-all duration-700 ease-in-out ${
            isLessonMode ? "w-full" : "w-1/2 border-r border-white/10"
          }`}
        >
          <div id="publisher-container" className="absolute inset-0 z-10" />
          <div className="absolute inset-0 z-20 bg-linear-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />
        </div>

        {/* SUBSCRIBER (Remote) - Draggable PiP in Lesson, 50% in Grid */}
        <motion.div
          layout
          drag={isLessonMode}
          dragConstraints={constraintsRef}
          dragMomentum={false}
          className={`bg-slate-900 border-white/5 shadow-2xl overflow-hidden transition-all duration-500 ease-in-out ${
            isLessonMode
              ? "absolute top-8 right-8 z-40 w-80 aspect-video rounded-2xl border backdrop-blur-xl cursor-grab active:cursor-grabbing"
              : "w-1/2 relative"
          }`}
        >
          <div id="subscriber-container" className="absolute inset-0 z-10" />
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2 pointer-events-none">
            <div className="size-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-tighter opacity-70">
              Remote Participant
            </span>
          </div>
        </motion.div>
      </div>

      {/* Modern Control Bar */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ y: 100, x: "-50%", opacity: 0 }}
            animate={{ y: 0, x: "-50%", opacity: 1 }}
            exit={{ y: 100, x: "-50%", opacity: 0 }}
            className="absolute bottom-10 left-1/2 z-60 w-full max-w-2xl px-6"
          >
            <div className="bg-slate-900/80 backdrop-blur-3xl border border-white/10 p-4 rounded-3xl flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-2">
                <ControlButton
                  active={isAudioEnabled}
                  onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                  icon={
                    isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />
                  }
                  danger={!isAudioEnabled}
                />
                <ControlButton
                  active={isVideoEnabled}
                  onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                  icon={
                    isVideoEnabled ? (
                      <Video size={20} />
                    ) : (
                      <VideoOff size={20} />
                    )
                  }
                  danger={!isVideoEnabled}
                />
              </div>

              <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/5">
                <ActionButton
                  label="Share"
                  icon={<MonitorUp size={18} />}
                  active={isScreenSharing}
                  onClick={toggleScreenShare}
                />
                <ActionButton
                  label={isRecording ? "Stop" : "Record"}
                  icon={
                    isRecording ? (
                      <StopCircle size={18} className="text-red-500" />
                    ) : (
                      <CircleDot size={18} />
                    )
                  }
                  active={isRecording}
                  onClick={toggleRecording}
                />
                <div className="w-px h-4 bg-white/10 mx-1" />
                <ActionButton
                  label={isLessonMode ? "Grid" : "Lesson"}
                  icon={<LayoutTemplate size={18} />}
                  onClick={() => setIsLessonMode(!isLessonMode)}
                />
              </div>

              <Button
                variant="destructive"
                onClick={() => {
                  sessionRef.current?.disconnect();
                  endSessionRedirect();
                }}
                className="rounded-2xl h-12 w-14 bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-900/20 border-t border-white/20"
              >
                <PhoneOff size={20} />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ControlButton({ active, onClick, icon, danger }: ControlButtonProps) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={`rounded-2xl size-12 transition-all duration-300 ${
        danger
          ? "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20"
          : "text-slate-300 hover:bg-white/10"
      } ${active && !danger ? "bg-white/5 text-white" : ""}`}
    >
      {icon}
    </Button>
  );
}

function ActionButton({ label, icon, active, onClick }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 hover:bg-white/10 ${
        active ? "text-emerald-400" : "text-slate-400"
      }`}
    >
      {icon}
      <span className="text-[10px] font-medium uppercase tracking-wider">
        {label}
      </span>
    </button>
  );
}

// "use client";

// import { useRouter } from "next/navigation";
// import Script from "next/script";
// import { useEffect, useRef, useState, useCallback } from "react";
// import { toast } from "sonner";
// import { Button } from "./ui/button";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   Loader2,
//   Mic,
//   MicOff,
//   PhoneOff,
//   Video,
//   VideoOff,
//   LayoutTemplate,
//   MonitorUp,
//   CircleDot,
//   StopCircle,
// } from "lucide-react";

// // --- Types ---
// interface VideoCallProps {
//   sessionId: string;
//   token: string;
// }

// interface ControlButtonProps {
//   active: boolean;
//   onClick: () => void;
//   icon: React.ReactNode;
//   danger?: boolean;
// }

// interface ActionButtonProps {
//   label: string;
//   icon: React.ReactNode;
//   active?: boolean;
//   onClick: () => void;
// }

// export default function VideoCall({ sessionId, token }: VideoCallProps) {
//   const [scriptLoaded, setScriptLoaded] = useState(false);
//   const [isConnected, setIsConnected] = useState(false);
//   const [isVideoEnabled, setIsVideoEnabled] = useState(true);
//   const [isAudioEnabled, setIsAudioEnabled] = useState(true);
//   const [isScreenSharing, setIsScreenSharing] = useState(false);
//   const [isRecording, setIsRecording] = useState(false);
//   const [isLessonMode, setIsLessonMode] = useState(true);
//   const [showControls, setShowControls] = useState(true);

//   // Replace 'any' with specific Vonage types
//   const sessionRef = useRef<OT.Session | null>(null);
//   const publisherRef = useRef<OT.Publisher | null>(null);
//   const screenPublisherRef = useRef<OT.Publisher | null>(null);
//   const constraintsRef = useRef<HTMLDivElement>(null);
//   const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
//   const audioEnabledRef = useRef(isAudioEnabled);
//   const videoEnabledRef = useRef(isVideoEnabled);
//   const router = useRouter();
//   const appId = process.env.NEXT_PUBLIC_VONAGE_APPLICATION_ID;

//   useEffect(() => {
//     audioEnabledRef.current = isAudioEnabled;
//     videoEnabledRef.current = isVideoEnabled;
//   }, [isAudioEnabled, isVideoEnabled]);

//   const handleMouseMove = () => {
//     setShowControls(true);
//     if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
//     controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 4000);
//   };

//   const initializeSession = useCallback(() => {
//     // window.OT is now recognized thanks to the 'declare global' above
//     if (
//       typeof window === "undefined" ||
//       !window.OT ||
//       !appId ||
//       sessionRef.current
//     )
//       return;

//     try {
//       const OT = window.OT;
//       sessionRef.current = OT.initSession(appId, sessionId);

//       sessionRef.current.on("streamCreated", (event) => {
//         // We cast the event to includes the stream property
//         // Using the library's base event type + the stream requirement
//         const streamEvent = event as OT.OTEvent & { stream: OT.Stream };

//         if (sessionRef.current && streamEvent.stream) {
//           sessionRef.current.subscribe(
//             streamEvent.stream,
//             "subscriber-container",
//             {
//               insertMode: "append",
//               width: "100%",
//               height: "100%",
//               style: { buttonDisplayMode: "off" },
//             },
//           );
//         }
//       });

//       sessionRef.current.on("sessionConnected", () => {
//         setIsConnected(true);
//         publisherRef.current = OT.initPublisher("publisher-container", {
//           insertMode: "replace",
//           width: "100%",
//           height: "100%",
//           publishAudio: audioEnabledRef.current,
//           publishVideo: videoEnabledRef.current,
//           style: { buttonDisplayMode: "off" },
//         });
//         if (publisherRef.current) {
//           sessionRef.current?.publish(publisherRef.current);
//         }
//       });

//       sessionRef.current.connect(token, (err) => {
//         if (err) toast.error("Connection failed");
//       });
//     } catch (error) {
//       console.error("SDK Error:", error);
//     }
//   }, [appId, sessionId, token]);

//   useEffect(() => {
//     if (publisherRef.current) publisherRef.current.publishAudio(isAudioEnabled);
//   }, [isAudioEnabled]);

//   useEffect(() => {
//     if (publisherRef.current) publisherRef.current.publishVideo(isVideoEnabled);
//   }, [isVideoEnabled]);

//   const toggleScreenShare = () => {
//     if (typeof window === "undefined" || !window.OT) return;
//     const OT = window.OT;

//     if (!isScreenSharing) {
//       screenPublisherRef.current = OT.initPublisher(
//         "publisher-container",
//         {
//           videoSource: "screen",
//           insertMode: "append",
//           width: "100%",
//           height: "100%",
//         },
//         (error) => {
//           if (error) {
//             toast.error("Screen sharing not supported or denied");
//           } else if (sessionRef.current && screenPublisherRef.current) {
//             sessionRef.current.publish(screenPublisherRef.current);
//             setIsScreenSharing(true);
//           }
//         },
//       );

//       screenPublisherRef.current.on("streamDestroyed", () => {
//         setIsScreenSharing(false);
//       });
//     } else {
//       if (sessionRef.current && screenPublisherRef.current) {
//         sessionRef.current.unpublish(screenPublisherRef.current);
//         screenPublisherRef.current.destroy();
//         setIsScreenSharing(false);
//       }
//     }
//   };

//   const toggleRecording = () => {
//     setIsRecording(!isRecording);
//     toast.info(!isRecording ? "Recording started" : "Recording saved");
//   };

//   useEffect(() => {
//     if (scriptLoaded && appId && sessionId && token) initializeSession();
//     return () => {
//       sessionRef.current?.disconnect();
//     };
//   }, [scriptLoaded, appId, sessionId, token, initializeSession]);

//   return (
//     <div
//       ref={constraintsRef}
//       className="fixed inset-0 bg-[#020617] text-slate-100 overflow-hidden font-sans"
//       onMouseMove={handleMouseMove}
//     >
//       <Script
//         src="https://unpkg.com/@vonage/client-sdk-video@2.28.2/dist/js/opentok.js"
//         onLoad={() => setScriptLoaded(true)}
//       />

//       {/* Loading State */}
//       {!isConnected && (
//         <div className="absolute inset-0 z-100 flex flex-col items-center justify-center bg-slate-950">
//           <div className="relative">
//             <div className="absolute inset-0 rounded-full blur-xl bg-emerald-500/20 animate-pulse" />
//             <Loader2 className="size-10 text-emerald-500 animate-spin relative" />
//           </div>
//           <p className="mt-6 text-slate-400 font-light tracking-widest uppercase text-xs">
//             Establishing Secure Connection
//           </p>
//         </div>
//       )}

//       {/* Video Canvas */}
//       <div className="relative flex h-full w-full">
//         {/* PUBLISHER (Self) - Takes 100% in Lesson, 50% in Grid */}
//         <div
//           className={`relative bg-slate-950 transition-all duration-700 ease-in-out ${
//             isLessonMode ? "w-full" : "w-1/2 border-r border-white/10"
//           }`}
//         >
//           <div id="publisher-container" className="absolute inset-0 z-10" />
//           <div className="absolute inset-0 z-20 bg-linear-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />
//         </div>

//         {/* SUBSCRIBER (Remote) - Draggable PiP in Lesson, 50% in Grid */}
//         <motion.div
//           layout
//           drag={isLessonMode}
//           dragConstraints={constraintsRef}
//           dragMomentum={false}
//           className={`bg-slate-900 border-white/5 shadow-2xl overflow-hidden transition-all duration-500 ease-in-out ${
//             isLessonMode
//               ? "absolute top-8 right-8 z-40 w-80 aspect-video rounded-2xl border backdrop-blur-xl cursor-grab active:cursor-grabbing"
//               : "w-1/2 relative"
//           }`}
//         >
//           <div id="subscriber-container" className="absolute inset-0 z-10" />
//           <div className="absolute top-4 left-4 z-20 flex items-center gap-2 pointer-events-none">
//             <div className="size-2 bg-emerald-500 rounded-full animate-pulse" />
//             <span className="text-[10px] font-bold uppercase tracking-tighter opacity-70">
//               Remote Participant
//             </span>
//           </div>
//         </motion.div>
//       </div>

//       {/* Modern Control Bar */}
//       <AnimatePresence>
//         {showControls && (
//           <motion.div
//             initial={{ y: 100, x: "-50%", opacity: 0 }}
//             animate={{ y: 0, x: "-50%", opacity: 1 }}
//             exit={{ y: 100, x: "-50%", opacity: 0 }}
//             className="absolute bottom-10 left-1/2 z-60 w-full max-w-2xl px-6"
//           >
//             <div className="bg-slate-900/80 backdrop-blur-3xl border border-white/10 p-4 rounded-3xl flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
//               <div className="flex items-center gap-2">
//                 <ControlButton
//                   active={isAudioEnabled}
//                   onClick={() => setIsAudioEnabled(!isAudioEnabled)}
//                   icon={
//                     isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />
//                   }
//                   danger={!isAudioEnabled}
//                 />
//                 <ControlButton
//                   active={isVideoEnabled}
//                   onClick={() => setIsVideoEnabled(!isVideoEnabled)}
//                   icon={
//                     isVideoEnabled ? (
//                       <Video size={20} />
//                     ) : (
//                       <VideoOff size={20} />
//                     )
//                   }
//                   danger={!isVideoEnabled}
//                 />
//               </div>

//               <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/5">
//                 <ActionButton
//                   label="Share"
//                   icon={<MonitorUp size={18} />}
//                   active={isScreenSharing}
//                   onClick={toggleScreenShare}
//                 />
//                 <ActionButton
//                   label={isRecording ? "Stop" : "Record"}
//                   icon={
//                     isRecording ? (
//                       <StopCircle size={18} className="text-red-500" />
//                     ) : (
//                       <CircleDot size={18} />
//                     )
//                   }
//                   active={isRecording}
//                   onClick={toggleRecording}
//                 />
//                 <div className="w-px h-4 bg-white/10 mx-1" />
//                 <ActionButton
//                   label={isLessonMode ? "Grid" : "Lesson"}
//                   icon={<LayoutTemplate size={18} />}
//                   onClick={() => setIsLessonMode(!isLessonMode)}
//                 />
//               </div>

//               <Button
//                 variant="destructive"
//                 onClick={() => {
//                   sessionRef.current?.disconnect();
//                   router.push("/student");
//                 }}
//                 className="rounded-2xl h-12 w-14 bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-900/20 border-t border-white/20"
//               >
//                 <PhoneOff size={20} />
//               </Button>
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }

// function ControlButton({ active, onClick, icon, danger }: ControlButtonProps) {
//   return (
//     <Button
//       variant="ghost"
//       onClick={onClick}
//       className={`rounded-2xl size-12 transition-all duration-300 ${
//         danger
//           ? "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20"
//           : "text-slate-300 hover:bg-white/10"
//       } ${active && !danger ? "bg-white/5 text-white" : ""}`}
//     >
//       {icon}
//     </Button>
//   );
// }

// function ActionButton({ label, icon, active, onClick }: ActionButtonProps) {
//   return (
//     <button
//       onClick={onClick}
//       className={`flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 hover:bg-white/10 ${
//         active ? "text-emerald-400" : "text-slate-400"
//       }`}
//     >
//       {icon}
//       <span className="text-[10px] font-medium uppercase tracking-wider">
//         {label}
//       </span>
//     </button>
//   );
// }

// "use client";

// import { useRouter } from "next/navigation";
// import Script from "next/script";
// import { useEffect, useRef, useState, useCallback } from "react";
// import { toast } from "sonner";
// import { Button } from "./ui/button";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   Loader2,
//   Mic,
//   MicOff,
//   PhoneOff,
//   Video,
//   VideoOff,
//   LayoutTemplate,
//   MonitorUp,
//   CircleDot,
//   StopCircle,
// } from "lucide-react";

// // --- Types ---
// interface VideoCallProps {
//   sessionId: string;
//   token: string;
// }

// interface ControlButtonProps {
//   active: boolean;
//   onClick: () => void;
//   icon: React.ReactNode;
//   danger?: boolean;
// }

// interface ActionButtonProps {
//   label: string;
//   icon: React.ReactNode;
//   active?: boolean;
//   onClick: () => void;
// }

// export default function VideoCall({ sessionId, token }: VideoCallProps) {
//   const [scriptLoaded, setScriptLoaded] = useState(false);
//   const [isConnected, setIsConnected] = useState(false);
//   const [isVideoEnabled, setIsVideoEnabled] = useState(true);
//   const [isAudioEnabled, setIsAudioEnabled] = useState(true);
//   const [isScreenSharing, setIsScreenSharing] = useState(false);
//   const [isRecording, setIsRecording] = useState(false);
//   const [isLessonMode, setIsLessonMode] = useState(true);
//   const [showControls, setShowControls] = useState(true);

//   // Use the global OT type or 'any' specifically for the SDK refs
//   const sessionRef = useRef<any>(null);
//   const publisherRef = useRef<any>(null);
//   const screenPublisherRef = useRef<any>(null);
//   const constraintsRef = useRef<HTMLDivElement>(null);
//   const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

//   const audioEnabledRef = useRef(isAudioEnabled);
//   const videoEnabledRef = useRef(isVideoEnabled);

//   const router = useRouter();
//   const appId = process.env.NEXT_PUBLIC_VONAGE_APPLICATION_ID;

//   useEffect(() => {
//     audioEnabledRef.current = isAudioEnabled;
//     videoEnabledRef.current = isVideoEnabled;
//   }, [isAudioEnabled, isVideoEnabled]);

//   const handleMouseMove = () => {
//     setShowControls(true);
//     if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
//     controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 4000);
//   };

//   const initializeSession = useCallback(() => {
//     if (!(window as any).OT || !appId || sessionRef.current) return;

//     try {
//       const OT = (window as any).OT;
//       sessionRef.current = OT.initSession(appId, sessionId);

//       sessionRef.current.on("streamCreated", (event: any) => {
//         sessionRef.current.subscribe(event.stream, "subscriber-container", {
//           insertMode: "append",
//           width: "100%",
//           height: "100%",
//           style: { buttonDisplayMode: "off" },
//         });
//       });

//       sessionRef.current.on("sessionConnected", () => {
//         setIsConnected(true);
//         publisherRef.current = OT.initPublisher("publisher-container", {
//           insertMode: "replace",
//           width: "100%",
//           height: "100%",
//           publishAudio: audioEnabledRef.current,
//           publishVideo: videoEnabledRef.current,
//           style: { buttonDisplayMode: "off" },
//         });
//         sessionRef.current.publish(publisherRef.current);
//       });

//       sessionRef.current.connect(token, (err: Error | null) => {
//         if (err) toast.error("Connection failed");
//       });
//     } catch (error) {
//       console.error("SDK Error:", error);
//     }
//   }, [appId, sessionId, token]);

//   useEffect(() => {
//     if (publisherRef.current) publisherRef.current.publishAudio(isAudioEnabled);
//   }, [isAudioEnabled]);

//   useEffect(() => {
//     if (publisherRef.current) publisherRef.current.publishVideo(isVideoEnabled);
//   }, [isVideoEnabled]);

//   const toggleScreenShare = () => {
//     const OT = (window as any).OT;
//     if (!isScreenSharing) {
//       screenPublisherRef.current = OT.initPublisher(
//         "publisher-container",
//         {
//           videoSource: "screen",
//           insertMode: "append",
//           width: "100%",
//           height: "100%",
//         },
//         (error: Error | null) => {
//           if (error) {
//             toast.error("Screen sharing not supported or denied");
//           } else {
//             sessionRef.current.publish(screenPublisherRef.current);
//             setIsScreenSharing(true);
//           }
//         },
//       );

//       screenPublisherRef.current.on("streamDestroyed", () => {
//         setIsScreenSharing(false);
//       });
//     } else {
//       sessionRef.current.unpublish(screenPublisherRef.current);
//       screenPublisherRef.current.destroy();
//       setIsScreenSharing(false);
//     }
//   };

//   const toggleRecording = () => {
//     setIsRecording(!isRecording);
//     toast.info(!isRecording ? "Recording started" : "Recording saved");
//   };

//   useEffect(() => {
//     if (scriptLoaded && appId && sessionId && token) initializeSession();
//     return () => {
//       sessionRef.current?.disconnect();
//     };
//   }, [scriptLoaded, appId, sessionId, token, initializeSession]);

//   return (
//     <div
//       ref={constraintsRef}
//       className="fixed inset-0 bg-[#020617] text-slate-100 overflow-hidden font-sans"
//       onMouseMove={handleMouseMove}
//     >
//       <Script
//         src="https://unpkg.com/@vonage/client-sdk-video@2.28.2/dist/js/opentok.js"
//         onLoad={() => setScriptLoaded(true)}
//       />

//       {/* Loading State */}
//       {!isConnected && (
//         <div className="absolute inset-0 z-100 flex flex-col items-center justify-center bg-slate-950">
//           <div className="relative">
//             <div className="absolute inset-0 rounded-full blur-xl bg-emerald-500/20 animate-pulse" />
//             <Loader2 className="size-10 text-emerald-500 animate-spin relative" />
//           </div>
//           <p className="mt-6 text-slate-400 font-light tracking-widest uppercase text-xs">
//             Establishing Secure Connection
//           </p>
//         </div>
//       )}

//       {/* Video Canvas */}
//       <div className="relative flex h-full w-full">
//         {/* PUBLISHER (Self) - Takes 100% in Lesson, 50% in Grid */}
//         <div
//           className={`relative bg-slate-950 transition-all duration-700 ease-in-out ${
//             isLessonMode ? "w-full" : "w-1/2 border-r border-white/10"
//           }`}
//         >
//           <div id="publisher-container" className="absolute inset-0 z-10" />
//           <div className="absolute inset-0 z-20 bg-linear-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />
//         </div>

//         {/* SUBSCRIBER (Remote) - Draggable PiP in Lesson, 50% in Grid */}
//         <motion.div
//           layout
//           drag={isLessonMode}
//           dragConstraints={constraintsRef}
//           dragMomentum={false}
//           className={`bg-slate-900 border-white/5 shadow-2xl overflow-hidden transition-all duration-500 ease-in-out ${
//             isLessonMode
//               ? "absolute top-8 right-8 z-40 w-80 aspect-video rounded-2xl border backdrop-blur-xl cursor-grab active:cursor-grabbing"
//               : "w-1/2 relative"
//           }`}
//         >
//           <div id="subscriber-container" className="absolute inset-0 z-10" />
//           <div className="absolute top-4 left-4 z-20 flex items-center gap-2 pointer-events-none">
//             <div className="size-2 bg-emerald-500 rounded-full animate-pulse" />
//             <span className="text-[10px] font-bold uppercase tracking-tighter opacity-70">
//               Remote Participant
//             </span>
//           </div>
//         </motion.div>
//       </div>

//       {/* Modern Control Bar */}
//       <AnimatePresence>
//         {showControls && (
//           <motion.div
//             initial={{ y: 100, x: "-50%", opacity: 0 }}
//             animate={{ y: 0, x: "-50%", opacity: 1 }}
//             exit={{ y: 100, x: "-50%", opacity: 0 }}
//             className="absolute bottom-10 left-1/2 z-60 w-full max-w-2xl px-6"
//           >
//             <div className="bg-slate-900/80 backdrop-blur-3xl border border-white/10 p-4 rounded-3xl flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
//               <div className="flex items-center gap-2">
//                 <ControlButton
//                   active={isAudioEnabled}
//                   onClick={() => setIsAudioEnabled(!isAudioEnabled)}
//                   icon={
//                     isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />
//                   }
//                   danger={!isAudioEnabled}
//                 />
//                 <ControlButton
//                   active={isVideoEnabled}
//                   onClick={() => setIsVideoEnabled(!isVideoEnabled)}
//                   icon={
//                     isVideoEnabled ? (
//                       <Video size={20} />
//                     ) : (
//                       <VideoOff size={20} />
//                     )
//                   }
//                   danger={!isVideoEnabled}
//                 />
//               </div>

//               <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/5">
//                 <ActionButton
//                   label="Share"
//                   icon={<MonitorUp size={18} />}
//                   active={isScreenSharing}
//                   onClick={toggleScreenShare}
//                 />
//                 <ActionButton
//                   label={isRecording ? "Stop" : "Record"}
//                   icon={
//                     isRecording ? (
//                       <StopCircle size={18} className="text-red-500" />
//                     ) : (
//                       <CircleDot size={18} />
//                     )
//                   }
//                   active={isRecording}
//                   onClick={toggleRecording}
//                 />
//                 <div className="w-px h-4 bg-white/10 mx-1" />
//                 <ActionButton
//                   label={isLessonMode ? "Grid" : "Lesson"}
//                   icon={<LayoutTemplate size={18} />}
//                   onClick={() => setIsLessonMode(!isLessonMode)}
//                 />
//               </div>

//               <Button
//                 variant="destructive"
//                 onClick={() => {
//                   sessionRef.current?.disconnect();
//                   router.push("/student");
//                 }}
//                 className="rounded-2xl h-12 w-14 bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-900/20 border-t border-white/20"
//               >
//                 <PhoneOff size={20} />
//               </Button>
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }

// function ControlButton({ active, onClick, icon, danger }: ControlButtonProps) {
//   return (
//     <Button
//       variant="ghost"
//       onClick={onClick}
//       className={`rounded-2xl size-12 transition-all duration-300 ${
//         danger
//           ? "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20"
//           : "text-slate-300 hover:bg-white/10"
//       } ${active && !danger ? "bg-white/5 text-white" : ""}`}
//     >
//       {icon}
//     </Button>
//   );
// }

// function ActionButton({ label, icon, active, onClick }: ActionButtonProps) {
//   return (
//     <button
//       onClick={onClick}
//       className={`flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 hover:bg-white/10 ${
//         active ? "text-emerald-400" : "text-slate-400"
//       }`}
//     >
//       {icon}
//       <span className="text-[10px] font-medium uppercase tracking-wider">
//         {label}
//       </span>
//     </button>
//   );
// }

// "use client";

// import { useRouter } from "next/navigation";
// import Script from "next/script";
// import { useEffect, useRef, useState, useCallback } from "react";
// import { toast } from "sonner";
// import { Button } from "./ui/button";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   Loader2,
//   Mic,
//   MicOff,
//   PhoneOff,
//   Video,
//   VideoOff,
//   LayoutTemplate,
//   MonitorUp,
//   CircleDot,
//   StopCircle,
// } from "lucide-react";

// interface VideoCallProps {
//   sessionId: string;
//   token: string;
// }

// export default function VideoCall({ sessionId, token }: VideoCallProps) {
//   const [scriptLoaded, setScriptLoaded] = useState(false);
//   const [isConnected, setIsConnected] = useState(false);
//   const [isVideoEnabled, setIsVideoEnabled] = useState(true);
//   const [isAudioEnabled, setIsAudioEnabled] = useState(true);
//   const [isScreenSharing, setIsScreenSharing] = useState(false);
//   const [isRecording, setIsRecording] = useState(false);
//   const [isLessonMode, setIsLessonMode] = useState(true);
//   const [showControls, setShowControls] = useState(true);

//   const sessionRef = useRef<any>(null);
//   const publisherRef = useRef<any>(null);
//   const screenPublisherRef = useRef<any>(null);
//   const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

//   const audioEnabledRef = useRef(isAudioEnabled);
//   const videoEnabledRef = useRef(isVideoEnabled);

//   const router = useRouter();
//   const appId = process.env.NEXT_PUBLIC_VONAGE_APPLICATION_ID;

//   useEffect(() => {
//     audioEnabledRef.current = isAudioEnabled;
//     videoEnabledRef.current = isVideoEnabled;
//   }, [isAudioEnabled, isVideoEnabled]);

//   const handleMouseMove = () => {
//     setShowControls(true);
//     if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
//     controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 4000);
//   };

//   const initializeSession = useCallback(() => {
//     if (!window.OT || !appId || sessionRef.current) return;

//     try {
//       sessionRef.current = window.OT.initSession(appId, sessionId);

//       sessionRef.current.on("streamCreated", (event: any) => {
//         sessionRef.current.subscribe(event.stream, "subscriber-container", {
//           insertMode: "append",
//           width: "100%",
//           height: "100%",
//           style: { buttonDisplayMode: "off" },
//         });
//       });

//       sessionRef.current.on("sessionConnected", () => {
//         setIsConnected(true);
//         publisherRef.current = window.OT.initPublisher("publisher-container", {
//           insertMode: "replace",
//           width: "100%",
//           height: "100%",
//           publishAudio: audioEnabledRef.current,
//           publishVideo: videoEnabledRef.current,
//           style: { buttonDisplayMode: "off" },
//         });
//         sessionRef.current.publish(publisherRef.current);
//       });

//       sessionRef.current.connect(token, (err: any) => {
//         if (err) toast.error("Connection failed");
//       });
//     } catch (error) {
//       console.error("SDK Error:", error);
//     }
//   }, [appId, sessionId, token]);

//   // Hardware Sync
//   useEffect(() => {
//     if (publisherRef.current) publisherRef.current.publishAudio(isAudioEnabled);
//   }, [isAudioEnabled]);

//   useEffect(() => {
//     if (publisherRef.current) publisherRef.current.publishVideo(isVideoEnabled);
//   }, [isVideoEnabled]);

//   // Screen Share Logic
//   const toggleScreenShare = () => {
//     if (!isScreenSharing) {
//       screenPublisherRef.current = window.OT.initPublisher(
//         "publisher-container",
//         {
//           videoSource: "screen",
//           insertMode: "append",
//           width: "100%",
//           height: "100%",
//         },
//         (error: any) => {
//           if (error) {
//             toast.error("Screen sharing not supported or denied");
//           } else {
//             sessionRef.current.publish(screenPublisherRef.current);
//             setIsScreenSharing(true);
//           }
//         },
//       );

//       screenPublisherRef.current.on("streamDestroyed", () => {
//         setIsScreenSharing(false);
//       });
//     } else {
//       sessionRef.current.unpublish(screenPublisherRef.current);
//       screenPublisherRef.current.destroy();
//       setIsScreenSharing(false);
//     }
//   };

//   const toggleRecording = () => {
//     setIsRecording(!isRecording);
//     toast.info(!isRecording ? "Recording started" : "Recording saved");
//   };

//   useEffect(() => {
//     if (scriptLoaded && appId && sessionId && token) initializeSession();
//     return () => {
//       sessionRef.current?.disconnect();
//     };
//   }, [scriptLoaded, appId, sessionId, token, initializeSession]);

//   return (
//     <div
//       className="fixed inset-0 bg-[#020617] text-slate-100 overflow-hidden font-sans"
//       onMouseMove={handleMouseMove}
//     >
//       <Script
//         src="https://unpkg.com/@vonage/client-sdk-video@2.28.2/dist/js/opentok.js"
//         onLoad={() => setScriptLoaded(true)}
//       />

//       {/* Loading State */}
//       {!isConnected && (
//         <div className="absolute inset-0 z-100 flex flex-col items-center justify-center bg-slate-950">
//           <div className="relative">
//             <div className="absolute inset-0 rounded-full blur-xl bg-emerald-500/20 animate-pulse" />
//             <Loader2 className="size-10 text-emerald-500 animate-spin relative" />
//           </div>
//           <p className="mt-6 text-slate-400 font-light tracking-widest uppercase text-xs">
//             Establishing Secure Connection
//           </p>
//         </div>
//       )}

//       {/* Video Canvas */}
//       <div className="relative flex h-full w-full">
//         <div
//           className={`relative bg-slate-950 transition-all duration-700 flex-1`}
//         >
//           <div id="publisher-container" className="absolute inset-0 z-10" />
//           <div className="absolute inset-0 z-20 bg-linear-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />
//         </div>

//         <motion.div
//           layout
//           className={`bg-slate-900 border-white/5 shadow-2xl overflow-hidden transition-all duration-500 ${
//             isLessonMode
//               ? "absolute top-8 right-8 z-40 w-80 aspect-video rounded-2xl border backdrop-blur-xl"
//               : "w-1/3 border-l"
//           }`}
//         >
//           <div id="subscriber-container" className="absolute inset-0 z-10" />
//           <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
//             <div className="size-2 bg-emerald-500 rounded-full animate-pulse" />
//             <span className="text-[10px] font-bold uppercase tracking-tighter opacity-70">
//               Remote Participant
//             </span>
//           </div>
//         </motion.div>
//       </div>

//       {/* Modern Control Bar */}
//       <AnimatePresence>
//         {showControls && (
//           <motion.div
//             initial={{ y: 100, x: "-50%", opacity: 0 }}
//             animate={{ y: 0, x: "-50%", opacity: 1 }}
//             exit={{ y: 100, x: "-50%", opacity: 0 }}
//             className="absolute bottom-10 left-1/2 z-60 w-full max-w-2xl px-6"
//           >
//             <div className="bg-slate-900/80 backdrop-blur-3xl border border-white/10 p-4 rounded-3xl flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
//               {/* Group 1: Media */}
//               <div className="flex items-center gap-2">
//                 <ControlButton
//                   active={isAudioEnabled}
//                   onClick={() => setIsAudioEnabled(!isAudioEnabled)}
//                   icon={
//                     isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />
//                   }
//                   danger={!isAudioEnabled}
//                 />
//                 <ControlButton
//                   active={isVideoEnabled}
//                   onClick={() => setIsVideoEnabled(!isVideoEnabled)}
//                   icon={
//                     isVideoEnabled ? (
//                       <Video size={20} />
//                     ) : (
//                       <VideoOff size={20} />
//                     )
//                   }
//                   danger={!isVideoEnabled}
//                 />
//               </div>

//               {/* Group 2: Actions */}
//               <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/5">
//                 <ActionButton
//                   label="Share"
//                   icon={<MonitorUp size={18} />}
//                   active={isScreenSharing}
//                   onClick={toggleScreenShare}
//                 />
//                 <ActionButton
//                   label={isRecording ? "Stop" : "Record"}
//                   icon={
//                     isRecording ? (
//                       <StopCircle size={18} className="text-red-500" />
//                     ) : (
//                       <CircleDot size={18} />
//                     )
//                   }
//                   active={isRecording}
//                   onClick={toggleRecording}
//                 />
//                 <div className="w-px h-4 bg-white/10 mx-1" />
//                 <ActionButton
//                   label="Layout"
//                   icon={<LayoutTemplate size={18} />}
//                   onClick={() => setIsLessonMode(!isLessonMode)}
//                 />
//               </div>

//               {/* Group 3: End Call */}
//               <Button
//                 variant="destructive"
//                 onClick={() => {
//                   sessionRef.current?.disconnect();
//                   router.push("/student");
//                 }}
//                 className="rounded-2xl h-12 w-14 bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-900/20 border-t border-white/20"
//               >
//                 <PhoneOff size={20} />
//               </Button>
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }

// // Sub-components for cleaner code
// function ControlButton({ active, onClick, icon, danger }: any) {
//   return (
//     <Button
//       variant="ghost"
//       onClick={onClick}
//       className={`rounded-2xl size-12 transition-all duration-300 ${
//         danger
//           ? "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20"
//           : "text-slate-300 hover:bg-white/10"
//       } ${active && !danger ? "bg-white/5 text-white" : ""}`}
//     >
//       {icon}
//     </Button>
//   );
// }

// function ActionButton({ label, icon, active, onClick }: any) {
//   return (
//     <button
//       onClick={onClick}
//       className={`flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 hover:bg-white/10 ${
//         active ? "text-emerald-400" : "text-slate-400"
//       }`}
//     >
//       {icon}
//       <span className="text-[10px] font-medium uppercase tracking-wider">
//         {label}
//       </span>
//     </button>
//   );
// }

// "use client";

// import { useRouter } from "next/navigation";
// import Script from "next/script";
// import { useEffect, useRef, useState, useCallback } from "react";
// import { toast } from "sonner";
// import { Button } from "./ui/button";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   Loader2,
//   Mic,
//   MicOff,
//   PhoneOff,
//   Video,
//   VideoOff,
//   LayoutTemplate,
// } from "lucide-react";

// interface VideoCallProps {
//   sessionId: string;
//   token: string;
// }

// export default function VideoCall({ sessionId, token }: VideoCallProps) {
//   const [scriptLoaded, setScriptLoaded] = useState(false);
//   const [isConnected, setIsConnected] = useState(false);
//   const [isVideoEnabled, setIsVideoEnabled] = useState(true);
//   const [isAudioEnabled, setIsAudioEnabled] = useState(true);
//   const [isLessonMode, setIsLessonMode] = useState(true);
//   const [showControls, setShowControls] = useState(true);

//   const sessionRef = useRef<any>(null);
//   const publisherRef = useRef<any>(null);
//   const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

//   // 1. Refs to track current toggle state without triggering re-renders of the init function
//   const audioEnabledRef = useRef(isAudioEnabled);
//   const videoEnabledRef = useRef(isVideoEnabled);

//   const router = useRouter();
//   const appId = process.env.NEXT_PUBLIC_VONAGE_APPLICATION_ID;

//   // Sync refs when state changes
//   useEffect(() => {
//     audioEnabledRef.current = isAudioEnabled;
//     videoEnabledRef.current = isVideoEnabled;
//   }, [isAudioEnabled, isVideoEnabled]);

//   const handleMouseMove = () => {
//     setShowControls(true);
//     if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
//     controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
//   };

//   // 2. Initialize Session - Dependencies are now strictly session-related
//   const initializeSession = useCallback(() => {
//     if (!window.OT || !appId || sessionRef.current) return;

//     try {
//       sessionRef.current = window.OT.initSession(appId, sessionId);

//       sessionRef.current.on("streamCreated", (event: any) => {
//         sessionRef.current.subscribe(event.stream, "subscriber-container", {
//           insertMode: "append",
//           width: "100%",
//           height: "100%",
//           style: { buttonDisplayMode: "off" },
//         });
//       });

//       sessionRef.current.on("sessionConnected", () => {
//         setIsConnected(true);
//         publisherRef.current = window.OT.initPublisher("publisher-container", {
//           insertMode: "replace",
//           width: "100%",
//           height: "100%",
//           // Use Refs here to prevent the React Compiler from demanding state dependencies
//           publishAudio: audioEnabledRef.current,
//           publishVideo: videoEnabledRef.current,
//         });
//         sessionRef.current.publish(publisherRef.current);
//       });

//       sessionRef.current.connect(token, (err: any) => {
//         if (err) toast.error("Session connection failed");
//       });
//     } catch (error) {
//       console.error("Vonage Init Error:", error);
//     }
//   }, [appId, sessionId, token]);

//   // 3. Sync hardware state via API calls (Smooth transitions)
//   useEffect(() => {
//     if (publisherRef.current) {
//       publisherRef.current.publishAudio(isAudioEnabled);
//     }
//   }, [isAudioEnabled]);

//   useEffect(() => {
//     if (publisherRef.current) {
//       publisherRef.current.publishVideo(isVideoEnabled);
//     }
//   }, [isVideoEnabled]);

//   // 4. Lifecycle management
//   useEffect(() => {
//     if (scriptLoaded && appId && sessionId && token) {
//       initializeSession();
//     }
//     return () => {
//       if (sessionRef.current) {
//         sessionRef.current.disconnect();
//         sessionRef.current = null;
//       }
//     };
//   }, [scriptLoaded, appId, sessionId, token, initializeSession]);

//   const endCall = () => {
//     sessionRef.current?.disconnect();
//     router.push("/student");
//   };

//   return (
//     <div
//       className="fixed inset-0 bg-[#020617] text-slate-100 overflow-hidden"
//       onMouseMove={handleMouseMove}
//     >
//       <Script
//         src="https://unpkg.com/@vonage/client-sdk-video@2.28.2/dist/js/opentok.js"
//         onLoad={() => setScriptLoaded(true)}
//       />

//       {!isConnected && (
//         <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-[#020617]">
//           <Loader2 className="size-12 text-emerald-500 animate-spin mb-4" />
//           <p className="text-slate-400 animate-pulse font-medium">
//             Entering Classroom...
//           </p>
//         </div>
//       )}

//       <div className="relative flex flex-col md:flex-row h-full w-full">
//         {/* PUBLISHER */}
//         <div
//           className={`relative bg-black transition-all duration-500 overflow-hidden ${isLessonMode ? "w-full h-full" : "flex-1 h-full border-r border-white/5"}`}
//         >
//           <div
//             id="publisher-container"
//             className="absolute inset-0 z-10 w-full h-full"
//           />
//           <div
//             className={`absolute inset-0 z-20 pointer-events-none transition-opacity duration-500 bg-gradient-to-t from-black/60 via-transparent to-transparent ${showControls ? "opacity-100" : "opacity-0"}`}
//           />
//         </div>

//         {/* SUBSCRIBER */}
//         <motion.div
//           layout
//           className={`bg-slate-900 border-white/10 shadow-2xl overflow-hidden transition-all duration-500 ${isLessonMode ? "absolute top-6 right-6 z-40 w-72 aspect-video rounded-xl border-2 cursor-grab active:cursor-grabbing" : "flex-1 h-full"}`}
//           drag={isLessonMode}
//           dragMomentum={false}
//         >
//           <div
//             id="subscriber-container"
//             className="absolute inset-0 z-10 w-full h-full"
//           />
//           <div className="absolute top-3 left-3 z-20 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border border-white/10">
//             Student
//           </div>
//         </motion.div>
//       </div>

//       {/* CONTROLS */}
//       <AnimatePresence>
//         {showControls && (
//           <motion.div
//             initial={{ y: 50, opacity: 0, x: "-50%" }}
//             animate={{ y: 0, opacity: 1, x: "-50%" }}
//             exit={{ y: 50, opacity: 0, x: "-50%" }}
//             className="absolute bottom-8 left-1/2 z-[60]"
//           >
//             <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/10 p-3 rounded-2xl flex items-center gap-3 shadow-2xl">
//               <Button
//                 variant="ghost"
//                 size="icon"
//                 onClick={() => setIsAudioEnabled(!isAudioEnabled)}
//                 className={`rounded-xl size-12 transition-colors ${!isAudioEnabled ? "bg-red-500/20 text-red-500" : "text-white hover:bg-white/10"}`}
//               >
//                 {isAudioEnabled ? <Mic size={22} /> : <MicOff size={22} />}
//               </Button>

//               <Button
//                 variant="ghost"
//                 size="icon"
//                 onClick={() => setIsVideoEnabled(!isVideoEnabled)}
//                 className={`rounded-xl size-12 transition-colors ${!isVideoEnabled ? "bg-red-500/20 text-red-500" : "text-white hover:bg-white/10"}`}
//               >
//                 {isVideoEnabled ? <Video size={22} /> : <VideoOff size={22} />}
//               </Button>

//               <div className="w-px h-6 bg-white/10 mx-1" />

//               <Button
//                 variant="ghost"
//                 className="rounded-xl px-4 gap-2 text-xs font-semibold text-white hover:bg-white/10 h-12"
//                 onClick={() => setIsLessonMode(!isLessonMode)}
//               >
//                 <LayoutTemplate size={18} />
//                 {isLessonMode ? "Grid Mode" : "Lesson Mode"}
//               </Button>

//               <Button
//                 variant="destructive"
//                 size="icon"
//                 onClick={endCall}
//                 className="rounded-xl size-12 bg-red-600 hover:bg-red-500 shadow-lg shadow-red-900/40"
//               >
//                 <PhoneOff size={22} />
//               </Button>
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }

// "use client";

// import { useRouter } from "next/navigation";
// import Script from "next/script";
// import { useEffect, useRef, useState } from "react";
// import { toast } from "sonner";
// import { Button } from "./ui/button";
// import { motion } from "framer-motion";
// import {
//   Loader2,
//   Mic,
//   MicOff,
//   PhoneOff,
//   Video,
//   VideoOff,
//   MonitorUp,
//   CircleDot,
//   LayoutTemplate,
// } from "lucide-react";

// interface VideoCallProps {
//   sessionId: string;
//   token: string;
// }

// export default function VideoCall({ sessionId, token }: VideoCallProps) {
//   const [isLoading, setIsLoading] = useState(true);
//   const [scriptLoaded, setScriptLoaded] = useState(false);
//   const [isConnected, setIsConnected] = useState(false);
//   const [isVideoEnabled, setIsVideoEnabled] = useState(true);
//   const [isAudioEnabled, setIsAudioEnabled] = useState(true);
//   const [isScreenSharing, setIsScreenSharing] = useState(false);
//   const [isRecording, setIsRecording] = useState(false);
//   const [isLessonMode, setIsLessonMode] = useState(true);
//   const [showControls, setShowControls] = useState(true);

//   const sessionRef = useRef<OT.Session | null>(null);
//   const publisherRef = useRef<OT.Publisher | null>(null);
//   const screenPublisherRef = useRef<OT.Publisher | null>(null);
//   const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
//   const router = useRouter();

//   const appId = process.env.NEXT_PUBLIC_VONAGE_APPLICATION_ID;

//   const handleMouseMove = () => {
//     setShowControls(true);
//     if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
//     controlsTimeoutRef.current = setTimeout(() => {
//       setShowControls(false);
//     }, 3000);
//   };

//   const handleScriptLoad = () => setScriptLoaded(true);

//   const initializeSession = () => {
//     if (!window.OT) return;
//     try {
//       sessionRef.current = window.OT.initSession(appId, sessionId);
//       sessionRef.current.on("streamCreated", (event) => {
//         sessionRef.current.subscribe(event.stream, "subscriber", {
//           insertMode: "append",
//           width: "100%",
//           height: "100%",
//           style: { buttonDisplayMode: "off", fitMode: "cover" },
//         });
//       });
//       sessionRef.current.on("sessionConnected", () => {
//         setIsConnected(true);
//         publisherRef.current = window.OT.initPublisher("publisher", {
//           insertMode: "replace",
//           width: "100%",
//           height: "100%",
//           publishAudio: isAudioEnabled,
//           publishVideo: isVideoEnabled,
//           style: { fitMode: "cover" },
//         });
//         sessionRef.current.publish(publisherRef.current);
//       });
//       sessionRef.current.connect(token);
//     } catch (error) {
//       toast.error("Failed to initialize call");
//     }
//   };

//   useEffect(() => {
//     if (appId && sessionId && token) setIsLoading(false);
//   }, [appId, sessionId, token]);

//   useEffect(() => {
//     if (scriptLoaded && !isLoading && !sessionRef.current) initializeSession();
//   }, [scriptLoaded, isLoading]);

//   const toggleScreenShare = () => {
//     if (!isScreenSharing) {
//       screenPublisherRef.current = window.OT.initPublisher(
//         "publisher",
//         {
//           videoSource: "screen",
//           insertMode: "append",
//           width: "100%",
//           height: "100%",
//         },
//         (err) => {
//           if (err) toast.error("Screen share failed");
//           else {
//             sessionRef.current.publish(screenPublisherRef.current);
//             setIsScreenSharing(true);
//           }
//         },
//       );
//     } else {
//       sessionRef.current.unpublish(screenPublisherRef.current);
//       screenPublisherRef.current.destroy();
//       setIsScreenSharing(false);
//     }
//   };

//   const toggleVideo = () => {
//     publisherRef.current?.publishVideo(!isVideoEnabled);
//     setIsVideoEnabled(!isVideoEnabled);
//   };

//   const toggleAudio = () => {
//     publisherRef.current?.publishAudio(!isAudioEnabled);
//     setIsAudioEnabled(!isAudioEnabled);
//   };

//   const endCall = () => {
//     sessionRef.current?.disconnect();
//     router.push("/student");
//   };

//   return (
//     <div
//       className="fixed inset-0 bg-black text-slate-100 overflow-hidden"
//       onMouseMove={handleMouseMove}
//     >
//       <Script
//         src="https://unpkg.com/@vonage/client-sdk-video@2.28.2/dist/js/opentok.js"
//         onLoad={handleScriptLoad}
//       />

//       {isLoading ? (
//         <div className="h-full flex flex-col items-center justify-center bg-slate-950">
//           <Loader2 className="size-12 text-emerald-500 animate-spin mb-4" />
//           <p className="text-slate-400 animate-pulse">
//             Launching your session...
//           </p>
//         </div>
//       ) : (
//         <div className="relative h-full w-full">
//           <div
//             className={`h-full w-full transition-all duration-500 ${
//               isLessonMode
//                 ? "relative"
//                 : "grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-950"
//             }`}
//           >
//             {/* PUBLISHER CONTAINER */}
//             <div
//               className={`bg-black overflow-hidden relative group transition-all duration-500 ${
//                 isLessonMode
//                   ? "absolute inset-0 z-0 w-full h-full"
//                   : "rounded-sm border border-white/5 shadow-2xl"
//               }`}
//             >
//               <div
//                 id="publisher"
//                 className="w-full h-full [&_div]:w-full! [&_div]:h-full! [&_video]:object-cover! [&_video]:static!"
//               />

//               {/* FLOATING SUBSCRIBER (Lesson Mode) */}
//               {isLessonMode && (
//                 <motion.div
//                   drag
//                   dragMomentum={false}
//                   className="absolute top-10 right-10 z-50 w-72 aspect-video bg-slate-900 rounded-sm overflow-hidden border-2 border-white/20 shadow-2xl cursor-grab active:cursor-grabbing"
//                 >
//                   <div className="absolute top-2 left-3 z-10 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-sm text-[10px] uppercase tracking-widest border border-white/10 font-bold">
//                     Student
//                   </div>
//                   <div
//                     id="subscriber"
//                     className="w-full h-full [&_div]:w-full! [&_div]:h-full! [&_video]:object-cover!"
//                   />
//                 </motion.div>
//               )}

//               {/* TOP BAR CONTROLS */}
//               <div
//                 className={`absolute top-6 inset-x-6 z-40 flex justify-between items-start transition-all duration-500 transform ${
//                   showControls
//                     ? "translate-y-0 opacity-100"
//                     : "-translate-y-10 opacity-0 pointer-events-none"
//                 }`}
//               >
//                 <div className="bg-black/40 backdrop-blur-xl px-4 py-2.5 rounded-sm flex items-center gap-3 border border-white/10 shadow-xl">
//                   <div
//                     className={`size-2 rounded-sm ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}
//                   />
//                   <span className="text-xs font-semibold tracking-wide uppercase">
//                     Live Classroom
//                   </span>
//                 </div>

//                 <div className="flex gap-2">
//                   <button
//                     onClick={() => setIsLessonMode(!isLessonMode)}
//                     className="bg-black/40 hover:bg-white/10 backdrop-blur-xl px-4 py-2.5 rounded-sm flex items-center gap-2 border border-white/10 transition-colors text-xs font-medium"
//                   >
//                     <LayoutTemplate size={16} />
//                     {isLessonMode ? "Grid Mode" : "Lesson Mode"}
//                   </button>
//                   <button
//                     onClick={() => setIsRecording(!isRecording)}
//                     className={`bg-black/40 hover:bg-white/10 backdrop-blur-xl px-4 py-2.5 rounded-sm flex items-center gap-2 border border-white/10 transition-colors text-xs font-medium ${isRecording ? "text-red-500" : ""}`}
//                   >
//                     <CircleDot
//                       size={16}
//                       className={isRecording ? "animate-pulse" : ""}
//                     />
//                     {isRecording ? "Stop" : "Record"}
//                   </button>
//                 </div>
//               </div>

//               {/* BOTTOM BAR CONTROLS */}
//               <div
//                 className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-40 transition-all duration-500 transform ${
//                   showControls
//                     ? "translate-y-0 opacity-100"
//                     : "translate-y-10 opacity-0 pointer-events-none"
//                 }`}
//               >
//                 <div className="bg-black/40 backdrop-blur-2xl border border-white/10 p-3 rounded-sm flex items-center gap-3 shadow-2xl">
//                   <Button
//                     variant="ghost"
//                     size="icon"
//                     onClick={toggleAudio}
//                     className={`rounded-sm size-12 ${!isAudioEnabled ? "bg-red-500/20 text-red-500" : "hover:bg-white/10"}`}
//                   >
//                     {isAudioEnabled ? <Mic size={22} /> : <MicOff size={22} />}
//                   </Button>
//                   <Button
//                     variant="ghost"
//                     size="icon"
//                     onClick={toggleVideo}
//                     className={`rounded-sm size-12 ${!isVideoEnabled ? "bg-red-500/20 text-red-500" : "hover:bg-white/10"}`}
//                   >
//                     {isVideoEnabled ? (
//                       <Video size={22} />
//                     ) : (
//                       <VideoOff size={22} />
//                     )}
//                   </Button>
//                   <div className="w-px h-6 bg-white/10 mx-1" />
//                   <Button
//                     variant="ghost"
//                     size="icon"
//                     onClick={toggleScreenShare}
//                     className={`rounded-sm size-12 ${isScreenSharing ? "bg-emerald-500/20 text-emerald-500" : "hover:bg-white/10"}`}
//                   >
//                     <MonitorUp size={22} />
//                   </Button>
//                   <Button
//                     variant="destructive"
//                     size="icon"
//                     onClick={endCall}
//                     className="rounded-sm size-12 shadow-lg shadow-red-500/30 bg-red-600 hover:bg-red-500"
//                   >
//                     <PhoneOff size={22} />
//                   </Button>
//                 </div>
//               </div>

//               {/* READABILITY GRADIENTS */}
//               <div
//                 className={`absolute inset-x-0 top-0 h-32 bg-linear-to-b from-black/70 to-transparent pointer-events-none transition-opacity duration-500 ${showControls ? "opacity-100" : "opacity-0"}`}
//               />
//               <div
//                 className={`absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-black/70 to-transparent pointer-events-none transition-opacity duration-500 ${showControls ? "opacity-100" : "opacity-0"}`}
//               />
//             </div>

//             {/* SIDE SUBSCRIBER (Grid Mode) */}
//             {!isLessonMode && (
//               <div className="bg-slate-900 rounded-sm overflow-hidden border border-white/5 relative shadow-xl backdrop-blur-sm h-full">
//                 <div className="absolute top-4 left-4 z-10 bg-black/40 backdrop-blur-md px-3 py-1 rounded-sm text-[10px] uppercase tracking-widest border border-white/5 font-bold">
//                   Student
//                 </div>
//                 <div
//                   id="subscriber"
//                   className="w-full h-full [&_div]:w-full! [&_div]:h-full! [&_video]:object-cover!"
//                 />
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// "use client";

// import { useRouter } from "next/navigation";
// import Script from "next/script";
// import { useEffect, useRef, useState } from "react";
// import { toast } from "sonner";
// import { Button } from "./ui/button";
// import {
//   Loader2,
//   Mic,
//   MicOff,
//   PhoneOff,
//   User,
//   Video,
//   VideoOff,
// } from "lucide-react";

// export default function VideoCall({ sessionId, token }) {
//   const [isLoading, setIsLoading] = useState(true);
//   const [scriptLoaded, setScriptLoaded] = useState(false);
//   const [isConnected, setIsConnected] = useState(false);
//   const [isVideoEnabled, setIsVideoEnabled] = useState(true);
//   const [isAudioEnabled, setIsAudioEnabled] = useState(true);

//   const sessionRef = useRef(null);
//   const publisherRef = useRef(null);
//   const router = useRouter();

//   const appId = process.env.NEXT_PUBLIC_VONAGE_APPLICATION_ID;

//   const handleScriptLoad = () => {
//     setScriptLoaded(true);
//     if (!window.OT) {
//       toast.error("Failed to load Vonage Video API");
//       setIsLoading(false);
//       return;
//     }

//     initializeSession();
//   };

//   const initializeSession = () => {
//     if (!appId || !sessionId || !token) {
//       toast.error("Missing required video call parameters");
//       router.push("/student");
//       return;
//     }

//     try {
//       sessionRef.current = window.OT.initSession(appId, sessionId);

//       sessionRef.current.on("streamCreated", (event) => {
//         sessionRef.current.subscribe(
//           event.stream,
//           "subscriber",
//           {
//             insertMode: "append",
//             width: "100%",
//             height: "100%",
//           },
//           (error) => {
//             if (error) {
//               toast.error("Error connecting to other participant's stream");
//             }
//           },
//         );
//       });

//       sessionRef.current.on("sessionConnected", () => {
//         setIsConnected(true);
//         setIsLoading(false);

//         publisherRef.current = window.OT.initPublisher(
//           "publisher",
//           {
//             insertMode: "replace",
//             width: "100%",
//             height: "100%",
//             publishAudio: isAudioEnabled,
//             publishVideo: isVideoEnabled,
//           },
//           (error) => {
//             if (error) {
//               console.error("Publisher error:", error);
//               toast.error("Error initializing your camera and microphone");
//             } else {
//               console.log(
//                 "Publisher initialized successfully - you should see your video now",
//               );
//             }
//           },
//         );
//       });

//       sessionRef.current.on("sessionDisconnected", () => {
//         setIsConnected(false);
//       });

//       sessionRef.current.connect(token, (error) => {
//         if (error) {
//           toast.error("Error connecting to video session");
//         } else {
//           if (publisherRef.current) {
//             sessionRef.current.publish(publisherRef.current, (error) => {
//               if (error) {
//                 console.log("Error publishing stream:", error);
//                 toast.error("Error publishing your stream");
//               } else {
//                 console.log("Stream published successfully");
//               }
//             });
//           }
//         }
//       });
//     } catch (error) {
//       toast.error("Failed to initialize call");
//       setIsLoading(false);
//     }
//   };

//   const toggleVideo = () => {
//     if (publisherRef.current) {
//       publisherRef.current.publishVideo(!isVideoEnabled);
//       setIsVideoEnabled((prev) => !prev);
//     }
//   };

//   const toggleAudio = () => {
//     if (publisherRef.current) {
//       publisherRef.current.publishAudio(!isAudioEnabled);
//       setIsAudioEnabled((prev) => !prev);
//     }
//   };

//   const endCall = () => {
//     if (publisherRef.current) {
//       publisherRef.current.destroy();
//       publisherRef.current = null;
//     }

//     if (sessionRef.current) {
//       sessionRef.current.disconnect();
//       sessionRef.current = null;
//     }

//     router.push("/student");
//   };

//   useEffect(() => {
//     return () => {
//       if (publisherRef.current) {
//         publisherRef.current.destroy();
//       }
//       if (sessionRef.current) {
//         sessionRef.current.disconnect();
//       }
//     };
//   }, []);

//   if (!sessionId || !token || !appId) {
//     return (
//       <div className="container mx-auto px-4 py-12 text-center">
//         <h1 className="text-3xl font-bold text-white mb-4">
//           Invalid Video Call
//         </h1>
//         <p className="text-muted-foreground mb-6">
//           Missing required parameters for the video call
//         </p>
//         <Button
//           onClick={() => router.push("/appointments")}
//           className="bg-emerald-600 hover:bg-amber-700"
//         >
//           Back to Appointments
//         </Button>
//       </div>
//     );
//   }

//   return (
//     <>
//       <Script
//         src="https://unpkg.com/@vonage/client-sdk-video@2.28.2/dist/js/opentok.js"
//         onLoad={handleScriptLoad}
//         onError={() => {
//           toast.error("Failed to load video call script");
//           setIsLoading(false);
//         }}
//       />

//       <div className="container mx-auto px-4 py-8">
//         <div className="text-center mb-6">
//           <h1 className="text-3xl font-bold text-white mb-2">Video Session</h1>
//           <p className="text-muted-foreground">
//             {isConnected
//               ? "Connected"
//               : isLoading
//                 ? "Connecting..."
//                 : "Connection failed"}
//           </p>
//         </div>

//         {isLoading && !scriptLoaded ? (
//           <div className="flex flex-col items-center justify-center py-12">
//             <Loader2 className="size-12 text-emerald-400 animate-spin mb-4" />
//             <p className="text-white text-lg">
//               Loading video call components...
//             </p>
//           </div>
//         ) : (
//           <div className="space-y-6">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div className="border border-emerald-900/20 rounded-lg overflow-hidden">
//                 <div className="border border-emerald-900/20 rounded-lg overflow-hidden">
//                   You
//                 </div>

//                 <div
//                   className="w-full h-75 md:h-100 bg-muted/30"
//                   id="publisher"
//                 >
//                   {!scriptLoaded && (
//                     <div className="flex items-center justify-center h-full">
//                       <div className="bg-muted/20 rounded-full p-8">
//                         <User className="size-12 text-emerald-400" />
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </div>

//               <div className="border border-emerald-900/20 rounded-lg overflow-hidden">
//                 <div className="bg-emerald-900/10 px-3 py-2 text-emerald-400 text-sm font-medium">
//                   Other Participant
//                 </div>

//                 <div
//                   id="subscriber"
//                   className="w-full h-75 md:h-100 bg-muted/30"
//                 >
//                   {!isConnected ||
//                     (!scriptLoaded && (
//                       <div className="flex items-center justify-center h-full">
//                         <div className="bg-muted/20 rounded-full p-8">
//                           <User className="size-12 text-emerald-400" />
//                         </div>
//                       </div>
//                     ))}
//                 </div>
//               </div>
//             </div>

//             {/* Video call control buttons */}
//             <div className="flex justify-center space-x-4">
//               <Button
//                 variant="outline"
//                 size="lg"
//                 onClick={toggleVideo}
//                 className={`rounded-full p-4 size-14 ${
//                   isVideoEnabled
//                     ? "border-emerald-900/30"
//                     : "bg-red-900/20 border-red-900/30 text-red-400"
//                 }`}
//                 disabled={!publisherRef.current}
//               >
//                 {!isVideoEnabled ? <Video /> : <VideoOff />}
//               </Button>

//               <Button
//                 variant="outline"
//                 size="lg"
//                 onClick={toggleAudio}
//                 className={`rounded-full p-4 size-14 ${
//                   isAudioEnabled
//                     ? "border-emerald-900/30"
//                     : "bg-red-900/20 border-red-900/30 text-red-400"
//                 }`}
//                 disabled={!publisherRef.current}
//               >
//                 {!isVideoEnabled ? <Mic /> : <MicOff />}
//               </Button>

//               <Button
//                 variant="destructive"
//                 size="lg"
//                 onClick={endCall}
//                 className="rounded-full size-14 p-4 bg-red-600 hover:bg-red-700"
//               >
//                 <PhoneOff />
//               </Button>
//             </div>

//             <div className="text-center">
//               <p className="text-muted-foreground text-sm">
//                 {isVideoEnabled ? "Camera on" : "Camera off"}
//                 {isAudioEnabled ? "Microphone on" : "Mocrophone off"}
//               </p>
//               <p className="text-muted-foreground text-sm mt-1">
//                 When you&apos;re finished with your session, click the red
//                 button to end the video call
//               </p>
//             </div>
//           </div>
//         )}
//       </div>
//     </>
//   );
// }
