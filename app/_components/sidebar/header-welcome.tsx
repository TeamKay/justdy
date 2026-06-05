import Link from "next/link";
import { IconLogout } from "@tabler/icons-react";

export function HeaderWelcome({ name }: { name: string }) {
  return (
    <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row md:items-center md:justify-between gap-0">
      <div>
        <h3 className="text-lg font-semibold text-white">
          Welcome back, <span className="text-[#DFFF00]">{name}</span>
        </h3>
      </div>

      <Link
        href="/"
        className="
          flex items-center gap-2
          rounded-md px-3 py-2 text-sm
          bg-white/5 border border-white/10
          hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400
          transition
        "
      >
        <IconLogout size={16} />
        Exit
      </Link>
    </div>
  );
}
