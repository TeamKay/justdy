import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { Star } from "lucide-react";
import { PublicProductsType } from "../actions/get-all-products";

interface iAppProps {
  data: PublicProductsType;
}

export function PublicProductCard({ data }: iAppProps) {
  const thumbnailUrl = data.imageKey
    ? data.imageKey.startsWith("http")
      ? data.imageKey
      : `https://utfs.io/f/${data.imageKey}`
    : "/placeholder-course.jpg";

  if (!data.product) {
    return null;
  }

  return (
    <Link
      href={`/products/${data.product.slug}`}
      className="block w-full max-w-[320px] focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-2xl"
    >
      <Card className="group relative overflow-hidden rounded-xl bg-background border border-white/10 p-0 shadow-lg hover:shadow-purple-500/10 hover:border-purple-500/40 hover:-translate-y-1.5 transition-all duration-300 flex flex-col w-full h-80 cursor-pointer backdrop-blur-md">
        {/* Subtle hover gradient glow effect */}
        <div className="absolute inset-0 bg-linear-to-br from-purple-500/10 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0" />

        {/* Media Container */}
        <div className="relative overflow-hidden w-full h-36 bg-slate-800/80 z-10">
          {thumbnailUrl && (
            <Image
              width={320}
              height={192}
              src={thumbnailUrl}
              alt={data.product.title}
              className="block h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          )}

          {/* Frosted Modern Category Badge */}
          {data.category && (
            <div className="absolute top-3 left-3 z-20">
              <span className="inline-flex items-center rounded-full border border-purple-500/30 bg-slate-950/70 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-purple-300 shadow-sm">
                {data.category}
              </span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <CardContent className="p-4 flex flex-col justify-between flex-1 min-h-0 z-10 bg-emerald-900/10">
          <div className="space-y-1.5">
            {/* Title */}
            <h3 className="font-semibold text-sm leading-snug text-slate-100 group-hover:text-purple-300 transition-colors line-clamp-2">
              {data.product.title}
            </h3>

            {/* Description */}
            {data.product.smallDescription && (
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {data.product.smallDescription}
              </p>
            )}
          </div>

          {/* Bottom Info Bar */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10 mt-auto">
            {/* Rating */}
            <div className="flex items-center gap-1.5">
              <Star className="size-3.5 fill-amber-400 text-amber-400" />
              <span className="text-xs font-semibold text-slate-200">4.8</span>
              <span className="text-[10px] text-slate-500">(2.4k)</span>
            </div>

            {/* Price Tag */}
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-bold text-slate-100">
                ${data.product.price ? data.product.price.toFixed(2) : "0.00"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function PublicProductCardSkeleton() {
  return (
    <Card className="rounded-2xl border border-white/10 bg-slate-900/60 flex flex-col w-[320px] h-80 shrink-0 mx-auto overflow-hidden p-0 shadow-lg">
      <div className="w-full h-36 bg-slate-800/60">
        <Skeleton className="w-full h-full bg-slate-800" />
      </div>

      <CardContent className="p-4 flex flex-col justify-between flex-1 min-h-0">
        <div className="space-y-2.5">
          <Skeleton className="h-4 w-5/6 rounded-md bg-slate-800" />
          <Skeleton className="h-3 w-full rounded-md bg-slate-800" />
          <Skeleton className="h-3 w-2/3 rounded-md bg-slate-800" />
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <Skeleton className="h-4 w-16 rounded-md bg-slate-800" />
          <Skeleton className="h-5 w-14 rounded-md bg-slate-800" />
        </div>
      </CardContent>
    </Card>
  );
}

// import Image from "next/image";
// import Link from "next/link";
// import { Card, CardContent } from "./ui/card";
// import { Skeleton } from "./ui/skeleton";
// import { PublicProductsType } from "../actions/get-all-products";

// interface iAppProps {
//   data: PublicProductsType;
// }

// export function PublicProductCard({ data }: iAppProps) {
//   const thumbnailUrl = data.imageKey
//     ? data.imageKey.startsWith("http")
//       ? data.imageKey
//       : `https://utfs.io/f/${data.imageKey}`
//     : "/placeholder-course.jpg";

//   if (!data.product) {
//     return null;
//   }

//   return (
//     <Link
//       href={`/products/${data.product.slug}`}
//       className="block w-full max-w-[320px]"
//     >
//       {/* Added p-0 to reset default Shadcn Card padding */}
//       <Card className="group overflow-hidden rounded-md bg-background p-0 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col w-full h-70 cursor-pointer">
//         {/* Changed overflow-auto to overflow-hidden so the image stays flush */}
//         <div className="relative overflow-hidden w-full h-35 bg-neutral-100">
//           {thumbnailUrl && (
//             <Image
//               width={320}
//               height={192}
//               src={thumbnailUrl}
//               alt={data.product.title}
//               className="block h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
//             />
//           )}

//           {/* Category Badge */}
//           {data.category && (
//             <div className="absolute top-2 left-3 z-10">
//               <span className="inline-flex items-center rounded-md border border-amber-500/30 bg-[#857938] backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
//                 {data.category}
//               </span>
//             </div>
//           )}
//         </div>

//         {/* Content details below image */}
//         <CardContent className="p-4 pt-3 flex flex-col justify-between flex-1 min-h-0">
//           <div className="space-y-1">
//             <h3 className="font-bold text-base leading-snug text-white line-clamp-2">
//               {data.product.title}
//             </h3>

//             {data.product.smallDescription && (
//               <p className="text-xs text-muted-foreground line-clamp-2">
//                 {data.product.smallDescription}
//               </p>
//             )}
//           </div>

//           <div className="flex items-center justify-between pt-3 border-t border-neutral-100 mt-auto">
//             <div className="flex items-center gap-1">
//               <span className="text-amber-500 text-sm">★</span>
//               <span className="text-xs font-bold text-amber-600">4.8</span>
//               <span className="text-[10px] text-neutral-400">(2.4k)</span>
//             </div>

//             <div className="flex items-baseline gap-1">
//               <span className="text-sm font-bold text-white">
//                 ${data.product.price ? data.product.price.toFixed(2) : "0.00"}
//               </span>
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//     </Link>
//   );
// }

// export function PublicProductCardSkeleton() {
//   return (
//     <Card className="rounded-2xl border border-neutral-100 flex flex-col w-[320px] h-90 shrink-0 mx-auto overflow-hidden p-0">
//       <div className="w-full h-48 bg-neutral-100">
//         <Skeleton className="w-full h-full" />
//       </div>

//       <CardContent className="p-4 flex flex-col justify-between flex-1 min-h-0">
//         <div className="space-y-2">
//           <Skeleton className="h-5 w-5/6 rounded-md" />
//           <Skeleton className="h-3 w-2/3 rounded-md" />
//           <Skeleton className="h-4 w-1/3 rounded-md pt-1" />
//         </div>

//         <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
//           <Skeleton className="h-4 w-16 rounded-md" />
//           <Skeleton className="h-5 w-14 rounded-md" />
//         </div>
//       </CardContent>
//     </Card>
//   );
// }
