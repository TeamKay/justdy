import { getAllCourses } from "@/app/actions/get-all-courses";
import {
  PublicCourseCard,
  PublicCourseCardSkeleton,
} from "../../_components/PublicCourseCard";
import { Suspense } from "react";
import EmptyCoursesState from "@/app/_components/EmptyCoursesState";

export const dynamic = "force-dynamic";

export default function PublicCourseRoute() {
  return (
    <div className="mt-10 px-4 md:px-8 max-w-7xl mx-auto">
      <Suspense fallback={<LoadingSkeletonLayout />}>
        <RenderCourses />
      </Suspense>
    </div>
  );
}

async function RenderCourses() {
  const courses = await getAllCourses();

  if (!courses || courses.length === 0) {
    return <EmptyCoursesState />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <PublicCourseCard key={course.id} data={course} />
      ))}
    </div>
  );
}

function LoadingSkeletonLayout() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, index) => (
        <PublicCourseCardSkeleton key={index} />
      ))}
    </div>
  );
}
