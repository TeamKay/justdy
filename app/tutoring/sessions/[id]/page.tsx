import TutoringSessionRoom from "@/app/_components/TutoringSessionRoom";

type SessionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TutoringSessionPage({ params }: SessionPageProps) {
  const { id } = await params;

  return <TutoringSessionRoom bookingId={id} />;
}
