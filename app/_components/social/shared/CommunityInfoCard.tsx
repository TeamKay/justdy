
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Users } from "lucide-react";

const communityImages = [
  "/images/community-banner.jpg",
  "/images/community-banner-2.jpg",
  "/images/community-banner-3.jpg",
];

interface CommunityInfoCardProps {
  isLoggedIn: boolean;
}

interface CommunityStats {
  members: number;
  online: number;
  tutors: number;
}

export default function CommunityInfoCard({
  isLoggedIn,
}: CommunityInfoCardProps) {
  const [activeImage, setActiveImage] = useState(0);
  const [stats, setStats] = useState<CommunityStats | null>(null);

  // Rotate carousel images every five seconds.
  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveImage((current) => (current + 1) % communityImages.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  // Automatically refresh community statistics every five seconds.
  useEffect(() => {
    let mounted = true;
    let interval: number | undefined;

    const fetchStats = async () => {
      if (document.visibilityState !== "visible") return;

      try {
        const response = await fetch("/api/community/stats", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch community statistics.");
        }

        const data: CommunityStats = await response.json();

        if (mounted) {
          setStats(data);
        }
      } catch (error) {
        if (mounted) {
          console.error("Community statistics error:", error);
        }
      }
    };

    const startPolling = () => {
      if (interval !== undefined) return;

      fetchStats();
      interval = window.setInterval(fetchStats, 5000);
    };

    const stopPolling = () => {
      if (interval !== undefined) {
        window.clearInterval(interval);
        interval = undefined;
      }
    };

    if (document.visibilityState === "visible") {
      startPolling();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        startPolling();
      } else {
        stopPolling();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      mounted = false;
      stopPolling();
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, []);

  // Update authenticated user's online presence every 30 seconds.
  useEffect(() => {
    if (!isLoggedIn) return;

    let mounted = true;

    const updatePresence = async () => {
      if (document.visibilityState !== "visible") return;

      try {
        await fetch("/api/community/presence", {
          method: "POST",
          cache: "no-store",
        });
      } catch (error) {
        if (mounted) {
          console.error("Unable to update online presence:", error);
        }
      }
    };

    updatePresence();

    const interval = window.setInterval(updatePresence, 30_000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        updatePresence();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      mounted = false;
      window.clearInterval(interval);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [isLoggedIn]);

  return (
    <section className="overflow-hidden rounded-lg border border-[#E5EAE3] bg-white shadow-[0_4px_20px_rgba(23,59,47,0.07)] transition-shadow duration-300 hover:shadow-[0_8px_28px_rgba(23,59,47,0.10)]">

      {/* Image carousel */}
      <div className="group relative h-48 overflow-hidden bg-[#EAF1EB]">
        {communityImages.map((image, index) => (
          <img
            key={image}
            src={image}
            alt={`Justdy Learning Community - ${index + 1}`}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
              activeImage === index ? "opacity-100" : "opacity-0"
            }`}
            loading={index === 0 ? "eager" : "lazy"}
          />
        ))}

        <div className="absolute inset-0 bg-linear-to-t from-[#152C20]/75 via-[#152C20]/10 to-black/10" />

        <div className="absolute bottom-4 left-4">
          <p className="text-sm font-bold tracking-wide text-white drop-shadow-md">
            Learn. Connect. Grow.
          </p>
        </div>

        <div className="absolute bottom-4 right-4 flex items-center gap-1.5">
          {communityImages.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Show image ${index + 1}`}
              aria-pressed={activeImage === index}
              onClick={() => setActiveImage(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                activeImage === index
                  ? "w-7 bg-[#F8D783]"
                  : "w-1.5 bg-white/70 hover:bg-white"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Community information */}
      <div className="p-5">
        <div>
          <h2 className="text-[16px] font-bold tracking-tight text-[#202820]">
            Justdy Learning Community
          </h2>

          <p className="mt-3 text-[13px] leading-5 text-[#657167]">
            A welcoming space for learners passionate about mathematics,
            technology and personal growth. Share ideas, ask questions,
            learn together, grow your skills and book sessions with experts.
          </p>
        </div>

        {/* Automatically refreshed community statistics */}
        <div className="mt-5 grid grid-cols-3 divide-x divide-[#E3EAE3] rounded-lg border border-[#E8EEE8] bg-[#F8FAF7] py-4">
          <div className="text-center">
            <p className="text-xl font-extrabold tracking-tight text-[#234C38] tabular-nums">
              {stats ? stats.members.toLocaleString() : "—"}
            </p>
            <p className="mt-1 text-[10px] font-normal tracking-wider text-[#87938A]">
              Members
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5">
              <p className="text-xl font-extrabold tracking-tight text-[#234C38] tabular-nums">
                {stats ? stats.online.toLocaleString() : "—"}
              </p>
            </div>
            <p className="mt-1 text-[10px] font-normal tracking-wider text-[#87938A]">
              Online
            </p>
          </div>

          <div className="text-center">
            <p className="text-xl font-extrabold tracking-tight text-[#234C38] tabular-nums">
              {stats ? stats.tutors.toLocaleString() : "—"}
            </p>
            <p className="mt-1 text-[10px] font-normal tracking-wider text-[#87938A]">
              Tutors
            </p>
          </div>
        </div>

        {/* Community footer */}
        <div className="mt-5 flex items-center gap-2">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EAF1EB] text-[#315E43]">
            <Users className="h-3 w-3" />
          </div>

          <span className="text-[11px] font-medium text-[#748177]">
            Learning together, growing together
          </span>
        </div>

        {/* Only show join button to logged-out visitors */}
        {!isLoggedIn && (
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(new Event("justdy:open-public-signin"))
            }
            className="mt-5 flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#312c65] px-4 py-3 text-sm font-extrabold tracking-wide text-[#ffffff] shadow-[0_3px_8px_rgba(185,120,50,0.13)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#312c65] hover:shadow-[0_6px_14px_rgba(185,120,50,0.20)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B97832] focus-visible:ring-offset-2"
          >
            JOIN THE COMMUNITY
            <ArrowUpRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </section>
  );
}
