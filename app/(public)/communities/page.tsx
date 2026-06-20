import CommunitiesDiscoveryPage from "@/app/_components/CommunitiesDiscoveryPage";
import prisma from "@/lib/prisma";

export default async function DiscoverPage() {
  // Fetch all communities from the database
  const dbCommunities = await prisma.community.findMany({
    orderBy: {
      memberCount: "desc", // Sort popular ones first
    },
  });

  // Dynamically extract unique categories present in your DB communities
  const uniqueCategories = Array.from(
    new Set(dbCommunities.map((c) => c.category)),
  );

  // Map database data safely into clean serializable props for the client component
  const communities = dbCommunities.map((community) => ({
    id: community.id,
    title: community.name,
    category: community.category.toLowerCase(),
    image:
      community.fileKey ||
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80", // Fallback banner

    description: community.description,
    smallDescription: community.smallDescription,
    members:
      community.memberCount >= 1000
        ? `${(community.memberCount / 1000).toFixed(1)}k`
        : community.memberCount.toString(),
    price: community.price === 0 ? "Free" : `$${community.price}/month`,
  }));

  return (
    <CommunitiesDiscoveryPage
      initialCommunities={communities}
      availableCategories={uniqueCategories}
    />
  );
}
