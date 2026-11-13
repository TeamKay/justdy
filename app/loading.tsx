
import { GraduationCap } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F6F8F5]">
      <div className="flex flex-col items-center gap-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#312c65] text-white shadow-lg">
          <GraduationCap className="h-9 w-9" />
        </div>

        <div className="text-center">
          <h2 className="text-xl font-bold tracking-tight text-[#173B2F]">
            Justdy
          </h2>
          <p className="mt-1 text-sm text-[#718075]">
            Preparing your learning experience...
          </p>
        </div>

        <div className="h-1.5 w-40 overflow-hidden rounded-full bg-[#DDE8DD]">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-[#6D9B72]" />
        </div>
      </div>
    </div>
  );
}
