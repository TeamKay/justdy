import { X } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";
import { buttonVariants } from "../_components/ui/button";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center">
      {/* Floating modal-style close button */}
      <Link
        href="/"
        className={buttonVariants({
          variant: "outline",
          className:
            "absolute top-4 right-4 z-50 w-11 h-11 rounded-full p-0 flex items-center justify-center " +
            "bg-white/10 backdrop-blur-xl border border-white/10 text-zinc-300 " +
            "shadow-lg shadow-black/30 " +
            "before:absolute before:inset-0 before:rounded-full before:bg-white/10 before:blur-xl before:opacity-0 hover:before:opacity-100 " +
            "hover:text-white hover:bg-white/20 transition-all duration-200 hover:scale-110",
        })}
      >
        <X className="size-4" />
      </Link>

      <div className="flex w-full flex-col gap-6">{children}</div>
    </div>
  );
}
