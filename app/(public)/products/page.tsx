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
                  px-3
                  py-1.5
                  text-xs
                  font-medium
                  text-slate-700
                  shadow-sm
                  bg-emerald-900/30
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
        grid-cols-1
        gap-5
        sm:grid-cols-2
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
        grid-cols-1
        gap-5
        sm:grid-cols-2
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

// import { Suspense } from "react";
// import EmptyCourseState from "@/app/_components/EmptyCoursesState";
// import {
//   PublicProductCard,
//   PublicProductCardSkeleton,
// } from "@/app/_components/PublicProductCard";

// import { GetAllPublishedProducts } from "@/app/actions/manage-get-all-products";
// import { ProductType } from "@/lib/generated/prisma/enums";

// export const dynamic = "force-dynamic";

// interface PageProps {
//   searchParams: Promise<{
//     type?: string;
//     search?: string;
//   }>;
// }

// export default async function PublicProductsRoute({ searchParams }: PageProps) {
//   const resolvedSearchParams = await searchParams;

//   const searchQuery = resolvedSearchParams.search?.trim();

//   const currentType =
//     resolvedSearchParams.type &&
//     Object.values(ProductType).includes(
//       resolvedSearchParams.type as ProductType,
//     )
//       ? (resolvedSearchParams.type as ProductType)
//       : undefined;

//   /*
//    * Fetch both datasets in parallel.
//    * This avoids waiting for one database request before starting the next.
//    */
//   const [allProducts, filteredProducts] = await Promise.all([
//     GetAllPublishedProducts(),
//     currentType || searchQuery
//       ? GetAllPublishedProducts(currentType, searchQuery)
//       : GetAllPublishedProducts(),
//   ]);

//   const totalCount = allProducts.length;
//   const filteredCount = filteredProducts.length;

//   const isFiltered = Boolean(currentType || searchQuery);

//   return (
//     <main className="min-h-screen bg-slate-50/70 dark:bg-background">
//       {/* =========================================================
//           PRODUCT SECTION
//       ========================================================= */}
//       <section className="mx-auto max-w-8xl px-4 py-8 sm:px-6 md:py-10 lg:px-28">
//         {/* =======================================================
//             SECTION HEADING
//         ======================================================= */}
//         <div className="mb-6 flex items-end justify-between gap-4">
//           <div>
//             <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
//               Learning collection
//             </p>

//             <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
//               {isFiltered ? "Matching resources" : "Explore our resources"}
//             </h2>
//           </div>
//         </div>

//         {/* =======================================================
//             PRODUCTS
//         ======================================================= */}
//         <Suspense
//           key={`${currentType ?? "all"}-${searchQuery ?? ""}`}
//           fallback={<LoadingSkeletonLayout />}
//         >
//           <RenderProducts products={filteredProducts} />
//         </Suspense>
//       </section>
//     </main>
//   );
// }

// /* ===============================================================
//    PRODUCTS
// =============================================================== */

// function RenderProducts({
//   products,
// }: {
//   products: Awaited<ReturnType<typeof GetAllPublishedProducts>>;
// }) {
//   if (!products || products.length === 0) {
//     return (
//       <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
//         <EmptyCourseState />
//       </div>
//     );
//   }

//   return (
//     <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
//       {products.map((product) => (
//         <div
//           key={product.id}
//           className="group transition-all duration-300 hover:-translate-y-1"
//         >
//           <PublicProductCard data={product} />
//         </div>
//       ))}
//     </div>
//   );
// }

// /* ===============================================================
//    LOADING SKELETON
// =============================================================== */

// function LoadingSkeletonLayout() {
//   return (
//     <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
//       {Array.from({ length: 8 }).map((_, index) => (
//         <div
//           key={index}
//           className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
//         >
//           <PublicProductCardSkeleton />
//         </div>
//       ))}
//     </div>
//   );
// }

// import { Suspense } from "react";
// import EmptyCourseState from "@/app/_components/EmptyCoursesState";
// import {
//   PublicProductCard,
//   PublicProductCardSkeleton,
// } from "@/app/_components/PublicProductCard";
// import { ProductSearchInput } from "@/app/_components/ProductSearchInput";
// import { GetAllPublishedProducts } from "@/app/actions/manage-get-all-products";
// import { ProductType } from "@/lib/generated/prisma/enums";

// export const dynamic = "force-dynamic";

// interface PageProps {
//   searchParams: Promise<{
//     type?: string;
//     search?: string;
//   }>;
// }

// export default async function PublicProductsRoute({ searchParams }: PageProps) {
//   const resolvedSearchParams = await searchParams;

//   const searchQuery = resolvedSearchParams.search?.trim();

//   const currentType =
//     resolvedSearchParams.type &&
//     Object.values(ProductType).includes(
//       resolvedSearchParams.type as ProductType,
//     )
//       ? (resolvedSearchParams.type as ProductType)
//       : undefined;

//   /*
//    * Fetch both datasets in parallel.
//    * This avoids waiting for one database request before starting the next.
//    */
//   const [allProducts, filteredProducts] = await Promise.all([
//     GetAllPublishedProducts(),
//     currentType || searchQuery
//       ? GetAllPublishedProducts(currentType, searchQuery)
//       : GetAllPublishedProducts(),
//   ]);

//   const totalCount = allProducts.length;
//   const filteredCount = filteredProducts.length;

//   const isFiltered = Boolean(currentType || searchQuery);

//   return (
//     <main className="min-h-screen bg-slate-50/70 dark:bg-background">
//       {/* =========================================================
//           PRODUCT SECTION
//       ========================================================= */}
//       <section className="mx-auto max-w-8xl px-4 py-8 sm:px-6 md:py-10 lg:px-28">
//         {/* Search / Toolbar */}
//         <div className="mb-8 rounded-2xl bg-white p-4 shadow-sm sm:p-5 dark:bg-emerald-800/30">
//           <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
//             {/* Search */}
//             <div className="w-full lg:max-w-xl">
//               <ProductSearchInput />
//             </div>

//             {/* Results information */}
//             <div className="flex items-center justify-between gap-4 lg:justify-end">
//               <div className="text-right">
//                 <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
//                   {isFiltered ? "Search results" : "Available resources"}
//                 </div>

//                 <div className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white">
//                   <span className="text-blue-600 dark:text-blue-400">
//                     {filteredCount}
//                   </span>{" "}
//                   {filteredCount === 1 ? "item" : "items"}
//                   {isFiltered && (
//                     <span className="font-normal text-slate-400">
//                       {" "}
//                       of {totalCount}
//                     </span>
//                   )}
//                 </div>
//               </div>

//               {/* Active filter */}
//               {currentType && (
//                 <div className="hidden rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 sm:block dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
//                   {currentType}
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Section heading */}
//         <div className="mb-6 flex items-end justify-between gap-4">
//           <div>
//             <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
//               Learning collection
//             </p>

//             <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
//               {isFiltered ? "Matching resources" : "Explore our resources"}
//             </h2>
//           </div>

//           <div className="hidden text-xs text-slate-500 sm:block dark:text-slate-400">
//             {filteredCount} {filteredCount === 1 ? "resource" : "resources"}{" "}
//             available
//           </div>
//         </div>

//         {/* Products */}
//         <Suspense
//           key={`${currentType ?? "all"}-${searchQuery ?? ""}`}
//           fallback={<LoadingSkeletonLayout />}
//         >
//           <RenderProducts products={filteredProducts} />
//         </Suspense>
//       </section>
//     </main>
//   );
// }

// /* ===============================================================
//    PRODUCTS
// =============================================================== */

// function RenderProducts({
//   products,
// }: {
//   products: Awaited<ReturnType<typeof GetAllPublishedProducts>>;
// }) {
//   if (!products || products.length === 0) {
//     return (
//       <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
//         <EmptyCourseState />
//       </div>
//     );
//   }

//   return (
//     <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
//       {products.map((product) => (
//         <div
//           key={product.id}
//           className="group transition-all duration-300 hover:-translate-y-1"
//         >
//           <PublicProductCard data={product} />
//         </div>
//       ))}
//     </div>
//   );
// }

// /* ===============================================================
//    LOADING SKELETON
// =============================================================== */

// function LoadingSkeletonLayout() {
//   return (
//     <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
//       {Array.from({ length: 8 }).map((_, index) => (
//         <div
//           key={index}
//           className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
//         >
//           <PublicProductCardSkeleton />
//         </div>
//       ))}
//     </div>
//   );
// }

// import { Suspense } from "react";

// import EmptyCourseState from "@/app/_components/EmptyCoursesState";

// import {
//   PublicProductCard,
//   PublicProductCardSkeleton,
// } from "@/app/_components/PublicProductCard";

// import { ProductSearchInput } from "@/app/_components/ProductSearchInput";

// import { GetAllPublishedProducts } from "@/app/actions/manage-get-all-products";

// import { ProductType } from "@/lib/generated/prisma/enums";

// export const dynamic = "force-dynamic";

// interface PageProps {
//   searchParams: Promise<{
//     type?: string;
//     search?: string;
//   }>;
// }

// export default async function PublicProductsRoute({ searchParams }: PageProps) {
//   const resolvedSearchParams = await searchParams;

//   const searchQuery = resolvedSearchParams.search;

//   const currentType =
//     resolvedSearchParams.type &&
//     Object.values(ProductType).includes(
//       resolvedSearchParams.type as ProductType,
//     )
//       ? (resolvedSearchParams.type as ProductType)
//       : undefined;

//   // Get everything for the total count
//   const allProducts = await GetAllPublishedProducts();

//   const totalCount = allProducts.length;

//   const isFiltered = Boolean(currentType || searchQuery);

//   // Get filtered products
//   const filteredProducts = isFiltered
//     ? await GetAllPublishedProducts(currentType, searchQuery)
//     : allProducts;

//   const filteredCount = filteredProducts.length;

//   return (
//     <div className="pb-20">
//       <div className="mt-5 max-w-8xl mx-auto px-4 md:px-6 lg:px-28">
//         <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-600 mb-8">
//           <div className="w-full lg:max-w-md">
//             <ProductSearchInput />
//           </div>

//           <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium self-end lg:self-center">
//             <span className="font-semibold text-slate-900 dark:text-slate-100">
//               {filteredCount}
//             </span>{" "}
//             out of{" "}
//             <span className="font-semibold text-slate-900 dark:text-slate-100">
//               {totalCount}
//             </span>{" "}
//             items
//           </div>
//         </div>

//         <Suspense
//           key={`${currentType ?? "all"}-${searchQuery ?? ""}`}
//           fallback={<LoadingSkeletonLayout />}
//         >
//           <RenderProducts products={filteredProducts} />
//         </Suspense>
//       </div>
//     </div>
//   );
// }

// function RenderProducts({
//   products,
// }: {
//   products: Awaited<ReturnType<typeof GetAllPublishedProducts>>;
// }) {
//   if (!products || products.length === 0) {
//     return <EmptyCourseState />;
//   }

//   return (
//     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
//       {products.map((product) => (
//         <PublicProductCard key={product.id} data={product} />
//       ))}
//     </div>
//   );
// }

// function LoadingSkeletonLayout() {
//   return (
//     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
//       {Array.from({ length: 8 }).map((_, index) => (
//         <PublicProductCardSkeleton key={index} />
//       ))}
//     </div>
//   );
// }

// import { Suspense } from "react";

// import EmptyCourseState from "@/app/_components/EmptyCoursesState";
// import {
//   PublicProductCard,
//   PublicProductCardSkeleton,
// } from "@/app/_components/PublicProductCard";
// import { ProductSearchInput } from "@/app/_components/ProductSearchInput";
// import { GetAllProducts } from "@/app/actions/manage-get-all-products";
// import { ProductType } from "@/lib/generated/prisma/enums";

// export const dynamic = "force-dynamic";

// interface PageProps {
//   searchParams: Promise<{ type?: string; search?: string }>;
// }

// export default async function PublicProductsRoute({ searchParams }: PageProps) {
//   const resolvedSearchParams = await searchParams;
//   const currentType = resolvedSearchParams.type;
//   const searchQuery = resolvedSearchParams.search;

//   // Fetch all products (unfiltered) to get total baseline count
//   const allProducts = await GetAllProducts();
//   const totalCount = allProducts?.length ?? 0;

//   // Fetch filtered products based on search and/or type
//   const isFiltered = Boolean(currentType || searchQuery);
//   const filteredProducts = isFiltered
//     ? await GetAllProducts(currentType as ProductType | undefined, searchQuery)
//     : allProducts;

//   const filteredCount = filteredProducts?.length ?? 0;

//   return (
//     <div className="pb-20">
//       {/* Main Catalog Content */}
//       <div className="mt-5 max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
//         {/* Filter & Search Navigation Bar */}
//         <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-600 mb-8">
//           {/* Center: Search Bar */}
//           <div className="w-full lg:max-w-md">
//             <ProductSearchInput />
//           </div>

//           {/* Dynamic Ratio Display */}
//           <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium self-end lg:self-center">
//             <span className="font-semibold text-slate-900 dark:text-slate-100">
//               {filteredCount}
//             </span>{" "}
//             out of{" "}
//             <span className="font-semibold text-slate-900 dark:text-slate-100">
//               {totalCount}
//             </span>{" "}
//             items
//           </div>
//         </div>

//         {/* Product Grid */}
//         <Suspense
//           key={`${currentType ?? "all"}-${searchQuery ?? ""}`}
//           fallback={<LoadingSkeletonLayout />}
//         >
//           <RenderProducts products={filteredProducts} />
//         </Suspense>
//       </div>
//     </div>
//   );
// }

// function RenderProducts({
//   products,
// }: {
//   products: Awaited<ReturnType<typeof GetAllProducts>>;
// }) {
//   if (!products || products.length === 0) {
//     return <EmptyCourseState />;
//   }

//   return (
//     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
//       {products.map((product) => (
//         <PublicProductCard key={product.id} data={product} />
//       ))}
//     </div>
//   );
// }

// function LoadingSkeletonLayout() {
//   return (
//     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
//       {Array.from({ length: 8 }).map((_, index) => (
//         <PublicProductCardSkeleton key={index} />
//       ))}
//     </div>
//   );
// }

// import { Suspense } from "react";

// import EmptyCourseState from "@/app/_components/EmptyCoursesState";
// import {
//   PublicProductCard,
//   PublicProductCardSkeleton,
// } from "@/app/_components/PublicProductCard";
// import { ProductSearchInput } from "@/app/_components/ProductSearchInput";
// import { GetAllProducts } from "@/app/actions/manage-get-all-products";

// export const dynamic = "force-dynamic";

// interface PageProps {
//   searchParams: Promise<{ type?: string; search?: string }>;
// }

// export default async function PublicProductsRoute({ searchParams }: PageProps) {
//   const resolvedSearchParams = await searchParams;
//   const currentType = resolvedSearchParams.type;
//   const searchQuery = resolvedSearchParams.search;

//   // Fetch all products (unfiltered) to get total baseline count
//   const allProducts = await GetAllProducts();
//   const totalCount = allProducts?.length ?? 0;

//   // Fetch filtered products based on search or type, passing individual string arguments if required by the action definition
//   const isFiltered = Boolean(currentType || searchQuery);
//   const filteredProducts = isFiltered
//     ? await GetAllProducts(currentType, searchQuery)
//     : allProducts;

//   const filteredCount = filteredProducts?.length ?? 0;

//   return (
//     <div className="pb-20">
//       {/* Main Catalog Content */}
//       <div className="mt-5 max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
//         {/* Filter & Search Navigation Bar */}
//         <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-600 mb-8">
//           {/* Center: Search Bar */}
//           <div className="w-full lg:max-w-md">
//             <ProductSearchInput />
//           </div>

//           {/* Dynamic Ratio Display */}
//           <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium self-end lg:self-center">
//             <span className="font-semibold text-slate-900 dark:text-slate-100">
//               {filteredCount}
//             </span>{" "}
//             out of{" "}
//             <span className="font-semibold text-slate-900 dark:text-slate-100">
//               {totalCount}
//             </span>{" "}
//             items
//           </div>
//         </div>

//         {/* Product Grid */}
//         <Suspense
//           key={`${currentType ?? "all"}-${searchQuery ?? ""}`}
//           fallback={<LoadingSkeletonLayout />}
//         >
//           <RenderProducts products={filteredProducts} />
//         </Suspense>
//       </div>
//     </div>
//   );
// }

// function RenderProducts({
//   products,
// }: {
//   products: Awaited<ReturnType<typeof GetAllProducts>>;
// }) {
//   if (!products || products.length === 0) {
//     return <EmptyCourseState />;
//   }

//   return (
//     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
//       {products.map((product) => (
//         <PublicProductCard key={product.id} data={product} />
//       ))}
//     </div>
//   );
// }

// function LoadingSkeletonLayout() {
//   return (
//     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
//       {Array.from({ length: 8 }).map((_, index) => (
//         <PublicProductCardSkeleton key={index} />
//       ))}
//     </div>
//   );
// }

// import { Suspense } from "react";

// import EmptyCourseState from "@/app/_components/EmptyCoursesState";
// import {
//   PublicProductCard,
//   PublicProductCardSkeleton,
// } from "@/app/_components/PublicProductCard";
// import { ProductSearchInput } from "@/app/_components/ProductSearchInput";
// import { GetAllProducts } from "@/app/actions/manage-get-all-products";

// export const dynamic = "force-dynamic";

// interface PageProps {
//   searchParams: Promise<{ type?: string; search?: string }>;
// }

// export default async function PublicProductsRoute({ searchParams }: PageProps) {
//   const resolvedSearchParams = await searchParams;
//   const currentType = resolvedSearchParams.type;
//   const searchQuery = resolvedSearchParams.search;

//   // Fetch all products (unfiltered) to get total baseline count
//   const allProducts = await GetAllProducts();
//   const totalCount = allProducts?.length ?? 0;

//   // Fetch filtered products based on search or type
//   const isFiltered = Boolean(currentType || searchQuery);
//   const filteredProducts = isFiltered
//     ? await GetAllProducts(currentType, searchQuery)
//     : allProducts;

//   const filteredCount = filteredProducts?.length ?? 0;

//   return (
//     <div className="pb-20">
//       {/* Main Catalog Content */}
//       <div className="mt-5 max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
//         {/* Filter & Search Navigation Bar */}
//         <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-600 mb-8">
//           {/* Center: Search Bar */}
//           <div className="w-full lg:max-w-md">
//             <ProductSearchInput />
//           </div>

//           {/* Dynamic Ratio Display */}
//           <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium self-end lg:self-center">
//             <span className="font-semibold text-slate-900 dark:text-slate-100">
//               {filteredCount}
//             </span>{" "}
//             out of{" "}
//             <span className="font-semibold text-slate-900 dark:text-slate-100">
//               {totalCount}
//             </span>{" "}
//             items
//           </div>
//         </div>

//         {/* Product Grid */}
//         <Suspense
//           key={`${currentType ?? "all"}-${searchQuery ?? ""}`}
//           fallback={<LoadingSkeletonLayout />}
//         >
//           <RenderProducts products={filteredProducts} />
//         </Suspense>
//       </div>
//     </div>
//   );
// }

// function RenderProducts({
//   products,
// }: {
//   products: Awaited<ReturnType<typeof GetAllProducts>>;
// }) {
//   if (!products || products.length === 0) {
//     return <EmptyCourseState />;
//   }

//   return (
//     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
//       {products.map((product) => (
//         <PublicProductCard key={product.id} data={product} />
//       ))}
//     </div>
//   );
// }

// function LoadingSkeletonLayout() {
//   return (
//     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
//       {Array.from({ length: 8 }).map((_, index) => (
//         <PublicProductCardSkeleton key={index} />
//       ))}
//     </div>
//   );
// }
