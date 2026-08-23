import { format } from "date-fns";
import { Calendar, Clock, GraduationCap, Inbox, User } from "lucide-react";

import { Badge } from "@/app/_components/ui/badge";
import { getAppointments } from "@/app/actions/manage-admin";

/* ============================================================
   TYPES
   ============================================================ */

type AppointmentStatus =
  | "Scheduled"
  | "Completed"
  | "Cancelled"
  | "Pending_payment";

/* ============================================================
   STATUS BADGE
   ============================================================ */

function StatusBadge({ status }: { status: AppointmentStatus }) {
  switch (status) {
    case "Scheduled":
      return (
        <Badge
          variant="outline"
          className="border-blue-500/20 bg-blue-500/10 text-blue-400"
        >
          Scheduled
        </Badge>
      );

    case "Completed":
      return (
        <Badge
          variant="outline"
          className="border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
        >
          Completed
        </Badge>
      );

    case "Cancelled":
      return (
        <Badge
          variant="outline"
          className="border-red-500/20 bg-red-500/10 text-red-400"
        >
          Cancelled
        </Badge>
      );

    case "Pending_payment":
      return (
        <Badge
          variant="outline"
          className="border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
        >
          Pending Payment
        </Badge>
      );

    default:
      return null;
  }
}

/* ============================================================
   PAGE
   ============================================================ */

export default async function SessionsPage() {
  /* ==========================================================
     FETCH APPOINTMENTS
     ========================================================== */

  const result = await getAppointments();

  const appointments = result.appointments ?? [];

  /* ==========================================================
     SORT APPOINTMENTS
     ========================================================== */

  const sortedAppointments = [...appointments].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );

  /* ==========================================================
     NEXT SCHEDULED APPOINTMENT
     ========================================================== */

  /*
   * Because the appointments above are already sorted
   * chronologically, the first Scheduled appointment
   * is the next scheduled session.
   *
   * We intentionally do NOT use Date.now() here because
   * Date.now() is an impure function and should not be
   * called during React rendering.
   */
  const nextAppointment = sortedAppointments.find(
    (appointment) => appointment.status === "Scheduled",
  );

  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <div className="space-y-6">
      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="flex flex-col gap-4 px-1 sm:flex-row sm:items-center sm:justify-between">
        {/* TITLE */}

        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-emerald-500/10 p-2">
            <Calendar className="size-5 text-emerald-400" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">Schedule</h2>

            <p className="text-xs text-muted-foreground">
              You have {appointments.length} total sessions
            </p>
          </div>
        </div>

        {/* ====================================================
            NEXT APPOINTMENT
            ==================================================== */}

        {nextAppointment && (
          <Badge
            variant="outline"
            className="w-fit border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
          >
            Next: {format(new Date(nextAppointment.startTime), "MMM d, h:mm a")}
          </Badge>
        )}
      </div>

      {/* ======================================================
          APPOINTMENTS
          ====================================================== */}

      {sortedAppointments.length > 0 ? (
        <div className="space-y-4">
          {sortedAppointments.map((appointment) => (
            <div
              key={appointment.id}
              className="rounded-xl border border-white/10 bg-zinc-950 p-5 transition-colors hover:border-emerald-500/20"
            >
              {/* =================================================
                  TOP SECTION
                  ================================================= */}

              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                {/* SUBJECT */}

                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-emerald-500/10 p-3">
                    <Calendar className="size-5 text-emerald-400" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-semibold text-white">
                      {appointment.subject}
                    </h3>

                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span>{appointment.gradeLevel}</span>

                      <span>•</span>

                      <span>
                        {format(new Date(appointment.date), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* STATUS */}

                <StatusBadge status={appointment.status as AppointmentStatus} />
              </div>

              {/* =================================================
                  SESSION INFORMATION
                  ================================================= */}

              <div className="mt-5 grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-2 lg:grid-cols-3">
                {/* DATE */}

                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 size-4 text-emerald-400" />

                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>

                    <p className="mt-1 text-sm font-medium text-white">
                      {format(new Date(appointment.date), "EEEE, MMMM d, yyyy")}
                    </p>
                  </div>
                </div>

                {/* TIME */}

                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 size-4 text-emerald-400" />

                  <div>
                    <p className="text-xs text-muted-foreground">Time</p>

                    <p className="mt-1 text-sm font-medium text-white">
                      {format(new Date(appointment.startTime), "h:mm a")} -{" "}
                      {format(new Date(appointment.endTime), "h:mm a")}
                    </p>
                  </div>
                </div>

                {/* STUDENT */}

                <div className="flex items-start gap-3">
                  <User className="mt-0.5 size-4 text-emerald-400" />

                  <div>
                    <p className="text-xs text-muted-foreground">Student</p>

                    <p className="mt-1 text-sm font-medium text-white">
                      {appointment.learner?.name ?? "Unknown Student"}
                    </p>

                    {appointment.learner?.email && (
                      <p className="text-xs text-muted-foreground">
                        {appointment.learner.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* EDUCATOR */}

                <div className="flex items-start gap-3">
                  <GraduationCap className="mt-0.5 size-4 text-emerald-400" />

                  <div>
                    <p className="text-xs text-muted-foreground">Educator</p>

                    <p className="mt-1 text-sm font-medium text-white">
                      {appointment.educator?.name ?? "Unknown Educator"}
                    </p>

                    {appointment.educator?.email && (
                      <p className="text-xs text-muted-foreground">
                        {appointment.educator.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* =================================================
                  STUDENT DESCRIPTION
                  ================================================= */}

              {appointment.learnerDescription && (
                <div className="mt-5 rounded-lg border border-white/10 bg-white/2 p-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    Student&apos;s Description
                  </p>

                  <p className="mt-2 text-sm leading-relaxed text-white/80">
                    {appointment.learnerDescription}
                  </p>
                </div>
              )}

              {/* =================================================
                  SESSION ID
                  ================================================= */}

              <div className="mt-4 border-t border-white/5 pt-3">
                <p className="text-[11px] text-muted-foreground">
                  Session ID:{" "}
                  <span className="font-mono text-white/40">
                    {appointment.id}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ====================================================
           EMPTY STATE
           ==================================================== */

        <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-zinc-950 py-16 text-center">
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-2xl" />

            <div className="relative rounded-2xl border border-white/10 bg-zinc-900 p-5">
              <Inbox className="size-10 text-emerald-500/50" />
            </div>
          </div>

          <h3 className="text-lg font-semibold text-white">
            No appointments yet
          </h3>

          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Students will appear here once they book tutoring sessions with you.
          </p>
        </div>
      )}
    </div>
  );
}
