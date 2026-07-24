import prisma from "@/lib/prisma";

export default async function StudentStatsCard({
  educatorId,
}: {
  educatorId: string;
}) {
  // Unique learners through 1:1 appointments
  const uniqueLearners = await prisma.appointment.groupBy({
    by: ["learnerId"],
    where: { educatorId, status: "Completed" },
  });

  // Total completed sessions
  const completedSessions = await prisma.appointment.count({
    where: { educatorId, status: "Completed" },
  });

  return (
    <div className="p-5 border rounded-xl bg-card text-card-foreground shadow-sm h-full">
      <h3 className="font-semibold text-lg mb-4">Student Activity</h3>

      <div className="space-y-4">
        <div className="flex justify-between items-center pb-2 border-b">
          <span className="text-sm text-muted-foreground">
            Unique Students Taught
          </span>
          <span className="text-lg font-bold">{uniqueLearners.length}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            Completed 1:1 Sessions
          </span>
          <span className="text-lg font-bold">{completedSessions}</span>
        </div>
      </div>
    </div>
  );
}
