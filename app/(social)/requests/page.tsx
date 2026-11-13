
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

import SocialNavigation from "../../_components/social/shared/SocialNavigation";
import SocialFollowRequests from "../../_components/social/members/SocialFollowRequests";

export const metadata = {
  title: "Learning Requests | Justdy",
  description: "Manage your Justdy follow requests.",
};

export default async function SocialRequestsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth?mode=signin");
  }

  const viewer = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      status: true,
      socialProfile: {
        select: {
          username: true,
          status: true,
        },
      },
    },
  });

  if (!viewer || viewer.status !== "Active") {
    redirect("/auth?mode=signin");
  }

  if (!viewer.socialProfile || viewer.socialProfile.status !== "ACTIVE") {
    redirect("/social/setup");
  }

  const pendingRequests = await prisma.socialFollow.findMany({
    where: {
      followingId: session.user.id,
      status: "PENDING",
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      createdAt: true,
      follower: {
        select: {
          id: true,
          status: true,
          imageUrl: true,
          socialProfile: {
            select: {
              username: true,
              displayName: true,
              status: true,
            },
          },
        },
      },
    },
  });

  // Only show requests from active accounts with active profiles.
  const requests = pendingRequests
    .filter(
      (request) =>
        request.follower.status === "Active" &&
        request.follower.socialProfile?.status === "ACTIVE",
    )
    .map((request) => ({
      id: request.id,
      createdAt: request.createdAt.toISOString(),
      follower: {
        id: request.follower.id,
        imageUrl: request.follower.imageUrl,
        socialProfile: {
          username: request.follower.socialProfile!.username,
          displayName: request.follower.socialProfile!.displayName,
        },
      },
    }));

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-[#173B2F]">
      <SocialNavigation username={viewer.socialProfile.username} />

      <div className="min-h-screen lg:pl-64">
        <header className="border-b border-[#E8E9E2] bg-white">
          <div className="mx-auto flex h-16 max-w-5xl items-center px-4 sm:px-8">
            <Link
              href="/home"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#64746A] transition hover:text-[#173B2F]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-8 pb-28 sm:px-8 sm:py-12">
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF1EB] text-[#52745D]">
                <Users className="h-6 w-6" />
              </div>

              <div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  Follow requests
                </h1>

                <p className="mt-1 text-sm text-[#87938A]">
                  Manage people who want to follow your profile.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2 text-xs font-medium text-[#87938A]">
              <span className="rounded-full bg-[#EAF1EB] px-3 py-1.5 text-[#315C3E]">
                {requests.length} pending{" "}
                {requests.length === 1 ? "request" : "requests"}
              </span>
            </div>
          </div>

          <SocialFollowRequests initialRequests={requests} />
        </main>
      </div>
    </div>
  );
}
