"use client";

import Link from "next/link";

export default function BecomeTutorButton() {
  return (
    <Link
      href="/tutoring/apply"
      className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-muted"
    >
      Become a Tutor
    </Link>
  );
}
