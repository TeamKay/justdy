import { Ban } from "lucide-react";

type iAppProps = {
  title: string;
  description: string;
  buttonText: string;
  href: string;
  className?: string;
  icon?: React.ReactNode; // 👈 add this
};

export function EmptyState({ description, title }: iAppProps) {
  return (
    <div className="flex flex-col flex-1 h-full items-center justify-center rounded-md border-dashed border p-8 text-center animate-in fade-in-50">
      <div className="flex size-20 items-center justify-center rounded-full bg-primary/10">
        <Ban className="size-10 text-primary" />
      </div>
      <h2 className="mt-6 text-2xl font-semibold">{title}</h2>
      <p className="mb-8 mt-2 text-center text-sm leading-tight text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
