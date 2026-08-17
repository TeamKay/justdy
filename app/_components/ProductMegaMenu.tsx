"use client";

import Link from "next/link";
import { ChevronDown, ChevronRight, Loader2, PackageOpen } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";

type ProductType =
  | "Course"
  | "Worksheets"
  | "Workbooks"
  | "Planners"
  | "Journals"
  | "Templates"
  | "Checklists"
  | "Trackers"
  | "Guides"
  | "Bundles";

interface Product {
  id: string;
  title: string;
  slug: string;
  price: number;
  type: ProductType;
  image: string | null;
}

interface ProductMegaMenuProps {
  onClose?: () => void;
}

interface ProductMobileMenuProps {
  onClose?: () => void;
}

/* ============================================================================
   Helpers
============================================================================ */

function formatTypeName(type: string) {
  return type.replace(/([a-z])([A-Z])/g, "$1 $2");
}

function formatPrice(price: number) {
  if (!price || price <= 0) {
    return "Free";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price / 100);
}

/**
 * Convert a stored image value into a valid browser URL.
 *
 * Supports:
 * - Full HTTPS URLs
 * - Full HTTP URLs
 * - Local Next.js paths such as /images/example.jpg
 * - UploadThing file keys
 */
function getImageUrl(image: string | null | undefined): string | null {
  if (!image) {
    return null;
  }

  const value = image.trim();

  if (!value) {
    return null;
  }

  // Already a complete public URL
  if (value.startsWith("https://") || value.startsWith("http://")) {
    return value;
  }

  // Local/public Next.js image
  if (value.startsWith("/")) {
    return value;
  }

  // UploadThing file key
  return `https://utfs.io/f/${value}`;
}

/* ============================================================================
   Desktop Mega Menu
============================================================================ */

export function ProductMegaMenu({ onClose }: ProductMegaMenuProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedType, setSelectedType] = useState<ProductType | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        setLoading(true);
        setError(false);

        const response = await fetch("/api/products/explore", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load explore products");
        }

        const data: Product[] = await response.json();

        if (cancelled) {
          return;
        }

        setProducts(data);

        /*
         * Automatically select the first available
         * product type.
         */
        if (data.length > 0) {
          setSelectedType(data[0].type);
        }
      } catch (error) {
        console.error("Failed to load explore products:", error);

        if (!cancelled) {
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * Automatically generate the category list
   * from the products returned by the database.
   */
  const productTypes = useMemo(() => {
    return Array.from(new Set(products.map((product) => product.type)));
  }, [products]);

  /*
   * Products belonging to selected category.
   */
  const selectedProducts = useMemo(() => {
    if (!selectedType) {
      return [];
    }

    return products
      .filter((product) => product.type === selectedType)
      .slice(0, 6);
  }, [products, selectedType]);

  /*
   * Loading state.
   */
  if (loading) {
    return (
      <div
        className="
          absolute
          left-0
          top-full
          z-100
          w-212.5
          max-w-[calc(100vw-2rem)]
          pt-2
        "
      >
        <div
          className="
            flex
            h-97.5
            items-center
            justify-center
            rounded-xl
            border
            border-slate-200
            bg-white
            shadow-[0_20px_60px_rgba(0,0,0,0.15)]
          "
        >
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="size-4 animate-spin text-[#857938]" />
            <span>Loading products...</span>
          </div>
        </div>
      </div>
    );
  }

  /*
   * Error state.
   */
  if (error) {
    return (
      <div
        className="
          absolute
          left-0
          top-full
          z-100
          w-125
          max-w-[calc(100vw-2rem)]
          pt-2
        "
      >
        <div
          className="
            flex
            min-h-60
            items-center
            justify-center
            rounded-xl
            border
            border-slate-200
            bg-white
            p-8
            shadow-[0_20px_60px_rgba(0,0,0,0.15)]
          "
        >
          <div className="text-center">
            <PackageOpen className="mx-auto mb-3 size-8 text-slate-300" />

            <p className="text-sm font-semibold text-slate-700">
              Unable to load products
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Please try again later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /*
   * Empty state.
   */
  if (products.length === 0) {
    return (
      <div
        className="
          absolute
          left-0
          top-full
          z-100
          w-125
          max-w-[calc(100vw-2rem)]
          pt-2
        "
      >
        <div
          className="
            flex
            min-h-60
            items-center
            justify-center
            rounded-xl
            border
            border-slate-200
            bg-white
            p-8
            shadow-[0_20px_60px_rgba(0,0,0,0.15)]
          "
        >
          <div className="text-center">
            <PackageOpen className="mx-auto mb-3 size-8 text-slate-300" />

            <p className="text-sm font-semibold text-slate-700">
              No published products yet
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Published products will appear here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="
        absolute
        left-0
        top-full
        z-100
        w-212.5
        max-w-[calc(100vw-2rem)]
        pt-2
      "
    >
      <motion.div
        initial={{
          opacity: 0,
          y: 8,
          scale: 0.98,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        transition={{
          duration: 0.18,
          ease: "easeOut",
        }}
        className="
          overflow-hidden
          rounded-xl
          border
          border-slate-200
          bg-white
          shadow-[0_20px_60px_rgba(0,0,0,0.15)]
        "
      >
        <div className="flex min-h-97.5">
          {/* ================================================================
              LEFT SIDE
          ================================================================= */}

          <aside
            className="
              w-57.5
              shrink-0
              border-r
              border-slate-200
              bg-slate-50
              p-3
            "
          >
            <div className="px-3 pb-3 pt-2">
              <p
                className="
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.16em]
                  text-slate-400
                "
              >
                Explore
              </p>

              <h3 className="mt-1 text-sm font-semibold text-slate-900">
                Product Categories
              </h3>
            </div>

            <div className="space-y-1">
              {productTypes.map((type) => {
                const active = selectedType === type;

                const count = products.filter(
                  (product) => product.type === type,
                ).length;

                return (
                  <button
                    key={type}
                    type="button"
                    onMouseEnter={() => setSelectedType(type)}
                    onFocus={() => setSelectedType(type)}
                    onClick={() => setSelectedType(type)}
                    className={cn(
                      `
                        group
                        flex
                        w-full
                        items-center
                        justify-between
                        rounded-lg
                        px-3
                        py-2.5
                        text-left
                        transition-all
                        duration-150
                        cursor-pointer
                      `,
                      active
                        ? `
                          bg-white
                          text-[#857938]
                          shadow-sm
                        `
                        : `
                          text-slate-700
                          hover:bg-white
                          hover:text-[#857938]
                        `,
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-sm font-medium">
                        {formatTypeName(type)}
                      </span>

                      <span
                        className={cn(
                          `
                            rounded-full
                            px-1.5
                            py-0.5
                            text-[10px]
                            font-medium
                          `,
                          active
                            ? "bg-[#857938]/10 text-[#857938]"
                            : "bg-slate-200 text-slate-500",
                        )}
                      >
                        {count}
                      </span>
                    </span>

                    <ChevronRight
                      className={cn(
                        `
                          size-4
                          shrink-0
                          transition-all
                          duration-150
                        `,
                        active
                          ? "translate-x-0.5 text-[#857938]"
                          : "text-slate-400 group-hover:text-[#857938]",
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </aside>

          {/* ================================================================
              RIGHT SIDE
          ================================================================= */}

          <section className="min-w-0 flex-1 bg-white p-5">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                  Featured
                </p>

                <h3 className="mt-1 text-lg font-semibold text-slate-900">
                  {selectedType ? formatTypeName(selectedType) : "Products"}
                </h3>

                <p className="mt-0.5 text-xs text-slate-500">
                  {selectedProducts.length}{" "}
                  {selectedProducts.length === 1 ? "product" : "products"}
                </p>
              </div>

              {selectedType && (
                <Link
                  href={`/products?type=${encodeURIComponent(selectedType)}`}
                  onClick={onClose}
                  className="
                    shrink-0
                    rounded-md
                    px-2.5
                    py-1.5
                    text-xs
                    font-semibold
                    text-[#857938]
                    transition-colors
                    hover:bg-[#857938]/10
                  "
                >
                  View all →
                </Link>
              )}
            </div>

            {selectedProducts.length === 0 ? (
              <div className="flex min-h-71.25 items-center justify-center">
                <div className="text-center">
                  <PackageOpen className="mx-auto mb-2 size-7 text-slate-300" />

                  <p className="text-sm text-slate-500">
                    No products in this category.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {selectedProducts.map((product) => {
                  const imageUrl = getImageUrl(product.image);

                  return (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      onClick={onClose}
                      className="
                        group
                        min-w-0
                        overflow-hidden
                        rounded-lg
                        border
                        border-slate-100
                        bg-white
                        transition-all
                        duration-200
                        hover:-translate-y-1
                        hover:border-slate-200
                        hover:shadow-lg
                      "
                    >
                      {/* Product image */}
                      <div
                        className="
                          relative
                          aspect-4/3
                          overflow-hidden
                          bg-slate-100
                        "
                      >
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={product.title}
                            fill
                            sizes="180px"
                            className="
                              object-cover
                              transition-transform
                              duration-300
                              group-hover:scale-105
                            "
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <PackageOpen className="size-7 text-slate-300" />
                          </div>
                        )}

                        {/* Hover overlay */}
                        <div
                          className="
                            absolute
                            inset-0
                            bg-black/0
                            transition-colors
                            duration-200
                            group-hover:bg-black/5
                          "
                        />
                      </div>

                      {/* Product details */}
                      <div className="p-3">
                        <h4
                          className="
                            line-clamp-1
                            min-h-5
                            text-[13px]
                            font-medium
                            leading-5
                            text-slate-800
                            transition-colors
                            group-hover:text-[#857938]
                          "
                        >
                          {product.title}
                        </h4>

                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-sm font-bold text-[#857938]">
                            {formatPrice(product.price)}
                          </span>

                          <ChevronRight
                            className="
                              size-4
                              text-slate-300
                              transition-all
                              group-hover:translate-x-0.5
                              group-hover:text-[#857938]
                            "
                          />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </motion.div>
    </div>
  );
}

/* ============================================================================
   Mobile Product Menu
============================================================================ */

export function ProductMobileMenu({ onClose }: ProductMobileMenuProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedType, setSelectedType] = useState<ProductType | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        const response = await fetch("/api/products/explore", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load products");
        }

        const data: Product[] = await response.json();

        if (cancelled) {
          return;
        }

        setProducts(data);

        if (data.length > 0) {
          setSelectedType(data[0].type);
        }
      } catch (error) {
        console.error("Failed to load mobile products:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  const productTypes = useMemo(() => {
    return Array.from(new Set(products.map((product) => product.type)));
  }, [products]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-3 text-sm text-slate-500">
        <Loader2 className="size-4 animate-spin text-[#857938]" />
        Loading products...
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <p className="px-3 py-3 text-sm text-slate-500">
        No published products available.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {productTypes.map((type) => {
        const active = selectedType === type;

        const categoryProducts = products
          .filter((product) => product.type === type)
          .slice(0, 4);

        return (
          <div key={type}>
            <button
              type="button"
              onClick={() => setSelectedType(active ? null : type)}
              className="
                flex
                w-full
                items-center
                justify-between
                rounded-lg
                px-3
                py-2.5
                text-left
                text-sm
                font-medium
                text-slate-800
                transition-colors
                hover:bg-slate-100
                hover:text-[#857938]
              "
            >
              <span>{formatTypeName(type)}</span>

              <ChevronDown
                className={cn(
                  "size-4 transition-transform",
                  active && "rotate-180",
                )}
              />
            </button>

            {active && (
              <div className="ml-3 space-y-1 border-l border-slate-200 pl-3">
                {categoryProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    onClick={onClose}
                    className="
                      block
                      rounded-md
                      px-3
                      py-2
                      text-xs
                      text-slate-600
                      transition-colors
                      hover:bg-slate-50
                      hover:text-[#857938]
                    "
                  >
                    {product.title}
                  </Link>
                ))}

                {products.filter((product) => product.type === type).length >
                  4 && (
                  <Link
                    href={`/products?type=${encodeURIComponent(type)}`}
                    onClick={onClose}
                    className="
                      block
                      px-3
                      py-2
                      text-xs
                      font-semibold
                      text-[#857938]
                    "
                  >
                    View all →
                  </Link>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
