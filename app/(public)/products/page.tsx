import { Suspense } from "react";

import EmptyCourseState from "@/app/_components/EmptyCoursesState";
import {
  PublicProductCard,
  PublicProductCardSkeleton,
} from "@/app/_components/PublicProductCard";

import { GetAllPublishedProducts } from "@/app/actions/manage-get-all-products";
import { ProductType } from "@/lib/generated/prisma/enums";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    type?: string;
    search?: string;
  }>;
}

/* ========================================================================== */
/* RESOURCE LABEL                                                             */
/* ========================================================================== */

function getResourceLabel(type?: ProductType) {
  if (!type) {
    return "resource";
  }

  const value = String(type).toLowerCase();

  if (value.includes("course")) {
    return "course";
  }

  if (value.includes("workbook")) {
    return "workbook";
  }

  if (value.includes("digital") || value.includes("product")) {
    return "digital product";
  }

  return value.replace(/[_-]/g, " ");
}

/* ========================================================================== */
/* PAGE                                                                       */
/* ========================================================================== */

export default async function PublicProductsRoute({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;

  const searchQuery = resolvedSearchParams.search?.trim() || undefined;

  const currentType =
    resolvedSearchParams.type &&
    Object.values(ProductType).includes(
      resolvedSearchParams.type as ProductType,
    )
      ? (resolvedSearchParams.type as ProductType)
      : undefined;

  const [allProducts, filteredProducts] = await Promise.all([
    GetAllPublishedProducts(),

    currentType || searchQuery
      ? GetAllPublishedProducts(currentType, searchQuery)
      : GetAllPublishedProducts(),
  ]);

  /* ---------------------------------------------------------------------- */
  /* Counts                                                                  */
  /* ---------------------------------------------------------------------- */

  const totalCount = allProducts.length;
  const filteredCount = filteredProducts.length;

  const isSearchActive = Boolean(searchQuery);
  const isTypeFilterActive = Boolean(currentType);
  const isFiltered = isSearchActive || isTypeFilterActive;

  /* ---------------------------------------------------------------------- */
  /* Resource label                                                          */
  /* ---------------------------------------------------------------------- */

  const resourceLabel = getResourceLabel(currentType);

  const resultCount = isFiltered ? filteredCount : totalCount;

  const resultLabel = resultCount === 1 ? resourceLabel : `${resourceLabel}s`;

  /* ---------------------------------------------------------------------- */
  /* Render                                                                  */
  /* ---------------------------------------------------------------------- */

  return (
    <main className="min-h-screen bg-slate-50/70 dark:bg-background">
      {/* ================================================================== */}
      {/* PRODUCT SECTION                                                     */}
      {/* ================================================================== */}

      <section className="mx-auto max-w-8xl px-4 py-8 sm:px-6 md:py-10 lg:px-28">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-emerald-900 sm:text-2xl">
              {isSearchActive
                ? `Search results for "${searchQuery}"`
                : isTypeFilterActive
                  ? "Matching resources"
                  : "Explore our resources"}
            </h2>

            {/* ------------------------------------------------------------ */}
            {/* Result Count                                                   */}
            {/* ------------------------------------------------------------ */}

            <p className="mt-1 text-sm text-slate-500">
              {isFiltered ? (
                <>
                  {filteredCount} {resultLabel} found
                </>
              ) : (
                <>
                  {totalCount} {resultLabel} available
                </>
              )}
            </p>
          </div>
        </div>

        {/* ================================================================= */}
        {/* ACTIVE SEARCH / FILTER                                            */}
        {/* ================================================================= */}

        {isFiltered && (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {/* Search Filter */}

            {searchQuery && (
              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-md
                  border
                  border-slate-200
                  bg-emerald-900/30
                  px-3
                  py-1.5
                  text-xs
                  font-medium
                  text-slate-700
                  shadow-sm
                  dark:border-slate-700
                  dark:text-slate-200
                "
              >
                <span className="text-slate-400">Search:</span>

                <span className="font-semibold">&quot;{searchQuery}&quot;</span>
              </div>
            )}

            {/* Product Type Filter */}
          </div>
        )}

        {/* ================================================================= */}
        {/* PRODUCTS                                                           */}
        {/* ================================================================= */}

        <Suspense
          key={`${currentType ?? "all"}-${searchQuery ?? ""}`}
          fallback={<LoadingSkeletonLayout />}
        >
          <RenderProducts
            products={filteredProducts}
            searchQuery={searchQuery}
          />
        </Suspense>
      </section>
    </main>
  );
}

/* ========================================================================== */
/* PRODUCTS                                                                   */
/* ========================================================================== */

function RenderProducts({
  products,
  searchQuery,
}: {
  products: Awaited<ReturnType<typeof GetAllPublishedProducts>>;
  searchQuery?: string;
}) {
  /* ------------------------------------------------------------------------ */
  /* Empty State                                                              */
  /* ------------------------------------------------------------------------ */

  if (!products || products.length === 0) {
    return (
      <div
        className="
          rounded-2xl
          border
          border-dashed
          border-slate-300
          bg-white
          px-6
          py-16
          text-center
          dark:border-slate-700
          dark:bg-slate-900
        "
      >
        {searchQuery ? (
          <div className="mx-auto max-w-md">
            <div className="mb-4 text-4xl">🔎</div>

            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              No resources found
            </h3>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              We couldn&apos;t find any resources matching{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                &quot;{searchQuery}&quot;
              </span>
              .
            </p>

            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              Try another keyword such as a subject, grade level, or product
              name.
            </p>
          </div>
        ) : (
          <EmptyCourseState />
        )}
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Product Grid                                                             */
  /* ------------------------------------------------------------------------ */

  return (
    <div
      className="
        grid
        grid-cols-2
        gap-3
        sm:grid-cols-2
        sm:gap-5
        lg:grid-cols-3
        xl:grid-cols-6
      "
    >
      {products.map((product) => (
        <div
          key={product.id}
          className="
            group
            transition-all
            duration-300
            hover:-translate-y-1
          "
        >
          <PublicProductCard data={product} />
        </div>
      ))}
    </div>
  );
}

/* ========================================================================== */
/* LOADING SKELETON                                                           */
/* ========================================================================== */

function LoadingSkeletonLayout() {
  return (
    <div
      className="
        grid
        grid-cols-2
        gap-3
        sm:grid-cols-2
        sm:gap-5
        lg:grid-cols-3
        xl:grid-cols-4
      "
    >
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="
              overflow-hidden
              rounded-2xl
              border
              border-slate-200
              bg-white
              shadow-sm
              dark:border-slate-800
              dark:bg-slate-900
            "
        >
          <PublicProductCardSkeleton />
        </div>
      ))}
    </div>
  );
}
