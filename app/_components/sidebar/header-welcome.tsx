import Link from "next/link";
import { IconLogout } from "@tabler/icons-react";

export function HeaderWelcome({ name }: { name: string }) {
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 flex items-center justify-between w-full h-14">
      {/* Left Side: Hamburger Menu + Welcome Text */}
      <div className="flex items-center gap-3">
        <h3 className="text-sm md:text-lg font-semibold text-white truncate max-w-45 sm:max-w-none">
          Welcome, <span className="text-[#DFFF00]">{name}</span>
        </h3>
      </div>

      {/* Right Side: Exit Button */}
      <Link
        href="/"
        className="
          flex items-center gap-1.5 md:gap-2
          rounded-md px-2.5 py-1.5 md:px-3 md:py-2 text-xs md:text-sm
          bg-white/5 border border-white/10
          hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400
          transition shrink-0
        "
      >
        <IconLogout size={14} className="md:w-4 md:h-4" />
        <span>Exit</span>
      </Link>
    </div>
  );
}

// import Link from "next/link";
// import { IconLogout } from "@tabler/icons-react";

// export function HeaderWelcome({ name }: { name: string }) {
//   return (
//     <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row md:items-center md:justify-between gap-0">
//       <div>
//         <h3 className="text-lg font-semibold text-white">
//           Welcome back, <span className="text-[#DFFF00]">{name}</span>
//         </h3>
//       </div>

//       <Link
//         href="/"
//         className="
//           flex items-center gap-2
//           rounded-md px-3 py-2 text-sm
//           bg-white/5 border border-white/10
//           hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400
//           transition
//         "
//       >
//         <IconLogout size={16} />
//         Exit
//       </Link>
//     </div>
//   );
// }
