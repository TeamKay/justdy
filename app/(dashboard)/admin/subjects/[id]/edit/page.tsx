import SubjectEditForm from "@/app/_components/SubjectEditForm";
import { getSubjectById } from "@/app/actions/admin-subjects";
import { notFound } from "next/navigation";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function SubjectEditPage({ params }: EditPageProps) {
  const { id } = await params;
  const subject = await getSubjectById(id);

  if (!subject) {
    notFound();
  }

  return <SubjectEditForm subject={subject} />;
}
