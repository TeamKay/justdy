import StudentDashboard from "@/app/_components/StudentDashboard";
import { getStudentAppointments } from "@/app/actions/students";

export default async function Page() {
  // Fetch data directly on the server
  const { appointments, error } = await getStudentAppointments();

  if (error) {
    return <div>Error loading data: {error}</div>;
  }

  const serializedAppointments = JSON.parse(JSON.stringify(appointments));

  return (
    <StudentDashboard
      appointments={serializedAppointments || []}
      courses={{ courses: [] }} // ✅ FIXED
    />
  );
}
