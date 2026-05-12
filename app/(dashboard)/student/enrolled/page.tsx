import { getEnrolledCourses } from "@/app/actions/get-enrolled-courses";
import { CourseProgressCard } from "./_components/CourseProgressCard";
import { EmptyState } from "@/app/_components/general/EmptyState";
import { GraduationCap } from "lucide-react"; // Or your preferred icon library

export default async function EnrolledCoursesPage() {
  const [enrolledCourses] = await Promise.all([getEnrolledCourses()]);

  return (
    <div className="w-full h-full flex flex-col space-y-10 mt-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            My Learning
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and view your progress in all enrolled programs.
          </p>
        </div>
      </div>

      {enrolledCourses.length === 0 ? (
        <div className="flex min-h-100 flex-col items-center justify-center rounded-xl border border-dashed bg-card p-8 text-center animate-in fade-in zoom-in-95 duration-300">
          <EmptyState
            icon={
              <GraduationCap className="h-12 w-12 text-muted-foreground/60" />
            }
            title="Start your learning journey"
            description="You haven't enrolled in any courses yet. Explore our catalog to find the perfect skill to master today."
            buttonText="Explore Catalog"
            href="/courses"
            className="max-w-105"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {enrolledCourses.map((course) => (
            <CourseProgressCard key={course.Course.id} data={course} />
          ))}
        </div>
      )}
    </div>
  );
}
