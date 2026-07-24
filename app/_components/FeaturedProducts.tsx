import { PublicProductCard } from "./PublicProductCard";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default async function FeaturedProducts() {
  // Query top 5 latest published digital products from the main Product table
  const products = await prisma.product.findMany({
    where: {
      type: "Downloadable",
      status: "Published",
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
    select: {
      id: true,
      title: true,
      smallDescription: true,
      price: true,
      type: true,
      slug: true,
      status: true,
      user: {
        select: {
          name: true,
        },
      },
      digitalProduct: {
        select: {
          images: {
            orderBy: { position: "asc" },
            select: {
              imageKey: true,
            },
          },
        },
      },
    },
  });

  // Map the DB response into the shape PublicProductCard expects
  const digitalproducts = products.map((product) => {
    const primaryImageKey = product.digitalProduct?.images?.[0]?.imageKey;

    return {
      id: product.id,
      imageKey: primaryImageKey || null,
      duration: null, // Digital products don't have course duration
      category: "Digital Product", // Hardcoded fallback since category isn't on Product
      product: {
        title: product.title,
        smallDescription: product.smallDescription ?? "",
        price: product.price ?? 0,
        slug: product.slug,
        status: product.status,
      },
    };
  });

  return (
    <section className="py-0 mb-5 mt-10">
      <div className="max-w-8xl mx-auto px-4 md:px-6 lg:px-20 w-full">
        {/* Header containing Title & Navigation Button */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-3">
          <div>
            <h2 className="text-2xl sm:text-xl font-bold tracking-tight text-white/70">
              Featured Products
            </h2>
          </div>

          <Link href="/digital-products">
            <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-purple-400 hover:text-purple-300 border border-purple-500/20 hover:border-purple-500/40 bg-purple-500/5 hover:bg-purple-500/10 rounded-xl transition-all active:scale-95 cursor-pointer whitespace-nowrap">
              All Digital Products
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>

        {/* Cards Grid / Empty State */}
        {digitalproducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 auto-cols-fr">
            {digitalproducts.map((product) => (
              <PublicProductCard key={product.id} data={product} />
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
                No digital products published yet
              </h3>

              <p className="mt-2 text-sm text-slate-400 max-w-md leading-relaxed">
                New digital products are on the way. Check back soon or explore
                our other available resources.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// import { PublicProductCard } from "./PublicProductCard";
// import prisma from "@/lib/prisma";
// import Link from "next/link";
// import { ArrowRight } from "lucide-react";

// export default async function LatestDigitalProducts() {
//   const digitalproducts = await prisma.digitalProduct.findMany({
//     where: {
//       status: "Published",
//     },
//     orderBy: [{ createdAt: "desc" }],
//     take: 5,
//   });

//   return (
//     <section className="py-0 mb-5 mt-10">
//       <div className="max-w-8xl mx-auto px-4  md:px-6 lg:px-20 w-full">
//         {/* Header containing Title & Navigation Button */}
//         <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-3">
//           <div>
//             <h2 className="text-2xl sm:text-2xl font-bold tracking-tight text-white">
//               Digital Products
//             </h2>
//           </div>

//           <Link href="/courses">
//             <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-purple-400 hover:text-purple-300 border border-purple-500/20 hover:border-purple-500/40 bg-purple-500/5 hover:bg-purple-500/10 rounded-xl transition-all active:scale-95 cursor-pointer whitespace-nowrap">
//               All Digital Products
//               <ArrowRight className="w-4 h-4" />
//             </button>
//           </Link>
//         </div>

//         {/* Cards Grid / Empty State */}
//         {digitalproducts.length > 0 ? (
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 auto-cols-fr">
//             {digitalproducts.map((product) => (
//               <PublicProductCard key={product.id} data={product} />
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
