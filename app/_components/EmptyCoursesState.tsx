import { Sparkles, BookOpen, Rocket } from "lucide-react";

export default function EmptyCoursesState() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      {/* Animated Icon Container */}
      <div className="relative mb-6">
        <div className="absolute inset-0 blur-2xl bg-[#857938]/20 rounded-full animate-pulse" />
        <div className="relative bg-[#857938]/10 p-6 rounded-full">
          <Rocket className="size-10 text-[#857938]" />
        </div>
      </div>

      {/* Heading */}
      <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
        Exciting Courses Coming Soon
      </h2>

      {/* Subtext */}
      <p className="mt-3 text-muted-foreground max-w-md">
        We&apos;re preparing high-quality learning experiences just for you. Our
        courses are currently being crafted and will be published very soon.
      </p>

      {/* Feature badges */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-sm">
          <BookOpen className="size-4" />
          Expert-led content
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-sm">
          <Sparkles className="size-4" />
          High-quality learning
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-sm">
          <Rocket className="size-4" />
          Launching soon
        </div>
      </div>

      {/* Call to action */}
      <div className="mt-8">
        <p className="text-sm text-muted-foreground">
          Stay tuned — something amazing is on the way 🚀
        </p>
      </div>
    </div>
  );
}
