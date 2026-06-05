import EducatorProfile from "@/app/_components/EducatorProfile";
import {
  getAvailableTimeSlots,
  getEducatorById,
} from "@/app/actions/appointments";
import { redirect } from "next/navigation";

interface PageProps {
  params: { id: string };
}

export default async function EducatorIDPage({ params }: PageProps) {
  const { id } = await params;

  let educatorData;
  let slotsData;

  try {
    [educatorData, slotsData] = await Promise.all([
      getEducatorById(id),
      getAvailableTimeSlots(id),
    ]);
  } catch (error) {
    console.error("Error loading educator profile", error);
    redirect("/educators");
  }

  return (
    <EducatorProfile
      educator={{
        ...educatorData.educator,
        imageUrl: educatorData.educator.imageUrl ?? undefined,
      }}
      availableDays={slotsData.days || []}
    />
  );
}
