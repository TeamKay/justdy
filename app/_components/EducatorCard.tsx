import Image from "next/image";
import { Calendar, User, Share2 } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import Link from "next/link";

interface EducatorProps {
  educator: {
    id: string;
    name: string;
    imageUrl?: string;
    specialty: string;
    experience: string;
    description: string;
  };
}

export default function EducatorCard({ educator }: EducatorProps) {
  return (
    // Added pt-0 to the Card container to kill any default top-padding rules
    <Card className="group relative flex flex-col overflow-hidden pt-0 border border-slate-800/80 bg-[#0b0f17] backdrop-blur-sm transition-all duration-300 hover:border-emerald-500/30 hover:shadow-[0_0_30px_rgba(16,185,129,0.05)] rounded-xl">
      {/* === TOP SECTION: IMAGE SITS FLUSH AGAINST THE TOP BORDER === */}
      <div className="relative w-full aspect-4/3 bg-slate-800 border-b border-slate-800/50 overflow-hidden rounded-t-xl">
        {educator.imageUrl ? (
          <Image
            src={educator.imageUrl}
            alt={educator.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            priority
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <User className="w-12 h-12 text-slate-600" />
          </div>
        )}

        {/* FLOATING EXPERIENCE BADGE */}
        <div className="absolute top-3 right-3 z-10 bg-[#0b0f17]/80 backdrop-blur-md border border-slate-700/60 text-[#00cc88] font-semibold text-[11px] px-2.5 py-1 rounded-md shadow-lg tracking-wide">
          {educator.experience} Years
        </div>

        {/* FLOATING SHARE ACTION */}
        <button
          className="absolute right-3 -bottom-5 z-10 flex items-center justify-center size-10 rounded-full bg-slate-900 border border-slate-700 text-slate-300 shadow-md hover:bg-slate-800 hover:text-white transition-colors"
          onClick={(e) => {
            e.preventDefault();
          }}
        >
          <Share2 className="size-4" />
        </button>
      </div>

      {/* === BOTTOM SECTION: CONTENT === */}
      {/* Reduced pt-5 to pt-4 so the text content feels perfectly spaced right underneath the overlapping share button */}
      <CardContent className="p-5 flex flex-col justify-between grow gap-4 pt-3">
        <div className="space-y-1">
          {/* CATEGORY / SPECIALTY BADGE */}
          <span className="text-xs font-bold tracking-wider uppercase text-[#00cc88]">
            {educator.specialty}
          </span>

          {/* TUTOR NAME */}
          <h3 className="font-bold text-white text-lg md:text-xl leading-snug tracking-tight group-hover:text-[#00cc88] transition-colors line-clamp-1">
            {educator.name}
          </h3>

          {/* DESCRIPTION */}
          {educator.description && (
            <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed pt-1">
              {educator.description}
            </p>
          )}
        </div>

        {/* ACTION BUTTON */}
        <Button
          asChild
          className="w-full mt-2 bg-[#00cc88] hover:bg-[#00b377] text-slate-950 font-bold transition-all shadow-md rounded-lg h-11 text-sm"
        >
          <Link
            href={`/educators/${educator.id}`}
            className="flex items-center justify-center gap-2"
          >
            <Calendar className="size-4" />
            View Profile & Book
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
