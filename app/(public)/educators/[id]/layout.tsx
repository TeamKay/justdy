import { getEducatorById } from "@/app/actions/appointments";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
  params: { id: string };
}

/* ---------------- METADATA ---------------- */

export async function generateMetadata({ params }: { params: { id: string } }) {
  const { id } = params;

  const { educator } = await getEducatorById(id);

  if (!educator) return { title: "Educator Not Found" };

  return {
    title: `${educator.name} - Justdy`,
    description: `Book an appointment with ${educator.name}, ${educator.specialty} specialist with ${educator.experience} years of experience.`,
  };
}

/* ---------------- LAYOUT ---------------- */

export default async function EducatorProfileLayout({
  children,
  params,
}: LayoutProps) {
  const { id } = params;

  const { educator } = await getEducatorById(id);

  if (!educator) redirect("/educators");

  return <div className="container mx-auto">{children}</div>;
}

// import { getEducatorById } from "@/app/actions/appointments";
// import { redirect } from "next/navigation";
// import { ReactNode } from "react";

// interface LayoutProps {
//   children: ReactNode;
//   params: { id: string };
// }

// export async function generateMetadata({ params }: { params: { id: string } }) {
//   const { id } = await params;
//   const { educator } = await getEducatorById(id);

//   if (!educator) return { title: "Educator Not Found" };

//   return {
//     title: `${educator.name} - Justdy`,
//     description: `Book an appointment with ${educator.name}, ${educator.specialty} specialist with ${educator.experience} years of experience.`,
//   };
// }

// export default async function EducatorProfileLayout({
//   children,
//   params,
// }: LayoutProps) {
//   const { id } = await params;
//   const { educator } = await getEducatorById(id);

//   if (!educator) redirect("/educators");

//   return <div className="container mx-auto">{children}</div>;
// }
