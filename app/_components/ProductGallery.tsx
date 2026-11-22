"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  images: string[];
  title: string;
}

export function ProductGallery({ images, title }: ProductGalleryProps) {
  const galleryImages =
    images.length > 0 ? images : ["/placeholder-course.jpg"];

  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectedImage = galleryImages[selectedIndex] ?? galleryImages[0];

  const hasMultipleImages = galleryImages.length > 1;

  /* ==========================================================================
     NAVIGATION
  ========================================================================== */

  const goToPrevious = useCallback(() => {
    setSelectedIndex((current) =>
      current === 0 ? galleryImages.length - 1 : current - 1,
    );
  }, [galleryImages.length]);

  const goToNext = useCallback(() => {
    setSelectedIndex((current) =>
      current === galleryImages.length - 1 ? 0 : current + 1,
    );
  }, [galleryImages.length]);

  const goToImage = (index: number) => {
    setSelectedIndex(index);
  };

  /* ==========================================================================
     KEYBOARD NAVIGATION
  ========================================================================== */

  useEffect(() => {
    if (!hasMultipleImages) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;

      // Don't interfere with inputs, textareas, etc.
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToPrevious();
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        goToNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [hasMultipleImages, goToPrevious, goToNext]);

  /* ==========================================================================
     SINGLE IMAGE
  ========================================================================== */

  if (!hasMultipleImages) {
    return (
      <div
        className="
          relative
          aspect-video
          w-full
          overflow-hidden
          bg-slate-100
          dark:bg-background
        "
      >
        <Image
          src={galleryImages[0]}
          alt={title || "Product image"}
          fill
          priority
          sizes="100vw"
          className="
            object-cover
            sm:object-contain
          "
        />
      </div>
    );
  }

  return (
    <div
      className="
        flex
        w-full
        items-stretch
        gap-2
        overflow-hidden
        bg-background

        sm:gap-3
        sm:p-4

        lg:p-0
      "
    >
      {/* ======================================================================
          LEFT THUMBNAIL COLUMN
      ======================================================================= */}

      <aside
        className="
          flex
          w-14
          shrink-0
          flex-col
          gap-2

          sm:w-20
          sm:gap-3

          lg:w-24
        "
      >
        <div
          className="
            flex
            max-h-[70vw]
            min-h-70
            flex-col
            gap-2
            overflow-y-auto
            pr-1
            scrollbar-thin

            sm:max-h-150
            sm:min-h-0
            sm:gap-3
          "
        >
          {galleryImages.map((imgUrl, index) => {
            const isSelected = selectedIndex === index;

            return (
              <button
                key={`${imgUrl}-${index}`}
                type="button"
                onClick={() => goToImage(index)}
                aria-label={`View image ${index + 1}`}
                aria-current={isSelected ? "true" : undefined}
                className={cn(
                  `
                    relative
                    h-16
                    w-full
                    shrink-0
                    overflow-hidden
                    rounded-md
                    border-2
                    bg-slate-50
                    shadow-sm
                    transition-all
                    duration-200
                    focus:outline-none
                    focus:ring-2
                    focus:ring-[#857938]
                    focus:ring-offset-1

                    sm:h-24

                    lg:h-28
                  `,
                  isSelected
                    ? `
                        border-[#857938]
                        opacity-100
                        scale-100
                        ring-2
                        ring-[#857938]/30
                      `
                    : `
                        border-slate-200
                        opacity-60
                        hover:border-[#857938]/50
                        hover:opacity-100
                        dark:border-slate-700
                      `,
                )}
              >
                {/* ============================================================
                    THUMBNAIL IMAGE

                    h-full + w-full ensures the image completely fills
                    the thumbnail container.
                ============================================================ */}

                <Image
                  src={imgUrl}
                  alt={`${title} thumbnail ${index + 1}`}
                  fill
                  sizes="
                    (max-width: 640px) 56px,
                    (max-width: 1024px) 80px,
                    96px
                  "
                  className="
                    h-full
                    w-full
                    object-cover
                  "
                />

                {/* ============================================================
                    SELECTED INDICATOR
                ============================================================ */}

                {isSelected && (
                  <span
                    className="
                      absolute
                      inset-y-0
                      left-0
                      w-1
                      
                    "
                  />
                )}
              </button>
            );
          })}
        </div>
      </aside>

      {/* ======================================================================
          MAIN DISPLAY IMAGE
      ======================================================================= */}

      <div
        className="
          relative
          min-w-0
          flex-1
          overflow-hidden
          rounded-md
          bg-slate-50
          dark:bg-emerald-900/30
        "
      >
        <div
          className="
            relative
            h-[70vw]
            min-h-70
            max-h-150
            w-full
            overflow-hidden

            sm:h-auto
            sm:min-h-107.5
            sm:max-h-none

            lg:min-h-150
          "
        >
          <Image
            key={selectedImage}
            src={selectedImage}
            alt={`${title} preview ${selectedIndex + 1}`}
            fill
            priority={selectedIndex === 0}
            sizes="
              (max-width: 640px) calc(100vw - 64px),
              (max-width: 1024px) calc(70vw - 130px),
              55vw
            "
            className="
              object-cover
              transition-opacity
              duration-300

              sm:object-contain
            "
          />

          {/* ==================================================================
              PREVIOUS BUTTON
          =================================================================== */}

          <button
            type="button"
            onClick={goToPrevious}
            aria-label="Previous product image"
            className="
              absolute
              left-2
              top-1/2
              z-10
              flex
              size-9
              -translate-y-1/2
              items-center
              justify-center
              rounded-full
              bg-black/40
              text-white
              shadow-lg
              backdrop-blur-sm
              transition-all
              hover:scale-105
              hover:bg-black/60
              focus:outline-none
              focus:ring-2
              focus:ring-[#857938]
              sm:left-4
              sm:size-10
              sm:text-slate-800
              sm:hover:bg-white
              dark:sm:bg-blue-500
              dark:sm:text-white
            "
          >
            <ChevronLeft className="size-4 sm:size-5" />
          </button>

          {/* ==================================================================
              NEXT BUTTON
          =================================================================== */}

          <button
            type="button"
            onClick={goToNext}
            aria-label="Next product image"
            className="
              absolute
              right-2
              top-1/2
              z-10
              flex
              size-9
              -translate-y-1/2
              items-center
              justify-center
              rounded-full
            
              bg-black/40
              text-white
              shadow-lg
              backdrop-blur-sm
              transition-all
              hover:scale-105
              hover:bg-black/60
              focus:outline-none
              focus:ring-2
              focus:ring-[#857938]
              sm:right-4
              sm:size-10
              sm:bg-white/90
              sm:text-slate-800
              sm:hover:bg-white
              dark:sm:bg-blue-600
              dark:sm:text-white
            "
          >
            <ChevronRight className="size-4 sm:size-5" />
          </button>

          {/* ==================================================================
              IMAGE COUNTER
          =================================================================== */}

          <div
            className="
              absolute
              bottom-3
              left-1/2
              z-10
              -translate-x-1/2
              rounded-md
              bg-black/60
              px-3
              py-1
              text-[11px]
              font-medium
              text-white
              shadow-md
              backdrop-blur-sm

              sm:rounded-md
              sm:bg-blue-500
              sm:text-xs
            "
          >
            {selectedIndex + 1} / {galleryImages.length}
          </div>
        </div>
      </div>
    </div>
  );
}
