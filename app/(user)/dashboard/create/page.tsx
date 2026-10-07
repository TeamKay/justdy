"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  ClipboardCheck,
  Image as ImageIcon,
  Palette,
  Sparkles,
  Users,
  Video,
} from "lucide-react";

type Studio = {
  href: string;
  label: string;
  description: string;
  image: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
  rating: string;
  price: string;
  classes: string;
  students: string;
};

const studios: Studio[] = [
  {
    href: "/dashboard/create/video",
    label: "Video",
    description: "Create engaging educational videos and animated explanations.",
    image:
      "https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?auto=format&fit=crop&w=1200&q=85",
    icon: Video,
    badge: "POPULAR",
    rating: "4.9",
    price: "AI",
    classes: "Video creation",
    students: "Unlimited",
  },
  {
    href: "/dashboard/create/image",
    label: "Images",
    description:
      "Generate illustrations, diagrams, posters, and educational visuals.",
    image:
      "https://images.unsplash.com/photo-1545235617-9465d2a55698?auto=format&fit=crop&w=1200&q=85",
    icon: ImageIcon,
    badge: "POPULAR",
    rating: "4.9",
    price: "AI",
    classes: "Visual creation",
    students: "Unlimited",
  },
  {
    href: "/dashboard/create/coloring-pages",
    label: "Coloring Pages",
    description:
      "Create clean, printable coloring pages for learning and activities.",
    image:
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=85",
    icon: Palette,
    badge: "NEW",
    rating: "4.8",
    price: "AI",
    classes: "Printable creation",
    students: "Unlimited",
  },
  {
    href: "/dashboard/create/assessments",
    label: "Assessments",
    description:
      "Create worksheets and workbooks with questions and answer keys.",
    image:
      "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=85",
    icon: ClipboardCheck,
    badge: "BEST SELLER",
    rating: "5.0",
    price: "AI",
    classes: "Learning & practice",
    students: "Unlimited",
  },
];

export default function PromptStudioPage() {
  return (
    <main className="min-h-screen bg-white ">
      <section className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="mt-20 text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl lg:text-[2.7rem]">
            What would you like to create?
          </h1>
        </div>

        {/* Studio Cards */}
        <div className="mx-auto mt-10 grid max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {studios.map((studio) => {
            const Icon = studio.icon;

            return (
              <Link
                key={studio.href}
                href={studio.href}
                className="group relative overflow-hidden rounded-lg border border-border/70 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                {/* Image */}
                <div className="relative h-51.25 overflow-hidden">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{
                      backgroundImage: `url("${studio.image}")`,
                    }}
                  />
                  {/* Arrow */}
                  <div className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-white/95 text-foreground shadow-sm backdrop-blur transition-all duration-200 group-hover:bg-foreground group-hover:text-background">
                    <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </div>

                </div>

                {/* Card Content */}
                <div className="p-5 pt-7">
                  <h2 className="text-[21px] font-bold leading-tight tracking-[-0.03em] text-foreground">
                    {studio.label}
                  </h2>

                  <p className="mt-2 min-h-10.5 text-sm leading-5.5 text-muted-foreground">
                    {studio.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Previous Creations */}
        <div className="mx-auto mt-8 flex justify-center">
          <Link
            href="/dashboard/library"
            className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <span>View your previous creations</span>
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </section>
    </main>
  );
}