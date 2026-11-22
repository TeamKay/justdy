import { X } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-svh w-full bg-background">
      {/* Close button */}
      <Link
        href="/"
        aria-label="Close"
        className="
          fixed
          top-5
          right-5
          z-50
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-full
          text-zinc-500
          transition-all
          hover:bg-zinc-100
          hover:text-zinc-900
          dark:hover:bg-zinc-800
          dark:hover:text-zinc-100
        "
      >
        <X className="h-6 w-6" />
      </Link>

      <div className="w-full">{children}</div>
    </main>
  );
}

