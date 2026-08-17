// "use client";

// import { buttonVariants } from "@/app/_components/ui/button";
// import { Card, CardContent } from "@/app/_components/ui/card";
// import { Progress } from "@/app/_components/ui/progress";
// import { EnrolledCourseType } from "@/app/actions/manage-get-enrolled-courses";
// import { useCourseProgress } from "@/hooks/use-course-progress";
// import Image from "next/image";
// import Link from "next/link";

// interface IAppProps {
//   data: EnrolledCourseType;
// }

// // ==========================================================
// // UPLOADTHING URL HELPER
// // ==========================================================

// function getUploadThingUrl(key?: string | null): string | undefined {
//   if (!key) {
//     return undefined;
//   }

//   // Already a complete URL
//   if (key.startsWith("http://") || key.startsWith("https://")) {
//     return key;
//   }

//   // UploadThing file key
//   return `https://utfs.io/f/${key}`;
// }

// export function CourseProgressCard({ data }: IAppProps) {
//   // ==========================================================
//   // COURSE / PRODUCT
//   // ==========================================================

//   const course = data.product;

//   // ==========================================================
//   // COURSE THUMBNAIL
//   //
//   // imageKey = thumbnail/image stored in UploadThing
//   // fileKey  = course/download file
//   // ==========================================================

//   const thumbnailUrl = getUploadThingUrl(course.imageKey);

//   // ==========================================================
//   // COURSE PROGRESS
//   // ==========================================================

//   const { totalLessons, completedLessons, progressPercentage } =
//     useCourseProgress({
//       courseData: course,
//     });

//   // ==========================================================
//   // COURSE URL
//   // ==========================================================

//   const courseUrl = `/learner/courses/${course.slug}`;

//   // ==========================================================
//   // RENDER
//   // ==========================================================

//   return (
//     <Card
//       className="
//         group
//         relative
//         overflow-hidden
//         gap-0
//         py-0
//         border-zinc-200
//         bg-white
//         dark:bg-amber-100
//       "
//     >
//       {/* ==================================================== */}
//       {/* COURSE IMAGE */}
//       {/* ==================================================== */}

//       <div
//         className="
//           relative
//           aspect-video
//           w-full
//           overflow-hidden
//           bg-zinc-100
//           dark:bg-zinc-900
//         "
//       >
//         {thumbnailUrl ? (
//           <Image
//             src={thumbnailUrl}
//             alt={`Thumbnail image for ${course.title}`}
//             fill
//             sizes="
//               (max-width: 640px) 100vw,
//               (max-width: 1024px) 50vw,
//               (max-width: 1280px) 33vw,
//               25vw
//             "
//             className="
//               object-cover
//               transition-transform
//               duration-300
//               group-hover:scale-105
//             "
//           />
//         ) : (
//           <div
//             className="
//               flex
//               h-full
//               w-full
//               items-center
//               justify-center
//               bg-linear-to-br
//               from-zinc-100
//               to-zinc-200
//               dark:from-zinc-900
//               dark:to-zinc-800
//             "
//           >
//             <span className="text-sm font-medium text-zinc-400">
//               No course image
//             </span>
//           </div>
//         )}

//         {/* Optional image overlay */}
//         {thumbnailUrl && (
//           <div
//             className="
//               pointer-events-none
//               absolute
//               inset-0
//               bg-linear-to-t
//               from-black/20
//               via-transparent
//               to-transparent
//             "
//           />
//         )}
//       </div>

//       {/* ==================================================== */}
//       {/* CONTENT */}
//       {/* ==================================================== */}

//       <CardContent className="p-4">
//         {/* COURSE TITLE */}

//         <Link
//           href={courseUrl}
//           className="
//             font-semibold
//             text-lg
//             leading-tight
//             line-clamp-2
//             transition-colors
//             hover:text-primary
//             hover:underline
//           "
//         >
//           {course.title}
//         </Link>

//         {/* DESCRIPTION */}

//         {course.description && (
//           <div
//             className="
//       mt-2
//       line-clamp-3
//       text-sm
//       leading-relaxed
//       text-muted-foreground
//       [&_p]:m-0
//       [&_p]:mb-1
//       [&_p:last-child]:mb-0
//       [&_strong]:font-semibold
//       [&_ul]:my-1
//       [&_ul]:list-disc
//       [&_ul]:pl-5
//       [&_ol]:my-1
//       [&_ol]:list-decimal
//       [&_ol]:pl-5
//     "
//             dangerouslySetInnerHTML={{
//               __html: course.description,
//             }}
//           />
//         )}

//         {/* ================================================== */}
//         {/* PROGRESS */}
//         {/* ================================================== */}

//         <div className="mt-5 space-y-3">
//           <div className="flex items-center justify-between text-sm">
//             <p className="text-muted-foreground">Progress</p>

//             <p className="font-semibold text-foreground">
//               {progressPercentage}%
//             </p>
//           </div>

//           <Progress value={progressPercentage} className="h-1.5" />

//           <p className="text-xs text-muted-foreground">
//             {completedLessons} of {totalLessons} lessons completed
//           </p>
//         </div>

//         {/* ================================================== */}
//         {/* ACTION */}
//         {/* ================================================== */}

//         <Link
//           href={courseUrl}
//           className={buttonVariants({
//             className: "mt-4 w-full",
//           })}
//         >
//           {progressPercentage > 0 ? "Continue Learning" : "Start Learning"}
//         </Link>
//       </CardContent>
//     </Card>
//   );
// }
