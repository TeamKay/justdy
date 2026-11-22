import Link from "next/link";

export default function Announcements() {
  return (
    <div className="relative flex h-13 w-full items-center justify-center overflow-hidden rounded-lg border border-[#DCE9DD] bg-[#1c0a4a] shadow-[0_15px_45px_rgba(21,63,56,0.06)]">
     

      <div className="relative z-10 flex items-center justify-center gap-3">
        {/* Glowing status dot */}
        <span className="relative flex h-2.5 w-2.5 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#b7ff36] opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#d7ff4a] shadow-[0_0_6px_2px_rgba(215,255,74,0.9),0_0_14px_5px_rgba(215,255,74,0.5)]" />
        </span>

        <span className="text-center text-xs font-semibold text-[#ffffff] sm:text-sm">
          Thanksgiving Math Tutoring Deals Are Here!
        </span>

        <Link
          href="/tutoring"
          className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-bold text-[#d7f60b] transition hover:text-[#d7f60b]"
        >
          Book Now!
        </Link>
      </div>
    </div>
  );
}