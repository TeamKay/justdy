import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function CourseProgressCard({
  userId,
}: {
  userId: string;
}) {
  const activeEnrollments = await prisma.enrollmentProgress.findMany({
    where: { userId },
    take: 3,
    orderBy: { updatedAt: "desc" },
    include: {
      course: {
        include: {
          product: { select: { title: true, slug: true } },
        },
      },
    },
  });

  return (
    <div className="p-5 border rounded-xl bg-card text-card-foreground shadow-sm h-full flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-lg">Continue Learning</h3>
          <Link
            href="/dashboard/courses"
            className="text-xs text-primary hover:underline font-medium"
          >
            View All
          </Link>
        </div>

        {activeEnrollments.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            You haven&apos;t started any courses yet.
          </p>
        ) : (
          <div className="space-y-4">
            {activeEnrollments.map((item) => (
              <div key={item.id} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium truncate max-w-50">
                    {item.course.product.title}
                  </span>
                  <span className="text-xs text-muted-foreground font-semibold">
                    {Math.round(item.progress)}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
