import { getCourseSidebarData } from "@/app/actions/manage-get-course-sidebar-data";
import { redirect } from "next/navigation";

interface CourseSlugRouteProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function CourseSlugRoute({
  params,
}: CourseSlugRouteProps) {
  const { slug } = await params;

  const data = await getCourseSidebarData(slug);

  const chapters = data.course.chapters ?? [];

  const firstChapter = chapters[0];

  const firstLesson = firstChapter?.lessons?.[0];

  if (firstLesson) {
    redirect(`/learner/products/${slug}/${firstLesson.id}`);
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10">
          <span className="text-2xl">📚</span>
        </div>

        <h2 className="text-2xl font-bold tracking-tight">
          Course content is coming soon
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          This course does not have any lessons available yet. Please check back
          later.
        </p>
      </div>
    </div>
  );
}
