import { Button } from "@/app/_components/ui/button";
import { Card, CardContent } from "@/app/_components/ui/card";
import { getCurrentUser } from "@/app/actions/onboarding";
import { getStudentAppointments } from "@/app/actions/learners";
import { Calendar, Search, Sparkles, AlertCircle, Plus } from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";

interface RawAppointment {
  id: string;
  status: string;
  startTime: Date | string;
  endTime?: Date | string; // Added
  createdAt?: Date | string; // Added
  updatedAt?: Date | string; // Added
  notes?: string | null; // Added
  studentDescription?: string | null; // Added
  learner: {
    id: string;
    name: string;
    email: string;
    imageUrl: string | null;
  };
  educator: {
    id: string;
    name: string;
    email: string;
    imageUrl: string | null;
  };
}

export default async function StudentAppointments() {
  const user = await getCurrentUser();

  if (!user || user.role !== "Learner") {
    redirect("/onboarding");
  }

  const { appointments, error } = await getStudentAppointments();

  const safeAppointments = appointments ?? [];

  // Sort appointments so 'Scheduled' ones appear first, then sorted by date
  const sortedAppointments = [...safeAppointments].sort((a, b) => {
    if (a.status === "Scheduled" && b.status !== "Scheduled") return -1;
    if (a.status !== "Scheduled" && b.status === "Scheduled") return 1;

    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  });

  // ✅ FIX 1: Map 'learner' to 'student' to satisfy the AppointmentsTable type requirements
  const formattedAppointments = (sortedAppointments as RawAppointment[]).map(
    (appointment) => ({
      id: appointment.id,
      status: appointment.status as "Scheduled" | "Completed" | "Cancelled",
      startTime: new Date(appointment.startTime),
      endTime: appointment.endTime
        ? new Date(appointment.endTime)
        : new Date(appointment.startTime),
      createdAt: appointment.createdAt
        ? new Date(appointment.createdAt)
        : new Date(),
      updatedAt: appointment.updatedAt
        ? new Date(appointment.updatedAt)
        : new Date(),
      notes: appointment.notes ?? null,
      studentDescription: appointment.studentDescription ?? null,
      student: {
        id: appointment.learner.id,
        name: appointment.learner.name,
        email: appointment.learner.email,
        specialty: null, // Matched with Table's User type definition
      },
      educator: {
        id: appointment.educator.id,
        name: appointment.educator.name,
        email: appointment.educator.email || null,
        specialty: null,
      },
    }),
  );

  return (
    <div className="w-full h-full flex flex-col space-y-10 mt-12">
      {/* Header Section with Booking Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            My Sessions
          </h1>
          <p className="text-muted-foreground">
            Manage your learning schedule and sessions.
          </p>
        </div>

        <Link href="/educators">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-lg shadow-emerald-900/20">
            <Plus className="size-4" />
            Book New Session
          </Button>
        </Link>
      </div>

      {error ? (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="flex items-center justify-center py-10 gap-3">
            <AlertCircle className="text-destructive size-5" />
            <p className="text-destructive font-medium">
              Failed to load sessions: {error}
            </p>
          </CardContent>
        </Card>
      ) : safeAppointments.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-4">
            {formattedAppointments.map((appointment) => (
              <Card
                key={appointment.id}
                className="border-white/10 bg-zinc-950 p-5 transition-colors hover:border-emerald-500/20"
              >
                <CardContent className="p-0">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className="font-semibold text-white">
                        Session with {appointment.educator.name}
                      </h3>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {new Date(appointment.startTime).toLocaleDateString()} ·{" "}
                        {new Date(appointment.startTime).toLocaleTimeString(
                          [],
                          {
                            hour: "numeric",
                            minute: "2-digit",
                          },
                        )}
                      </p>
                    </div>

                    <span
                      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-medium ${
                        appointment.status === "Scheduled"
                          ? "border-blue-500/20 bg-blue-500/10 text-blue-400"
                          : appointment.status === "Completed"
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                            : "border-red-500/20 bg-red-500/10 text-red-400"
                      }`}
                    >
                      {appointment.status}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Educator</p>
                      <p className="mt-1 text-sm font-medium text-white">
                        {appointment.educator.name}
                      </p>

                      {appointment.educator.email && (
                        <p className="text-xs text-muted-foreground">
                          {appointment.educator.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">Time</p>
                      <p className="mt-1 text-sm font-medium text-white">
                        {new Date(appointment.startTime).toLocaleTimeString(
                          [],
                          {
                            hour: "numeric",
                            minute: "2-digit",
                          },
                        )}{" "}
                        –{" "}
                        {new Date(appointment.endTime).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  {appointment.studentDescription && (
                    <div className="mt-5 rounded-lg border border-white/10 bg-white/2 p-4">
                      <p className="text-xs font-medium text-muted-foreground">
                        Your Description
                      </p>

                      <p className="mt-2 text-sm leading-relaxed text-white/80">
                        {appointment.studentDescription}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 border-t border-white/5 pt-3">
                    <p className="text-[11px] text-muted-foreground">
                      Session ID:{" "}
                      <span className="font-mono text-white/40">
                        {appointment.id}
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        /* Empty State */
        <Card className="border-white/5 bg-white/5 backdrop-blur-sm border-dashed border-2 py-16">
          <CardContent className="flex flex-col items-center text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full" />
              <div className="relative bg-zinc-900 border border-white/10 p-6 rounded-full">
                <Calendar className="size-12 text-emerald-500/40" />
              </div>
              <Sparkles className="absolute -top-2 -right-2 size-6 text-emerald-400 animate-pulse" />
            </div>

            <h3 className="text-2xl font-bold text-white mb-2">
              Start your learning journey
            </h3>
            <p className="text-muted-foreground max-w-sm mb-8">
              Your schedule looks a bit empty. Connect with our expert educators
              to book your first 1-on-1 session.
            </p>

            <Link href="/educators">
              <Button
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 px-8"
              >
                <Search className="size-4" />
                Find an Educator
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Helpful Hint Footer */}
      {safeAppointments.length > 0 && (
        <p className="text-center text-xs text-muted-foreground italic pb-8">
          Need to reschedule? Contact your educator at least 24 hours in
          advance.
        </p>
      )}
    </div>
  );
}
