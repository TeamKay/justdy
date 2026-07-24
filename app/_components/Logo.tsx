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
          "hover:bg-accent/40 hover:backdrop-blur-sm hover:border-accent/50 hover:shadow-sm",
        )}
      >
        {/* 2. Use the renamed variable here */}
        <Image src={LogoImg} alt="Logo" width={28} height={28} priority />
        <span className="font-semibold text-lg">Justdy</span>
      </Link>
    </div>
  );
}
