// app/admin/educators/page.tsx
import { Suspense } from "react";
import { getPendingEducators, getVerifiedEducators } from "@/app/actions/admin";
import { AdminEducatorTable } from "@/app/_components/AdminEducatorTable";

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
    <div className="max-w-6xl mx-auto px-0 py-0 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Manage Educators</h1>
      </div>

      <div className="rounded-md border bg-card overflow-hidden">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Educator
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Specialty
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Experience
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <Suspense
            fallback={
              <tbody>
                <tr>
                  <td colSpan={5} className="text-center py-10">
                    Loading...
                  </td>
                </tr>
              </tbody>
            }
          >
            <EducatorDataWrapper query={query} />
          </Suspense>
        </table>
      </div>
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

  // Optional: move your filtering logic back in if needed
  const filtered = allEducators.filter(
    (e) =>
      e.name.toLowerCase().includes(query.toLowerCase()) ||
      e.email.toLowerCase().includes(query.toLowerCase()),
  );

  return <AdminEducatorTable data={filtered} />;
}

// import { getVerifiedEducators } from "@/app/actions/admin";
// import VerifiedEducators from "../../../_components/verified-educators";

// export default async function AdminPage() {
//   const [verifiedEducatorsData] = await Promise.all([getVerifiedEducators()]);

//   return (
//     <div className="w-full space-y-10">
//       {/* Verified Educators Section */}
//       <section className="space-y-4">
//         <h2 className="text-lg font-semibold">Verified Educators</h2>
//         <div className="border rounded-lg p-4 bg-background">
//           <VerifiedEducators
//             educators={verifiedEducatorsData.educators || []}
//           />
//         </div>
//       </section>
//     </div>
//   );
// }
