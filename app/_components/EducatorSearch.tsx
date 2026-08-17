"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition, useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/app/_components/ui/input";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  placeholder?: string;
  className?: string;
  paramName?: string;
  debounceMs?: number;
}

export function SearchInput({
  placeholder = "Search...",
  className,
  paramName = "q",
  debounceMs = 300,
}: SearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const urlValue = searchParams.get(paramName) ?? "";

  // Track local value for immediate typing response
  const [value, setValue] = useState(urlValue);
  // Track previous urlValue during render to update local state without a useEffect sync
  const [prevUrlValue, setPrevUrlValue] = useState(urlValue);

  // Sync state during render when URL param changes (React-recommended pattern for deriving state from props/external sources)
  if (prevUrlValue !== urlValue) {
    setPrevUrlValue(urlValue);
    setValue(urlValue);
  }

  // Debounced URL update on user input
  useEffect(() => {
    // Skip debounce if value already matches URL
    if (value === urlValue) return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (value.trim()) {
        params.set(paramName, value.trim());
      } else {
        params.delete(paramName);
      }

      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [value, urlValue, pathname, router, searchParams, paramName, debounceMs]);

  const handleClear = () => {
    setValue("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete(paramName);
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <div className={cn("relative flex items-center w-full", className)}>
      <Search className="absolute left-3 size-4 text-muted-foreground pointer-events-none select-none" />
      <Input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-8 text-xs h-9 bg-background shadow-xs focus-visible:ring-1"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-sm"
          aria-label="Clear search"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
