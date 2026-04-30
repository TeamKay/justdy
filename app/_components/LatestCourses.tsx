import { PublicCourseCard } from "./PublicCourseCard";
import Link from "next/link"; // Ensure you import Link
import { cn } from "@/lib/utils";
import { buttonVariants } from "./ui/button";
import { ArrowRight } from "lucide-react";
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
      <div className="max-w-7xl mx-auto px-4 mb-30 md:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Latest Courses
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Explore our newest additions and start learning today.
            </p>
          </div>

          <Link
            href="/courses"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "group gap-2 px-5 py-2.5", // 'group' allows us to animate the icon on hover
            )}
          >
            View All Courses
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-cols-fr">
          {courses.map((course) => (
            <PublicCourseCard key={course.id} data={course} />
          ))}
        </div>
      </div>
    </section>
  );
}
