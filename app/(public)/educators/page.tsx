import EducatorsList from "@/app/_components/EducatorsList";
import { getAllEducators } from "@/app/actions/educators-listing";

export default async function EducatorsPage() {
  const { educators, error } = await getAllEducators();

  if (error) {
    return (
      <div className="text-white text-center py-20">
        Error loading educators.
      </div>
    );
  }

  return <EducatorsList initialEducators={educators || []} />;
}
