"use client";

import { useState, useMemo } from "react";
import EducatorCard from "@/app/_components/EducatorCard";
import { Search, SlidersHorizontal } from "lucide-react";

interface Educator {
  id: string;
  name: string | null;
  imageUrl: string | null;
  specialty: string | null;
  experience: number | null;
  description: string | null;
}

export default function EducatorsList({
  initialEducators,
}: {
  initialEducators: Educator[];
}) {
  const [selectedSpecialty, setSelectedSpecialty] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEducators = useMemo(() => {
    return initialEducators.filter((edu) => {
      const matchesSpecialty =
        selectedSpecialty === "All" || edu.specialty === selectedSpecialty;

      const matchesSearch = (edu.name || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      return matchesSpecialty && matchesSearch;
    });
  }, [selectedSpecialty, searchQuery, initialEducators]);

  return (
    <div className="relative min-h-screen w-full bg-background px-4 py-0 text-slate-100 overflow-hidden">
      <div className="mx-auto max-w-6xl space-y-10">
        {/* === HEADER === */}

        {/* === SEARCH & FILTER BAR === */}
        <div className="flex flex-col sm:flex-row gap-3 p-2 rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-md shadow-lg">
          {/* SEARCH INPUT */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search tutor by name..."
              className="w-full bg-transparent text-sm h-11 pl-10 pr-4 text-white placeholder:text-slate-500 focus:outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* DIVIDER LINE FOR DESKTOP */}
          <div className="hidden sm:block w-px bg-slate-800 my-2" />

          {/* SUBJECT FILTER */}
          <div className="relative w-full sm:w-60 flex items-center">
            <SlidersHorizontal className="absolute left-3 size-4 text-slate-500 pointer-events-none" />
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="w-full h-11 bg-transparent pl-9 pr-8 text-sm text-slate-200 cursor-pointer focus:outline-none appearance-none rounded-lg hover:bg-slate-800/30 transition-colors"
            >
              <option value="All" className="bg-[#12181d] text-white">
                Filter by subject
              </option>
            </select>
            <div className="absolute right-3 pointer-events-none text-slate-500 text-xs">
              ▼
            </div>
          </div>
        </div>

        {/* === RESULTS COUNT INDICATOR === */}
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-4 text-sm text-slate-400">
          <span>
            Showing{" "}
            <strong className="text-emerald-400 font-medium">
              {filteredEducators.length}
            </strong>{" "}
            tutors
          </span>
        </div>

        {/* === GRID LAYOUT === */}
        {filteredEducators.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {filteredEducators.map((educator) => (
              <EducatorCard
                key={educator.id}
                educator={{
                  id: educator.id,
                  name: educator.name || "Anonymous Tutor",
                  imageUrl: educator.imageUrl || undefined,
                  specialty: educator.specialty || "General Education",
                  experience:
                    educator.experience !== null
                      ? String(educator.experience)
                      : "0",
                  description: educator.description || "",
                }}
              />
            ))}
          </div>
        ) : (
          /* === CLEAN EMPTY STATE === */
          <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-dashed border-slate-800 bg-slate-900/10">
            <p className="text-sm text-slate-400 text-center max-w-sm">
              We couldn&apos;t find any tutors matching &quot;
              {searchQuery || selectedSpecialty}&quot;. Try broadening your
              search terms.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
