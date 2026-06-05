"use client";

import React, { useRef, useState } from "react";

interface Props {
  src: string;
  poster?: string;
}

export default function YouTubeStyleVideoPlayer({ src, poster }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  // Play / Pause
  const togglePlay = async () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      await videoRef.current.play();
    }
  };

  // Progress update
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const total = videoRef.current.duration;

    setProgress((current / total) * 100);
  };

  // Seek
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;

    const newTime = (clickX / width) * videoRef.current.duration;
    videoRef.current.currentTime = newTime;
  };

  // Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-black overflow-hidden rounded-lg group"
    >
      {/* VIDEO */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-cover"
        onClick={togglePlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => {
          if (!videoRef.current) return;
          setDuration(videoRef.current.duration);
        }}
      />

      {/* BUFFERING */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* CENTER PLAY BUTTON */}
      {!isPlaying && !isBuffering && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-20 h-20 bg-white/30 hover:bg-white/40 rounded-full flex items-center justify-center transition">
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-10 h-10 ml-1"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </button>
      )}

      {/* CONTROLS */}
      <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition">
        {/* Progress Bar */}
        <div
          className="w-full h-1 bg-white/20 cursor-pointer"
          onClick={handleSeek}
        >
          <div
            className="h-full bg-red-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Bottom Controls */}
        <div className="flex items-center justify-between mt-2 text-white">
          {/* Play / Pause */}
          <button onClick={togglePlay}>{isPlaying ? "❚❚" : "▶"}</button>

          {/* Time */}
          <div className="text-xs">
            {Math.floor((progress / 100) * duration || 0)}s /{" "}
            {Math.floor(duration || 0)}s
          </div>

          {/* Fullscreen */}
          <button onClick={toggleFullscreen} className="text-sm">
            ⛶
          </button>
        </div>
      </div>
    </div>
  );
}
