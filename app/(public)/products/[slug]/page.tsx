import {
  IconArrowLeft,
  IconBook,
  IconChevronDown,
  IconClock,
  IconPlayerPlay,
} from "@tabler/icons-react";
import { CheckIcon, Star } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import { checkIfCourseBought } from "@/app/actions/user-is-enrolled";
import { getIndividualProduct } from "@/app/actions/manage-get-product";
import { ProductPurchaseOptions } from "@/app/_components/ProductPurchaseOptions";
import { Badge } from "@/app/_components/ui/badge";
import { Separator } from "@/app/_components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/app/_components/ui/collapsible";
import { Card, CardContent } from "@/app/_components/ui/card";
import { buttonVariants } from "@/app/_components/ui/button";
import { ProductGallery } from "@/app/_components/ProductGallery";

type Params = Promise<{ slug: string }>;

/* ==========================================================================
   IMAGE HELPERS
============================================================================= */

function formatImageUrl(key?: unknown): string | null {
  if (!key || typeof key !== "string") {
    return null;
  }

  if (key.startsWith("http://") || key.startsWith("https://")) {
    return key;
  }

  const cleanKey = key.startsWith("/") ? key.slice(1) : key;

  return `https://utfs.io/f/${cleanKey}`;
}

/* ==========================================================================
   PAGE
============================================================================= */

export default async function SlugPage({ params }: { params: Params }) {
  const { slug } = await params;

  const product = await getIndividualProduct(slug);

  if (!product) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Product not found</h1>

          <p className="mt-2 text-sm text-muted-foreground">
            The product you&apos;re looking for may have been removed or is no
            longer available.
          </p>

          <Link
            href="/products"
            className={buttonVariants({
              className: "mt-6 bg-[#857938] text-white hover:bg-[#70662e]",
            })}
          >
            Back to products
          </Link>
        </div>
      </div>
    );
  }

  /* ==========================================================================
     PRODUCT STATE
  ============================================================================= */

  const isCourse = product.type === "Course";
  const isEnrolled = await checkIfCourseBought(product.id);

  /* ==========================================================================
     IMAGES
  ============================================================================= */

  const rawImageKeys: unknown[] = [];

  if (isCourse && product.imageKey) {
    rawImageKeys.push(product.imageKey);
  } else if (product.images?.length) {
    const sortedImages = [...product.images].sort(
      (a, b) => (a.position ?? 0) - (b.position ?? 0),
    );

    sortedImages.forEach((img) => {
      if (img.imageKey) {
        rawImageKeys.push(img.imageKey);
      }
    });
  }

  if (rawImageKeys.length === 0 && product.imageKey) {
    rawImageKeys.push(product.imageKey);
  }

  const productImages: string[] = Array.from(
    new Set(
      rawImageKeys
        .map((key) => formatImageUrl(key))
        .filter((url): url is string => Boolean(url)),
    ),
  );

  if (productImages.length === 0) {
    productImages.push("/placeholder-course.jpg");
  }

  /* ==========================================================================
     PRINTED OPTION
  ============================================================================= */

  const printedPrice = product.printedPrice;

  const hasPrintedOption =
    !isCourse && typeof printedPrice === "number" && printedPrice > 0;

  /* ==========================================================================
     COURSE INFORMATION
  ============================================================================= */

  const totalLessons =
    product.chapters?.reduce(
      (total, chapter) => total + chapter.lessons.length,
      0,
    ) || 0;

  /* ==========================================================================
     RENDER
  ============================================================================= */

  return (
    <main className="min-h-screen bg-slate-50/70 dark:bg-background">
      <div className="mx-auto max-w-8xl px-4 py-6 sm:px-6 lg:px-28 lg:py-2">
        {/* ==================================================================
            BACK
        ================================================================== */}

        <div className="mb-3">
          <Link
            href="/products"
            className={buttonVariants({
              variant: "ghost",
              className:
                "h-auto gap-2 px-0 text-sm text-muted-foreground hover:bg-transparent hover:text-foreground",
            })}
          >
            <IconArrowLeft className="size-4" />
            Back to products
          </Link>
        </div>

        {/* ==================================================================
            TWO COLUMN PRODUCT LAYOUT
        ================================================================== */}

        <div
          className="
            grid
            grid-cols-1
            items-start
            gap-8
          lg:grid-cols-[17fr_8fr]
            lg:gap-10
            xl:gap-8
          "
        >
          {/* ==================================================================
              LEFT COLUMN
          ================================================================== */}

          <section className="min-w-0">
            {/* ================================================================
                PRODUCT GALLERY
            ================================================================= */}

            <div
              className="
    overflow-hidden
    rounded-md
    border
    border-slate-200
    bg-white
    shadow-sm
    dark:border-slate-400
    dark:bg-background
  "
            >
              {isCourse ? (
                // Course has exactly ONE image, so display it directly
                // and let it completely fill the preview container.
                <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                  <Image
                    src={productImages[0]}
                    alt={product.title}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 70vw"
                    className="object-cover"
                  />
                </div>
              ) : (
                // Digital products can have multiple images.
                <ProductGallery images={productImages} title={product.title} />
              )}
            </div>

            {/* ================================================================
                PRODUCT HEADER
            ================================================================= */}

            <div className="mt-8">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {product.category && (
                  <Badge variant="secondary" className="rounded-full px-3 py-1">
                    {product.category}
                  </Badge>
                )}

                {isCourse && (
                  <Badge
                    variant="outline"
                    className="
                      rounded-full
                      border-emerald-200
                      bg-emerald-50
                      px-3
                      py-1
                      text-emerald-700
                      dark:border-emerald-900
                      dark:bg-emerald-950/30
                      dark:text-emerald-400
                    "
                  >
                    Online Course
                  </Badge>
                )}
              </div>

              <h1
                className="
                  max-w-4xl
                  text-3xl
                  font-bold
                  tracking-tight
                  text-slate-900
                  dark:text-white
                  sm:text-4xl
                  lg:text-[2.0rem]
                  lg:leading-tight
                "
              >
                {product.title}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                {isCourse && (
                  <>
                    <span className="flex items-center gap-1.5">
                      <IconBook className="size-4" />
                      {totalLessons} {totalLessons === 1 ? "lesson" : "lessons"}
                    </span>

                    <span className="flex items-center gap-1.5">
                      <IconClock className="size-4" />
                      {product.duration || 0} hours
                    </span>
                  </>
                )}

                <span className="flex items-center gap-1.5">
                  <Badge variant="outline" className="rounded-md px-3 py-1">
                    {product.type}
                  </Badge>
                  <Star className="size-4 fill-amber-400 text-amber-400" />
                  <span className="font-medium text-foreground">4.8</span>
                  <span>(373 reviews)</span>
                </span>
              </div>
            </div>

            <Separator className="my-5" />

            {/* ================================================================
                DESCRIPTION
            ================================================================= */}

            <section>
              <h2 className="mb-4 text-xl font-bold tracking-tight">
                About this product
              </h2>

              <div
                className="
      max-w-none
      text-sm
      leading-7
      text-slate-600
      dark:text-slate-300

      [&_p]:mb-5
      [&_p:last-child]:mb-0

      [&_h1]:mb-5
      [&_h1]:mt-8
      [&_h1]:text-2xl
      [&_h1]:font-bold
      [&_h1]:text-slate-900
      dark:[&_h1]:text-white

      [&_h2]:mb-4
      [&_h2]:mt-7
      [&_h2]:text-xl
      [&_h2]:font-bold
      [&_h2]:text-slate-900
      dark:[&_h2]:text-white

      [&_h3]:mb-3
      [&_h3]:mt-6
      [&_h3]:text-lg
      [&_h3]:font-bold
      [&_h3]:text-slate-900
      dark:[&_h3]:text-white

      [&_strong]:font-bold
      [&_strong]:text-slate-900
      dark:[&_strong]:text-white

      [&_em]:italic

      [&_ul]:my-5
      [&_ul]:list-disc
      [&_ul]:pl-6

      [&_ol]:my-5
      [&_ol]:list-decimal
      [&_ol]:pl-6

      [&_li]:mb-2

      [&_blockquote]:my-5
      [&_blockquote]:border-l-4
      [&_blockquote]:border-[#857938]
      [&_blockquote]:pl-4
      [&_blockquote]:italic

      [&_a]:font-medium
      [&_a]:text-[#857938]
      [&_a]:underline

      [&_br]:content-['']
    "
                dangerouslySetInnerHTML={{
                  __html: product.description || "",
                }}
              />
            </section>

            {/* ================================================================
                WHAT'S INCLUDED
            ================================================================= */}

            <section className="mt-10">
              <h2 className="mb-5 text-xl font-bold tracking-tight">
                What&apos;s included
              </h2>

              <div className="grid gap-3 sm:grid-cols-2">
                <FeatureItem
                  title="Lifetime access"
                  description="Access your purchase whenever you need it."
                />

                <FeatureItem
                  title="Mobile & desktop"
                  description="Use your resources across your devices."
                />

                {isCourse ? (
                  <FeatureItem
                    title="Certificate"
                    description="Receive a certificate upon completion."
                  />
                ) : (
                  <FeatureItem
                    title="Digital files"
                    description="Get instant access to your downloadable files."
                  />
                )}

                {hasPrintedOption && (
                  <FeatureItem
                    title="Printed option"
                    description="Choose a physical copy at checkout."
                  />
                )}
              </div>
            </section>

            {/* ================================================================
                COURSE CONTENT
            ================================================================= */}

            {isCourse && (
              <section className="mt-10">
                <div className="mb-5 flex items-end justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">
                      Course content
                    </h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Explore the lessons included in this course.
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-medium">
                    {totalLessons} {totalLessons === 1 ? "lesson" : "lessons"}
                  </span>
                </div>

                <div className="space-y-3">
                  {product.chapters?.map((chapter, index) => (
                    <Collapsible key={chapter.id} defaultOpen={index === 0}>
                      <Card
                        className="
                            overflow-hidden
                            border-slate-200
                            py-0
                            shadow-sm
                            dark:border-slate-800
                          "
                      >
                        <CollapsibleTrigger className="w-full">
                          <CardContent
                            className="
                                flex
                                items-center
                                justify-between
                                gap-4
                                px-5
                                py-4
                                transition-colors
                                hover:bg-muted/50
                              "
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <div
                                className="
                                    flex
                                    size-8
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-lg
                                    bg-primary/10
                                    text-xs
                                    font-bold
                                    text-primary
                                  "
                              >
                                {index + 1}
                              </div>

                              <span className="truncate text-left text-sm font-semibold">
                                {chapter.title}
                              </span>
                            </div>

                            <IconChevronDown className="size-4 shrink-0 text-muted-foreground" />
                          </CardContent>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <div className="space-y-1 border-t bg-muted/10 p-3">
                            {chapter.lessons.map((lesson) => (
                              <div
                                key={lesson.id}
                                className="
                                      flex
                                      items-center
                                      gap-3
                                      rounded-lg
                                      px-3
                                      py-2.5
                                      text-sm
                                      text-muted-foreground
                                      transition-colors
                                      hover:bg-accent
                                      hover:text-foreground
                                    "
                              >
                                <IconPlayerPlay className="size-4 shrink-0 text-primary" />

                                <span className="truncate">{lesson.title}</span>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  ))}
                </div>
              </section>
            )}

            {/* ================================================================
                CREATOR
            ================================================================= */}

            <section
              className="
                mt-10
                rounded-2xl
                border
                border-slate-200
                bg-white
                p-5
                shadow-sm
                dark:border-slate-800
                dark:bg-slate-950
                sm:p-6
              "
            >
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                About the creator
              </p>

              <div className="flex items-center gap-4">
                <div
                  className="
                    relative
                    flex
                    size-14
                    shrink-0
                    items-center
                    justify-center
                    overflow-hidden
                    rounded-full
                    bg-primary/10
                    text-lg
                    font-bold
                    text-primary
                  "
                >
                  {product.educatorImage ? (
                    <Image
                      src={product.educatorImage}
                      alt={product.educatorName}
                      width={56}
                      height={56}
                      sizes="56px"
                      className="size-full object-cover"
                    />
                  ) : (
                    <span>
                      {Array.from(
                        product.educatorName || "E",
                      )[0]?.toUpperCase() || "E"}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{product.educatorName}</h3>

                    <Badge
                      variant="secondary"
                      className="
                        bg-purple-100
                        text-purple-700
                        dark:bg-purple-950/40
                        dark:text-purple-300
                      "
                    >
                      Star Seller
                    </Badge>
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <Star className="size-4 fill-amber-400 text-amber-400" />

                    <span className="font-medium text-foreground">4.8</span>

                    <span>373 reviews</span>
                  </div>
                </div>
              </div>
            </section>
          </section>

          {/* ==================================================================
              RIGHT COLUMN — ONE COMPLETE PURCHASE CARD
          ================================================================== */}

          <ProductPurchaseOptions
            productId={product.id}
            title={product.title}
            digitalPrice={product.price}
            printedPrice={product.printedPrice}
            image={productImages[0]}
            isCourse={isCourse}
            isEnrolled={isEnrolled}
            enrolledHref={
              isCourse
                ? `/student/enrolled/${product.id}`
                : `/student/downloads/${product.id}`
            }
          />

          {/* ==================================================================
              SMALL RATING CARD
          ================================================================== */}

          <div
            className="
              lg:col-start-2
              -mt-4
              flex
              items-center
              justify-between
              rounded-xl
              border
              border-slate-200
              bg-white
              px-4
              py-3
              shadow-sm
              dark:border-slate-800
              dark:bg-slate-950
              lg:sticky
              lg:top-[calc(1.5rem+100%)]
            "
          >
            <div className="flex items-center gap-2">
              <Star className="size-4 fill-amber-400 text-amber-400" />

              <span className="text-sm font-semibold">4.8</span>

              <span className="text-xs text-muted-foreground">373 reviews</span>
            </div>

            <span className="text-xs font-medium text-emerald-600">
              Highly rated
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ==========================================================================
   FEATURE ITEM
============================================================================= */

function FeatureItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      className="
        flex
        gap-3
        rounded-xl
        border
        border-slate-200
        bg-white
        p-4
        shadow-sm
        dark:border-slate-800
        dark:bg-slate-950
      "
    >
      <div
        className="
          flex
          size-8
          shrink-0
          items-center
          justify-center
          rounded-full
          bg-emerald-500/10
          text-emerald-600
        "
      >
        <CheckIcon className="size-4" />
      </div>

      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>

        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}
