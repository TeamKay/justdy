import EducatorCard from "@/app/_components/EducatorCard";
import { getEducatorsBySpecialty } from "@/app/actions/educators-listing";
import { ChevronLeft } from "lucide-react"; // Assuming you use lucide for icons
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function EducatorsSpecialityPage({
  params,
}: {
  params: Promise<{ speciality: string }>;
}) {
  const { speciality } = await params;

  if (!speciality) {
    redirect("/educators");
  }

  const { educators } = await getEducatorsBySpecialty(speciality);
  const formattedTitle = speciality
    ? decodeURIComponent(speciality)
    : "Specialty";

  return (
    <div className="relative min-h-screen pb-20 px-4 md:px-8">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/2 -z-10 h-125 w-full -translate-x-1/2 bg-[radial-gradient(circle_at_top,var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent blur-3xl" />

      {/* Inline Header Section */}
      <header className="flex flex-row items-center justify-between mb-10 py-2 border-b border-white/5">
        <div className="flex items-center gap-4">
          <Link
            href="/educators"
            className="group flex items-center justify-center w-10 h-10 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all shadow-xl backdrop-blur-md"
          >
            <ChevronLeft className="w-5 h-5 text-white group-hover:-translate-x-0.5 transition-transform" />
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white capitalize">
            {formattedTitle}
          </h1>
        </div>

        {/* Optional: Counter badge for a professional touch */}
        <div className="hidden sm:block px-4 py-1.5 rounded-md bg-white/5 border border-white/10 backdrop-blur-md">
          <span className="text-sm font-medium text-blue-400">
            {educators?.length || 0} Experts Available
          </span>
        </div>
      </header>

      {educators && educators.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {educators.map((educator) => (
            <div key={educator.id} className="group">
              <EducatorCard
                educator={{
                  id: educator.id,
                  name: educator.name || "Unknown Educator",
                  // 1. Changed .image to .imageUrl
                  imageUrl: educator.imageUrl || undefined,
                  specialty: educator.specialty || "General",
                  // 2. Convert number to string using String() or template literal
                  experience:
                    educator.experience !== null
                      ? String(educator.experience)
                      : "0",
                  description: educator.description || "",
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 rounded-4xl bg-white/2 border border-dashed border-white/10">
          <div className="bg-white/5 p-5 rounded-3xl mb-4 backdrop-blur-xl">
            <span className="text-4xl">✨</span>
          </div>
          <h3 className="text-xl font-semibold text-white">No experts found</h3>
          <p className="text-slate-500 mt-2 max-w-xs text-center">
            We&apos;re currently vetting educators for the {formattedTitle}{" "}
            specialty.
          </p>
        </div>
      )}
    </div>
  );
}

// import EducatorCard from "@/app/_components/EducatorCard";
// import PageHeader from "@/app/_components/Page-header";
// import { getEducatorsBySpecialty } from "@/app/actions/educators-listing";
// import { redirect } from "next/navigation";

// export default async function EducatorsSpecialityPage({
//   params,
// }: {
//   params: Promise<{ speciality: string }>;
// }) {
//   const { speciality } = await params;

//   if (!speciality) {
//     redirect("/educators");
//   }

//   const { educators, error } = await getEducatorsBySpecialty(speciality);

//   if (error) {
//     console.error("Error fetching educators:", error);
//   }

//   return (
//     <div className="space-y-5">
//       <PageHeader
//         title={speciality ? speciality.split("%20").join(" ") : "Specialty"}
//         backLink="/educators"
//         backLabel="All Specialties"
//       />
//       {educators && educators.length > 0 ? (
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           {educators.map((educator) => (
//             <EducatorCard
//               key={educator.id}
//               educator={{
//                 id: educator.id, // Pass ID if the card needs it for linking
//                 name: educator.name || "Unknown Educator",
//                 imageUrl: educator.image || undefined, // Convert null to undefined
//                 specialty: educator.specialty || "General", // Provide fallback for null
//                 experience: educator.experience || "0", // Provide fallback
//                 description: educator.description || "", // Provide fallback
//               }}
//             />
//           ))}
//         </div>
//       ) : (
//         <div className="text-center py-12">
//           <h3 className="text-xl font-medium text-white mb-2">
//             No educator available
//           </h3>
//           <p className="text-muted-foreground">
//             There are currently no verified educators in this specialty. Please
//             check back later or choose another specialty
//           </p>
//         </div>
//       )}
//     </div>
//   );
// }
