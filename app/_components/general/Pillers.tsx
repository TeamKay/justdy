// import React from "react";
// import {
//   BookOpen,
//   Calendar,
//   ChevronRight,
//   Download,
//   Video,
// } from "lucide-react";

// export default function KeyPillars() {
//   const pillars = [
//     {
//       id: "courses",
//       title: "Structured Learning Paths",
//       description:
//         "Comprehensive, self-paced courses featuring interactive exercises, assessments, and verified completion credentials.",
//       cta: "Explore Course Catalog",
//       href: "#courses",
//       icon: BookOpen,
//       tag: "Self-Paced",
//     },
//     {
//       id: "tutoring",
//       title: "Executive 1-on-1 Mentorship",
//       description:
//         "Personalized live sessions and technical consultations tailored to accelerate your specific learning objectives.",
//       cta: "Schedule Consultation",
//       href: "#tutoring",
//       icon: Calendar,
//       tag: "Live Sessions",
//     },
//     {
//       id: "digital-products",
//       title: "Curated Digital Assets",
//       description:
//         "Instant access to production-ready code repositories, design systems, and specialized technical documentation.",
//       cta: "Browse Resource Library",
//       href: "#digital-products",
//       icon: Download,
//       tag: "Instant Access",
//     },
//     {
//       id: "free-tutorials",
//       title: "Complimentary Knowledge Base",
//       description:
//         "Targeted, bite-sized video walkthroughs and guides designed for rapid skill acquisition and problem-solving.",
//       cta: "Access Free Library",
//       href: "#free-tutorials",
//       icon: Video,
//       tag: "100% Free",
//     },
//   ];

//   return (
//     <section id="features" className="py-24 max-w-7xl mx-auto px-6 lg:px-8">
//       {/* Section Header */}
//       <div className="text-center max-w-2xl mx-auto mb-8">
//         <h2 className="text-3xl md:text-4xl font-extrabold text-slate-400 tracking-tight">
//           Four Ways to Elevate Your Skills
//         </h2>
//         <p className="mt-3.5 text-base text-muted-foreground font-normal leading-relaxed">
//           Choose the learning format that best fits your goals, pace, and
//           schedule.
//         </p>
//       </div>

//       {/* Pillars Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         {pillars.map((pillar) => {
//           const Icon = pillar.icon;
//           return (
//             <div
//               key={pillar.id}
//               className="group relative p-6 md:p-7 rounded-md bg-background border border-emerald-950 shadow-xs hover:border-emerald-900 hover:shadow-xl hover:shadow-slate-900/5 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between overflow-hidden"
//             >
//               {/* Subtle Top Border Accent on Hover */}
//               <div className="absolute top-0 inset-x-0 h-1 bg-transparent group-hover:bg-slate-900 transition-colors duration-300" />

//               <div>
//                 {/* Header Row: Icon + Pill Tag */}
//                 <div className="flex items-center justify-between mb-6">
//                   <div className="w-12 h-12 rounded-xl bg-neutral-800 text-white flex items-center justify-center shadow-md shadow-slate-900/10 group-hover:scale-105 transition-transform duration-300">
//                     <Icon className="w-5 h-5 text-slate-100" />
//                   </div>
//                   <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md bg-blue-500/10 border-blue-500/20 text-blue-400">
//                     {pillar.tag}
//                   </span>
//                 </div>

//                 {/* Title & Description */}
//                 <h3 className="text-base font-bold text-slate-400 tracking-tight">
//                   {pillar.title}
//                 </h3>
//                 <p className="mt-2.5 text-muted-foreground text-xs leading-relaxed font-normal">
//                   {pillar.description}
//                 </p>
//               </div>

//               {/* Action Link */}
//               <a
//                 href={pillar.href}
//                 className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-muted-foreground hover:text-slate-700 transition-colors group/link"
//               >
//                 <span>{pillar.cta}</span>
//                 <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover/link:text-slate-900 group-hover/link:translate-x-1 transition-all" />
//               </a>
//             </div>
//           );
//         })}
//       </div>
//     </section>
//   );
// }
