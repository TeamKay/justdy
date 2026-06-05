"use server";

import { auth } from "@/lib/auth";
import { Prisma } from "@/lib/generated/prisma/client";
import prisma from "@/lib/prisma";
import { communitySchema } from "@/lib/zodSchemas";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { UTApi } from "uploadthing/server";

export async function getCommunities() {
  return await prisma.community.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      smallDescription: true,
      slug: true,
    },
  });
}

export async function getCommunityById(id: string) {
  try {
    const community = await prisma.community.findUnique({
      where: { id },
    });
    return community;
  } catch (error) {
    console.error("getCommunityById error:", error);
    return null;
  }
}

export async function createCommunity(values: unknown) {
  try {
    const validatedData = communitySchema.parse(values);

    const slugify = (text: string) =>
      text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

    const slug = slugify(validatedData.name);

    const community = await prisma.community.create({
      data: {
        name: validatedData.name,
        smallDescription: validatedData.smallDescription,
        description: validatedData.description,
        category: validatedData.category,
        fileKey: validatedData.fileKey,
        videoKey: validatedData.videoKey,
        price: validatedData.price,
        slug,
      },
    });

    return {
      status: "success",
      data: community,
    };
  } catch (error) {
    console.error(error);

    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Failed to create community",
    };
  }
}

export async function updateCommunity(id: string, values: unknown) {
  try {
    // 1. Safely parse and validate the incoming JSON values
    const validatedData = communitySchema.parse(values);

    // 2. Perform the database update using your matching prisma schema keys
    await prisma.community.update({
      where: { id },
      data: {
        name: validatedData.name,
        smallDescription: validatedData.smallDescription,
        description: validatedData.description,
        category: validatedData.category,
        fileKey: validatedData.fileKey,
        videoKey: validatedData.videoKey,
        price: validatedData.price,
      },
    });

    // 3. Purge the Next.js router cache for your layout routes so the dashboard updates
    revalidatePath("/admin/communities");

    return {
      status: "success",
    };
  } catch (error) {
    console.error("updateCommunity error:", error);

    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "An unexpected system fault occurred while updating.",
    };
  }
}

export async function deleteCommunity(id: string) {
  const utapi = new UTApi();
  try {
    // 1. Fetch the community first to get the fileKey
    const community = await prisma.community.findUnique({
      where: { id },
      select: { fileKey: true, videoKey: true },
    });

    if (!community) {
      throw new Error("Community not found");
    }

    // 2. If a fileKey exists, delete it from UploadThing
    if (community.fileKey) {
      const fileKey = community.fileKey.split("/").pop();

      if (fileKey) {
        await utapi.deleteFiles(fileKey);
      }
    }

    // 2. If a fileKey exists, delete it from UploadThing
    if (community.videoKey) {
      const fileKey = community.videoKey.split("/").pop();

      if (fileKey) {
        await utapi.deleteFiles(fileKey);
      }
    }

    // 3. Delete the community record from your database
    await prisma.community.delete({
      where: { id },
    });

    // 4. Revalidate the path so the UI updates instantly
    revalidatePath("/admin/communities");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete community:", error);
    return { success: false, error: "Failed to delete community" };
  }
}

export async function getCommunityBySlug(slug: string) {
  try {
    if (!slug) return null;

    const community = await prisma.community.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        smallDescription: true,
        description: true,
        category: true,
        fileKey: true,
        videoKey: true,
        price: true,
        memberCount: true,
        slug: true,
      },
    });

    if (!community) return null;

    return {
      id: community.id,
      name: community.name,
      description: community.description,
      smallDescription: community.smallDescription,
      category: community.category,
      fileKey: community.fileKey,
      videoKey: community.videoKey,
      price: community.price,
      memberCount: community.memberCount,
      slug: community.slug, // 2. Map it out to the frontend here
    };
  } catch (error) {
    console.error("GET_COMMUNITY_BY_SLUG_ERROR:", error);
    return null;
  }
}

export async function joinCommunity(slug: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return {
      success: false,
      message: "Please login first",
    };
  }

  const userId = session.user.id;

  const community = await prisma.community.findUnique({
    where: {
      slug,
    },
  });

  if (!community) {
    return {
      success: false,
      message: "Community not found",
    };
  }

  // Check membership
  const existingMembership = await prisma.communityMember.findUnique({
    where: {
      userId_communityId: {
        userId,
        communityId: community.id,
      },
    },
  });

  if (existingMembership) {
    return {
      success: true,
      alreadyJoined: true,
      message: "You are already a member",
    };
  }

  // Create membership
  await prisma.$transaction([
    prisma.communityMember.create({
      data: {
        userId,
        communityId: community.id,
        role: "Member",
        status: "Active",
      },
    }),

    prisma.community.update({
      where: {
        id: community.id,
      },
      data: {
        memberCount: {
          increment: 1,
        },
      },
    }),
  ]);

  return {
    success: true,
    alreadyJoined: false,
    message: "Successfully joined community",
  };
}

export async function getDiscoverData(searchQuery?: string, category?: string) {
  // 1. Dynamic where clauses based on client filters
  const whereClause: Prisma.CommunityWhereInput = {};

  if (category && category !== "all") {
    whereClause.category = { equals: category, mode: "insensitive" };
  }

  if (searchQuery) {
    whereClause.OR = [
      { name: { contains: searchQuery, mode: "insensitive" } },
      { description: { contains: searchQuery, mode: "insensitive" } },
    ];
  }

  // 2. Query communities and aggregations concurrently
  const [communities, uniqueCategories] = await Promise.all([
    prisma.community.findMany({
      where: whereClause,
      include: {
        members: {
          take: 1, // Fetch an item to grab a dynamic mock avatar link if needed
          include: {
            user: { select: { imageUrl: true, name: true } },
          },
        },
      },
      orderBy: { memberCount: "desc" },
    }),
    // Dynamically retrieve only categories that actually exist in the DB
    prisma.community.groupBy({
      by: ["category"],
    }),
  ]);

  // 3. Format raw data structures cleanly for presentation components
  const items = communities.map((c) => ({
    id: c.id,
    title: c.name,
    smallDescription: c.smallDescription,
    description: c.description,
    category: c.category.toLowerCase(),
    // Fallback image using Unsplash queries matching the category name dynamically
    image: c.fileKey
      ? `https://utfs.io/f/${c.fileKey}`
      : `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80`,

    members:
      c.memberCount >= 1000
        ? `${(c.memberCount / 1000).toFixed(1)}k`
        : `${c.memberCount}`,
    price: c.price === 0 ? "Free" : `$${c.price}/month`,
  }));

  const categories = [
    { id: "all", label: "All" },
    ...uniqueCategories.map((cat) => ({
      id: cat.category.toLowerCase(),
      label: cat.category.charAt(0).toUpperCase() + cat.category.slice(1),
    })),
  ];

  return { items, categories };
}

export async function createCommunityPost(formData: {
  content: string;
  userId: string;
  title: string;
  communityId: string; // 1. Add this to your input validation
}) {
  if (!formData.content.trim()) return { success: false };

  try {
    await prisma.communityPost.create({
      data: {
        title: formData.title || "Community Update",
        content: formData.content,
        userId: formData.userId,
        communityId: formData.communityId, // 2. Provide the missing required field
        category: "General Discussion",
      },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Database Post Insertion Failure:", error);
    return { success: false };
  }
}
