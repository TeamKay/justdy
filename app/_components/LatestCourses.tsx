import { PublicCourseCard } from "./PublicCourseCard";
import prisma from "@/lib/prisma";

export default async function LatestCourses() {
  const courses = await prisma.course.findMany({
    where: {
      status: "Published",
    },
    orderBy: [{ createdAt: "desc" }],
    take: 3,
  });

  return (
    <section className="py-0">
      {/* Cards Grid / Empty State */}
      {courses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-cols-fr">
          {courses.map((course) => (
            <PublicCourseCard key={course.id} data={course} />
          ))}
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-md p-6 md:pt-10 md:pb-30 text-center">
          <div className="relative z-10 flex flex-col items-center">
            {/* Icon */}
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-md bg-white/10 border border-white/10">
              <svg
                className="h-6 w-6 text-white/80"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6l4 2"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <h3 className="text-xl md:text-2xl font-semibold text-white">
              No courses published yet
            </h3>

            <p className="mt-2 text-sm text-muted-foreground max-w-md">
              New learning content is on the way. Check back soon or explore all
              available categories.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
