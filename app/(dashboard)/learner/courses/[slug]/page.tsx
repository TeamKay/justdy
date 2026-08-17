import { getCourseSidebarData } from "@/app/actions/manage-get-course-sidebar-data";
import { redirect } from "next/navigation";

interface IAppProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function CourseSlugRoute({ params }: IAppProps) {
  const { slug } = await params;

  // ==========================================================
  // GET COURSE
  // ==========================================================

  const courseData = await getCourseSidebarData(slug);

  const course = courseData.course;

  // ==========================================================
  // FIND FIRST CHAPTER
  // ==========================================================
  //
  // The current Prisma structure uses:
  //
  // Product
  //   └── chapters[]
  //         └── lessons[]
  //
  // NOT:
  //
  // course.chapter
  // ==========================================================

  const firstChapter = course.chapters?.[0];

  // ==========================================================
  // FIND FIRST LESSON
  // ==========================================================

  const firstLesson = firstChapter?.lessons?.[0];

  // ==========================================================
  // REDIRECT TO FIRST LESSON
  // ==========================================================

  if (firstLesson) {
    redirect(`/learner/courses/${slug}/${firstLesson.id}`);
  }

  // ==========================================================
  // NO LESSONS
  // ==========================================================

  return (
    <div className="flex h-full min-h-100 items-center justify-center px-6 text-center">
      <div className="max-w-md">
        <h2 className="text-2xl font-bold text-foreground">
          No lessons available
        </h2>

        <p className="mt-2 text-muted-foreground">
          This course does not have any lessons yet. Please check back later.
        </p>
      </div>
    </div>
  );
}
