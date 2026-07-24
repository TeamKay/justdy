import React from "react";
import Image from "next/image";
import Link from "next/link";

interface Product {
  id: string;
  title: string;
  category: string;
  price: number;
  originalPrice: number | null;
  rating: number;
  image: string;
  description: string;
  features: string[];
}

interface ProductGridProps {
  products: Product[];
  onClearSearch: () => void;
}

export default function ProductGrid({
  products = [],
  onClearSearch,
}: ProductGridProps) {
  return (
    <>
      {products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/marketplace/${product.id}`}
              className="flex flex-col h-full cursor-pointer rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden group/card hover:shadow-md transition-shadow duration-200"
            >
              {/* Image Container - Fully covers the top */}
              <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
                <Image
                  src={product.image}
                  width={400}
                  height={400}
                  alt={product.title}
                  className="object-cover w-full h-full group-hover/card:scale-[1.03] transition-transform duration-200"
                />
                {/* Optional "Bestseller" Badge if needed */}
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs border border-yellow-500/80 px-2 py-0.5 rounded-md">
                  <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-wider">
                    Bestseller
                  </span>
                </div>
              </div>

              {/* Information Section with Padding */}
              <div className="p-4 flex flex-col justify-between grow gap-2">
                <div>
                  {/* Title */}
                  <h3 className="text-sm font-bold text-[#222222] line-clamp-2 leading-snug group-hover/card:text-blue-600 transition-colors">
                    {product.title}
                  </h3>

                  {/* Subtitle / Category */}
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                    {product.category || "Beginner to Advanced"}
                  </p>

                  {/* Creator / Instructor Placeholder */}
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-[9px] text-gray-500">👤</span>
                    </div>
                    <span className="text-xs text-gray-500">Instructor</span>
                  </div>
                </div>

                {/* Bottom Row: Rating on Left, Price on Right */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-auto">
                  {/* Rating */}
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500 text-xs">★</span>
                    <span className="text-xs font-bold text-gray-700">
                      {product.rating || "4.8"}
                    </span>
                    <span className="text-[10px] text-gray-400">(2.4k)</span>
                  </div>

                  {/* Prices */}
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-bold text-sm text-gray-900">
                      ${product.price}
                    </span>
                    {product.originalPrice && (
                      <span className="text-[11px] text-gray-400 line-through">
                        ${product.originalPrice}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-500 font-medium">
            No marketplace items match your request.
          </p>
          <button
            onClick={onClearSearch}
            className="mt-2 text-sm font-bold text-[#F1641E] underline cursor-pointer"
          >
            Clear search query
          </button>
        </div>
      )}
    </>
  );
}

// import React from "react";
// import Image from "next/image";
// import Link from "next/link";

// interface Product {
//   id: string;
//   title: string;
//   category: string;
//   price: number;
//   originalPrice: number | null;
//   rating: number;
//   image: string;
//   description: string;
//   features: string[];
// }

// interface ProductGridProps {
//   products: Product[];
//   onClearSearch: () => void;
// }

// export default function ProductGrid({
//   products = [],
//   onClearSearch,
// }: ProductGridProps) {
//   return (
//     <>
//       {products.length > 0 ? (
//         <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-5 lg:grid-cols-5 gap-4">
//           {products.map((product) => (
//             <Link
//               key={product.id}
//               href={`/marketplace/${product.id}`}
//               className="flex flex-col h-full cursor-pointer rounded-lg overflow-hidden group/card"
//             >
//               <div className="relative aspect-square w-full overflow-hidden bg-gray-100 rounded-lg">
//                 <Image
//                   src={product.image}
//                   width={400}
//                   height={400}
//                   alt={product.title}
//                   className="object-cover w-full h-full group-hover/card:scale-[1.02] transition-transform duration-200"
//                 />
//               </div>
//               <div className="pt-2 flex flex-col justify-between grow">
//                 <h3 className="text-sm font-normal text-[#222222] line-clamp-1 mb-0.5 group-hover/card:underline">
//                   {product.title}
//                 </h3>
//                 <div className="flex items-baseline gap-1.5 mt-0.5">
//                   <span className="font-bold text-base text-[#258635]">
//                     ${product.price}
//                   </span>
//                   {product.originalPrice && (
//                     <span className="text-xs text-gray-500 line-through">
//                       ${product.originalPrice}
//                     </span>
//                   )}
//                 </div>
//               </div>
//             </Link>
//           ))}
//         </div>
//       ) : (
//         <div className="text-center py-20 border border-dashed border-gray-200 rounded-xl">
//           <p className="text-gray-500 font-medium">
//             No marketplace items match your request.
//           </p>
//           <button
//             onClick={onClearSearch}
//             className="mt-2 text-sm font-bold text-[#F1641E] underline cursor-pointer"
//           >
//             Clear search query
//           </button>
//         </div>
//       )}
//     </>
//   );
// }
