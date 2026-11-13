
import prisma from "@/lib/prisma";

/**
 * Returns the Prisma conditions for posts a social user may view.
 *
 * PUBLIC: any eligible social user.
 * FOLLOWERS: the author and accepted followers.
 * ONLY_ME: the author only.
 *
 * Posts from inactive authors and accounts blocked in either
 * direction are excluded.
 */
export function visibleSocialPostWhere(viewerId: string) {
  return {
    status: "PUBLISHED" as const,

    author: {
      is: {
        status: "Active" as const,

        socialProfile: {
          is: {
            status: "ACTIVE" as const,
          },
        },

        socialBlocksInitiated: {
          none: {
            blockedId: viewerId,
          },
        },

        socialBlocksReceived: {
          none: {
            blockerId: viewerId,
          },
        },
      },
    },

    OR: [
      // The author can always view their own published posts.
      {
        authorId: viewerId,
      },

      // Public posts are visible to eligible social users.
      {
        visibility: "PUBLIC" as const,
      },

      // Followers posts require an accepted follow relationship.
      {
        visibility: "FOLLOWERS" as const,
        author: {
          is: {
            socialFollowsReceived: {
              some: {
                followerId: viewerId,
                status: "ACCEPTED" as const,
              },
            },
          },
        },
      },
    ],
  };
}

/**
 * Confirms that the viewer has an active Justdy account
 * and an active social profile.
 */
export async function getActiveSocialViewer(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
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

  return user;
}
