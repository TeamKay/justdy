import { PublicProductCard } from "./PublicProductCard";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default async function FeaturedCourses() {
  const courses = await prisma.course.findMany({
    where: {
      product: {
        status: "Published",
      },
    },
    orderBy: [{ createdAt: "desc" }],
    take: 5,
    select: {
      id: true,
      category: true,
      imageKey: true,
      duration: true,
      product: {
        select: {
          slug: true,
          title: true,
          smallDescription: true,
          price: true,
          status: true,
        },
      },
    },
  });

  return (
    <section className="py-0 mb-5 mt-5">
      <div className="max-w-8xl mx-auto px-4 md:px-6 lg:px-20 w-full">
        {/* Header containing Title & Navigation Button */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-3">
          <div>
            <h2 className="text-2xl sm:text-xl font-bold tracking-tight text-white/70">
              Featured Courses
            </h2>
          </div>

          <Link href="/courses">
            <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-purple-400 hover:text-purple-300 border border-purple-500/20 hover:border-purple-500/40 bg-purple-500/5 hover:bg-purple-500/10 rounded-xl transition-all active:scale-95 cursor-pointer whitespace-nowrap">
              All Courses
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>

        {/* Cards Grid / Empty State */}
        {courses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 auto-cols-fr">
            {courses.map((course) => (
              <PublicProductCard key={course.id} data={course} />
            ))}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto mt-8 py-12 md:py-16 rounded-2xl border border-purple-500/10 bg-slate-950/20 text-center shadow-sm backdrop-blur-md">
            <div className="relative z-10 flex flex-col items-center px-6">
              {/* Icon */}
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20">
                <svg
                  className="h-6 w-6 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6l4 2"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>

              <h3 className="text-xl font-semibold text-white">
                No courses published yet
              </h3>

              <p className="mt-2 text-sm text-slate-400 max-w-md leading-relaxed">
                New learning content is on the way. Check back soon or explore
                all available categories.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// import { PublicCourseCard } from "./PublicCourseCard";
// import prisma from "@/lib/prisma";
// import Link from "next/link";
// import { ArrowRight } from "lucide-react";

// export default async function FeaturedCourses() {
//   const courses = await prisma.course.findMany({
//     where: {
//       //status: "Published",
//     },
//     orderBy: [{ createdAt: "desc" }],
//     take: 5,
//   });

//   return (
//     <section className="py-0 mb-5 mt-5">
//       <div className="max-w-8xl mx-auto px-4  md:px-6 lg:px-20 w-full">
//         {/* Header containing Title & Navigation Button */}
//         <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-3">
//           <div>
//             <h2 className="text-2xl sm:text-xl font-bold tracking-tight text-white/70">
//               Featured Courses
//             </h2>
//           </div>

//           <Link href="/courses">
//             <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-purple-400 hover:text-purple-300 border border-purple-500/20 hover:border-purple-500/40 bg-purple-500/5 hover:bg-purple-500/10 rounded-xl transition-all active:scale-95 cursor-pointer whitespace-nowrap">
//               All Courses
//               <ArrowRight className="w-4 h-4" />
//             </button>
//           </Link>
//         </div>

//         {/* Cards Grid / Empty State */}
//         {courses.length > 0 ? (
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 auto-cols-fr">
//             {courses.map((course) => (
//               <PublicCourseCard key={course.id} data={course} />
//             ))}
//           </div>
//         ) : (
//           <div className="max-w-2xl mx-auto mt-8 py-12 md:py-16 rounded-2xl border border-purple-500/10 bg-slate-950/20 text-center shadow-sm backdrop-blur-md">
//             <div className="relative z-10 flex flex-col items-center px-6">
//               {/* Icon */}
//               <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20">
//                 <svg
//                   className="h-6 w-6 text-purple-400"
//                   fill="none"
//                   stroke="currentColor"
//                   strokeWidth="1.5"
//                   viewBox="0 0 24 24"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     d="M12 6v6l4 2"
//                   />
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
//                   />
//                 </svg>
//               </div>

//               <h3 className="text-xl font-semibold text-white">
//                 No courses published yet
//               </h3>

//               <p className="mt-2 text-sm text-slate-400 max-w-md leading-relaxed">
//                 New learning content is on the way. Check back soon or explore
//                 all available categories.
//               </p>
//             </div>
//           </div>
//         )}
//       </div>
//     </section>
//   );
// }

// import { PublicProductCard } from "./PublicProductCard";
// import prisma from "@/lib/prisma";

// export default async function LatestCourses() {
//   const products = await prisma.product.findMany({
//     where: {
//       status: "Published",
//     },
//     orderBy: [{ createdAt: "desc" }],
//     take: 3,
//   });

//   return (
//     <section className="py-0 mb-20">
//       {/* Cards Grid / Empty State */}
//       {products.length > 0 ? (
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-cols-fr">
//           {products.map((product) => (
//             <PublicProductCard key={product.id} data={product} />
//           ))}
//         </div>
//       ) : (
//         <div className="max-w-296 mx-auto px-4 sm:px-6 lg:px-8 mt-8 md:py-30 rounded-md border border-emerald-950 text-center shadow-sm backdrop-blur-md">
//           <div className="relative z-10 flex flex-col items-center">
//             {/* Icon */}
//             <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-md bg-white/10 border border-white/10">
//               <svg
//                 className="h-6 w-6 text-white/80"
//                 fill="none"
//                 stroke="currentColor"
//                 strokeWidth="1.5"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   d="M12 6v6l4 2"
//                 />
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
//                 />
//               </svg>
//             </div>

//             <h3 className="text-xl md:text-2xl font-semibold text-white">
//               No courses published yet
//             </h3>

//             <p className="mt-2 text-sm text-muted-foreground max-w-md">
//               New learning content is on the way. Check back soon or explore all
//               available categories.
//             </p>
//           </div>
//         </div>
//       )}
//     </section>
//   );
// }
