"use client";

import Link from "next/link";
import Image from "next/image";
import clsx from "clsx";
import LogoImg from "@/public/images/logo.png";

export default function MyLogo() {
  return (
    <div>
      <Link
        href="/"
        className={clsx(
          "flex items-center gap-2 shrink-0 px-3 py-1.5 rounded-md transition-all duration-300 ease-in-out border border-transparent",
          "active:scale-95",
        )}
      >
        <Image src={LogoImg} alt="Logo" width={28} height={28} priority />

        {/* Hidden on mobile, visible from sm and above */}
        <span className="hidden sm:inline font-semibold text-lg">Justdy</span>
      </Link>
    </div>
  );
}
