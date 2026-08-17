import EducatorProfile from "@/app/_components/educator-profile";
import { getEducatorById } from "@/app/actions/appointments";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EducatorIDPage({ params }: PageProps) {
  const { id } = await params;

  let educatorData;

  try {
    educatorData = await getEducatorById(id);
  } catch (error) {
    console.error("Error loading educator profile", error);
    redirect("/educators");
  }

  if (!educatorData?.educator) {
    redirect("/educators");
  }

  return (
    <EducatorProfile
      educator={{
        id: educatorData.educator.id,
        name: educatorData.educator.name,

        imageUrl: educatorData.educator.imageUrl ?? undefined,

        // Educator profile fields
        specialty: educatorData.educator.specialty ?? "Mathematics",
        experience: educatorData.educator.experience ?? 0,
        description:
          educatorData.educator.description ??
          "Professional educator available for personalized learning.",
      }}
    />
  );
}
