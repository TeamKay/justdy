import prisma from "@/lib/prisma";

interface Props {
  userId: string;
  isEducator: boolean;
}

export default async function UpcomingSessionsCard({
  userId,
  isEducator,
}: Props) {
  // Query appointment depending on whether the user is student or teacher
  const appointments = await prisma.appointment.findMany({
    where: isEducator
      ? { educatorId: userId, status: "Scheduled" }
      : { learnerId: userId, status: "Scheduled" },
    take: 3,
    orderBy: { startTime: "asc" },
    include: {
      learner: {
        select: {
          id: true,
          name: true,
          email: true,
          imageUrl: true,
        },
      },
      educator: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return (
    <div className="p-5 border rounded-xl bg-card text-card-foreground shadow-sm">
      <h3 className="font-semibold text-lg mb-4">Upcoming Sessions</h3>
      {appointments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No scheduled sessions.</p>
      ) : (
        <ul className="space-y-3">
          {appointments.map((apt) => {
            const partnerName = isEducator
              ? `${apt.learner.name}`
              : `${apt.educator.name}`;

            return (
              <li
                key={apt.id}
                className="flex justify-between items-center text-sm"
              >
                <div>
                  <p className="font-medium">{apt.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    with {partnerName}
                  </p>
                </div>
                <span className="text-xs bg-muted px-2 py-1 rounded">
                  {new Date(apt.startTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
