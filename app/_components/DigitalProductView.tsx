import Image from "next/image";
import { Download, FileText, ArrowLeft } from "lucide-react";

import Link from "next/link";
import { buttonVariants } from "@/app/_components/ui/button";

interface DigitalProductViewProps {
  product: {
    id: string;
    title: string;
    description: string;
    fileKey: string | null;
    fileType: string | null;
    fileSize: number | null;

    images: {
      imageKey: string;
    }[];
  };

  purchase: {
    id: string;
    quantity: number;
  };
}

export function DigitalProductView({ product }: DigitalProductViewProps) {
  const imageKey = product.images?.[0]?.imageKey;

  const imageUrl = imageKey
    ? imageKey.startsWith("http")
      ? imageKey
      : `https://utfs.io/f/${imageKey}`
    : null;

  return (
    <div className="min-h-full bg-background">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* BACK */}

        <Link
          href="/learner/products"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="size-4" />
          My Products
        </Link>

        {/* PRODUCT */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* IMAGE */}

          <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted border">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={product.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FileText className="size-20 text-muted-foreground/40" />
              </div>
            )}
          </div>

          {/* DETAILS */}

          <div className="flex flex-col justify-center">
            <p className="text-sm font-semibold text-primary uppercase">
              Digital Product
            </p>

            <h1 className="text-3xl font-bold tracking-tight mt-2">
              {product.title}
            </h1>

            {product.description && (
              <div
                className="mt-5 prose prose-sm dark:prose-invert"
                dangerouslySetInnerHTML={{
                  __html: product.description,
                }}
              />
            )}

            {/* DOWNLOAD */}

            {product.fileKey ? (
              <a
                href={`/api/products/${product.id}/download`}
                className={buttonVariants({
                  className: "mt-8 w-full sm:w-auto",
                  size: "lg",
                })}
              >
                <Download className="size-7 mr-2" />
                Download Product
              </a>
            ) : (
              <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-4">
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  The downloadable file for this product is not currently
                  available.
                </p>
              </div>
            )}

            {product.fileType && (
              <p className="text-xs text-muted-foreground mt-3">
                File type: {product.fileType}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
