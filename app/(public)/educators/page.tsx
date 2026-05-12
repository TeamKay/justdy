import UnifiedEducatorsClient from "@/app/_components/UnifiedEducatorsPage";
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

  return <UnifiedEducatorsClient initialEducators={educators || []} />;
}
