import Whiteboard from "@/app/_components/Whiteboard";

type PageProps = {
  params: Promise<{
    appointmentId: string;
  }>;
};

export default async function AppointmentWhiteboardPage({ params }: PageProps) {
  const { appointmentId } = await params;

  return <Whiteboard mode="appointment" appointmentId={appointmentId} />;
}
