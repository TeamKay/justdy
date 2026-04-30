import { Card, CardContent } from "@/app/_components/ui/card";
import { Specialties } from "@/lib/Specialties";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function SpecialitiesPage() {
  return (
    <div className="relative min-h-screen w-full bg-background px-6 py-5">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-[5%] top-[10%] h-125 w-125 rounded-full bg-emerald-600/10 blur-[120px]" />
        <div className="absolute -left-[5%] bottom-[10%] h-125 w-125 rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="mb-16 space-y-4 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
            Find Your <span className="text-emerald-500">Educator</span>
          </h1>
          <p className="mx-auto max-w-2xl text-slate-400 text-lg">
            Connect with industry-leading educators across specialized
            disciplines.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {Specialties.map((specialty) => (
            <Link
              key={specialty.name}
              href={`/educators/${specialty.name}`}
              className="group"
            >
              <Card className="relative h-105 overflow-hidden border-white/10 bg-white/3 transition-all duration-500 hover:-translate-y-2 hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-500/20">
                {/* 1. TOP PORTION: The Image */}
                <div className="relative h-[60%] w-full overflow-hidden">
                  <div className="absolute inset-0 bg-linear-to-t from-[#020617] via-transparent to-transparent z-10" />

                  {/* Floating Icon Overlay */}
                  <div className="relative  z-20 flex size-20 items-center justify-center backdrop-blur-md text-white [&_svg]:size-10">
                    {specialty.icon}
                  </div>
                </div>

                {/* 2. BOTTOM PORTION: Glass Content */}
                <CardContent className="relative h-[40%] p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                      {specialty.name}
                    </h3>
                    <p className="mt-2 text-sm text-slate-400 line-clamp-2">
                      Explore {specialty.name.toLowerCase()} experts ready to
                      guide your next project.
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs font-semibold uppercase tracking-widest text-emerald-500/80">
                      24 Educators
                    </span>
                    <ArrowUpRight className="size-5 text-slate-500 transition-all group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-emerald-400" />
                  </div>
                </CardContent>

                {/* Glass Polish: Subtle sheen on hover */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-emerald-500/5 via-transparent to-white/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// import { Card, CardContent } from "@/app/_components/ui/card";
// import { Specialties } from "@/lib/Specialties";
// import Link from "next/link";

// export default function SpecialitiesPage() {
//   return (
//     <>
//       <div className="flex flex-col items-center justify-center mb-8 text-center">
//         <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 gradient-title">
//           Find a Teacher
//         </h1>
//         <p className="text-muted-foreground text-lg">
//           Browse by specialty or view all available educators
//         </p>
//       </div>

//       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
//         {Specialties.map((spacialty) => (
//           <Link key={spacialty.name} href={`/educators/${spacialty.name}`}>
//             <Card className="hover:border-emerald-700/40 transition-all cursor-pointer border-emerald-900/20 h-full">
//               <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
//                 <div className="size-12 rounded-full bg-emerald-900/20 flex items-center justify-center mb-4">
//                   <div>{spacialty.icon}</div>
//                 </div>
//                 <h3 className="font-medium text-white">{spacialty.name}</h3>
//               </CardContent>
//             </Card>
//           </Link>
//         ))}
//       </div>
//     </>
//   );
// }
