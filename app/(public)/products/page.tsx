import { Suspense } from "react";
import { getAllProducts } from "@/app/actions/get-all-products";
import EmptyCourseState from "@/app/_components/EmptyCoursesState";
import {
  PublicProductCard,
  PublicProductCardSkeleton,
} from "@/app/_components/PublicProductCard";
import { ProductSearchInput } from "@/app/_components/ProductSearchInput";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ type?: string; search?: string }>;
}

export default async function PublicProductsRoute({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const currentType = resolvedSearchParams.type;
  const searchQuery = resolvedSearchParams.search;

  // Fetch all products (unfiltered) to get total baseline count
  const allProducts = await getAllProducts();
  const totalCount = allProducts?.length ?? 0;

  // Fetch filtered products based on search or type
  const isFiltered = Boolean(currentType || searchQuery);
  const filteredProducts = isFiltered
    ? await getAllProducts(currentType, searchQuery)
    : allProducts;

  const filteredCount = filteredProducts?.length ?? 0;

  return (
    <div className="pb-20">
      {/* Main Catalog Content */}
      <div className="mt-5 max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Filter & Search Navigation Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800 mb-8">
          {/* Center: Search Bar */}
          <div className="w-full lg:max-w-md">
            <ProductSearchInput />
          </div>

          {/* Dynamic Ratio Display */}
          <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium self-end lg:self-center">
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {filteredCount}
            </span>{" "}
            out of{" "}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {totalCount}
            </span>{" "}
            items
          </div>
        </div>

        {/* Product Grid */}
        <Suspense
          key={`${currentType ?? "all"}-${searchQuery ?? ""}`}
          fallback={<LoadingSkeletonLayout />}
        >
          <RenderProducts products={filteredProducts} />
        </Suspense>
      </div>
    </div>
  );
}

function RenderProducts({
  products,
}: {
  products: Awaited<ReturnType<typeof getAllProducts>>;
}) {
  if (!products || products.length === 0) {
    return <EmptyCourseState />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <PublicProductCard key={product.id} data={product} />
      ))}
    </div>
  );
}

function LoadingSkeletonLayout() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, index) => (
        <PublicProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

// import { Suspense } from "react";
// import { getAllProducts } from "@/app/actions/get-all-products";
// import EmptyCourseState from "@/app/_components/EmptyCoursesState";
// import {
//   PublicProductCard,
//   PublicProductCardSkeleton,
// } from "@/app/_components/PublicProductCard";
// import { ProductSearchInput } from "@/app/_components/ProductSearchInput";

// export const dynamic = "force-dynamic";

// interface PageProps {
//   searchParams: Promise<{ type?: string; search?: string }>;
// }

// export default async function PublicProductsRoute({ searchParams }: PageProps) {
//   const resolvedSearchParams = await searchParams;
//   const currentType = resolvedSearchParams.type;
//   const searchQuery = resolvedSearchParams.search;

//   return (
//     <div className="pb-20">
//       {/* Main Catalog Content */}
//       <div className=" mt-5 max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
//         {/* Filter & Search Navigation Bar */}
//         <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800 mb-8">
//           {/* Center: Search Bar (Horizontal alignment) */}
//           <div className="w-full lg:max-w-md">
//             <ProductSearchInput />
//           </div>

//           <div>number of items</div>
//         </div>

//         {/* Product Grid */}
//         <Suspense
//           key={`${currentType ?? "all"}-${searchQuery ?? ""}`}
//           fallback={<LoadingSkeletonLayout />}
//         >
//           <RenderProducts typeFilter={currentType} searchQuery={searchQuery} />
//         </Suspense>
//       </div>
//     </div>
//   );
// }

// async function RenderProducts({
//   typeFilter,
//   searchQuery,
// }: {
//   typeFilter?: string;
//   searchQuery?: string;
// }) {
//   const products = await getAllProducts(typeFilter, searchQuery);

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
// import Link from "next/link";
// import { getAllProducts } from "@/app/actions/get-all-products";
// import EmptyCourseState from "@/app/_components/EmptyCoursesState";
// import {
//   PublicProductCard,
//   PublicProductCardSkeleton,
// } from "@/app/_components/PublicProductCard";

// export const dynamic = "force-dynamic";

// interface PageProps {
//   searchParams: Promise<{ type?: string }>;
// }

// export default async function PublicProductsRoute({ searchParams }: PageProps) {
//   const resolvedSearchParams = await searchParams;
//   const currentType = resolvedSearchParams.type;

//   return (
//     <div className="mt-10 px-4 md:px-8 max-w-7xl mx-auto pb-16">
//       {/* Header & Filter Tabs */}
//       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
//         <div>
//           <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
//             Explore Catalog
//           </h1>
//           <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
//             Browse our full range of courses and digital assets
//           </p>
//         </div>

//         {/* Dynamic Filter Tabs */}
//         <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/60 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 w-fit">
//           <Link
//             href="/products"
//             className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
//               !currentType
//                 ? "bg-purple-600 text-white shadow-sm"
//                 : "text-slate-600 dark:text-slate-400 hover:text-purple-500"
//             }`}
//           >
//             All Products
//           </Link>
//           <Link
//             href="/products?type=Course"
//             className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
//               currentType === "Course"
//                 ? "bg-purple-600 text-white shadow-sm"
//                 : "text-slate-600 dark:text-slate-400 hover:text-purple-500"
//             }`}
//           >
//             Courses
//           </Link>
//           <Link
//             href="/products?type=Downloadable"
//             className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
//               currentType === "Downloadable"
//                 ? "bg-purple-600 text-white shadow-sm"
//                 : "text-slate-600 dark:text-slate-400 hover:text-purple-500"
//             }`}
//           >
//             Digital Products
//           </Link>
//         </div>
//       </div>

//       <Suspense key={currentType ?? "all"} fallback={<LoadingSkeletonLayout />}>
//         <RenderProducts typeFilter={currentType} />
//       </Suspense>
//     </div>
//   );
// }

// async function RenderProducts({ typeFilter }: { typeFilter?: string }) {
//   const products = await getAllProducts(typeFilter);

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
//       {Array.from({ length: 4 }).map((_, index) => (
//         <PublicProductCardSkeleton key={index} />
//       ))}
//     </div>
//   );
// }

// import { Suspense } from "react";
// import { getAllProducts } from "@/app/actions/get-all-products";
// import EmptyCourseState from "@/app/_components/EmptyCoursesState";
// import {
//   PublicProductCard,
//   PublicProductCardSkeleton,
// } from "@/app/_components/PublicProductCard";

// export const dynamic = "force-dynamic";

// export default function PublicCoursesRoute() {
//   return (
//     <div className="mt-10 px-4 md:px-8 max-w-7xl mx-auto">
//       <Suspense fallback={<LoadingSkeletonLayout />}>
//         <RenderCourses />
//       </Suspense>
//     </div>
//   );
// }

// async function RenderCourses() {
//   const courses = await getAllProducts();

//   if (!courses || courses.length === 0) {
//     return <EmptyCourseState />;
//   }

//   return (
//     <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,320px))] gap-6">
//       {courses.map((course) => (
//         <PublicProductCard key={course.id} data={course} />
//       ))}
//     </div>
//   );
// }

// function LoadingSkeletonLayout() {
//   return (
//     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//       {Array.from({ length: 3 }).map((_, index) => (
//         <PublicProductCardSkeleton key={index} />
//       ))}
//     </div>
//   );
// }
