import { PublicProductCard } from "./PublicProductCard";
import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function FeaturedProducts() {
  const productTypes = await prisma.product.groupBy({
    by: ["type"],
    where: {
      status: "Published",
    },
  });

  const productsByType = await Promise.all(
    productTypes.map(async ({ type }) => {
      const products = await prisma.product.findMany({
        where: {
          type,
          status: "Published",
        },

        orderBy: {
          createdAt: "desc",
        },

        take: 7,

        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          type: true,
          slug: true,
          status: true,

          // IMPORTANT:
          // Course products store their main image here.
          imageKey: true,

          // Digital products store their images here.
          images: {
            orderBy: {
              position: "asc",
            },
            select: {
              imageKey: true,
            },
          },

          user: {
            select: {
              name: true,
            },
          },
        },
      });

      return {
        type,
        products,
      };
    }),
  );

  const sections = productsByType.filter(
    (section) => section.products.length > 0,
  );

  return (
    <section className="py-0 bg-background pb-20">
      <div className="max-w-8xl mx-auto px-6 sm:px-6 md:px-28 lg:px-28">
        <div className="space-y-10">
          {sections.map(({ type, products }) => {
            const formattedProducts = products.map((product) => {
              /*
               * ============================================================
               * DETERMINE PRODUCT IMAGE
               * ============================================================
               *
               * COURSE:
               *   Product.imageKey
               *
               * DIGITAL PRODUCT:
               *   Product.images[0].imageKey
               *
               * We normalize both into digitalProductImages so the
               * PublicProductCard can use the same property for every
               * product type.
               */

              const productImages =
                product.type === "Course"
                  ? product.imageKey
                    ? [product.imageKey]
                    : []
                  : (product.images ?? []).map((image) => image.imageKey);

              return {
                id: product.id,
                title: product.title,
                description: product.description ?? "",
                status: product.status,
                type: product.type,
                price: (product.price ?? 0) / 100,
                slug: product.slug,

                duration: 0,
                fileKey: "",

                educatorName: product.user?.name || "Unknown Educator",

                mainVideoUrl: null,

                /*
                 * For courses this contains exactly ONE image.
                 * For workbooks/digital products this contains
                 * the gallery images in position order.
                 */
                digitalProductImages: productImages,
              };
            });

            return (
              <div key={type}>
                {/* ==========================================================
                    SECTION HEADER
                ========================================================== */}

                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl sm:text-xl font-semibold tracking-tight text-blue-500">
                    {type}
                  </h2>

                  <Link
                    href={`/products?type=${encodeURIComponent(type)}`}
                    className="px-5 py-1.5 text-sm font-medium bg-[#857938] text-white hover:bg-blue-500 hover:text-white rounded-md transition-all cursor-pointer"
                  >
                    View all
                  </Link>
                </div>

                {/* ==========================================================
                    PRODUCT GRID
                ========================================================== */}

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  {formattedProducts.map((product) => (
                    <div key={product.id} className="min-w-0">
                      <PublicProductCard data={product} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* ================================================================
            EMPTY STATE
        ================================================================ */}

        {sections.length === 0 && (
          <div className="max-w-2xl mx-auto py-12 rounded-md border border-slate-200 bg-white text-center shadow-sm">
            <div className="flex flex-col items-center px-6">
              <h3 className="text-lg font-semibold text-slate-900">
                No products published yet
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                New products are on the way. Check back soon.
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

// export default async function FeaturedProducts() {
//   const productTypes = await prisma.product.groupBy({
//     by: ["type"],
//     where: {
//       status: "Published",
//     },
//   });

//   const productsByType = await Promise.all(
//     productTypes.map(async ({ type }) => {
//       const products = await prisma.product.findMany({
//         where: {
//           type,
//           status: "Published",
//         },

//         orderBy: {
//           createdAt: "desc",
//         },

//         take: 7,

//         select: {
//           id: true,
//           title: true,
//           description: true,
//           price: true,
//           type: true,
//           slug: true,
//           status: true,
//           user: {
//             select: {
//               name: true,
//             },
//           },
//           images: {
//             orderBy: {
//               position: "asc",
//             },
//             select: {
//               imageKey: true,
//             },
//           },
//         },
//       });

//       return {
//         type,
//         products,
//       };
//     }),
//   );

//   const sections = productsByType.filter(
//     (section) => section.products.length > 0,
//   );

//   return (
//     <section className="py-0 bg-background pb-20">
//       <div className="max-w-8xl mx-auto px-6 sm:px-6 md:px-28 lg:px-28">
//         <div className="space-y-10">
//           {sections.map(({ type, products }) => {
//             const formattedProducts = products.map((product) => ({
//               id: product.id,
//               title: product.title,
//               description: product.description ?? "",
//               status: product.status,
//               type: product.type,
//               price: (product.price ?? 0) / 100,
//               slug: product.slug,
//               duration: 0,
//               fileKey: "",
//               educatorName: product.user?.name || "Unknown Educator",
//               mainVideoUrl: null,
//               digitalProductImages:
//                 product.images.map(
//                   (image: { imageKey: string }) => image.imageKey,
//                 ) ?? [],
//             }));

//             return (
//               <div key={type}>
//                 {/* Section Header */}
//                 <div className="flex items-center justify-between mb-3">
//                   <h2 className="text-xl sm:text-xl font-semibold tracking-tight text-blue-500">
//                     {type}
//                   </h2>

//                   <Link
//                     href={`/products?type=${encodeURIComponent(type)}`}
//                     className="px-5 py-1.5 text-sm font-medium bg-[#857938] text-white hover:bg-blue-500 hover:text-white rounded-md transition-all cursor-pointer"
//                   >
//                     View all
//                   </Link>
//                 </div>

//                 {/* 7 Products Per Row */}
//                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
//                   {formattedProducts.map((product) => (
//                     <div key={product.id} className="min-w-0">
//                       <PublicProductCard data={product} />
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             );
//           })}
//         </div>

//         {/* Empty State */}
//         {sections.length === 0 && (
//           <div className="max-w-2xl mx-auto py-12 rounded-md border border-slate-200 bg-white text-center shadow-sm">
//             <div className="flex flex-col items-center px-6">
//               <h3 className="text-lg font-semibold text-slate-900">
//                 No products published yet
//               </h3>

//               <p className="mt-1 text-sm text-slate-500">
//                 New products are on the way. Check back soon.
//               </p>
//             </div>
//           </div>
//         )}
//       </div>
//     </section>
//   );
// }
