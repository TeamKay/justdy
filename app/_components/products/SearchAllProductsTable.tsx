"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Input } from "@/app/_components/ui/input";
import { useDebouncedCallback } from "use-debounce";
import { Search } from "lucide-react"; // Import the search icon

export function SearchAllProductsTable({
  defaultValue,
}: {
  defaultValue: string;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("q", term);
    } else {
      params.delete("q");
    }

    startTransition(() => {
      replace(`${pathname}?${params.toString()}`);
    });
  }, 300);

  return (
    <div className="relative w-full max-w-xl">
      {/* Search Icon */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
        <Search className="h-5 w-5" strokeWidth={1.5} />
      </div>

      <Input
        placeholder="Search by product name or educator name..."
        defaultValue={defaultValue}
        onChange={(e) => handleSearch(e.target.value)}
        className="h-10 w-full rounded-lg border-zinc-800 bg-[#0a0a0a] pl-12 pr-10 text-base text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-700"
      />

      {/* Loading Spinner */}
      {isPending && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-500 border-t-transparent" />
        </div>
      )}
    </div>
  );
}
