// app/admin/educators/page.tsx
import { Suspense } from "react";
import { getPendingEducators, getVerifiedEducators } from "@/app/actions/admin";
import { AdminEducatorTable } from "@/app/_components/AdminEducatorTable";

import { Card, CardContent } from "@/app/_components/ui/card";
import { Skeleton } from "@/app/_components/ui/skeleton";
import { Users, Clock, CheckCircle2, ShieldCheck } from "lucide-react";
import { SearchInput } from "@/app/_components/EducatorSearch";

type RawEducator = {
  id: string;
  name: string;
  email: string;

  emailVerified: boolean;
  imageUrl: string | null;
  createdAt: Date;

  specialty?: string | null;
  experience?: number | null;
  description?: string | null;
  credentialUrl?: string | null;
};

type EducatorStatus = "Pending" | "Verified";

export default async function AdminEducatorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: query = "" } = await searchParams;

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* SaaS Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="size-6 text-primary" />
            Educator Verification
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Review applicant credentials, approve instructor permissions, and
            manage educator accounts.
          </p>
        </div>
      </div>

      {/* Main Table View Container */}
      <Card className="border-border/60 shadow-xs rounded-xl overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/10">
          <div className="w-full sm:w-72">
            {/* Search Input Filter */}
            <SearchInput
              placeholder="Search by name or email..."
              className="h-9 text-xs bg-background"
            />
          </div>
        </div>

        {/* Data Table Wrapper */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th scope="col" className="px-6 py-3.5 font-medium">
                  Educator
                </th>
                <th scope="col" className="px-6 py-3.5 font-medium">
                  Specialty
                </th>
                <th scope="col" className="px-6 py-3.5 font-medium">
                  Status
                </th>
                <th scope="col" className="px-6 py-3.5 font-medium">
                  Experience
                </th>
                <th scope="col" className="px-6 py-3.5 font-medium text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <Suspense fallback={<TableSkeleton />}>
              <EducatorDataWrapper query={query} />
            </Suspense>
          </table>
        </div>
      </Card>
    </div>
  );
}

function normalizeEducator(e: RawEducator, status: EducatorStatus) {
  return {
    ...e,
    status,

    specialty: e.specialty ?? "Not Specified",
    experience: e.experience ?? 0,

    description: e.description ?? undefined,
    credentialUrl: e.credentialUrl ?? undefined,
  };
}

async function EducatorDataWrapper({ query }: { query: string }) {
  const [pendingRes, verifiedRes] = await Promise.all([
    getPendingEducators(),
    getVerifiedEducators(),
  ]);

  // Merge and normalize data
  const allEducators = [
    ...(pendingRes.educators || []).map((e) => normalizeEducator(e, "Pending")),
    ...(verifiedRes.educators || []).map((e) =>
      normalizeEducator(e, "Verified"),
    ),
  ];

  // Search Filtering
  const filtered = allEducators.filter(
    (e) =>
      e.name.toLowerCase().includes(query.toLowerCase()) ||
      e.email.toLowerCase().includes(query.toLowerCase()),
  );

  if (filtered.length === 0) {
    return (
      <tbody>
        <tr>
          <td
            colSpan={5}
            className="text-center py-12 text-sm text-muted-foreground"
          >
            No educators found matching your criteria.
          </td>
        </tr>
      </tbody>
    );
  }

  return <AdminEducatorTable data={filtered} />;
}

// SaaS Skeleton Loading State for Tabular Data
function TableSkeleton() {
  return (
    <tbody className="divide-y divide-border/40">
      {Array.from({ length: 5 }).map((_, index) => (
        <tr key={index} className="animate-pulse">
          <td className="px-6 py-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-9 rounded-full shrink-0" />
              <div className="space-y-1.5 w-full">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          </td>
          <td className="px-6 py-4">
            <Skeleton className="h-4 w-24" />
          </td>
          <td className="px-6 py-4">
            <Skeleton className="h-5 w-16 rounded-full" />
          </td>
          <td className="px-6 py-4">
            <Skeleton className="h-4 w-12" />
          </td>
          <td className="px-6 py-4 text-right">
            <div className="flex justify-end gap-2">
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  );
}
