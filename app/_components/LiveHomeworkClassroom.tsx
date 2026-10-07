/* eslint-disable @typescript-eslint/no-explicit-any */



"use client";







import { useCallback, useEffect, useRef, useState } from "react";



import {



  BookOpen,



  Clock3,



  FileText,



  Loader2,



  MessageCircle,



  PhoneOff,



  ShieldCheck,



  Sparkles,



  X,



} from "lucide-react";







import VideoCall from "@/app/_components/VideoCall";



import Whiteboard, {



  type WhiteboardRealtimeData,



} from "@/app/_components/Whiteboard";







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







type DailyCredentials = {



  videoSessionId: string;



  token: string;



  roomUrl?: string;



  role: "tutor" | "customer";



};







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







type Props = {



  user: ClassroomUser;



  session: ClassroomSession;



  request: HomeworkRequest;



};







const WHITEBOARD_MESSAGE_CHUNK_SIZE = 2800;



const WHITEBOARD_MESSAGE_MAX_CHUNKS = 512;



const WHITEBOARD_MESSAGE_TTL_MS = 15_000;







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







function createWhiteboardMessageId() {



  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {



    return crypto.randomUUID();



  }







  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;



}







function formatDuration(totalSeconds: number) {



  const seconds = Math.max(0, totalSeconds);



  const minutes = Math.floor(seconds / 60);



  const remainingSeconds = seconds % 60;







  return `${String(minutes).padStart(2, "0")}:${String(



    remainingSeconds,



  ).padStart(2, "0")}`;



}







export default function LiveHomeworkClassroom({



  user,



  session,



  request,



}: Props) {



  const [videoCredentials, setVideoCredentials] =



    useState<DailyCredentials | null>(null);



  const [connectionError, setConnectionError] = useState("");



  const [sessionStatus, setSessionStatus] = useState(session.status);



  const [startedAt, setStartedAt] = useState<string | null>(session.startedAt);



  const [elapsedSeconds, setElapsedSeconds] = useState(



    session.durationSeconds,



  );



  const [showAssignment, setShowAssignment] = useState(true);



  const [showHomeworkPanel, setShowHomeworkPanel] = useState(true);







  const [remoteWhiteboardData, setRemoteWhiteboardData] =



    useState<WhiteboardRealtimeData | null>(null);



  const [participantRailWidth, setParticipantRailWidth] = useState(350);







  const whiteboardSendRef = useRef<



    ((type: string, data?: unknown) => void) | null



  >(null);



  const whiteboardSignalTimerRef =



    useRef<ReturnType<typeof setTimeout> | null>(null);



  const whiteboardChunkBuffersRef = useRef<



    Map<string, WhiteboardChunkBuffer>



  >(new Map());







  const isTeacher =



    user.id === session.teacherId || user.role?.toLowerCase() === "admin";







  const otherPersonLabel = isTeacher ? "Learner" : "Teacher";







  const startOfficialSession = useCallback(async () => {



    const response = await fetch(



      `/api/live-homework-help/session/${encodeURIComponent(session.id)}`,



      {



        method: "PATCH",



        headers: {



          "Content-Type": "application/json",



        },



        body: JSON.stringify({ action: "START" }),



      },



    );







    const data = await response.json().catch(() => null);







    if (!response.ok) {



      throw new Error(



        data?.error ?? "Unable to start the live homework session.",



      );



    }







    setSessionStatus(data.session.status);



    setStartedAt(data.session.startedAt);







    return data.session;



  }, [session.id]);







  const loadDailyCredentials = useCallback(async () => {



    setConnectionError("");







    try {



      const response = await fetch(



        `/api/live-homework-help/session/${encodeURIComponent(



          session.id,



        )}/daily`,



        {



          method: "POST",



          headers: {



            "Content-Type": "application/json",



          },



        },



      );







      const data = await response.json().catch(() => null);







      if (!response.ok) {



        throw new Error(



          data?.error ?? "Unable to prepare the Daily classroom.",



        );



      }







      setVideoCredentials({



        videoSessionId: data.videoSessionId,



        token: data.token,



        roomUrl: data.roomUrl,



        role: data.role,



      });



    } catch (error) {



      setConnectionError(



        error instanceof Error



          ? error.message



          : "Unable to connect to the live classroom.",



      );



    }



  }, [session.id]);







  useEffect(() => {



    const timer = window.setTimeout(() => {



      void loadDailyCredentials();



    }, 0);







    return () => window.clearTimeout(timer);



  }, [loadDailyCredentials]);







  useEffect(() => {



    return () => {



      if (whiteboardSignalTimerRef.current) {



        clearTimeout(whiteboardSignalTimerRef.current);



      }







      whiteboardChunkBuffersRef.current.clear();



    };



  }, []);







  const sendWhiteboardSnapshot = useCallback(



    (data: WhiteboardRealtimeData) => {



      const sendSignal = whiteboardSendRef.current;



      if (!sendSignal) return;







      try {



        const encoded = encodeWhiteboardPayload(data);



        const total = Math.ceil(



          encoded.length / WHITEBOARD_MESSAGE_CHUNK_SIZE,



        );







        if (total < 1 || total > WHITEBOARD_MESSAGE_MAX_CHUNKS) {



          console.warn(



            "Live Homework whiteboard snapshot is too large for Daily app-message transport.",



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



        console.error(



          "Failed to send Live Homework whiteboard snapshot:",



          error,



        );



      }



    },



    [],



  );







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



        const encoded = Array.from(



          { length: buffer.total },



          (_, index) => buffer?.chunks.get(index) ?? "",



        ).join("");







        const decoded = decodeWhiteboardPayload(encoded);







        if (decoded && typeof decoded === "object") {



          setRemoteWhiteboardData(decoded as WhiteboardRealtimeData);



        }



      } catch (error) {



        console.error(



          "Failed to decode Live Homework whiteboard snapshot:",



          error,



        );



      } finally {



        buffers.delete(chunk.id);



      }



    },



    [],



  );







  const handleConnected = useCallback(() => {



    void startOfficialSession().catch((error) => {



      setConnectionError(



        error instanceof Error



          ? error.message



          : "Unable to start the live homework session.",



      );



    });



  }, [startOfficialSession]);







  const handleEndSession = useCallback(async () => {



    if (!isTeacher) {



      return;



    }







    const response = await fetch(



      `/api/live-homework-help/session/${encodeURIComponent(session.id)}`,



      {



        method: "PATCH",



        headers: {



          "Content-Type": "application/json",



        },



        body: JSON.stringify({ action: "END" }),



      },



    );







    const data = await response.json().catch(() => null);







    if (!response.ok) {



      throw new Error(



        data?.error ?? "Unable to end the live homework session.",



      );



    }







    setSessionStatus("ENDED");



    setElapsedSeconds(data.session?.durationSeconds ?? elapsedSeconds);



  }, [elapsedSeconds, isTeacher, session.id]);







  useEffect(() => {



    if (sessionStatus !== "ACTIVE" || !startedAt) {



      return;



    }







    const updateTimer = () => {



      const started = new Date(startedAt).getTime();







      if (!Number.isFinite(started)) return;







      setElapsedSeconds(



        Math.max(0, Math.floor((Date.now() - started) / 1000)),



      );



    };







    updateTimer();







    const timer = window.setInterval(updateTimer, 1000);







    return () => window.clearInterval(timer);



  }, [sessionStatus, startedAt]);







  const homeworkPanel = (



    <aside



      className={`fixed bottom-4 right-4 z-[950] w-[min(380px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition ${



        showHomeworkPanel ? "" : "w-auto"



      }`}



    >



      {showHomeworkPanel ? (



        <>



          <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">



            <div className="min-w-0">



              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">



                Live Homework Help



              </p>



              <h2 className="mt-1 truncate text-sm font-semibold text-slate-950">



                {request.subject}



              </h2>



              <div className="mt-1 flex flex-wrap gap-1.5">



                {request.gradeLevel && (



                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">



                    {request.gradeLevel}



                  </span>



                )}



                {request.topic && (



                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">



                    {request.topic}



                  </span>



                )}



              </div>



            </div>







            <button



              type="button"



              onClick={() => setShowHomeworkPanel(false)}



              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"



              aria-label="Hide homework panel"



            >



              <X className="size-4" />



            </button>



          </div>







          <div className="max-h-[55vh] overflow-y-auto p-4">



            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">



              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">



                <BookOpen className="size-4 text-emerald-700" />



                Learner&apos;s question



              </div>



              <p className="mt-2 text-sm leading-6 text-slate-600">



                {request.description}



              </p>



            </div>







            {request.assignmentName && (



              <div className="mt-3 rounded-xl border border-slate-200 p-3">



                <div className="flex items-center gap-3">



                  <FileText className="size-4 shrink-0 text-emerald-700" />



                  <div className="min-w-0 flex-1">



                    <p className="truncate text-sm font-medium text-slate-800">



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



                      className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"



                    >



                      Open



                    </a>



                  )}



                </div>



              </div>



            )}







            <div className="mt-3 border-t border-slate-100 pt-3">



              <button



                type="button"



                onClick={() => setShowAssignment((value) => !value)}



                className="text-xs font-semibold text-slate-500 hover:text-slate-900"



              >



                {showAssignment ? "Hide assignment details" : "Show assignment details"}



              </button>







              {showAssignment && (



                <p className="mt-2 text-xs leading-5 text-slate-500">



                  Work through the problem together on the shared whiteboard.



                </p>



              )}



            </div>



          </div>







          <div className="border-t border-slate-100 px-4 py-3">



            <div className="flex items-center gap-2 text-xs text-slate-500">



              <Clock3 className="size-3.5" />



              <span>{formatDuration(elapsedSeconds)}</span>



              <span className="text-slate-300">•</span>



              <span>{otherPersonLabel} connected</span>



            </div>



          </div>



        </>



      ) : (



        <button



          type="button"



          onClick={() => setShowHomeworkPanel(true)}



          className="flex items-center gap-2 px-4 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"



        >



          <MessageCircle className="size-4 text-emerald-700" />



          Homework



        </button>



      )}



    </aside>



  );







  if (!videoCredentials) {



    return (



      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">



        <div className="max-w-md text-center">



          {connectionError ? (



            <>



              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-300">



                <PhoneOff className="size-6" />



              </div>



              <h1 className="mt-5 text-xl font-semibold">



                Unable to prepare the classroom



              </h1>



              <p className="mt-2 text-sm leading-6 text-slate-400">



                {connectionError}



              </p>



              <button



                type="button"



                onClick={() => void loadDailyCredentials()}



                className="mt-5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"



              >



                Try again



              </button>



            </>



          ) : (



            <>



              <Loader2 className="mx-auto size-8 animate-spin text-emerald-300" />



              <h1 className="mt-5 text-lg font-semibold">



                Preparing your live classroom…



              </h1>



              <p className="mt-2 text-sm text-slate-400">



                Setting up your private Daily room.



              </p>



            </>



          )}



        </div>



      </main>



    );



  }







  return (



    <main className="fixed inset-0 overflow-hidden bg-white text-slate-900">



      <div className="absolute inset-0 z-0">



        <Whiteboard



          mode="standalone"



          leftInset={participantRailWidth}



          remoteData={remoteWhiteboardData}



          onRealtimeChange={handleWhiteboardChange}



          onClose={() => {



            window.location.href = "/live-help";



          }}



        />



      </div>







      <section className="pointer-events-none absolute inset-0 z-[800]">



        <VideoCall



          sessionId={videoCredentials.videoSessionId}



          token={videoCredentials.token}



          roomUrl={videoCredentials.roomUrl}



          role={videoCredentials.role === "tutor" ? "educator" : "student"}



          onParticipantRailWidthChange={setParticipantRailWidth}



          onSignal={handleWhiteboardSignal}



          onSignalReady={(sendSignal) => {



            whiteboardSendRef.current = sendSignal;



          }}



          onConnected={handleConnected}



          onEndSession={handleEndSession}



        />



      </section>







      {homeworkPanel}







      {connectionError && (



        <div className="pointer-events-auto fixed bottom-5 left-1/2 z-[1000] -translate-x-1/2 rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm text-rose-700 shadow-xl">



          {connectionError}



        </div>



      )}







      {isTeacher && sessionStatus === "ENDED" && (



        <div className="pointer-events-auto fixed inset-0 z-[1100] flex items-center justify-center bg-slate-950/70 p-6">



          <div className="w-full max-w-md rounded-2xl bg-white p-7 text-center shadow-2xl">



            <ShieldCheck className="mx-auto size-10 text-emerald-600" />



            <h2 className="mt-4 text-xl font-semibold text-slate-950">



              Live homework session ended



            </h2>



            <p className="mt-2 text-sm leading-6 text-slate-500">



              The session has been saved. You can return to Live Homework Help.



            </p>



            <button



              type="button"



              onClick={() => {



                window.location.href = "/live-help";



              }}



              className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800"



            >



              <Sparkles className="size-4" />



              Return to Live Homework Help



            </button>



          </div>



        </div>



      )}







    </main>



  );



}




