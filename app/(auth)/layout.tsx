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

// import { X } from "lucide-react";
// import Link from "next/link";
// import { ReactNode } from "react";

// export default function AuthLayout({ children }: { children: ReactNode }) {
//   return (
//     <div className="relative flex min-h-svh flex-col items-center justify-center">
//       {/* Minimal close button - icon only */}
//       <Link
//         href="/"
//         className="absolute top-4 right-4 z-50 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
//       >
//         <X className="size-7" />
//       </Link>

//       <div className="flex w-full flex-col gap-6">{children}</div>
//     </div>
//   );
// }
