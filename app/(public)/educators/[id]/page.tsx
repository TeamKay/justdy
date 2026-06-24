import EducatorProfile from "@/app/_components/educator-profile";
import { getEducatorById } from "@/app/actions/appointments";
import { redirect } from "next/navigation";

interface PageProps {
  params: { id: string };
}

export default async function EducatorIDPage({ params }: PageProps) {
  const { id } = await params;

  let educatorData;

  try {
    [educatorData] = await Promise.all([getEducatorById(id)]);
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
    />
  );
}
