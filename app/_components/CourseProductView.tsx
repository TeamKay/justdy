import { redirect } from "next/navigation";

import { getCourseSidebarData } from "@/app/actions/manage-get-course-sidebar-data";

interface CourseProductViewProps {
  product: {
    slug: string;
  };
}

export async function CourseProductView({ product }: CourseProductViewProps) {
  // ==========================================================
  // LOAD COURSE
  // ==========================================================

  const courseData = await getCourseSidebarData(product.slug);

  const course = courseData.course;

  // ==========================================================
  // FIND FIRST CHAPTER
  // ==========================================================

  const firstChapter = course.chapters?.[0];

  // ==========================================================
  // FIND FIRST LESSON
  // ==========================================================

  const firstLesson = firstChapter?.lessons?.[0];

  // ==========================================================
  // NO LESSONS
  // ==========================================================

  if (!firstLesson) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <div className="max-w-md text-center">
          <h2 className="text-2xl font-bold text-foreground">
            Course Content Is Coming Soon
          </h2>

          <p className="mt-2 text-muted-foreground">
            This course does not have any lessons yet. Please check back later.
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // OPEN FIRST LESSON
  // ==========================================================

  redirect(`/learner/products/${product.slug}/${firstLesson.id}`);
}
