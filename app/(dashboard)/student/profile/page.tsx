import { auth } from "@/lib/auth"; // Your Better Auth server instance
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/login");

  const loggedInUserId = session.user.id;
  const requestedProfileId = params.id;

  // 1. BLOCK: If student is trying to see someone else's ID
  // 2. ALLOW: If the IDs match OR if the user is an Admin
  const isAdmin = session.user.role === "Admin";
  const isOwner = loggedInUserId === requestedProfileId;

  if (!isOwner && !isAdmin) {
    // If they aren't the owner and aren't an admin, kick them out
    redirect("/dashboard/student");
  }

  return (
    <div>
      <h1>Welcome to the profile of {requestedProfileId}</h1>
    </div>
  );
}
