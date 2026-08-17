"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpen, Download, ArrowRight } from "lucide-react";

import { Card, CardContent } from "@/app/_components/ui/card";
import { Progress } from "@/app/_components/ui/progress";
import { Badge } from "@/app/_components/ui/badge";
import { buttonVariants } from "@/app/_components/ui/button";

interface ProductData {
  id: string;
  title: string;
  slug: string;
  type: string;

  // ==========================================================
  // DESCRIPTION
  // ==========================================================

  description?: string | null;

  // ==========================================================
  // COURSE IMAGE
  // ==========================================================

  imageKey?: string | null;

  // ==========================================================
  // DIGITAL PRODUCT IMAGES
  // ==========================================================

  images: {
    imageKey: string;
  }[];

  // ==========================================================
  // ACCESS TYPE
  // ==========================================================

  accessType: "course" | "digital";

  // ==========================================================
  // DIGITAL PRODUCT FILE
  // ==========================================================

  fileKey?: string | null;

  // ==========================================================
  // COURSE PROGRESS
  // ==========================================================

  progress: {
    totalLessons: number;
    completedLessons: number;
    progressPercentage: number;
  } | null;
}

interface MyProductCardProps {
  product: ProductData;
}

// ==========================================================
// IMAGE URL
// ==========================================================

function getImageUrl(product: ProductData) {
  const imageKey =
    product.accessType === "course"
      ? product.imageKey
      : product.images?.[0]?.imageKey;

  if (!imageKey) {
    return null;
  }

  // Already a complete URL
  if (imageKey.startsWith("http://") || imageKey.startsWith("https://")) {
    return imageKey;
  }

  // UploadThing file key
  return `https://utfs.io/f/${imageKey}`;
}

// ==========================================================
// PRODUCT CARD
// ==========================================================

export function MyProductCard({ product }: MyProductCardProps) {
  const imageUrl = getImageUrl(product);

  const isCourse = product.accessType === "course";

  // ========================================================
  // RENDER
  // ========================================================

  return (
    <Card
      className="
    group
    overflow-hidden
    border-border
    bg-white
     dark:bg-amber-100
    py-0
    gap-0
  "
    >
      {/* ==================================================== */}
      {/* IMAGE */}
      {/* ==================================================== */}

      <div className="relative aspect-video bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.title}
            fill
            sizes="
              (max-width: 640px) 100vw,
              (max-width: 1024px) 50vw,
              (max-width: 1280px) 33vw,
              25vw
            "
            className="
              object-cover
              transition-transform
              duration-300
              group-hover:scale-105
            "
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            {isCourse ? (
              <BookOpen className="size-12 text-muted-foreground" />
            ) : (
              <Download className="size-12 text-muted-foreground" />
            )}
          </div>
        )}

        {/* PRODUCT TYPE BADGE */}

        <Badge className="absolute right-3 top-3">
          {isCourse ? "Course" : "Product"}
        </Badge>
      </div>

      {/* ==================================================== */}
      {/* CONTENT */}
      {/* ==================================================== */}

      <CardContent className="px-5 pt-4 pb-4">
        {/* TITLE */}

        <h3 className="line-clamp-2 text-lg font-semibold">{product.title}</h3>

        {/* ================================================== */}
        {/* DESCRIPTION */}
        {/* ================================================== */}

        {product.description && (
          <div
            className="
              mt-2
              line-clamp-3
              text-sm
              leading-relaxed
              text-muted-foreground

              [&_p]:m-0
              [&_p]:mb-1
              [&_p:last-child]:mb-0

              [&_strong]:font-semibold
              [&_strong]:text-foreground

              [&_ul]:my-1
              [&_ul]:list-disc
              [&_ul]:pl-5

              [&_ol]:my-1
              [&_ol]:list-decimal
              [&_ol]:pl-5
            "
            dangerouslySetInnerHTML={{
              __html: product.description,
            }}
          />
        )}

        {/* ================================================== */}
        {/* COURSE PROGRESS */}
        {/* ================================================== */}

        {isCourse && product.progress && (
          <div className="mt-5 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>

              <span className="font-medium">
                {product.progress.progressPercentage}%
              </span>
            </div>

            <Progress
              value={product.progress.progressPercentage}
              className="h-1.5"
            />

            <p className="text-xs text-muted-foreground">
              {product.progress.completedLessons} of{" "}
              {product.progress.totalLessons} lessons completed
            </p>
          </div>
        )}

        {/* ================================================== */}
        {/* ACCESS BUTTON */}
        {/* ================================================== */}

        <Link
          href={`/learner/products/${product.slug}`}
          className={buttonVariants({
            className: "mt-5 w-full",
          })}
        >
          {isCourse ? (
            <>
              {product.progress && product.progress.progressPercentage > 0
                ? "Continue Learning"
                : "Start Learning"}

              <ArrowRight className="ml-2 size-4" />
            </>
          ) : (
            <>
              Access Product
              <ArrowRight className="ml-2 size-4" />
            </>
          )}
        </Link>
      </CardContent>
    </Card>
  );
}
