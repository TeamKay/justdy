import { EducatorProfileForm } from "@/app/_components/EducatorProfileForm";
import { getEducator } from "@/app/actions/user";

export default async function EducatorProfilePage() {
  const educator = await getEducator();

  return (
    <div className="mx-auto max-w-7xl px-12">
      <EducatorProfileForm educator={educator} />
    </div>
  );
}
