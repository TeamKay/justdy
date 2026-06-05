import { AdminCommunityTable } from "@/app/_components/AdminCommunityTable";
import prisma from "@/lib/prisma";
import { Suspense } from "react";
import Link from "next/link";

export default async function AdminCommunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: query = "" } = await searchParams;

  return (
    <div className="max-w-6xl mx-auto px-0 py-0 space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Communities</h1>
          <p className="text-sm text-muted-foreground">
            Deploy and manage student and tutor interaction hubs
          </p>
        </div>

        {/* ✅ CREATE BUTTON ADDED */}
        <Link
          href="/admin/communities/create"
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
        >
          + Create Community
        </Link>
      </div>

      {/* TABLE */}
      <div className="rounded-md border bg-card overflow-hidden">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground w-[45%]">
                Community Info
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                Category
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                Price
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                Members
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold  text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>

          <Suspense
            fallback={
              <tbody>
                <tr>
                  <td
                    colSpan={4}
                    className="text-center py-10 text-sm text-muted-foreground"
                  >
                    Loading communities...
                  </td>
                </tr>
              </tbody>
            }
          >
            <CommunityDataWrapper query={query} />
          </Suspense>
        </table>
      </div>
    </div>
  );
}

async function CommunityDataWrapper({ query }: { query: string }) {
  const communities = await prisma.community.findMany({
    orderBy: { name: "asc" },
  });

  const filtered = communities.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.category.toLowerCase().includes(query.toLowerCase()),
  );

  return <AdminCommunityTable data={filtered} />;
}
