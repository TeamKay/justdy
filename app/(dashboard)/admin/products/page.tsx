import { Suspense } from "react";
import { SearchAllProductsTable } from "@/app/_components/SearchAllProductsTable";

import { adminGetProducts } from "@/app/actions/admin-get-all-products";
import {
  AdminProductRow,
  AdminProductRowSkeleton,
} from "@/app/_components/AdminProductRow";

export default async function AdminAllProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: query = "" } = await searchParams;

  return (
    <div className="max-w-8xl w-full mx-auto px-2 pt-2 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div className="w-full md:w-auto min-w-150">
          <SearchAllProductsTable defaultValue={query} />
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-card rounded-md border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-6 py-4 text-left text-[12px] font-bold tracking-widest text-muted-foreground/80">
                  Product Info
                </th>

                <th className="px-6 py-4 text-left text-[12px] font-bold  tracking-widest text-muted-foreground/80">
                  Product Type
                </th>
                <th className="px-6 py-4 text-left text-[12px] font-bold tracking-widest text-muted-foreground/80">
                  Educator
                </th>
                <th className="px-6 py-4 text-left text-[12px] font-bold tracking-widest text-muted-foreground/80">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-[12px] font-bold tracking-widest text-muted-foreground/80">
                  Sales
                </th>

                <th className="px-6 py-4 text-right text-[12px] font-bold  tracking-widest text-muted-foreground/80">
                  Actions
                </th>
              </tr>
            </thead>
            <Suspense key={query} fallback={<AdminProductRowSkeletonLayout />}>
              <RenderProducts query={query} />
            </Suspense>
          </table>
        </div>
      </div>
    </div>
  );
}

async function RenderProducts({ query }: { query: string }) {
  const data = await adminGetProducts(query);

  if (data.length === 0) {
    return (
      <tbody>
        <tr>
          <td colSpan={6} className="py-24">
            <div className="flex flex-col items-center justify-center text-center space-y-3">
              {/* Subtle icon */}
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-foreground">
                No products published yet
              </h3>

              {/* Description */}
              <p className="text-sm text-muted-foreground max-w-md">
                There are currently no published products available in the
                system. Once educators create and publish products, they will
                appear here for management and oversight.
              </p>

              {/* Optional subtle badge */}
              <div className="mt-2 inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
                Waiting for product submissions
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody className="divide-y divide-border bg-card">
      {data.map((course) => (
        <AdminProductRow
          key={course.id}
          data={{
            ...course,
          }}
        />
      ))}
    </tbody>
  );
}

function AdminProductRowSkeletonLayout() {
  return (
    <tbody className="divide-y divide-border">
      {Array.from({ length: 5 }).map((_, index) => (
        <AdminProductRowSkeleton key={index} />
      ))}
    </tbody>
  );
}
