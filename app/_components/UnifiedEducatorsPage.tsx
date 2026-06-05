"use client";

import { useState, useMemo } from "react";
import { Specialties } from "@/lib/Specialties";
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

export default function UnifiedEducatorsClient({
  initialEducators,
}: {
  initialEducators: Educator[];
}) {
  const [selectedSpecialty, setSelectedSpecialty] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const specialties = ["All", ...Specialties.map((s) => s.name)];

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
    <div className="relative min-h-screen w-full bg-background px-4 py-12 text-slate-100 overflow-hidden">
      {/* === MODERN AMBIENT BACKGROUND === */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 h-125 w-250 -translate-x-1/2 rounded-full bg-emerald-500/6 blur-[120px]" />
        <div className="absolute top-1/4 right-0 h-75 w-75 bg-blue-500/4 blur-[100px]" />
      </div>

      <div className="mx-auto max-w-6xl space-y-10">
        {/* === HEADER === */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Find the perfect tutor
          </h1>
          <p className="text-slate-400 text-base max-w-xl">
            Discover specialized educators tailored to your learning style and
            goals.
          </p>
        </div>

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
              {specialties
                .filter((s) => s !== "All")
                .map((spec) => (
                  <option
                    key={spec}
                    value={spec}
                    className="bg-[#12181d] text-white"
                  >
                    {spec}
                  </option>
                ))}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

// "use client";

// import { useState, useMemo } from "react";
// import { Specialties } from "@/lib/Specialties";
// import EducatorCard from "@/app/_components/EducatorCard";
// import { Search, ChevronDown } from "lucide-react";

// interface Educator {
//   id: string;
//   name: string | null;
//   imageUrl: string | null;
//   specialty: string | null;
//   experience: number | null;
//   description: string | null;
// }

// export default function UnifiedEducatorsClient({
//   initialEducators,
// }: {
//   initialEducators: Educator[];
// }) {
//   const [selectedSpecialty, setSelectedSpecialty] = useState("All");
//   const [searchQuery, setSearchQuery] = useState("");

//   const specialties = ["All", ...Specialties.map((s) => s.name)];

//   const filteredEducators = useMemo(() => {
//     return initialEducators.filter((edu) => {
//       const matchesSpecialty =
//         selectedSpecialty === "All" || edu.specialty === selectedSpecialty;

//       const matchesSearch = (edu.name || "")
//         .toLowerCase()
//         .includes(searchQuery.toLowerCase());

//       return matchesSpecialty && matchesSearch;
//     });
//   }, [selectedSpecialty, searchQuery, initialEducators]);

//   return (
//     <div className="relative min-h-screen w-full bg-background px-5 py-5 text-white overflow-hidden animate-in fade-in duration-700">
//       {/* === PREMIUM BACKGROUND LAYERS === */}
//       <div className="absolute inset-0 -z-10 overflow-hidden">
//         <div className="absolute top-0 left-1/2 h-105 w-225 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[130px]" />
//         <div className="absolute bottom-0 right-0 h-75 w-75 bg-blue-500/10 blur-[120px]" />
//         <div className="absolute top-1/2 left-0 h-62.5 w-62.5 bg-purple-500/10 blur-[120px]" />
//         <div className="absolute inset-0 opacity-[0.03] bg-[url('/noise.png')]" />
//       </div>

//       <div className="mx-auto max-w-7xl space-y-6">
//         {/* === HEADER === */}
//         <div className="text-center space-y-3">
//           <h1 className="text-3xl md:text-3xl font-bold tracking-tight bg-linear-to-r from-white via-white to-emerald-300 bg-clip-text text-transparent">
//             Discover Expert Educators
//           </h1>

//           <div className="h-px w-24 bg-emerald-400/30 mx-auto" />
//         </div>

//         {/* === CONTROL PANEL (GLASS) === */}
//         <header className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-5 rounded-md border border-white/5 bg-emerald-950/30 backdrop-blur-xl">
//           {/* SEARCH */}
//           <div className="relative flex-1">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
//             <input
//               type="text"
//               placeholder="Search educators, expertise, or keywords..."
//               className="w-full bg-transparent border border-white/5 rounded-md py-3 pl-10 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400/30 transition-all"
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//             />
//           </div>

//           {/* FILTER */}
//           <div className="relative w-full md:w-64">
//             <select
//               value={selectedSpecialty}
//               onChange={(e) => setSelectedSpecialty(e.target.value)}
//               className="w-full appearance-none bg-transparent border border-white/5 rounded-md py-3 px-4 text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400/30"
//             >
//               {specialties.map((spec) => (
//                 <option key={spec} value={spec} className="bg-[#0b0f17]">
//                   {spec}
//                 </option>
//               ))}
//             </select>

//             <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-500 pointer-events-none" />
//           </div>

//           {/* COUNTER */}
//           <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-md border border-white/5 bg-white/5 backdrop-blur-xl">
//             <div className="h-2 w-2 rounded-md bg-emerald-400 animate-pulse" />
//             <span className="text-sm font-medium text-emerald-300">
//               {filteredEducators.length} Experts Available
//             </span>
//           </div>
//         </header>

//         {/* === GRID === */}
//         {filteredEducators.length > 0 ? (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-5">
//             {filteredEducators.map((educator) => (
//               <div
//                 key={educator.id}
//                 className="transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
//               >
//                 <EducatorCard
//                   educator={{
//                     id: educator.id,
//                     name: educator.name || "Unknown",
//                     imageUrl: educator.imageUrl || undefined,
//                     specialty: educator.specialty || "General",
//                     experience:
//                       educator.experience !== null
//                         ? String(educator.experience)
//                         : "0",
//                     description: educator.description || "",
//                   }}
//                 />
//               </div>
//             ))}
//           </div>
//         ) : (
//           /* === EMPTY STATE === */
//           <div className="flex flex-col items-center justify-center py-28 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-xl">
//             <div className="text-5xl mb-4 opacity-80">🔍</div>
//             <h3 className="text-xl font-semibold text-white">
//               No educators found
//             </h3>
//             <p className="text-slate-400 mt-2 text-center max-w-sm text-sm">
//               Adjust your filters or try a different keyword to discover
//               experts.
//             </p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
