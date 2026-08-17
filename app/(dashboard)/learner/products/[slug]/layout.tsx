import { getCourseSidebarData } from "@/app/actions/manage-get-course-sidebar-data";
import { CourseSidebar } from "../_components/CourseSidebar";

interface CourseLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    slug: string;
  }>;
}

export default async function CourseLayout({
  children,
  params,
}: CourseLayoutProps) {
  const { slug } = await params;

  const data = await getCourseSidebarData(slug);

  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-background">
      {/* ===================================================== */}
      {/* COURSE SIDEBAR */}
      {/* ===================================================== */}

      <aside
        className="
          hidden
          w-80
          shrink-0
          overflow-y-auto
          border-r
          border-border
          bg-background
          lg:block
        "
      >
        <div className="h-full p-5">
          <CourseSidebar course={data.course} />
        </div>
      </aside>

      {/* ===================================================== */}
      {/* LESSON CONTENT */}
      {/* ===================================================== */}

      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
