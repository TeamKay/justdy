import { Suspense } from "react";
import { SearchAllCoursesTable } from "@/app/_components/SearchAllCoursesTable";
import {
  AdminCourseRow,
  AdminCourseRowSkeleton,
} from "@/app/_components/AdminCourseRow";
import { adminGetCourses } from "@/app/actions/admin-get-all-courses";

export default async function AdminAllCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: query = "" } = await searchParams;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Course Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Overview and moderation of all courses across the platform.
          </p>
        </div>

        <div className="w-full md:w-auto min-w-75">
          <SearchAllCoursesTable defaultValue={query} />
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">
                  Course Info
                </th>
                <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">
                  Educator
                </th>
                <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">
                  Duration
                </th>
                <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">
                  Enrolled
                </th>
                <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">
                  Actions
                </th>
              </tr>
            </thead>
            <Suspense key={query} fallback={<AdminCourseRowSkeletonLayout />}>
              <RenderCourses query={query} />
            </Suspense>
          </table>
        </div>
      </div>
    </div>
  );
}

async function RenderCourses({ query }: { query: string }) {
  const data = await adminGetCourses(query);

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
    <tbody className="divide-y divide-border bg-card">
      {data.map((course) => (
        <AdminCourseRow
          key={course.id}
          data={{
            ...course,
            _count: {
              enrollment: course._count.enrollment,
            },
          }}
        />
      ))}
    </tbody>
  );
}

function AdminCourseRowSkeletonLayout() {
  return (
    <tbody className="divide-y divide-border">
      {Array.from({ length: 5 }).map((_, index) => (
        <AdminCourseRowSkeleton key={index} />
      ))}
    </tbody>
  );
}
