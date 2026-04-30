import Link from "next/link";
import { Suspense } from "react";
import { buttonVariants } from "@/app/_components/ui/button";
import { educatorGetCourses } from "@/app/actions/educator-get-courses";
import {
  EducatorCourseRow,
  EducatorCourseRowSkeleton,
} from "@/app/_components/EducatorCourseRow";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function CoursesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // 1. Check Auth & Role FIRST
  if (!session?.user) redirect("/login");

  if (session.user.role !== "Educator") {
    redirect("/onboarding");
  }

  if (session.user?.verificationStatus !== "Verified") {
    redirect("/educator/verification");
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-0">
      <div className="flex items-center justify-between pb-5">
        <h1 className="text-2xl font-bold text-foreground">List of Courses</h1>
        <Link href="/educator/courses/create" className={buttonVariants()}>
          Create New Course
        </Link>
      </div>

      <div className="rounded-md border bg-card overflow-hidden">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Course
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Duration
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Enrolled
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <Suspense fallback={<EducatorCourseRowSkeletonLayout />}>
            <RenderCourses />
          </Suspense>
        </table>
      </div>
    </div>
  );
}

async function RenderCourses() {
  const data = await educatorGetCourses();

  if (data.length === 0) {
    return (
      <tbody>
        <tr>
          <td colSpan={6} className="py-24">
            <div className="flex flex-col items-center justify-center text-center space-y-3">
              {/* Subtle icon */}
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-foreground">
                No courses published yet
              </h3>

              {/* Description */}
              <p className="text-sm text-muted-foreground max-w-md">
                There are currently no published courses available in the
                system. Once educators create and publish courses, they will
                appear here for management and oversight.
              </p>

              {/* Optional subtle badge */}
              <div className="mt-2 inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
                Waiting for course submissions
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody className="divide-y divide-border">
      {data.map((course) => (
        <EducatorCourseRow key={course.id} data={course} />
      ))}
    </tbody>
  );
}

function EducatorCourseRowSkeletonLayout() {
  return (
    <tbody>
      {Array.from({ length: 4 }).map((_, index) => (
        <EducatorCourseRowSkeleton key={index} />
      ))}
    </tbody>
  );
}

// import Link from "next/link";
// import { Suspense } from "react";
// import { buttonVariants } from "@/app/_components/ui/button";
// import { EmptyState } from "@/app/_components/general/EmptyState";
// import { educatorGetCourses } from "@/app/actions/educator-get-courses";
// import { EducatorCourseRow, EducatorCourseRowSkeleton } from "./_components/EducatorCourseRow";

// export default function CoursesPage(){
//     return(
//         <>
//         <div className="flex items-center justify-between max-w-6xl mx-auto pb-5">
//         <h1 className="text-2xl font-bold">List of Courses</h1>
//         <Link href="/dashboard/educator/courses/create" className={buttonVariants()}>
//             Create New Course
//         </Link>
//         </div>

//         <Suspense fallback={<EducatorCourseRowSkeletonLayout />}>
//             <RenderCourses />
//         </Suspense>
//         </>
//     );
// }

// async function RenderCourses(){
//     const data = await educatorGetCourses();

//     return (
//         <>
//         {data.length === 0 ? (
//             <EmptyState
//             title="No courses found"
//             description="Create a new course to get started"
//             buttonText="Create Course"
//             href="/dashboard/educator/courses/create"/>
//         ):(
//             <div className="grid grid-cols-1 max-w-6xl mx-auto sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-4 gap-7">
//             {data.map((course) => (
//                 <EducatorCourseRow key={course.id} data={course} />
//             ))}

//         </div>
//         )}
//         </>
//     )
// }

// function EducatorCourseRowSkeletonLayout(){
//     return (
//         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-4 gap-7">
//             {Array.from({length: 4}).map((_, index) => (
//                 <EducatorCourseRowSkeleton key={index}/>
//             ))}
//         </div>
//     )
// }
