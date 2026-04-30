import { ReactNode } from "react";
import { getEducatorById } from "@/app/actions/appointments";
import { redirect } from "next/navigation";

// 1. Define the Params type
interface PageParams {
  id: string;
}

// 2. Define the Layout Props type
interface LayoutProps {
  children: ReactNode;
  params: Promise<PageParams>;
}

// Metadata also needs types for its arguments
export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { id } = await params;
  const { educator } = await getEducatorById(id);

  if (!educator) return { title: "Educator Not Found" };

  return {
    title: `${educator.name} - Justdy`,
    description: `Book an appointment with ${educator.name}, ${educator.specialty} specialist with ${educator.experience} years of experience.`,
  };
}

export default async function EducatorProfileLayout({
  children,
  params,
}: LayoutProps) {
  const { id } = await params;
  const { educator } = await getEducatorById(id);

  if (!educator) redirect("/educators");

  return <div className="container mx-auto">{children}</div>;
}

// import PageHeader from "@/app/_components/page-header";
// import { getEducatorById } from "@/app/actions/appointments";
// import { redirect } from "next/navigation";

// export async function generateMetadata({ params }) {
//   const { id } = await params;
//   const { educator } = await getEducatorById(id);

//   return {
//     title: `Dr. ${educator.name} - Justdy`,
//     description: `Book an appointment with Dr. ${educator.name}, ${educator.specialty}
//     specialist with ${educator.experience} years of experience.`,
//   };
// }

// export default async function EducatorProfileLayout({ children, params }) {
//   const { id } = await params;
//   const { educator } = await getEducatorById(id);

//   if (!educator) redirect("/educators");
//   return (
//     <div className="container mx-auto">
//       <PageHeader
//         title={"Dr. " + educator.name}
//         backLink={`/educators/${educator.specialty}`}
//         backLabel={`Back to ${educator.specialty}`}
//       />

//       {children}
//     </div>
//   );
// }
