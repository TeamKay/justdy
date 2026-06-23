import LearnerOnboarding from "@/app/_components/LearnerOnboarding";

export default function OnboardingPage() {
  return (
    // grow and flex ensure it spans the exact height allocated by PublicLayout
    <main className="grow flex flex-col">
      <LearnerOnboarding />
    </main>
  );
}
