
"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { notifyUsers } from "@/lib/notifications";
import {
  createSocialFollowSchema,
  respondSocialFollowSchema,
} from "@/lib/social/validation";

type ActionResult =
  | { success: true; message: string; status?: "PENDING" | "ACCEPTED" }
  | { success: false; error: string };

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

async function getActiveSocialUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      status: true,
      socialProfile: {
        select: {
          id: true,
          username: true,
          status: true,
        },
      },
    },
  });

  if (
    !user ||
    user.status !== "Active" ||
    !user.socialProfile ||
    user.socialProfile.status !== "ACTIVE"
  ) {
    return null;
  }

    return {
    ...user,
    socialProfile: user.socialProfile,
  };
}

function refreshProfiles(...usernames: string[]) {
  for (const username of new Set(usernames.filter(Boolean))) {
    revalidatePath(`/profile/${username}`);
  }

  revalidatePath("/home");
}

async function findAvailableTarget(username: string) {
  return prisma.socialProfile.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      userId: true,
      isPrivate: true,
      status: true,
      user: {
        select: {
          status: true,
        },
      },
    },
  });
}

/**
 * Follow a public profile or request access to a private profile.
 */
export async function createSocialFollow(
  input: unknown,
): Promise<ActionResult> {
  const currentUser = await getActiveSocialUser();

  if (!currentUser) {
    return {
      success: false,
      error: "Your account cannot create follow requests.",
    };
  }

  const parsed = createSocialFollowSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Please provide a valid username." };
  }

  const target = await findAvailableTarget(parsed.data.username);

  if (
    !target ||
    target.status !== "ACTIVE" ||
    target.user.status !== "Active"
  ) {
    return { success: false, error: "This profile is unavailable." };
  }

  if (target.userId === currentUser.id) {
    return { success: false, error: "You cannot follow your own profile." };
  }

  const existingBlock = await prisma.socialBlock.findFirst({
    where: {
      OR: [
        { blockerId: currentUser.id, blockedId: target.userId },
        { blockerId: target.userId, blockedId: currentUser.id },
      ],
    },
    select: { id: true },
  });

  if (existingBlock) {
    return {
      success: false,
      error: "This follow request cannot be completed.",
    };
  }

  const status = target.isPrivate ? "PENDING" : "ACCEPTED";

  const existingFollow = await prisma.socialFollow.findUnique({
    where: {
      followerId_followingId: {
        followerId: currentUser.id,
        followingId: target.userId,
      },
    },
    select: { id: true, status: true },
  });

  if (existingFollow?.status === "ACCEPTED") {
    return { success: false, error: "You already follow this profile." };
  }

  if (existingFollow?.status === "PENDING") {
    return {
      success: false,
      error: "Your follow request is already pending.",
    };
  }

  try {
    if (existingFollow) {
      await prisma.socialFollow.update({
        where: { id: existingFollow.id },
        data: { status },
      });
    } else {
      await prisma.socialFollow.create({
        data: {
          followerId: currentUser.id,
          followingId: target.userId,
          status,
        },
      });
    }
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        success: false,
        error: "A follow request already exists.",
      };
    }

    throw error;
  }

  await notifyUsers([target.userId], {
    eventKey: `social-follow-${status.toLowerCase()}:${currentUser.id}:${target.userId}:${Date.now()}`,
    type: status === "PENDING" ? "SOCIAL_FOLLOW_REQUEST" : "SOCIAL_NEW_FOLLOWER",
    title:
      status === "PENDING" ? "New follow request" : "You have a new follower",
    message:
      status === "PENDING"
        ? `@${currentUser.socialProfile.username} requested to follow you.`
        : `@${currentUser.socialProfile.username} started following you.`,
    href: `/profile/${currentUser.socialProfile.username}`,
  });

  refreshProfiles(currentUser.socialProfile.username, target.username);

  return {
    success: true,
    message:
      status === "PENDING"
        ? "Follow request sent."
        : "You are now following this profile.",
    status,
  };
}

/**
 * Accept or reject an incoming follow request.
 */
export async function respondToSocialFollowRequest(
  input: unknown,
): Promise<ActionResult> {
  const currentUser = await getActiveSocialUser();

  if (!currentUser) {
    return { success: false, error: "Your account cannot manage requests." };
  }

  const parsed = respondSocialFollowSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Invalid follow request." };
  }

  const request = await prisma.socialFollow.findFirst({
    where: {
      id: parsed.data.followId,
      followingId: currentUser.id,
      status: "PENDING",
    },
    select: {
      id: true,
      followerId: true,
      follower: {
        select: {
          socialProfile: {
            select: { username: true },
          },
        },
      },
    },
  });

  if (!request) {
    return {
      success: false,
      error: "This follow request is no longer available.",
    };
  }

  const nextStatus = parsed.data.decision === "ACCEPT" ? "ACCEPTED" : "REJECTED";

  const updated = await prisma.socialFollow.updateMany({
    where: {
      id: request.id,
      followingId: currentUser.id,
      status: "PENDING",
    },
    data: { status: nextStatus },
  });

  if (updated.count === 0) {
    return {
      success: false,
      error: "This follow request has already been handled.",
    };
  }

  if (nextStatus === "ACCEPTED") {
    await notifyUsers([request.followerId], {
      eventKey: `social-follow-accepted:${request.id}`,
      type: "SOCIAL_FOLLOW_ACCEPTED",
      title: "Follow request accepted",
      message: `@${currentUser.socialProfile.username} accepted your follow request.`,
      href: `/profile/${currentUser.socialProfile.username}`,
    });
  }

  const followerUsername = request.follower.socialProfile?.username;

  refreshProfiles(
    currentUser.socialProfile.username,
    ...(followerUsername ? [followerUsername] : []),
  );

  return {
    success: true,
    message:
      nextStatus === "ACCEPTED"
        ? "Follow request accepted."
        : "Follow request declined.",
  };
}

/**
 * Cancel an outgoing pending follow request.
 */
export async function cancelSocialFollowRequest(
  input: unknown,
): Promise<ActionResult> {
  const currentUser = await getActiveSocialUser();

  if (!currentUser) {
    return { success: false, error: "Your account cannot manage requests." };
  }

  const parsed = createSocialFollowSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Invalid profile." };
  }

  const target = await findAvailableTarget(parsed.data.username);

  if (!target) {
    return { success: false, error: "This profile is unavailable." };
  }

  const result = await prisma.socialFollow.deleteMany({
    where: {
      followerId: currentUser.id,
      followingId: target.userId,
      status: "PENDING",
    },
  });

  if (!result.count) {
    return {
      success: false,
      error: "There is no pending request to cancel.",
    };
  }

  refreshProfiles(currentUser.socialProfile.username, target.username);

  return { success: true, message: "Follow request cancelled." };
}

/**
 * Unfollow an account.
 */
export async function unfollowSocialUser(
  input: unknown,
): Promise<ActionResult> {
  const currentUser = await getActiveSocialUser();

  if (!currentUser) {
    return { success: false, error: "Your account cannot unfollow users." };
  }

  const parsed = createSocialFollowSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Invalid profile." };
  }

  const target = await findAvailableTarget(parsed.data.username);

  if (!target) {
    return { success: false, error: "This profile is unavailable." };
  }

  const result = await prisma.socialFollow.deleteMany({
    where: {
      followerId: currentUser.id,
      followingId: target.userId,
      status: "ACCEPTED",
    },
  });

  if (!result.count) {
    return { success: false, error: "You do not follow this profile." };
  }

  refreshProfiles(currentUser.socialProfile.username, target.username);

  return { success: true, message: "You have unfollowed this profile." };
}

/**
 * Block an account and remove follow relationships in both directions.
 */
export async function blockSocialUser(
  input: unknown,
): Promise<ActionResult> {
  const currentUser = await getActiveSocialUser();

  if (!currentUser) {
    return { success: false, error: "Your account cannot block users." };
  }

  const parsed = createSocialFollowSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Invalid profile." };
  }

  const target = await findAvailableTarget(parsed.data.username);

  if (!target || target.status !== "ACTIVE") {
    return { success: false, error: "This profile is unavailable." };
  }

  if (target.userId === currentUser.id) {
    return { success: false, error: "You cannot block yourself." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.socialBlock.create({
        data: {
          blockerId: currentUser.id,
          blockedId: target.userId,
        },
      });

      await tx.socialFollow.deleteMany({
        where: {
          OR: [
            { followerId: currentUser.id, followingId: target.userId },
            { followerId: target.userId, followingId: currentUser.id },
          ],
        },
      });
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { success: false, error: "You have already blocked this user." };
    }

    throw error;
  }

  refreshProfiles(currentUser.socialProfile.username, target.username);

  return { success: true, message: "This account has been blocked." };
}

/**
 * Unblock an account.
 */
export async function unblockSocialUser(
  input: unknown,
): Promise<ActionResult> {
  const currentUser = await getActiveSocialUser();

  if (!currentUser) {
    return { success: false, error: "Your account cannot unblock users." };
  }

  const parsed = createSocialFollowSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Invalid profile." };
  }

  const target = await findAvailableTarget(parsed.data.username);

  if (!target) {
    return { success: false, error: "This profile is unavailable." };
  }

  const result = await prisma.socialBlock.deleteMany({
    where: {
      blockerId: currentUser.id,
      blockedId: target.userId,
    },
  });

  if (!result.count) {
    return { success: false, error: "This account is not blocked." };
  }

  refreshProfiles(currentUser.socialProfile.username, target.username);

  return { success: true, message: "This account has been unblocked." };
}
