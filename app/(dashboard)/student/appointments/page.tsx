import { Button } from "@/app/_components/ui/button";
import { Card, CardContent } from "@/app/_components/ui/card";
import { getCurrentUser } from "@/app/actions/onboarding";
import { getStudentAppointments } from "@/app/actions/students";
import { Calendar, Search, Sparkles, AlertCircle, Plus } from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";
import AppointmentsTable from "@/app/_components/AppointmentTable";

export default async function StudentAppointments() {
  const user = await getCurrentUser();

  if (!user || user.role !== "Student") {
    redirect("/onboarding");
  }

  const { appointments, error } = await getStudentAppointments();

  const safeAppointments = appointments ?? [];

  // In your parent component (e.g., StudentDashboard.tsx)
  const sortedAppointments = [...safeAppointments].sort((a, b) => {
    if (a.status === "Scheduled" && b.status !== "Scheduled") return -1;
    if (a.status !== "Scheduled" && b.status === "Scheduled") return 1;

    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  });

  return (
    <div className="w-full h-full flex flex-col space-y-10 mt-12">
      {/* Header Section with Booking Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            My Appointments
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
              Failed to load appointments: {error}
            </p>
          </CardContent>
        </Card>
      ) : safeAppointments.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {/* Appointment Counter Badge */}

          <div className="space-y-4">
            {sortedAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="transition-all duration-300 hover:translate-x-1"
              >
                <AppointmentsTable
                  appointments={appointments}
                  userRole="Student"
                />
              </div>
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
