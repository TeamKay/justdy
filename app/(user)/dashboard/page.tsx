import { getDashboardData } from "@/app/(user)/dashboard/dashboard-data";
import LearnerDashboard from "@/app/_components/dashboard/LearnerDashboard";
import TeacherDashboard from "@/app/_components/dashboard/TeacherDashboard";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const { account } = data;

  const hasDashboard =
    account.isLearner || account.isTeacherAdmin;

  if (!hasDashboard) {
    return null;
  }

  return (
    <main className=" bg-muted/20">
      <div className="mx-auto w-full max-w-6xl px-4 pt-10 sm:px-6 lg:px-8">
        {/* Shared dashboard welcome */}
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Welcome back, {account.name.split(" ")[0]}.
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
            Everything you need for learning, teaching, and managing your
            Justdy experience in one place.
          </p>
        </header>

        {/* Learner dashboard */}
        {account.isLearner ? (
          <section className="mb-12">
            <LearnerDashboard
              account={account}
              upcoming={data.learnerUpcoming}
              activities={data.learningActivities}
              courseEnrollments={data.courseEnrollments}
              completedSessions={data.completedSessions}
              showWelcome={false}
            />
          </section>
        ) : null}

        {/* Teacher/admin dashboard */}
        {account.isTeacherAdmin ? (
          <section>
            <TeacherDashboard
              account={account}
              upcoming={data.teacherUpcoming}
              completedSessions={data.completedSessions}
              latestPayout={data.latestPayout}
              adminStats={data.adminStats}
              clientGrowth={data.clientGrowth}
              recentClients={data.recentClients}
              showWelcome={false}
            />
          </section>
        ) : null}
      </div>
    </main>
  );
}