import { MyProductCard } from "@/app/_components/MyProductCard";
import { getMyProducts } from "@/app/actions/manage-get-my-products";
import { BookOpen } from "lucide-react";

export default async function MyProductsPage() {
  const products = await getMyProducts();

  return (
    <div className="w-full min-h-full px-4 md:px-6 py-10">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}

        <div className="mb-8 border-b pb-5">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">My Products</h1>

              <p className="text-sm text-muted-foreground mt-1">
                Access all your courses and purchased products.
              </p>
            </div>
          </div>
        </div>

        {/* EMPTY */}

        {products.length === 0 ? (
          <div className="min-h-100 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 text-center px-6">
            <BookOpen className="size-12 text-muted-foreground/50" />

            <h2 className="mt-4 text-xl font-semibold">
              Your library is empty
            </h2>

            <p className="mt-2 text-sm text-muted-foreground max-w-md">
              Products you purchase will appear here. Browse our catalog to find
              courses, workbooks, study guides, and other resources.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <MyProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
