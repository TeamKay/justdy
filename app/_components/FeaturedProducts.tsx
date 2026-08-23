import "server-only";

import { PublicProductCard } from "./PublicProductCard";
import prisma from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function FeaturedProducts() {
  const products = await prisma.product.findMany({
    where: {
      status: "Published",
    },

    orderBy: {
      createdAt: "desc",
    },

    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      type: true,
      slug: true,
      status: true,

      // Course products
      imageKey: true,

      // Digital products / workbooks
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

  /*
   * ================================================================
   * GROUP PRODUCTS BY TYPE
   * ================================================================
   */

  const productsByType = products.reduce<
    Array<{
      type: (typeof products)[number]["type"];
      products: typeof products;
    }>
  >((groups, product) => {
    const existingGroup = groups.find((group) => group.type === product.type);

    if (existingGroup) {
      /*
       * Keep only the first 7 products of each type.
       */
      if (existingGroup.products.length < 7) {
        existingGroup.products.push(product);
      }
    } else {
      groups.push({
        type: product.type,
        products: [product],
      });
    }

    return groups;
  }, []);

  /*
   * ================================================================
   * REMOVE EMPTY SECTIONS
   * ================================================================
   */

  const sections = productsByType.filter(
    (section) => section.products.length > 0,
  );

  /*
   * ================================================================
   * RENDER
   * ================================================================
   */

  return (
    <section className="bg-background py-0 pb-20">
      <div className="mx-auto max-w-8xl px-6 sm:px-6 md:px-28 lg:px-28">
        <div className="space-y-10">
          {sections.map(({ type, products }) => {
            const formattedProducts = products.map((product) => {
              /*
               * ==========================================================
               * DETERMINE PRODUCT IMAGE
               * ==========================================================
               *
               * COURSE:
               *   Product.imageKey
               *
               * DIGITAL PRODUCT / WORKBOOK:
               *   Product.images
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

                educatorName: product.user?.name ?? "Unknown Educator",

                mainVideoUrl: null,

                digitalProductImages: productImages,
              };
            });

            return (
              <div key={type}>
                {/* ========================================================
                    SECTION HEADER
                ======================================================== */}

                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-xl font-semibold tracking-tight text-blue-500 sm:text-xl">
                    {type}
                  </h2>

                  <Link
                    href={`/products?type=${encodeURIComponent(String(type))}`}
                    className="
                      cursor-pointer
                      rounded-md
                      bg-blue-500
                      px-5
                      py-1.5
                      text-sm
                      font-medium
                      text-white
                      transition-all
                      hover:bg-blue-600
                      hover:text-white
                    "
                  >
                    View all
                  </Link>
                </div>

                {/* ========================================================
                    PRODUCT GRID
                ======================================================== */}

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
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
          <div className="mx-auto max-w-2xl rounded-md border border-slate-200 bg-white py-12 text-center shadow-sm">
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
