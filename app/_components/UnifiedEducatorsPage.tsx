"use client";

import { useState, useMemo } from "react";
import { Specialties } from "@/lib/Specialties";
import EducatorCard from "@/app/_components/EducatorCard";
import { Search, ChevronDown } from "lucide-react";

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
    <div className="relative min-h-screen w-full bg-background px-5 py-5 text-white overflow-hidden animate-in fade-in duration-700">
      {/* === PREMIUM BACKGROUND LAYERS === */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 h-105 w-225 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[130px]" />
        <div className="absolute bottom-0 right-0 h-75 w-75 bg-blue-500/10 blur-[120px]" />
        <div className="absolute top-1/2 left-0 h-62.5 w-62.5 bg-purple-500/10 blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.03] bg-[url('/noise.png')]" />
      </div>

      <div className="mx-auto max-w-7xl space-y-6">
        {/* === HEADER === */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl md:text-3xl font-bold tracking-tight bg-linear-to-r from-white via-white to-emerald-300 bg-clip-text text-transparent">
            Discover Expert Educators
          </h1>

          <div className="h-px w-24 bg-emerald-400/30 mx-auto" />
        </div>

        {/* === CONTROL PANEL (GLASS) === */}
        <header className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-5 rounded-md border border-white/5 bg-emerald-950/30 backdrop-blur-xl">
          {/* SEARCH */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search educators, expertise, or keywords..."
              className="w-full bg-transparent border border-white/5 rounded-md py-3 pl-10 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400/30 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* FILTER */}
          <div className="relative w-full md:w-64">
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="w-full appearance-none bg-transparent border border-white/5 rounded-md py-3 px-4 text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400/30"
            >
              {specialties.map((spec) => (
                <option key={spec} value={spec} className="bg-[#0b0f17]">
                  {spec}
                </option>
              ))}
            </select>

            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-500 pointer-events-none" />
          </div>

          {/* COUNTER */}
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-md border border-white/5 bg-white/5 backdrop-blur-xl">
            <div className="h-2 w-2 rounded-md bg-emerald-400 animate-pulse" />
            <span className="text-sm font-medium text-emerald-300">
              {filteredEducators.length} Experts Available
            </span>
          </div>
        </header>

        {/* === GRID === */}
        {filteredEducators.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-5">
            {filteredEducators.map((educator) => (
              <div
                key={educator.id}
                className="transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                <EducatorCard
                  educator={{
                    id: educator.id,
                    name: educator.name || "Unknown",
                    imageUrl: educator.imageUrl || undefined,
                    specialty: educator.specialty || "General",
                    experience:
                      educator.experience !== null
                        ? String(educator.experience)
                        : "0",
                    description: educator.description || "",
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          /* === EMPTY STATE === */
          <div className="flex flex-col items-center justify-center py-28 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-xl">
            <div className="text-5xl mb-4 opacity-80">🔍</div>
            <h3 className="text-xl font-semibold text-white">
              No educators found
            </h3>
            <p className="text-slate-400 mt-2 text-center max-w-sm text-sm">
              Adjust your filters or try a different keyword to discover
              experts.
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
//     <div className="relative min-h-screen w-full bg-background px-6 py-10">
//       {/* background glow */}
//       <div className="absolute top-0 left-1/2 -z-10 h-72 w-full -translate-x-1/2 bg-[radial-gradient(circle_at_top,var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent blur-3xl" />

//       <div className="mx-auto max-w-8xl space-y-5">
//         {/* HEADER */}

//         <div className="text-center space-y-2">
//           <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
//             Discover Expert Educators
//           </h1>
//           <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto">
//             Search, filter, and connect with top educators across specialized
//             fields.
//           </p>
//         </div>

//         {/* Inline Header Section */}
//         <header className="flex flex-row items-center justify-between mb-10 py-2 border-b border-white/5">
//           <div className="relative flex-1">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />

//             <input
//               type="text"
//               placeholder="Search educators, expertise, or keywords..."
//               className="w-100 bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//             />
//           </div>

//           <div className="relative w-full md:w-64">
//             <select
//               value={selectedSpecialty}
//               onChange={(e) => setSelectedSpecialty(e.target.value)}
//               className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
//             >
//               {specialties.map((spec) => (
//                 <option key={spec} value={spec} className="bg-slate-900">
//                   {spec}
//                 </option>
//               ))}
//             </select>

//             <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-500 pointer-events-none" />
//           </div>

//           {/* Optional: Counter badge for a professional touch */}
//           <div className="hidden sm:block px-4 py-1.5 rounded-md bg-white/5 border border-white/10 backdrop-blur-md">
//             <span className="text-sm font-medium text-blue-400">
//               {filteredEducators.length} Experts Available
//             </span>
//           </div>
//         </header>

//         {/* GRID */}
//         {filteredEducators.length > 0 ? (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//             {filteredEducators.map((educator) => (
//               <EducatorCard
//                 key={educator.id}
//                 educator={{
//                   id: educator.id,
//                   name: educator.name || "Unknown",
//                   imageUrl: educator.imageUrl || undefined,
//                   specialty: educator.specialty || "General",
//                   experience:
//                     educator.experience !== null
//                       ? String(educator.experience)
//                       : "0",
//                   description: educator.description || "",
//                 }}
//               />
//             ))}
//           </div>
//         ) : (
//           <div className="flex flex-col items-center justify-center py-28 rounded-2xl bg-white/5 border border-dashed border-white/10">
//             <span className="text-4xl mb-3">🔍</span>
//             <h3 className="text-lg font-semibold text-white">
//               No educators found
//             </h3>
//             <p className="text-slate-500 mt-1 text-center max-w-sm text-sm">
//               Try adjusting your search or selecting a different specialty.
//             </p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// "use client";

// import { useState, useMemo } from "react";
// import { Specialties } from "@/lib/Specialties";
// import EducatorCard from "@/app/_components/EducatorCard";
// import { Search } from "lucide-react";

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

//   const specialties = ["All", ...Specialties.map((s) => s.name)];

//   return (
//     <div className="relative min-h-screen w-full bg-background px-6 py-8">
//       {/* background glow */}
//       <div className="absolute top-0 left-1/2 -z-10 h-72 w-full -translate-x-1/2 bg-[radial-gradient(circle_at_top,var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent blur-3xl" />

//       <div className="mx-auto max-w-7xl space-y-8">
//         {/* HEADER + FILTER PANEL */}
//         <div className="space-y-6">
//           {/* HEADER */}
//           <div className="text-center space-y-2">
//             <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
//               Discover Expert Educators
//             </h1>
//             <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto">
//               Search and connect with top educators across specialized fields.
//               Filter by expertise and find the right match for your learning
//               goals.
//             </p>
//           </div>

//           {/* FILTER CARD */}
//           <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-md px-4 py-4 space-y-4">
//             {/* SEARCH */}
//             <div className="relative">
//               <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
//               <input
//                 type="text"
//                 placeholder="Search educators, specialties, or expertise..."
//                 className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//               />
//             </div>

//             {/* PILLS + COUNT */}
//             <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
//               {/* SPECIALTY PILLS */}
//               <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
//                 {specialties.map((spec) => {
//                   const isActive = selectedSpecialty === spec;

//                   return (
//                     <button
//                       key={spec}
//                       onClick={() => setSelectedSpecialty(spec)}
//                       className={`
//                         whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium
//                         transition-all border
//                         ${
//                           isActive
//                             ? "bg-emerald-500 text-black border-emerald-400 shadow-sm"
//                             : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
//                         }
//                       `}
//                     >
//                       {spec}
//                     </button>
//                   );
//                 })}
//               </div>

//               {/* RESULTS BADGE */}
//               <div className="flex md:justify-end">
//                 <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300">
//                   <span className="text-white font-semibold">
//                     {filteredEducators.length}
//                   </span>{" "}
//                   educators found
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* GRID */}
//         {filteredEducators.length > 0 ? (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//             {filteredEducators.map((educator) => (
//               <EducatorCard
//                 key={educator.id}
//                 educator={{
//                   id: educator.id,
//                   name: educator.name || "Unknown",
//                   imageUrl: educator.imageUrl || undefined,
//                   specialty: educator.specialty || "General",
//                   experience:
//                     educator.experience !== null
//                       ? String(educator.experience)
//                       : "0",
//                   description: educator.description || "",
//                 }}
//               />
//             ))}
//           </div>
//         ) : (
//           <div className="flex flex-col items-center justify-center py-28 rounded-2xl bg-white/5 border border-dashed border-white/10">
//             <span className="text-4xl mb-3">🔍</span>
//             <h3 className="text-lg font-semibold text-white">
//               No educators found
//             </h3>
//             <p className="text-slate-500 mt-1 text-center max-w-sm text-sm">
//               Try adjusting your search or selecting a different specialty.
//             </p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
