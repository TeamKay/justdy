import prisma from "@/lib/prisma";
import { Suspense } from "react";
import Link from "next/link";
import { AdminSubjectTable } from "@/app/_components/AdminSubjectTable";
import { Card } from "@/app/_components/ui/card";

export default async function AdminSubjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: query = "" } = await searchParams;

  return (
    <Card className="max-w-6xl mx-auto px-12 py-0 space-y-4 bg-zinc-900/50 border-zinc-800 backdrop-blur-md shadow-2xl ">
      <div className="pt-12 pb-10">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-white">Manage Subjects</h1>
            <p className="text-sm text-zinc-400">
              Deploy and manage student curricular topics and academic
              disciplines
            </p>
          </div>

          <Link
            href="/admin/subjects/create"
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
          >
            + Create Subject
          </Link>
        </div>

        {/* TABLE */}
        <div className="rounded-md border bg-card overflow-hidden">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground w-[35%]">
                  Subject Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground w-[45%]">
                  Description
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-muted-foreground">
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
                      Loading subjects...
                    </td>
                  </tr>
                </tbody>
              }
            >
              <SubjectDataWrapper query={query} />
            </Suspense>
          </table>
        </div>
      </div>
    </Card>
  );
}

async function SubjectDataWrapper({ query }: { query: string }) {
  const subjects = await prisma.subject.findMany({
    orderBy: { name: "asc" },
  });

  // Since description is a standard string? field, we can filter it directly safely
  const filtered = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      (s.description &&
        s.description.toLowerCase().includes(query.toLowerCase())),
  );

  return <AdminSubjectTable data={filtered} />;
}
