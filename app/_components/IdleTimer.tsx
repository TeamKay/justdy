"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { authClient } from "@/lib/auth-client"; 
import { useRouter } from "next/navigation";

const IDLE_TIMEOUT = 1 * 60 * 1000; // 5 Minutes total
const WARNING_TIME = 30 * 1000;    // 30 seconds
const LOGOUT_TIME = IDLE_TIMEOUT - WARNING_TIME;

export default function IdleTimer() {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(30);
  
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);

  const logout = useCallback(async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          setShowWarning(false);
          router.push("/login");
          router.refresh();
        },
      },
    });
  }, [router]);

  const resetTimer = useCallback(() => {
    // Only trigger a state change if the modal is actually open
    setShowWarning((prev) => {
      if (prev) return false;
      return prev;
    });

    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);

    warningTimerRef.current = setTimeout(() => {
      setSecondsLeft(30); // Reset the visual countdown
      setShowWarning(true);
    }, LOGOUT_TIME);

    logoutTimerRef.current = setTimeout(logout, IDLE_TIMEOUT);
  }, [logout]);

  // 1. Monitor user activity
  useEffect(() => {
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    
    // Start timers on mount without calling setState immediately
    warningTimerRef.current = setTimeout(() => {
      setSecondsLeft(30);
      setShowWarning(true);
    }, LOGOUT_TIME);
    logoutTimerRef.current = setTimeout(logout, IDLE_TIMEOUT);

    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    return () => {
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [resetTimer, logout]);

  // 2. Handle the visual countdown tick
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showWarning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showWarning, secondsLeft]);

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in duration-300">
        <div className="flex items-center gap-3 text-amber-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Session Expiring</h2>
        </div>
        
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          You have been inactive for 5 minutes. You will be automatically logged out in:
        </p>
        
        <div className="mt-4 flex justify-center">
          <span className="text-4xl font-mono font-bold text-blue-600 dark:text-blue-400">
            00:{secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft}
          </span>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3">
          <button
            onClick={logout}
            className="order-2 sm:order-1 px-4 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
          >
            Log out now
          </button>
          <button
            onClick={resetTimer}
            className="order-1 sm:order-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-700 active:scale-95 transition-all"
          >
            I&apos;m still here
          </button>
        </div>
      </div>
    </div>
  );
}