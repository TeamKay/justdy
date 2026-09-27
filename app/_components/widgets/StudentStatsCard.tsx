import prisma from "@/lib/prisma";

export default async function StudentStatsCard({
  educatorId,
}: {
  educatorId: string;
}) {
  // The canonical Phase-1 tutoring data model is Booking -> TutoringSession.
  // Do not count legacy Appointment records for the teaching dashboard.
  const [uniqueLearners, completedSessions] = await Promise.all([
    prisma.booking.findMany({
      where: {
        educatorId,
        tutoringSession: {
          is: {
            status: "COMPLETED",
          },
        },
      },
      distinct: ["studentId"],
      select: { studentId: true },
    }),
    prisma.tutoringSession.count({
      where: {
        educatorId,
        status: "COMPLETED",
      },
    }),
  ]);

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
            Completed Tutoring Sessions
          </span>
          <span className="text-lg font-bold">{completedSessions}</span>
        </div>
      </div>
    </div>
  );
}
