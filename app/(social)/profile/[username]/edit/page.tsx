
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { CAPABILITIES, hasCapability } from "@/lib/auth/capabilities";

import SocialNavigation from "@/app/_components/social/shared/SocialNavigation";
import SocialProfileEditForm from "./SocialProfileEditForm";

type EditProfilePageProps = {
  params: Promise<{ username: string }>;
};

export default async function EditSocialProfilePage({
  params,
}: EditProfilePageProps) {
  const { username } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth?mode=signin");
  }

  const profile = await prisma.socialProfile.findUnique({
    where: {
      userId: session.user.id,
    },
    select: {
      username: true,
      displayName: true,
      bio: true,
      status: true,
      user: {
        select: {
          imageUrl: true,
          teachingProfile: {
            select: {
              headline: true,
              specialty: true,
              experience: true,
              description: true,
              hourlyRate: true,
              currency: true,
              subjects: true,
              gradeLevels: true,
              verificationStatus: true,
            },
          },
        },
      },
    },
  });

  if (!profile || profile.status !== "ACTIVE") {
    notFound();
  }

  if (profile.username !== username.toLowerCase()) {
    redirect(`/profile/${profile.username}/edit`);
  }

  const isAdmin =
    String(session.user.role ?? "").toUpperCase() === "ADMIN";

  const canManageTeachingProfile =
    isAdmin ||
    (await hasCapability(session.user.id, CAPABILITIES.TEACH));

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-[#173B2F]">
      <SocialNavigation username={profile.username} />

      <div className="pt-15 min-h-screen">
        <main className="mx-auto w-full max-w-3xl px-4 py-8 pb-0 sm:px-8 sm:py-8">
          <SocialProfileEditForm
            initialDisplayName={profile.displayName}
            initialBio={profile.bio ?? ""}
            username={profile.username}
            initialImageUrl={profile.user.imageUrl}
            initialTeachingProfile={profile.user.teachingProfile}
            canManageTeachingProfile={canManageTeachingProfile}
          />
        </main>
      </div>
    </div>
  );
}
