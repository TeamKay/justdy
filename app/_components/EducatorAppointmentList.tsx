"use client";

import { format } from "date-fns";
import { Calendar, Inbox } from "lucide-react";
import { Badge } from "@/app/_components/ui/badge";
import AppointmentsTable from "./AppointmentTable";

// 1. Define the type of a single user matching the Table's expectation
type TableUser = {
  id: string;
  name: string;
  email?: string | null;
  specialty?: string | null;
};

// 2. Define the exact shape expected by the AppointmentsTable component
type TableAppointmentShape = {
  id: string;
  startTime: Date;
  endTime: Date;
  createdAt: Date;
  updatedAt: Date;
  status: "Scheduled" | "Completed" | "Cancelled";
  notes: string | null;
  studentDescription: string | null;
  student: TableUser;
  educator: TableUser;
};

// 3. Define the raw shape coming from your educator server action
type RawActionAppointment = {
  id: string;
  startTime: Date;
  endTime: Date;
  createdAt: Date;
  updatedAt: Date;
  status: string; // Dynamic DB status string (e.g., "Pending_payment", "Scheduled")
  notes?: string | null;
  learnerDescription?: string | null;
  learner?: {
    id: string;
    name: string;
    email?: string | null;
    specialty?: string | null;
  } | null;
  educator?: {
    id: string;
    name: string;
    email?: string | null;
    specialty?: string | null;
  } | null;
};

export default function EducatorAppointmentList({
  appointments = [],
}: {
  appointments: RawActionAppointment[];
}) {
  // 4. Transform and normalize the database array into the strict table format
  const normalizedAppointments: TableAppointmentShape[] = appointments.map(
    (a) => {
      // Safely enforce that only valid statuses pass into your status-restricted table view
      let safeStatus: "Scheduled" | "Completed" | "Cancelled" = "Scheduled";
      if (a.status === "Completed" || a.status === "Cancelled") {
        safeStatus = a.status;
      }

      return {
        id: a.id,
        startTime: new Date(a.startTime),
        endTime: new Date(a.endTime),
        createdAt: new Date(a.createdAt),
        updatedAt: new Date(a.updatedAt),
        status: safeStatus,
        notes: a.notes ?? null,
        studentDescription: a.learnerDescription ?? null, // Key translation mapping
        student: {
          id: a.learner?.id ?? "",
          name: a.learner?.name ?? "Student",
          email: a.learner?.email ?? null,
          specialty: a.learner?.specialty ?? null,
        },
        educator: {
          id: a.educator?.id ?? "",
          name: a.educator?.name ?? "Educator",
          email: a.educator?.email ?? null,
          specialty: a.educator?.specialty ?? null,
        },
      };
    },
  );

  const upcomingAppointments = [...normalizedAppointments]
    .filter((a) => a.status === "Scheduled")
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 p-2 rounded-lg">
            <Calendar className="size-5 text-emerald-400" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">Schedule</h2>
            <p className="text-xs text-muted-foreground">
              You have {appointments.length} total sessions
            </p>
          </div>
        </div>

        {upcomingAppointments.length > 0 && (
          <Badge
            variant="outline"
            className="border-emerald-500/20 text-emerald-400 bg-emerald-500/5"
          >
            Next:{" "}
            {format(
              new Date(upcomingAppointments[0].startTime),
              "MMM d, h:mm a",
            )}
          </Badge>
        )}
      </div>

      {/* TABLE */}
      <div className="w-full">
        {normalizedAppointments.length > 0 ? (
          <AppointmentsTable
            appointments={normalizedAppointments}
            userRole="Educator"
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full" />
              <div className="relative bg-zinc-900 border border-white/10 p-5 rounded-2xl">
                <Inbox className="size-10 text-emerald-500/50" />
              </div>
            </div>

            <h3 className="text-lg font-semibold text-white">
              No appointments yet
            </h3>
            <p className="text-muted-foreground text-sm max-w-80 mt-2">
              Students will appear here once they book sessions with you.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// "use client";

// import { format } from "date-fns";
// import { Calendar, Inbox } from "lucide-react";
// import { Badge } from "@/app/_components/ui/badge";
// import AppointmentsTable from "./AppointmentTable";

// type Appointment = Awaited<
//   ReturnType<typeof import("../actions/educator").getEducatorAppointments>
// >["appointments"][number];

// export default function EducatorAppointmentList({
//   appointments = [],
// }: {
//   appointments: Appointment[];
// }) {
//   const upcomingAppointments = [...appointments]
//     .filter((a) => a.status === "Scheduled")
//     .sort(
//       (a, b) =>
//         new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
//     );

//   return (
//     <div className="space-y-6">
//       {/* HEADER */}
//       <div className="flex items-center justify-between px-1">
//         <div className="flex items-center gap-3">
//           <div className="bg-emerald-500/10 p-2 rounded-lg">
//             <Calendar className="size-5 text-emerald-400" />
//           </div>

//           <div>
//             <h2 className="text-xl font-bold text-white">Schedule</h2>

//             <p className="text-xs text-muted-foreground">
//               You have {appointments.length} total sessions
//             </p>
//           </div>
//         </div>

//         {upcomingAppointments.length > 0 && (
//           <Badge
//             variant="outline"
//             className="border-emerald-500/20 text-emerald-400 bg-emerald-500/5"
//           >
//             Next:{" "}
//             {format(
//               new Date(upcomingAppointments[0].startTime),
//               "MMM d, h:mm a",
//             )}
//           </Badge>
//         )}
//       </div>

//       {/* TABLE */}
//       <div className="w-full">
//         {appointments.length > 0 ? (
//           <AppointmentsTable appointments={appointments} userRole="Educator" />
//         ) : (
//           <div className="flex flex-col items-center justify-center py-16 text-center">
//             <div className="relative mb-4">
//               <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full" />

//               <div className="relative bg-zinc-900 border border-white/10 p-5 rounded-2xl">
//                 <Inbox className="size-10 text-emerald-500/50" />
//               </div>
//             </div>

//             <h3 className="text-lg font-semibold text-white">
//               No appointments yet
//             </h3>

//             <p className="text-muted-foreground text-sm max-w-80 mt-2">
//               Students will appear here once they book sessions with you.
//             </p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
