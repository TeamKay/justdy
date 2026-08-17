import Link from "next/link";
import { Suspense } from "react";
import { buttonVariants } from "@/app/_components/ui/button";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Plus, Package, PackagePlus } from "lucide-react";
import { GetAllProducts } from "@/app/actions/manage-get-all-products";
import { ProductTable } from "@/app/_components/ProductTable";

export default async function AllProducts() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // 1. Check Auth & Role FIRST
  if (!session?.user) redirect("/login");

  // Multi-role check (Admin or Educator)
  const userRole = session.user.role?.toLowerCase();
  if (userRole !== "admin" && userRole !== "educator") {
    redirect("/unauthorized");
  }

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* ---------------- HEADER ---------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Products Directory
            </h1>
          </div>
        </div>

        <Link
          href="/manage/products/create"
          className={buttonVariants({
            size: "default",
            className: "shrink-0 shadow-sm gap-1.5 font-medium",
          })}
        >
          <Plus className="w-4 h-4" />
          Create Product
        </Link>
      </div>

      {/* ---------------- TABLE CONTAINER ---------------- */}
      <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/40 border-b border-border/80">
                <th className="px-6 py-3.5 text-xs font-semibold text-muted-foreground  tracking-wider">
                  Product Details
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold text-muted-foreground  tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold text-muted-foreground  tracking-wider">
                  Creator
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold text-muted-foreground  tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold text-muted-foreground  tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-muted-foreground  tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            <Suspense fallback={<ProductTableSkeletonLayout />}>
              <RenderProducts />
            </Suspense>
          </table>
        </div>
      </div>
    </div>
  );
}

async function RenderProducts() {
  const data = await GetAllProducts();

  if (!data || data.length === 0) {
    return (
      <tbody>
        <tr>
          <td colSpan={6} className="py-20 px-6">
            <div className="flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-4">
              {/* Subtle Icon Container */}
              <div className="w-14 h-14 rounded-md bg-muted/80 border border-border flex items-center justify-center text-muted-foreground shadow-xs">
                <Package className="w-7 h-7 stroke-[1.5]" />
              </div>

              {/* Title & Microcopy */}
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-foreground">
                  No products published yet
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  You haven&apos;t created any products or courses. Get started
                  by publishing your first educational content.
                </p>
              </div>

              {/* Action Button */}
              <Link
                href="/manage/products/create"
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                  className: "gap-2 text-xs shadow-xs",
                })}
              >
                <PackagePlus className="w-3.5 h-3.5" />
                Create First Product
              </Link>
            </div>
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody className="divide-y divide-border/60 bg-card">
      {data.map((product) => (
        <ProductTable key={product.id} data={product} />
      ))}
    </tbody>
  );
}

function ProductTableSkeletonLayout() {
  return (
    <tbody className="divide-y divide-border/60 bg-card">
      {Array.from({ length: 5 }).map((_, index) => (
        <tr key={index} className="animate-pulse">
          <td className="px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted/80 shrink-0" />
              <div className="space-y-1.5 w-full">
                <div className="h-4 bg-muted/80 rounded-md w-3/4" />
                <div className="h-3 bg-muted/50 rounded-md w-1/2" />
              </div>
            </div>
          </td>
          <td className="px-6 py-4">
            <div className="h-4 bg-muted/80 rounded-md w-20" />
          </td>
          <td className="px-6 py-4">
            <div className="h-5 bg-muted/80 rounded-full w-16" />
          </td>
          <td className="px-6 py-4">
            <div className="h-4 bg-muted/80 rounded-md w-12" />
          </td>
          <td className="px-6 py-4 text-right">
            <div className="h-8 bg-muted/80 rounded-lg w-20 inline-block" />
          </td>
        </tr>
      ))}
    </tbody>
  );
}
