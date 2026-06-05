import { getEnrolledCourses } from "@/app/actions/get-enrolled-courses";
import { CourseProgressCard } from "./_components/CourseProgressCard";
import { EmptyState } from "@/app/_components/general/EmptyState";
import { ArrowRight } from "lucide-react";

export default async function EnrolledCoursesPage() {
  const [enrolledCourses] = await Promise.all([getEnrolledCourses()]);

  return (
    <div className="w-full h-full flex flex-col space-y-8 mt-12 px-1">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-900 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            My Learning
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your progress, access modules, and resume active curriculum
            pipelines.
          </p>
        </div>
      </div>

      {enrolledCourses.length === 0 ? (
        /* SINGLE OUTSIDE FRAME: Redesigned as a premium SaaS empty state */
        <div className="relative overflow-hidden w-full min-h-112.5 flex flex-col items-center justify-center rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-linear-to-b from-zinc-50/50 to-white dark:from-zinc-950/50 dark:to-zinc-950 px-6 py-16 text-center shadow-xs animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
          {/* Subtle geometric dot matrix background decoration */}
          <div className="absolute inset-0 mask-image-[radial-gradient(ellipse_at_center,white,transparent)] pointer-events-none opacity-[0.03] dark:opacity-[0.05] bg-[radial-gradient(#000_1px,transparent_1px)] dark:bg-[radial-gradient(#fff_1px,transparent_1px)] bg-size-[16px_16px]" />

          {/* Cleaned up Empty State call - ensure its own internal className is clean */}
          <EmptyState
            title="Your classroom is empty"
            description="You don't have any active course enrollments. Unlock deep-dive architecture tracks, interactive lessons, and professional developer pathways by browsing our tech stack catalogs."
            buttonText={
              <span className="flex items-center gap-1.5 font-medium">
                Explore Catalog <ArrowRight className="w-4 h-4" />
              </span>
            }
            href="/courses"
            className="max-w-md border-none bg-transparent p-0 shadow-none hover:shadow-none" // Stripped inner frames/bg
          />
        </div>
      ) : (
        /* LIVE COURSE GRID */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {enrolledCourses.map((course) => (
            <CourseProgressCard key={course.Course.id} data={course} />
          ))}
        </div>
      )}
    </div>
  );
}
