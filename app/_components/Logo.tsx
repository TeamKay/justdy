"use client";

import Link from "next/link";
import Image from "next/image";
import clsx from "clsx";

import LogoImg from "@/public/images/logo.png";

interface MyLogoProps {
  showText?: boolean;
  className?: string;
  clickable?: boolean;
}

export default function MyLogo({
  showText = true,
  className,
  clickable = true,
}: MyLogoProps) {
  const content = (
    <>
      <Image
        src={LogoImg}
        alt="Justdy"
        width={34}
        height={34}
        priority
        className="
          h-8
          w-8
          object-contain
          transition-transform
          duration-200
          group-hover:scale-105
        "
      />

      {showText && (
        <span
          className="
            ml-2.5
            text-[19px]
            font-bold
            tracking-[-0.04em]
            text-blue-500
            transition-colors
            duration-200
            group-hover:text-blue-600
          "
        >
          Justdy
        </span>
      )}
    </>
  );

  const classNames = clsx(
    "group inline-flex items-center shrink-0",
    "rounded-lg",
    "px-2 py-1.5",
    "transition-all duration-200 ease-out",
    "hover:bg-blue-100",
    "active:scale-[0.97]",
    "focus-visible:outline-none",
    "focus-visible:ring-2",
    "focus-visible:ring-[#857938]/30",
    "focus-visible:ring-offset-2",
    className,
  );

  // Non-clickable logo
  if (!clickable) {
    return (
      <div aria-label="Justdy" className={classNames}>
        {content}
      </div>
    );
  }

  // Normal clickable logo
  return (
    <Link href="/" aria-label="Justdy home" className={classNames}>
      {content}
    </Link>
  );
}
