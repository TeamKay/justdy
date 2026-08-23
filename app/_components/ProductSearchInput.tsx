"use client";

import { Search, X, Loader2, ArrowRight, Package } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  ProductSearchResult,
  searchProducts,
} from "../actions/manage-search-products";
import Image from "next/image";

export function ProductSearchInput() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(() => searchParams.get("search") || "");
  const [suggestions, setSuggestions] = useState<ProductSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();
    const loadSuggestions = async () => {
      setIsLoadingSuggestions(true);

      try {
        const results = await searchProducts(query);
        if (!controller.signal.aborted) {
          setSuggestions(results);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Failed to load search suggestions:", error);

          setSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingSuggestions(false);
        }
      }
    };

    const timeout = setTimeout(loadSuggestions, query.trim() ? 250 : 0);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [query, isOpen]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  function handleSearch(term: string) {
    const trimmedTerm = term.trim();

    if (!trimmedTerm) {
      setIsOpen(false);
      return;
    }

    setIsOpen(false);

    startTransition(() => {
      router.push(`/products?search=${encodeURIComponent(trimmedTerm)}`);
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    handleSearch(query);
  }

  function clearSearch() {
    setQuery("");
    setSuggestions([]);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    setIsOpen(false);
    startTransition(() => {
      router.replace(
        `${pathname}${params.toString() ? `?${params.toString()}` : ""}`,
      );
    });

    inputRef.current?.focus();
  }

  return (
    <div ref={wrapperRef} className="relative mx-auto w-full max-w-xl">
      <form onSubmit={handleSubmit}>
        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-slate-800" />

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search courses, workbooks, templates..."
            autoComplete="off"
            className="h-10 w-full rounded-md border border-blue-100 bg-background pl-11 pr-24 text-sm text-slate-900 shadow-lg transition-all
              placeholder:text-slate-500 focus:border-[#857938] focus:outline-none focus:ring-2  focus:ring-[#857938]/30 dark:border-slate-400
              "
          />

          {/* Clear */}
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-14 top-1/2 -translate-y-1/2 cursor-pointer p-1.5 text-slate-800 transition-colors hover:text-slate-700 dark:hover:text-red-600"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Search Button */}
          <button
            type="submit"
            aria-label="Search"
            className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md bg-blue-500
              text-white transition-all hover:scale-105 hover:bg-blue-600 hover:text-white active:scale-95"
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
          </button>
        </div>
      </form>

      {/* ================================================================ */}
      {/* Suggestions Dropdown                                              */}
      {/* ================================================================ */}

      {isOpen && (
        <div
          className="absolute left-0 right-0 top-[calc(100%+10px)] z-50 overflow-hidden rounded-md border border-slate-200 bg-white shadow-2xl
            dark:border-slate-400 dark:bg-background"
        >
          {/* Loading */}
          {isLoadingSuggestions ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
              <Loader2 className="size-4 animate-spin text-[#857938]" />
              Searching...
            </div>
          ) : suggestions.length > 0 ? (
            <div>
              {/* Header */}
              <div className="border-b px-4 py-3 border-slate-300">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  {query.trim() ? "Search Suggestions" : "Popular Products"}
                </p>
              </div>

              {/* Products */}
              <div className="p-2">
                {suggestions.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    onClick={() => setIsOpen(false)}
                    className="group flex items-center gap-3 rounded-md p-2.5 transition-colors hover:bg-emerald-900/20"
                  >
                    {/* Image */}
                    <div className="size-12 shrink-0 overflow-hidden rounded-md bg-slate-100 ">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.title}
                          width={48}
                          height={48}
                          sizes="48px"
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center">
                          <Package className="size-5 text-slate-400" />
                        </div>
                      )}
                    </div>

                    {/* Information */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800 transition-colors group-hover:text-[#857938]">
                        {product.title}
                      </p>

                      <div className="mt-0.5 flex items-center gap-2">
                        {product.category && (
                          <span className="truncate text-xs text-slate-400">
                            {product.category}
                          </span>
                        )}

                        <span className="text-xs font-semibold text-[#857938]">
                          ${(product.price / 100).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <ArrowRight className="size-4 shrink-0 text-slate-800 transition-all group-hover:translate-x-0.5 group-hover:text-[#857938]" />
                  </Link>
                ))}
              </div>

              {/* View all results */}
              {query.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    const trimmedQuery = query.trim();
                    if (!trimmedQuery) return;
                    setIsOpen(false);
                    router.push(
                      `/products?search=${encodeURIComponent(trimmedQuery)}`,
                    );
                  }}
                  className="flex w-full cursor-pointer items-center justify-between border-t border-slate-300 px-4 py-3 text-sm font-semibold
                   text-[#857938] transition-colors hover:bg-emerald-900/30"
                >
                  <span>
                    View all results for &quot;
                    {query}
                    &quot;
                  </span>

                  <ArrowRight className="size-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="px-5 py-8 text-center">
              <Package className="mx-auto mb-2 size-8 text-slate-300" />

              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                No products found
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Try another search term.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
