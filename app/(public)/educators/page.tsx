import EducatorsList from "@/app/_components/EducatorsList";
import { getAllEducators } from "@/app/actions/educators-listing";

export default async function EducatorsPage() {
  const { educators, error } = await getAllEducators();

  if (error) {
    return (
      <main className="min-h-screen bg-background">
        <div className="flex min-h-[60vh] items-center justify-center px-6">
          <div className="text-center">
            <h1 className="text-xl font-semibold text-foreground">
              Unable to load educators
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Please try again later.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return <EducatorsList initialEducators={educators} />;
}
