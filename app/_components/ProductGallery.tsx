"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  images: string[];
  title: string;
}

export function ProductGallery({ images, title }: ProductGalleryProps) {
  // Safe fallback if images array is empty
  const galleryImages =
    images.length > 0 ? images : ["/placeholder-course.jpg"];
  const [selectedImage, setSelectedImage] = useState(galleryImages[0]);

  // If there's only 1 image, render standard single-image layout
  if (galleryImages.length <= 1) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-xl shadow-lg">
        <Image
          src={galleryImages[0]}
          alt={title || "Product thumbnail"}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
      </div>
    );
  }

  return (
    // Updated layout direction to place thumbnails on the right
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Main Active Image Box */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl shadow-lg bg-slate-100 dark:bg-slate-900">
        <Image
          src={selectedImage}
          alt={title || "Product main thumbnail"}
          fill
          className="object-cover transition-all duration-300"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent pointer-events-none" />
      </div>

      {/* Side Vertical Thumbnails List (Right Side) */}
      <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-y-auto max-h-100 shrink-0 pb-2 sm:pb-0">
        {galleryImages.map((imgUrl, index) => {
          const isSelected = selectedImage === imgUrl;
          return (
            <button
              key={index}
              type="button"
              onClick={() => setSelectedImage(imgUrl)}
              className={cn(
                "relative size-20 sm:size-24 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer hover:opacity-90 focus:outline-none",
                isSelected
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100",
              )}
            >
              <Image
                src={imgUrl}
                alt={`${title} preview ${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
