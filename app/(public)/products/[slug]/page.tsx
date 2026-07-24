import {
  IconArrowLeft,
  IconBook,
  IconCategory,
  IconChevronDown,
  IconClock,
  IconDownload,
  IconFileText,
  IconPlayerPlay,
} from "@tabler/icons-react";
import { CheckIcon } from "lucide-react";

import { checkIfCourseBought } from "@/app/actions/user-is-enrolled";
import Link from "next/link";
import { EnrollmentButton } from "../../../_components/EnrollmentButton";
import { getIndividualProduct } from "@/app/actions/get-product";
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

// Format UploadThing Key to absolute CDN URL
function formatImageUrl(key?: string | null): string | null {
  if (!key) return null;
  if (key.startsWith("http://") || key.startsWith("https://")) {
    return key;
  }
  const cleanKey = key.startsWith("/") ? key.slice(1) : key;
  return `https://utfs.io/f/${cleanKey}`;
}

export default async function SlugPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getIndividualProduct(slug);

  const isCourse = Boolean(product?.course);
  const course = product?.course;
  const isEnrolled = await checkIfCourseBought(product.id);

  const rawImageKeys: string[] = [];

  if (isCourse && course?.imageKey) {
    // 1. Course image
    rawImageKeys.push(course.imageKey);
  } else if (product?.digitalProduct?.images?.length) {
    // 2. Digital Product images (Relational model: DigitalProduct -> DigitalProductImage[])
    const sortedImages = [...product.digitalProduct.images].sort(
      (a, b) => (a.position ?? 0) - (b.position ?? 0),
    );
    sortedImages.forEach((img) => {
      if (img.imageKey) rawImageKeys.push(img.imageKey);
    });
  }

  // Fallback check for standard image fields on product if present
  const fallbackProduct = product as typeof product & {
    images?: string[];
    fileKey?: string;
    imageKey?: string;
  };

  if (rawImageKeys.length === 0) {
    if (Array.isArray(fallbackProduct.images)) {
      rawImageKeys.push(...fallbackProduct.images);
    }
    if (fallbackProduct.imageKey) rawImageKeys.push(fallbackProduct.imageKey);
  }

  // Map to CDN URLs & deduplicate
  const productImages: string[] = Array.from(
    new Set(
      rawImageKeys
        .map((key) => formatImageUrl(key))
        .filter((url): url is string => Boolean(url)),
    ),
  );

  // Fallback image
  if (productImages.length === 0) {
    productImages.push("/placeholder-course.jpg");
  }

  const totalLessons =
    course?.chapter?.reduce(
      (total, chapter) => total + chapter.lessons.length,
      0,
    ) || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 mt-5">
      {/* Dynamic Back Button */}
      <div className="mb-6">
        <Link
          href="/products"
          className={buttonVariants({
            variant: "ghost",
            className: "flex items-center gap-2 pl-2 pr-4 hover:bg-accent",
          })}
        >
          <IconArrowLeft className="size-4" />
          <span className="font-medium text-sm">
            {isCourse ? "Back to Products" : "Back to Products"}
          </span>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Details & Content */}
        <div className="order-1 lg:col-span-2">
          {/* Main Interactive Product / Course Gallery */}
          <ProductGallery images={productImages} title={product.title} />

          <div className="mt-8 space-y-6">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight">
                {product.title}
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed line-clamp-2">
                {product.smallDescription}
              </p>
            </div>

            {/* Dynamic Badges */}
            <div className="flex flex-wrap gap-3">
              <Badge className="capitalize flex items-center gap-1 px-3 py-1 rounded-md">
                {isCourse ? "Online Course" : "Digital Download"}
              </Badge>

              {course?.category && (
                <Badge className="flex items-center gap-1 px-3 py-1 rounded-md">
                  <IconCategory className="size-4" />
                  <span>{course.category}</span>
                </Badge>
              )}

              {isCourse && course?.duration && (
                <Badge className="flex items-center gap-1 px-3 py-1 rounded-md">
                  <IconClock className="size-4" />
                  <span>{course.duration} hours</span>
                </Badge>
              )}
            </div>

            <Separator className="my-8" />

            {/* Description Section */}
            {product.smallDescription && (
              <div className="space-y-6">
                <h2 className="text-3xl font-semibold tracking-tight">
                  {isCourse ? "Course Description" : "Product Details"}
                </h2>
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: product.smallDescription }}
                />
              </div>
            )}
          </div>

          {/* Dynamic Content Area: Only Render Chapter Syllabus for Courses */}
          {isCourse && (
            <div className="mt-12 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-semibold tracking-tight">
                  Course Content
                </h2>
                <div className="text-sm text-muted-foreground">
                  {course?.chapter?.length || 0} chapters | {totalLessons}{" "}
                  lessons
                </div>
              </div>

              <div className="space-y-4">
                {course?.chapter?.map((chapter, index) => (
                  <Collapsible key={chapter.id} defaultOpen={index === 0}>
                    <Card className="p-0 overflow-hidden border-2 transition-all duration-200 hover:shadow-md gap-0">
                      <CollapsibleTrigger className="w-full">
                        <CardContent className="p-6 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <p className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                                {index + 1}
                              </p>
                              <div className="text-xl font-semibold text-left">
                                <h3>{chapter.title}</h3>
                                <p className="text-sm text-muted-foreground mt-1 text-left">
                                  {chapter.lessons.length} lesson
                                  {chapter.lessons.length !== 1 ? "s" : ""}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="text-xs">
                                {chapter.lessons.length} lesson
                                {chapter.lessons.length !== 1 ? "s" : ""}
                              </Badge>
                              <IconChevronDown className="size-5 text-muted-foreground" />
                            </div>
                          </div>
                        </CardContent>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="border-t bg-muted/20">
                          <div className="p-6 pt-4 space-y-3">
                            {chapter.lessons.map((lesson, lessonIndex) => (
                              <div
                                key={lesson.id}
                                className="flex items-center gap-4 rounded-lg p-3 hover:bg-accent transition-colors group"
                              >
                                <div className="flex size-8 items-center justify-center rounded-full bg-background border-2 border-primary/20">
                                  <IconPlayerPlay className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm">
                                    {lesson.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Lesson {lessonIndex + 1}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Checkout/Enrollment Card */}
        <div className="order-2 lg:col-span-1">
          <div className="sticky top-20">
            <Card className="py-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-lg font-medium">Price: </span>
                  <span className="text-2xl font-bold text-primary">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(product.price)}
                  </span>
                </div>

                {/* What you will get */}
                <div className="mb-6 space-y-3 rounded-lg bg-muted p-4">
                  <h4 className="font-medium">What you will get:</h4>

                  <div className="space-y-3">
                    {isCourse ? (
                      <>
                        <div className="flex items-center gap-3">
                          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <IconClock className="size-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              Course Duration
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {course?.duration || 0} hours
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <IconBook className="size-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Total Lessons</p>
                            <p className="text-sm text-muted-foreground">
                              {totalLessons} lessons
                            </p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <IconDownload className="size-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              Instant Access
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Download file right after purchase
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <IconFileText className="size-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Digital Files</p>
                            <p className="text-sm text-muted-foreground">
                              Lifetime access to updates
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Purchase Checklist */}
                <div className="mb-6 space-y-3">
                  <h4>This purchase includes:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <div className="rounded-full bg-green-500/10 text-green-500 p-1">
                        <CheckIcon className="size-3" />
                      </div>
                      <span>Full lifetime access</span>
                    </li>

                    <li className="flex items-center gap-2 text-sm">
                      <div className="rounded-full bg-green-500/10 text-green-500 p-1">
                        <CheckIcon className="size-3" />
                      </div>
                      <span>Access on mobile and desktop</span>
                    </li>

                    {isCourse && (
                      <li className="flex items-center gap-2 text-sm">
                        <div className="rounded-full bg-green-500/10 text-green-500 p-1">
                          <CheckIcon className="size-3" />
                        </div>
                        <span>Certificate on completion</span>
                      </li>
                    )}
                  </ul>
                </div>

                {/* Action Buttons */}
                {isEnrolled ? (
                  <Link
                    className={buttonVariants({
                      className: "w-full bg-[#857938] text-white",
                    })}
                    href={
                      isCourse
                        ? `/student/enrolled/${product.id}`
                        : `/student/downloads/${product.id}`
                    }
                  >
                    {isCourse ? "Watch Course" : "Download Files"}
                  </Link>
                ) : (
                  <EnrollmentButton
                    courseId={product.id}
                    buttonText={isCourse ? "Enroll Now" : "Buy Now"}
                  />
                )}

                <p className="mt-3 text-center text-xs text-muted-foreground">
                  30-day money back guaranteed
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// import {
//   IconArrowLeft,
//   IconBook,
//   IconCategory,
//   IconChevronDown,
//   IconClock,
//   IconDownload,
//   IconFileText,
//   IconPlayerPlay,
// } from "@tabler/icons-react";
// import { CheckIcon } from "lucide-react";

// import { checkIfCourseBought } from "@/app/actions/user-is-enrolled";
// import Link from "next/link";
// import { EnrollmentButton } from "../../../_components/EnrollmentButton";
// import { getIndividualProduct } from "@/app/actions/get-product";
// import { Badge } from "@/app/_components/ui/badge";
// import { Separator } from "@/app/_components/ui/separator";
// import {
//   Collapsible,
//   CollapsibleContent,
//   CollapsibleTrigger,
// } from "@/app/_components/ui/collapsible";
// import { Card, CardContent } from "@/app/_components/ui/card";
// import { buttonVariants } from "@/app/_components/ui/button";
// import { ProductGallery } from "@/app/_components/ProductGallery";

// type Params = Promise<{ slug: string }>;

// interface ExtendedProductFields {
//   images?: string[] | string | null;
//   fileKeys?: string[] | string | null;
//   imageKey?: string | null;
//   fileKey?: string | null;
// }

// // Fixed UploadThing URL Formatter
// function formatImageUrl(key?: string | null): string | null {
//   if (!key) return null;
//   if (key.startsWith("http://") || key.startsWith("https://")) {
//     return key;
//   }
//   if (key.startsWith("/f/")) {
//     return `https://utfs.io${key}`;
//   }
//   return `https://utfs.io/f/${key}`;
// }

// export default async function SlugPage({ params }: { params: Params }) {
//   const { slug } = await params;
//   const product = await getIndividualProduct(slug);

//   const extraFields = product as typeof product & ExtendedProductFields;

//   const isCourse = Boolean(product.course);
//   const course = product.course;
//   const isEnrolled = await checkIfCourseBought(product.id);

//   // Collect all image keys into a single array
//   const rawImageSources: string[] = [];

//   if (isCourse && course?.imageKey) {
//     rawImageSources.push(course.imageKey);
//   } else {
//     // 1. Process array/JSON string properties (images / fileKeys)
//     const possibleArrays = [extraFields.images, extraFields.fileKeys];

//     possibleArrays.forEach((item) => {
//       if (Array.isArray(item)) {
//         rawImageSources.push(...item);
//       } else if (typeof item === "string" && item.trim().startsWith("[")) {
//         try {
//           const parsed = JSON.parse(item);
//           if (Array.isArray(parsed)) rawImageSources.push(...parsed);
//         } catch {
//           // If JSON parse fails, treat as single key
//           rawImageSources.push(item);
//         }
//       } else if (typeof item === "string" && item.length > 0) {
//         rawImageSources.push(item);
//       }
//     });

//     // 2. Process single key properties (imageKey / fileKey)
//     if (extraFields.imageKey) rawImageSources.push(extraFields.imageKey);
//     if (extraFields.fileKey) rawImageSources.push(extraFields.fileKey);
//   }

//   // Format keys to full CDN URLs & remove duplicates
//   const productImages: string[] = Array.from(
//     new Set(
//       rawImageSources
//         .map((img) => formatImageUrl(img))
//         .filter((url): url is string => Boolean(url)),
//     ),
//   );

//   // Fallback if no images found
//   if (productImages.length === 0) {
//     productImages.push("/placeholder-course.jpg");
//   }

//   const totalLessons =
//     course?.chapter?.reduce(
//       (total, chapter) => total + chapter.lessons.length,
//       0,
//     ) || 0;

//   return (
//     <div className="max-w-7xl mx-auto px-4 md:px-8 mt-5">
//       {/* Dynamic Back Button */}
//       <div className="mb-6">
//         <Link
//           href="/products"
//           className={buttonVariants({
//             variant: "ghost",
//             className: "flex items-center gap-2 pl-2 pr-4 hover:bg-accent",
//           })}
//         >
//           <IconArrowLeft className="size-4" />
//           <span className="font-medium text-sm">
//             {isCourse ? "Back to Courses" : "Back to Products"}
//           </span>
//         </Link>
//       </div>

//       <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
//         {/* Left Column: Details & Content */}
//         <div className="order-1 lg:col-span-2">
//           {/* Main Interactive Product / Course Gallery */}
//           <ProductGallery images={productImages} title={product.title} />

//           <div className="mt-8 space-y-6">
//             <div className="space-y-4">
//               <h1 className="text-4xl font-bold tracking-tight">
//                 {product.title}
//               </h1>
//               <p className="text-lg text-muted-foreground leading-relaxed line-clamp-2">
//                 {product.smallDescription}
//               </p>
//             </div>

//             {/* Dynamic Badges */}
//             <div className="flex flex-wrap gap-3">
//               <Badge variant="secondary" className="capitalize">
//                 {isCourse ? "Online Course" : "Digital Download"}
//               </Badge>

//               {course?.category && (
//                 <Badge className="flex items-center gap-1 px-3 py-1 rounded-md">
//                   <IconCategory className="size-4" />
//                   <span>{course.category}</span>
//                 </Badge>
//               )}

//               {isCourse && course?.duration && (
//                 <Badge className="flex items-center gap-1 px-3 py-1 rounded-md">
//                   <IconClock className="size-4" />
//                   <span>{course.duration} hours</span>
//                 </Badge>
//               )}
//             </div>

//             <Separator className="my-8" />

//             {/* Description Section */}
//             {product.smallDescription && (
//               <div className="space-y-6">
//                 <h2 className="text-3xl font-semibold tracking-tight">
//                   {isCourse ? "Course Description" : "Product Details"}
//                 </h2>
//                 <div
//                   className="prose max-w-none"
//                   dangerouslySetInnerHTML={{ __html: product.smallDescription }}
//                 />
//               </div>
//             )}
//           </div>

//           {/* Dynamic Content Area: Only Render Chapter Syllabus for Courses */}
//           {isCourse && (
//             <div className="mt-12 space-y-6">
//               <div className="flex items-center justify-between">
//                 <h2 className="text-3xl font-semibold tracking-tight">
//                   Course Content
//                 </h2>
//                 <div className="text-sm text-muted-foreground">
//                   {course?.chapter?.length || 0} chapters | {totalLessons}{" "}
//                   lessons
//                 </div>
//               </div>

//               <div className="space-y-4">
//                 {course?.chapter?.map((chapter, index) => (
//                   <Collapsible key={chapter.id} defaultOpen={index === 0}>
//                     <Card className="p-0 overflow-hidden border-2 transition-all duration-200 hover:shadow-md gap-0">
//                       <CollapsibleTrigger className="w-full">
//                         <CardContent className="p-6 hover:bg-muted/50 transition-colors">
//                           <div className="flex items-center justify-between">
//                             <div className="flex items-center gap-4">
//                               <p className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
//                                 {index + 1}
//                               </p>
//                               <div className="text-xl font-semibold text-left">
//                                 <h3>{chapter.title}</h3>
//                                 <p className="text-sm text-muted-foreground mt-1 text-left">
//                                   {chapter.lessons.length} lesson
//                                   {chapter.lessons.length !== 1 ? "s" : ""}
//                                 </p>
//                               </div>
//                             </div>

//                             <div className="flex items-center gap-3">
//                               <Badge variant="outline" className="text-xs">
//                                 {chapter.lessons.length} lesson
//                                 {chapter.lessons.length !== 1 ? "s" : ""}
//                               </Badge>
//                               <IconChevronDown className="size-5 text-muted-foreground" />
//                             </div>
//                           </div>
//                         </CardContent>
//                       </CollapsibleTrigger>
//                       <CollapsibleContent>
//                         <div className="border-t bg-muted/20">
//                           <div className="p-6 pt-4 space-y-3">
//                             {chapter.lessons.map((lesson, lessonIndex) => (
//                               <div
//                                 key={lesson.id}
//                                 className="flex items-center gap-4 rounded-lg p-3 hover:bg-accent transition-colors group"
//                               >
//                                 <div className="flex size-8 items-center justify-center rounded-full bg-background border-2 border-primary/20">
//                                   <IconPlayerPlay className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
//                                 </div>
//                                 <div>
//                                   <p className="font-medium text-sm">
//                                     {lesson.title}
//                                   </p>
//                                   <p className="text-xs text-muted-foreground mt-1">
//                                     Lesson {lessonIndex + 1}
//                                   </p>
//                                 </div>
//                               </div>
//                             ))}
//                           </div>
//                         </div>
//                       </CollapsibleContent>
//                     </Card>
//                   </Collapsible>
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Right Column: Checkout/Enrollment Card */}
//         <div className="order-2 lg:col-span-1">
//           <div className="sticky top-20">
//             <Card className="py-0">
//               <CardContent className="p-6">
//                 <div className="flex items-center justify-between mb-6">
//                   <span className="text-lg font-medium">Price: </span>
//                   <span className="text-2xl font-bold text-primary">
//                     {new Intl.NumberFormat("en-US", {
//                       style: "currency",
//                       currency: "USD",
//                     }).format(product.price)}
//                   </span>
//                 </div>

//                 {/* What you will get */}
//                 <div className="mb-6 space-y-3 rounded-lg bg-muted p-4">
//                   <h4 className="font-medium">What you will get:</h4>

//                   <div className="space-y-3">
//                     {isCourse ? (
//                       <>
//                         <div className="flex items-center gap-3">
//                           <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
//                             <IconClock className="size-4" />
//                           </div>
//                           <div>
//                             <p className="text-sm font-medium">
//                               Course Duration
//                             </p>
//                             <p className="text-sm text-muted-foreground">
//                               {course?.duration || 0} hours
//                             </p>
//                           </div>
//                         </div>

//                         <div className="flex items-center gap-3">
//                           <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
//                             <IconBook className="size-4" />
//                           </div>
//                           <div>
//                             <p className="text-sm font-medium">Total Lessons</p>
//                             <p className="text-sm text-muted-foreground">
//                               {totalLessons} lessons
//                             </p>
//                           </div>
//                         </div>
//                       </>
//                     ) : (
//                       <>
//                         <div className="flex items-center gap-3">
//                           <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
//                             <IconDownload className="size-4" />
//                           </div>
//                           <div>
//                             <p className="text-sm font-medium">
//                               Instant Access
//                             </p>
//                             <p className="text-sm text-muted-foreground">
//                               Download file right after purchase
//                             </p>
//                           </div>
//                         </div>

//                         <div className="flex items-center gap-3">
//                           <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
//                             <IconFileText className="size-4" />
//                           </div>
//                           <div>
//                             <p className="text-sm font-medium">Digital Files</p>
//                             <p className="text-sm text-muted-foreground">
//                               Lifetime access to updates
//                             </p>
//                           </div>
//                         </div>
//                       </>
//                     )}
//                   </div>
//                 </div>

//                 {/* Purchase Checklist */}
//                 <div className="mb-6 space-y-3">
//                   <h4>This purchase includes:</h4>
//                   <ul className="space-y-2">
//                     <li className="flex items-center gap-2 text-sm">
//                       <div className="rounded-full bg-green-500/10 text-green-500 p-1">
//                         <CheckIcon className="size-3" />
//                       </div>
//                       <span>Full lifetime access</span>
//                     </li>

//                     <li className="flex items-center gap-2 text-sm">
//                       <div className="rounded-full bg-green-500/10 text-green-500 p-1">
//                         <CheckIcon className="size-3" />
//                       </div>
//                       <span>Access on mobile and desktop</span>
//                     </li>

//                     {isCourse && (
//                       <li className="flex items-center gap-2 text-sm">
//                         <div className="rounded-full bg-green-500/10 text-green-500 p-1">
//                           <CheckIcon className="size-3" />
//                         </div>
//                         <span>Certificate on completion</span>
//                       </li>
//                     )}
//                   </ul>
//                 </div>

//                 {/* Action Buttons */}
//                 {isEnrolled ? (
//                   <Link
//                     className={buttonVariants({
//                       className: "w-full bg-[#857938] text-white",
//                     })}
//                     href={
//                       isCourse
//                         ? `/student/enrolled/${product.id}`
//                         : `/student/downloads/${product.id}`
//                     }
//                   >
//                     {isCourse ? "Watch Course" : "Download Files"}
//                   </Link>
//                 ) : (
//                   <EnrollmentButton
//                     courseId={product.id}
//                     buttonText={isCourse ? "Enroll Now" : "Buy Now"}
//                   />
//                 )}

//                 <p className="mt-3 text-center text-xs text-muted-foreground">
//                   30-day money back guaranteed
//                 </p>
//               </CardContent>
//             </Card>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// import {
//   IconArrowLeft,
//   IconBook,
//   IconCategory,
//   IconChevronDown,
//   IconClock,
//   IconDownload,
//   IconFileText,
//   IconPlayerPlay,
// } from "@tabler/icons-react";
// import { CheckIcon } from "lucide-react";

// import { checkIfCourseBought } from "@/app/actions/user-is-enrolled";
// import Link from "next/link";
// import { EnrollmentButton } from "./_components/EnrollmentButton";
// import { getIndividualProduct } from "@/app/actions/get-product";
// import { Badge } from "@/app/_components/ui/badge";
// import { Separator } from "@/app/_components/ui/separator";
// import Image from "next/image";
// import {
//   Collapsible,
//   CollapsibleContent,
//   CollapsibleTrigger,
// } from "@/app/_components/ui/collapsible";
// import { Card, CardContent } from "@/app/_components/ui/card";
// import { buttonVariants } from "@/app/_components/ui/button";

// type Params = Promise<{ slug: string }>;

// export default async function SlugPage({ params }: { params: Params }) {
//   const { slug } = await params;
//   const product = await getIndividualProduct(slug);

//   // 1. Check if it's a course based on the presence of the nested course object
//   const isCourse = Boolean(product.course);
//   const course = product.course;
//   const isEnrolled = await checkIfCourseBought(product.id);

//   // 2. Handle image fallback safely without referencing fileKey directly
//   const imageSrc = course?.imageKey
//     ? course.imageKey.startsWith("http")
//       ? course.imageKey
//       : `https://utfs.io/f/${course.imageKey}`
//     : "/placeholder-course.jpg";

//   const totalLessons =
//     course?.chapter?.reduce(
//       (total, chapter) => total + chapter.lessons.length,
//       0,
//     ) || 0;

//   return (
//     <div className="max-w-7xl mx-auto px-4 md:px-8 mt-5">
//       {/* Dynamic Back Button */}
//       <div className="mb-6">
//         <Link
//           href="/products"
//           className={buttonVariants({
//             variant: "ghost",
//             className: "flex items-center gap-2 pl-2 pr-4 hover:bg-accent",
//           })}
//         >
//           <IconArrowLeft className="size-4" />
//           <span className="font-medium text-sm">
//             {isCourse ? "Back to Courses" : "Back to Products"}
//           </span>
//         </Link>
//       </div>

//       <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
//         {/* Left Column: Details & Content */}
//         <div className="order-1 lg:col-span-2">
//           {/* Main Product / Course Image */}
//           <div className="relative aspect-video w-full overflow-hidden rounded-xl shadow-lg">
//             <Image
//               src={imageSrc}
//               alt={product.title || "Product thumbnail"}
//               fill
//               className="object-cover"
//               priority
//             />
//             <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent"></div>
//           </div>

//           <div className="mt-8 space-y-6">
//             <div className="space-y-4">
//               <h1 className="text-4xl font-bold tracking-tight">
//                 {product.title}
//               </h1>
//               <p className="text-lg text-muted-foreground leading-relaxed line-clamp-2">
//                 {product.smallDescription}
//               </p>
//             </div>

//             {/* Dynamic Badges */}
//             <div className="flex flex-wrap gap-3">
//               <Badge variant="secondary" className="capitalize">
//                 {isCourse ? "Online Course" : "Digital Download"}
//               </Badge>

//               {course?.category && (
//                 <Badge className="flex items-center gap-1 px-3 py-1 rounded-md">
//                   <IconCategory className="size-4" />
//                   <span>{course.category}</span>
//                 </Badge>
//               )}

//               {isCourse && course?.duration && (
//                 <Badge className="flex items-center gap-1 px-3 py-1 rounded-md">
//                   <IconClock className="size-4" />
//                   <span>{course.duration} hours</span>
//                 </Badge>
//               )}
//             </div>

//             <Separator className="my-8" />

//             {/* Description Section */}
//             {product.smallDescription && (
//               <div className="space-y-6">
//                 <h2 className="text-3xl font-semibold tracking-tight">
//                   {isCourse ? "Course Description" : "Product Details"}
//                 </h2>
//                 <div
//                   className="prose max-w-none"
//                   dangerouslySetInnerHTML={{ __html: product.smallDescription }}
//                 />
//               </div>
//             )}
//           </div>

//           {/* Dynamic Content Area: Only Render Chapter Syllabus for Courses */}
//           {isCourse && (
//             <div className="mt-12 space-y-6">
//               <div className="flex items-center justify-between">
//                 <h2 className="text-3xl font-semibold tracking-tight">
//                   Course Content
//                 </h2>
//                 <div className="text-sm text-muted-foreground">
//                   {course?.chapter?.length || 0} chapters | {totalLessons}{" "}
//                   lessons
//                 </div>
//               </div>

//               <div className="space-y-4">
//                 {course?.chapter?.map((chapter, index) => (
//                   <Collapsible key={chapter.id} defaultOpen={index === 0}>
//                     <Card className="p-0 overflow-hidden border-2 transition-all duration-200 hover:shadow-md gap-0">
//                       <CollapsibleTrigger className="w-full">
//                         <CardContent className="p-6 hover:bg-muted/50 transition-colors">
//                           <div className="flex items-center justify-between">
//                             <div className="flex items-center gap-4">
//                               <p className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
//                                 {index + 1}
//                               </p>
//                               <div className="text-xl font-semibold text-left">
//                                 <h3>{chapter.title}</h3>
//                                 <p className="text-sm text-muted-foreground mt-1 text-left">
//                                   {chapter.lessons.length} lesson
//                                   {chapter.lessons.length !== 1 ? "s" : ""}
//                                 </p>
//                               </div>
//                             </div>

//                             <div className="flex items-center gap-3">
//                               <Badge variant="outline" className="text-xs">
//                                 {chapter.lessons.length} lesson
//                                 {chapter.lessons.length !== 1 ? "s" : ""}
//                               </Badge>
//                               <IconChevronDown className="size-5 text-muted-foreground" />
//                             </div>
//                           </div>
//                         </CardContent>
//                       </CollapsibleTrigger>
//                       <CollapsibleContent>
//                         <div className="border-t bg-muted/20">
//                           <div className="p-6 pt-4 space-y-3">
//                             {chapter.lessons.map((lesson, lessonIndex) => (
//                               <div
//                                 key={lesson.id}
//                                 className="flex items-center gap-4 rounded-lg p-3 hover:bg-accent transition-colors group"
//                               >
//                                 <div className="flex size-8 items-center justify-center rounded-full bg-background border-2 border-primary/20">
//                                   <IconPlayerPlay className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
//                                 </div>
//                                 <div>
//                                   <p className="font-medium text-sm">
//                                     {lesson.title}
//                                   </p>
//                                   <p className="text-xs text-muted-foreground mt-1">
//                                     Lesson {lessonIndex + 1}
//                                   </p>
//                                 </div>
//                               </div>
//                             ))}
//                           </div>
//                         </div>
//                       </CollapsibleContent>
//                     </Card>
//                   </Collapsible>
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Right Column: Checkout/Enrollment Card */}
//         <div className="order-2 lg:col-span-1">
//           <div className="sticky top-20">
//             <Card className="py-0">
//               <CardContent className="p-6">
//                 <div className="flex items-center justify-between mb-6">
//                   <span className="text-lg font-medium">Price: </span>
//                   <span className="text-2xl font-bold text-primary">
//                     {new Intl.NumberFormat("en-US", {
//                       style: "currency",
//                       currency: "USD",
//                     }).format(product.price)}
//                   </span>
//                 </div>

//                 {/* What you will get (Dynamic for Course vs Downloadable) */}
//                 <div className="mb-6 space-y-3 rounded-lg bg-muted p-4">
//                   <h4 className="font-medium">What you will get:</h4>

//                   <div className="space-y-3">
//                     {isCourse ? (
//                       <>
//                         <div className="flex items-center gap-3">
//                           <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
//                             <IconClock className="size-4" />
//                           </div>
//                           <div>
//                             <p className="text-sm font-medium">
//                               Course Duration
//                             </p>
//                             <p className="text-sm text-muted-foreground">
//                               {course?.duration || 0} hours
//                             </p>
//                           </div>
//                         </div>

//                         <div className="flex items-center gap-3">
//                           <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
//                             <IconBook className="size-4" />
//                           </div>
//                           <div>
//                             <p className="text-sm font-medium">Total Lessons</p>
//                             <p className="text-sm text-muted-foreground">
//                               {totalLessons} lessons
//                             </p>
//                           </div>
//                         </div>
//                       </>
//                     ) : (
//                       <>
//                         <div className="flex items-center gap-3">
//                           <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
//                             <IconDownload className="size-4" />
//                           </div>
//                           <div>
//                             <p className="text-sm font-medium">
//                               Instant Access
//                             </p>
//                             <p className="text-sm text-muted-foreground">
//                               Download file right after purchase
//                             </p>
//                           </div>
//                         </div>

//                         <div className="flex items-center gap-3">
//                           <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
//                             <IconFileText className="size-4" />
//                           </div>
//                           <div>
//                             <p className="text-sm font-medium">Digital Files</p>
//                             <p className="text-sm text-muted-foreground">
//                               Lifetime access to updates
//                             </p>
//                           </div>
//                         </div>
//                       </>
//                     )}
//                   </div>
//                 </div>

//                 {/* Purchase Checklist */}
//                 <div className="mb-6 space-y-3">
//                   <h4>This purchase includes:</h4>
//                   <ul className="space-y-2">
//                     <li className="flex items-center gap-2 text-sm">
//                       <div className="rounded-full bg-green-500/10 text-green-500 p-1">
//                         <CheckIcon className="size-3" />
//                       </div>
//                       <span>Full lifetime access</span>
//                     </li>

//                     <li className="flex items-center gap-2 text-sm">
//                       <div className="rounded-full bg-green-500/10 text-green-500 p-1">
//                         <CheckIcon className="size-3" />
//                       </div>
//                       <span>Access on mobile and desktop</span>
//                     </li>

//                     {isCourse && (
//                       <li className="flex items-center gap-2 text-sm">
//                         <div className="rounded-full bg-green-500/10 text-green-500 p-1">
//                           <CheckIcon className="size-3" />
//                         </div>
//                         <span>Certificate on completion</span>
//                       </li>
//                     )}
//                   </ul>
//                 </div>

//                 {/* Action Buttons: Check Enrolled / Purchased Status */}
//                 {isEnrolled ? (
//                   <Link
//                     className={buttonVariants({
//                       className: "w-full bg-[#857938] text-white",
//                     })}
//                     href={
//                       isCourse
//                         ? `/dashboard/student/enrolled/${product.id}`
//                         : `/dashboard/student/downloads/${product.id}`
//                     }
//                   >
//                     {isCourse ? "Watch Course" : "Download Files"}
//                   </Link>
//                 ) : (
//                   <EnrollmentButton
//                     courseId={product.id}
//                     buttonText={isCourse ? "Enroll Now" : "Buy Now"}
//                   />
//                 )}

//                 <p className="mt-3 text-center text-xs text-muted-foreground">
//                   30-day money back guaranteed
//                 </p>
//               </CardContent>
//             </Card>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// import {
//   IconArrowLeft,
//   IconBook,
//   IconCategory,
//   IconChevronDown,
//   IconClock,
//   IconPlayerPlay,
// } from "@tabler/icons-react";
// import { CheckIcon } from "lucide-react";

// import { checkIfCourseBought } from "@/app/actions/user-is-enrolled";
// import Link from "next/link";
// import { EnrollmentButton } from "./_components/EnrollmentButton";
// import { getIndividualProduct } from "@/app/actions/get-product";
// import { Badge } from "@/app/_components/ui/badge";
// import { Separator } from "@/app/_components/ui/separator";
// import Image from "next/image";
// import {
//   Collapsible,
//   CollapsibleContent,
//   CollapsibleTrigger,
// } from "@/app/_components/ui/collapsible";
// import { Card, CardContent } from "@/app/_components/ui/card";
// import { buttonVariants } from "@/app/_components/ui/button";

// type Params = Promise<{ slug: string }>;

// export default async function SlugPage({ params }: { params: Params }) {
//   const { slug } = await params;
//   const product = await getIndividualProduct(slug);
//   const course = product.course; // Access the nested course relation
//   const isEnrolled = await checkIfCourseBought(product.id);

//   const imageSrc = course?.imageKey
//     ? course.imageKey.startsWith("http")
//       ? course.imageKey
//       : `https://utfs.io/f/${course.imageKey}`
//     : "/placeholder-course.jpg";

//   const totalLessons =
//     course?.chapter?.reduce(
//       (total, chapter) => total + chapter.lessons.length,
//       0,
//     ) || 0;

//   return (
//     <div className="max-w-7xl mx-auto px-4 md:px-8 mt-5">
//       {/* Back Button Container */}
//       <div className="mb-6">
//         <Link
//           href="/products"
//           className={buttonVariants({
//             variant: "ghost",
//             className: "flex items-center gap-2 pl-2 pr-4 hover:bg-accent",
//           })}
//         >
//           <IconArrowLeft className="size-4" />
//           <span className="font-medium text-sm">Back to Courses</span>
//         </Link>
//       </div>

//       <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
//         {/* Left Column: Details & Content */}
//         <div className="order-1 lg:col-span-2">
//           {/* Main Course Image */}
//           <div className="relative aspect-video w-full overflow-hidden rounded-xl shadow-lg">
//             <Image
//               src={imageSrc}
//               alt={product.title || "Course thumbnail"}
//               fill
//               className="object-cover"
//               priority
//             />
//             <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent"></div>
//           </div>

//           <div className="mt-8 space-y-6">
//             <div className="space-y-4">
//               <h1 className="text-4xl font-bold tracking-tight">
//                 {product.title}
//               </h1>
//               <p className="text-lg text-muted-foreground leading-relaxed line-clamp-2">
//                 {product.smallDescription}
//               </p>
//             </div>

//             {/* Dynamic Badges */}
//             <div className="flex flex-wrap gap-3">
//               {course?.category && (
//                 <Badge className="flex items-center gap-1 px-3 py-1 rounded-md">
//                   <IconCategory className="size-4" />
//                   <span>{course.category}</span>
//                 </Badge>
//               )}

//               {course?.duration && (
//                 <Badge className="flex items-center gap-1 px-3 py-1 rounded-md">
//                   <IconClock className="size-4" />
//                   <span>{course.duration} hours</span>
//                 </Badge>
//               )}
//             </div>

//             <Separator className="my-8" />

//             {/* Description Section */}
//             {product.smallDescription && (
//               <div className="space-y-6">
//                 <h2 className="text-3xl font-semibold tracking-tight">
//                   Course Description
//                 </h2>
//                 <div
//                   className="prose max-w-none"
//                   dangerouslySetInnerHTML={{ __html: product.smallDescription }}
//                 />
//               </div>
//             )}
//           </div>

//           {/* Dynamic Content Area: Syllabus */}
//           <div className="mt-12 space-y-6">
//             <div className="flex items-center justify-between">
//               <h2 className="text-3xl font-semibold tracking-tight">
//                 Course Content
//               </h2>
//               <div className="text-sm text-muted-foreground">
//                 {course?.chapter?.length || 0} chapters | {totalLessons} lessons
//               </div>
//             </div>

//             <div className="space-y-4">
//               {course?.chapter?.map((chapter, index) => (
//                 <Collapsible key={chapter.id} defaultOpen={index === 0}>
//                   <Card className="p-0 overflow-hidden border-2 transition-all duration-200 hover:shadow-md gap-0">
//                     <CollapsibleTrigger className="w-full">
//                       <CardContent className="p-6 hover:bg-muted/50 transition-colors">
//                         <div className="flex items-center justify-between">
//                           <div className="flex items-center gap-4">
//                             <p className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
//                               {index + 1}
//                             </p>
//                             <div className="text-xl font-semibold text-left">
//                               <h3>{chapter.title}</h3>
//                               <p className="text-sm text-muted-foreground mt-1 text-left">
//                                 {chapter.lessons.length} lesson
//                                 {chapter.lessons.length !== 1 ? "s" : ""}
//                               </p>
//                             </div>
//                           </div>

//                           <div className="flex items-center gap-3">
//                             <Badge variant="outline" className="text-xs">
//                               {chapter.lessons.length} lesson
//                               {chapter.lessons.length !== 1 ? "s" : ""}
//                             </Badge>
//                             <IconChevronDown className="size-5 text-muted-foreground" />
//                           </div>
//                         </div>
//                       </CardContent>
//                     </CollapsibleTrigger>
//                     <CollapsibleContent>
//                       <div className="border-t bg-muted/20">
//                         <div className="p-6 pt-4 space-y-3">
//                           {chapter.lessons.map((lesson, lessonIndex) => (
//                             <div
//                               key={lesson.id}
//                               className="flex items-center gap-4 rounded-lg p-3 hover:bg-accent transition-colors group"
//                             >
//                               <div className="flex size-8 items-center justify-center rounded-full bg-background border-2 border-primary/20">
//                                 <IconPlayerPlay className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
//                               </div>
//                               <div>
//                                 <p className="font-medium text-sm">
//                                   {lesson.title}
//                                 </p>
//                                 <p className="text-xs text-muted-foreground mt-1">
//                                   Lesson {lessonIndex + 1}
//                                 </p>
//                               </div>
//                             </div>
//                           ))}
//                         </div>
//                       </div>
//                     </CollapsibleContent>
//                   </Card>
//                 </Collapsible>
//               ))}
//             </div>
//           </div>
//         </div>

//         {/* Right Column: Checkout/Enrollment Card */}
//         <div className="order-2 lg:col-span-1">
//           <div className="sticky top-20">
//             <Card className="py-0">
//               <CardContent className="p-6">
//                 <div className="flex items-center justify-between mb-6">
//                   <span className="text-lg font-medium">Price: </span>
//                   <span className="text-2xl font-bold text-primary">
//                     {new Intl.NumberFormat("en-US", {
//                       style: "currency",
//                       currency: "USD",
//                     }).format(product.price)}
//                   </span>
//                 </div>

//                 {/* What you will get */}
//                 <div className="mb-6 space-y-3 rounded-lg bg-muted p-4">
//                   <h4 className="font-medium">What you will get:</h4>

//                   <div className="space-y-3">
//                     <div className="flex items-center gap-3">
//                       <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
//                         <IconClock className="size-4" />
//                       </div>
//                       <div>
//                         <p className="text-sm font-medium">Course Duration</p>
//                         <p className="text-sm text-muted-foreground">
//                           {course?.duration || 0} hours
//                         </p>
//                       </div>
//                     </div>

//                     <div className="flex items-center gap-3">
//                       <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
//                         <IconBook className="size-4" />
//                       </div>
//                       <div>
//                         <p className="text-sm font-medium">Total Lessons</p>
//                         <p className="text-sm text-muted-foreground">
//                           {totalLessons} lessons
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Purchase Checklist */}
//                 <div className="mb-6 space-y-3">
//                   <h4>This purchase includes:</h4>
//                   <ul className="space-y-2">
//                     <li className="flex items-center gap-2 text-sm">
//                       <div className="rounded-full bg-green-500/10 text-green-500 p-1">
//                         <CheckIcon className="size-3" />
//                       </div>
//                       <span>Full lifetime access</span>
//                     </li>

//                     <li className="flex items-center gap-2 text-sm">
//                       <div className="rounded-full bg-green-500/10 text-green-500 p-1">
//                         <CheckIcon className="size-3" />
//                       </div>
//                       <span>Access on mobile and desktop</span>
//                     </li>

//                     <li className="flex items-center gap-2 text-sm">
//                       <div className="rounded-full bg-green-500/10 text-green-500 p-1">
//                         <CheckIcon className="size-3" />
//                       </div>
//                       <span>Certificate on completion</span>
//                     </li>
//                   </ul>
//                 </div>

//                 {isEnrolled ? (
//                   <Link
//                     className={buttonVariants({
//                       className: "w-full bg-[#857938] text-white",
//                     })}
//                     href={`/dashboard/student/enrolled/${product.id}`}
//                   >
//                     Watch Course
//                   </Link>
//                 ) : (
//                   <EnrollmentButton courseId={product.id} />
//                 )}

//                 <p className="mt-3 text-center text-xs text-muted-foreground">
//                   30-day money back guaranteed
//                 </p>
//               </CardContent>
//             </Card>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
