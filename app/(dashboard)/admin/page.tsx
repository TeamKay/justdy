import AdminDashboard from "@/app/_components/AdminDashboard";
import { adminGetDashboardStats } from "@/app/actions/admin-get-dashboard-stats";

export default async function AdminDashboardPage() {
  let data;
  let errorMessage: string | null = null;

  try {
    // Call your Prisma aggregation function
    data = await adminGetDashboardStats();
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "Failed to load dashboard data.";
  }

  if (errorMessage || !data) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center text-white/70 gap-2">
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="text-sm text-gray-400">
          {errorMessage || "Data is unavailable."}
        </p>
      </main>
    );
  }

  return (
    <main className="bg-gray-50 min-h-screen">
      <AdminDashboard
        stats={{
          totalLearners: data.totallearners, // Matches your lowercase 'l' from server action
          totalEducators: data.totalEducators,
          totalCoursesApproved: data.totalCourses,
          totalLessonsApproved: data.totalLessons,
        }}
      />
    </main>
  );
}
