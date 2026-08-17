import Image from "next/image";
import Link from "next/link";
import { Skeleton } from "./ui/skeleton";

export type PublicProductsType = {
  id: string;
  title: string;
  slug: string;
  price: number;
  description: string;
  status: string;
  type: string;
  duration: number;
  fileKey: string;
  educatorName: string;
  mainVideoUrl?: string | null;
  digitalProductImages?: string[];
};

interface iAppProps {
  data: PublicProductsType;
}

export function PublicProductCard({ data }: iAppProps) {
  /*
   * ============================================================
   * GET PRIMARY IMAGE
   * ============================================================
   *
   * FeaturedProducts has already normalized the image:
   *
   * Course:
   *   digitalProductImages = [imageKey]
   *
   * Workbook:
   *   digitalProductImages = [image1, image2, ...]
   *
   * So the first image is always the correct primary image.
   */

  const imageKey =
    data.digitalProductImages?.find(
      (image) => image && image.trim().length > 0,
    ) ||
    data.fileKey ||
    null;

  /*
   * ============================================================
   * BUILD IMAGE URL
   * ============================================================
   */

  const thumbnailUrl = imageKey
    ? imageKey.startsWith("http://") || imageKey.startsWith("https://")
      ? imageKey
      : `https://utfs.io/f/${imageKey}`
    : "/placeholder-course.jpg";

  const currentPrice = data.price ?? 0;

  const originalPrice = currentPrice > 0 ? currentPrice * 1.8 : null;

  return (
    <Link
      href={`/products/${data.slug}`}
      className="
        group
        flex
        flex-col
        w-full
        focus:outline-none
        focus-visible:ring-2
        focus-visible:ring-slate-900
        rounded-md
      "
    >
      {/* ==========================================================
          IMAGE
      ========================================================== */}

      <div
        className="
          relative
          w-full
          aspect-3/4
          overflow-hidden
          rounded-md
          bg-slate-100
          mb-2
        "
      >
        <Image
          fill
          sizes="
            (max-width: 640px) 50vw,
            (max-width: 1024px) 25vw,
            20vw
          "
          src={thumbnailUrl}
          alt={data.title}
          className="
            object-cover
            w-full
            h-full
            group-hover:scale-105
            transition-transform
            duration-300
            ease-out
          "
        />
      </div>

      {/* ==========================================================
          PRODUCT INFORMATION
      ========================================================== */}

      <div className="flex flex-col gap-1 px-0.5">
        <h3
          className="
            text-xs
            sm:text-sm
            text-slate-700
            font-normal
            truncate
            group-hover:underline
            transition-all
          "
        >
          {data.title}
        </h3>

        <div className="flex items-baseline gap-1.5 text-xs sm:text-sm">
          <span className="font-bold text-black">
            ${currentPrice.toFixed(2)}
          </span>

          {originalPrice && (
            <span className="text-slate-400 line-through text-xs">
              ${originalPrice.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function PublicProductCardSkeleton() {
  return (
    <div className="flex flex-col w-full gap-2">
      <Skeleton className="w-full aspect-3/4 rounded-2xl bg-slate-200" />

      <Skeleton className="h-4 w-5/6 rounded-md bg-slate-200" />

      <Skeleton className="h-4 w-1/2 rounded-md bg-slate-200" />
    </div>
  );
}

// import Image from "next/image";
// import Link from "next/link";
// import { Skeleton } from "./ui/skeleton";

// export type PublicProductsType = {
//   id: string;
//   title: string;
//   slug: string;
//   price: number;
//   description: string;
//   status: string;
//   type: string;
//   duration: number;
//   fileKey: string;
//   educatorName: string;
//   mainVideoUrl?: string | null;
//   digitalProductImages?: string[];
// };

// interface iAppProps {
//   data: PublicProductsType;
// }

// export function PublicProductCard({ data }: iAppProps) {
//   const imageKey = data.digitalProductImages?.[0] || data.fileKey || null;
//   const thumbnailUrl = imageKey
//     ? imageKey.startsWith("http")
//       ? imageKey
//       : `https://utfs.io/f/${imageKey}`
//     : "/placeholder-course.jpg";

//   const currentPrice = data.price ?? 0;
//   const originalPrice = currentPrice > 0 ? currentPrice * 1.8 : null;

//   return (
//     <Link
//       href={`/products/${data.slug}`}
//       className="group flex flex-col w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 rounded-md"
//     >
//       <div className="relative w-full aspect-3/4 overflow-hidden rounded-md bg-background mb-2">
//         <Image
//           fill
//           sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
//           src={thumbnailUrl}
//           alt={data.title}
//           className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300 ease-out"
//         />
//       </div>

//       <div className="flex flex-col gap-1 px-0.5">
//         <h3 className="text-xs sm:text-sm text-slate-700 font-normal truncate group-hover:underline transition-all">
//           {data.title}
//         </h3>

//         <div className="flex items-baseline gap-1.5 text-xs sm:text-sm">
//           <span className="font-bold text-black">
//             ${currentPrice.toFixed(2)}
//           </span>

//           {originalPrice && (
//             <span className="text-slate-400 line-through text-xs">
//               ${originalPrice.toFixed(2)}
//             </span>
//           )}
//         </div>
//       </div>
//     </Link>
//   );
// }

// export function PublicProductCardSkeleton() {
//   return (
//     <div className="flex flex-col w-full gap-2">
//       <Skeleton className="w-full aspect-3/4 rounded-2xl bg-slate-200" />
//       <Skeleton className="h-4 w-5/6 rounded-md bg-slate-200" />
//       <Skeleton className="h-4 w-1/2 rounded-md bg-slate-200" />
//     </div>
//   );
// }
