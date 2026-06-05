import { Ban } from "lucide-react";
import Link from "next/link"; // Imported for the redirect wrapper

type iAppProps = {
  title: string;
  description: string;
  buttonText: React.ReactNode; // 👈 Changed from string to React.ReactNode
  href: string;
  className?: string;
  icon?: React.ReactNode;
};

// Destructured the missing variables so we can render them safely below
export function EmptyState({
  description,
  title,
  buttonText,
  href,
  icon,
  className,
}: iAppProps) {
  return (
    <div
      className={`flex flex-col flex-1 h-full items-center justify-center text-center ${className || ""}`}
    >
      {/* Dynamic icon with a fallback to the default Ban icon */}
      <div className="flex size-14 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800">
        {icon ? icon : <Ban className="size-6 text-muted-foreground/60" />}
      </div>

      <h2 className="mt-5 text-xl font-bold tracking-tight text-foreground">
        {title}
      </h2>

      <p className="mt-2 max-w-sm text-sm text-muted-foreground leading-normal">
        {description}
      </p>

      {/* Renders the button now using the variable you passed */}
      {buttonText && href && (
        <Link
          href={href}
          className="mt-6 inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/95 transition-colors"
        >
          {buttonText}
        </Link>
      )}
    </div>
  );
}
