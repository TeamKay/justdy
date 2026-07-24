import LearnerDashboard from "@/app/_components/LearnerDashboard";
import { getLearnerDashboardData } from "@/app/actions/learner-activities";

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
      <LearnerDashboard
        appointments={data.appointments}
        courses={data.courses}
        userProfile={data.userProfile}
        plan={data.plan}
      />
    </main>
  );
}

// import LearnerDashboard from "@/app/_components/LearnerDashboard";
// import { getLearnerDashboardData } from "@/app/actions/learner-activities";

// export default async function StudentDashboardPage() {
//   let data;
//   let errorMessage: string | null = null;

//   try {
//     // 1. Run the async database fetch inside the try block
//     data = await getLearnerDashboardData();
//   } catch (error) {
//     // 2. Catch the error and store the message without returning JSX here
//     errorMessage =
//       error instanceof Error ? error.message : "Failed to load dashboard data.";
//   }

//   // 3. Handle the error state cleanly with a standard conditional return outside the try/catch
//   if (errorMessage || !data) {
//     return (
//       <main className="min-h-screen bg-background flex flex-col items-center justify-center text-white/70 gap-2">
//         <h2 className="text-xl font-semibold">Something went wrong</h2>
//         <p className="text-sm text-gray-400">
//           {errorMessage || "Data is unavailable."}
//         </p>
//       </main>
//     );
//   }

//   // 4. Return the happy-path JSX completely separated from the try/catch context
//   return (
//     <main className="bg-gray-50 min-h-screen">
//       <LearnerDashboard
//         appointments={data.appointments}
//         courses={data.courses}
//         userProfile={data.userProfile}
//         plan={data.plan}
//       />
//     </main>
//   );
// }
