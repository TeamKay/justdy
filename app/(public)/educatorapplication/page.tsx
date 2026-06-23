// app/apply/page.tsx

import EducatorApplicationForm from "@/app/_components/EducatorApplicationForm";
import { getActiveOnboardingSubjects } from "@/app/actions/admin-subjects";

export default async function ApplyPage() {
  // Fetch active subjects directly inside the server component layout
  const subjects = await getActiveOnboardingSubjects();

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Inject the server-fetched data straight into your client component */}
        <EducatorApplicationForm subjects={subjects} />
      </div>
    </main>
  );
}
