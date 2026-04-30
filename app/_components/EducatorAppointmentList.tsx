import AppointmentCard from "@/app/_components/AppointmentCard";
import { Card, CardContent } from "@/app/_components/ui/card";
import { Badge } from "@/app/_components/ui/badge";
import { Calendar, Inbox } from "lucide-react";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { getEducatorAppointments } from "../actions/educator";

type Appointment = Awaited<
  ReturnType<typeof getEducatorAppointments>
>["appointments"][number];

export default function EducatorAppointmentList({
  appointments = [],
}: {
  appointments: Appointment[];
}) {
  // Group appointments by date for better scannability
  const groupedAppointments = appointments.reduce<
    Record<string, Appointment[]>
  >((groups, appointment) => {
    const date = format(new Date(appointment.startTime), "yyyy-MM-dd");

    if (!groups[date]) groups[date] = [];
    groups[date].push(appointment);

    return groups;
  }, {});

  const dateKeys = Object.keys(groupedAppointments).sort();

  return (
    <div className="space-y-6">
      {/* Header Info Section */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 p-2 rounded-lg">
            <Calendar className="size-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Schedule
            </h2>
            <p className="text-xs text-muted-foreground">
              You have {appointments.length} total upcoming sessions
            </p>
          </div>
        </div>

        {appointments.length > 0 && (
          <Badge
            variant="outline"
            className="border-emerald-500/20 text-emerald-400 bg-emerald-500/5"
          >
            Next: {format(new Date(appointments[0].startTime), "MMM d, h:mm a")}
          </Badge>
        )}
      </div>

      <Card className="border-white/5 bg-white/5 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-6">
          {dateKeys.length > 0 ? (
            <div className="space-y-8">
              {dateKeys.map((date) => (
                <div key={date} className="space-y-4">
                  {/* Date Header */}
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-emerald-400 uppercase tracking-widest">
                      {isToday(parseISO(date))
                        ? "Today"
                        : isTomorrow(parseISO(date))
                          ? "Tomorrow"
                          : format(parseISO(date), "EEEE, MMM do")}
                    </span>
                    <div className="h-px flex-1 bg-white/5" />
                  </div>

                  {/* Appointments for this date */}
                  <div className="grid grid-cols-1 gap-4">
                    {groupedAppointments[date].map((appointment) => (
                      <div
                        key={appointment.id}
                        className="transition-transform duration-200 hover:scale-[1.01]"
                      >
                        <AppointmentCard
                          appointment={{
                            ...appointment,
                            startTime: new Date(appointment.startTime),
                            endTime: new Date(appointment.endTime),
                            createdAt: new Date(appointment.createdAt),
                            updatedAt: new Date(appointment.updatedAt),
                            studentDescription:
                              appointment.studentDescription ?? null, // ✅ fix here

                            student: {
                              ...appointment.student,
                              specialty:
                                appointment.student.specialty ?? undefined,
                            },
                            educator: {
                              ...appointment.educator,
                              specialty:
                                appointment.educator.specialty ?? undefined,
                            },
                          }}
                          userRole="Educator"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Enhanced Empty State */
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full" />
                <div className="relative bg-zinc-900 border border-white/10 p-5 rounded-2xl">
                  <Inbox className="size-10 text-emerald-500/50" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white">All clear!</h3>
              <p className="text-muted-foreground text-sm max-w-70 mx-auto mt-2">
                You don&apos;t have any scheduled appointments yet. Ensure your
                <span className="text-emerald-400 font-medium">
                  {" "}
                  availability{" "}
                </span>
                is set so students can find you.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
