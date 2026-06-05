import { notFound } from "next/navigation";

// Adjust this import path to wherever your database queries or actions are located

import { getCommunityById } from "@/app/actions/admin-communities";
import CommunityEditForm from "@/app/_components/CommunityEditForm";

interface EditCommunityPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditCommunityPage({
  params,
}: EditCommunityPageProps) {
  const { id } = await params;

  // Fetch the current record data
  const community = await getCommunityById(id);

  if (!community) {
    notFound();
  }

  return (
    <div className="w-full">
      <CommunityEditForm initialData={community} />
    </div>
  );
}
