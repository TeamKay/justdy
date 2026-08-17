import LearnerDashboard from "@/app/_components/LearnerDashboard";
import { getLearnerDashboardData } from "@/app/actions/manage-learner-activities";

export default async function StudentDashboardPage() {
  let data;
  let errorMessage: string | null = null;

  try {
    data = await getLearnerDashboardData();
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "Failed to load dashboard data.";
  }

  if (errorMessage || !data) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
        <div className="text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-red-50">
            <span className="text-xl text-red-600">!</span>
          </div>

          <h2 className="mt-4 text-xl font-semibold text-slate-900">
            Something went wrong
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {errorMessage || "Data is unavailable."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <LearnerDashboard
        appointments={data.appointments ?? []}
        courses={data.courses ?? []}
        digitalProducts={data.digitalProducts ?? []}
        userProfile={data.userProfile}
        plan={data.plan}
      />
    </main>
  );
}
