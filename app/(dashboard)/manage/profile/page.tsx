import { EducatorProfileForm } from "@/app/_components/EducatorProfileForm";
import { getEducator } from "@/app/actions/user";

export default async function EducatorProfilePage() {
  const educator = await getEducator();

  if (!educator) {
    return (
      <div className="mx-auto max-w-7xl px-12 py-10">
        <p className="text-sm text-muted-foreground">
          Educator profile not found.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-12">
      <EducatorProfileForm educator={educator} />
    </div>
  );
}
