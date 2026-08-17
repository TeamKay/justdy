import FreeOnboarding from "@/app/_components/FreeOnboarding";

export default function OnboardingPage() {
  return (
    // grow and flex ensure it spans the exact height allocated by PublicLayout
    <main className="grow flex flex-col">
      <FreeOnboarding />
    </main>
  );
}
