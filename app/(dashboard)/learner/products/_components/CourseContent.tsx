"use client";

import { tryCatch } from "@/hooks/try-catch";
import { BookOpen, CheckCircle } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { useConfetti } from "@/hooks/use-confetti";
import { LessonContentType } from "@/app/actions/manage-get-lesson-content";
import { Button } from "@/app/_components/ui/button";
import { RenderDescription } from "@/app/_components/rich-text-editor/RenderDescription";
import { markLessonComplete } from "../[slug]/[lessonId]/actions";

interface CourseContentProps {
  data: LessonContentType;
}

function getUploadThingUrl(key?: string | null) {
  if (!key) {
    return undefined;
  }

  if (key.startsWith("http://") || key.startsWith("https://")) {
    return key;
  }

  return `https://utfs.io/f/${key}`;
}

function VideoPlayer({
  thumbnailKey,
  videoKey,
}: {
  thumbnailKey?: string | null;
  videoKey?: string | null;
}) {
  const videoUrl = getUploadThingUrl(videoKey);
  const thumbnailUrl = getUploadThingUrl(thumbnailKey);

  if (!videoUrl) {
    return (
      <div className="flex aspect-video flex-col items-center justify-center rounded-2xl border bg-muted">
        <BookOpen className="mb-4 size-14 text-primary" />

        <p className="text-sm text-muted-foreground">
          This lesson does not have a video yet.
        </p>
      </div>
    );
  }

  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl bg-black shadow-sm">
      <video
        src={videoUrl}
        poster={thumbnailUrl}
        className="h-full w-full object-cover"
        controls
        playsInline
      />
    </div>
  );
}

export function CourseContent({ data }: CourseContentProps) {
  const [pending, startTransition] = useTransition();

  const { triggerConfetti } = useConfetti();

  const isCompleted =
    data.lessonProgress?.some(
      (progress) => progress.lessonId === data.id && progress.completed,
    ) ?? false;

  function onSubmit() {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(
        markLessonComplete(data.id, data.chapter.product.slug),
      );

      if (error) {
        toast.error("An unexpected error occurred.");
        return;
      }

      if (result.status === "success") {
        toast.success(result.message);
        triggerConfetti();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* VIDEO */}

      <VideoPlayer thumbnailKey={data.thumbnailKey} videoKey={data.videoKey} />

      {/* LESSON HEADER */}

      <div className="border-b border-border pb-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-primary">
              Lesson {data.position}
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              {data.title}
            </h1>
          </div>

          {isCompleted ? (
            <Button
              variant="outline"
              className="shrink-0 border-green-200 bg-green-50 text-green-700 hover:bg-green-50 dark:border-green-900 dark:bg-green-950/30 dark:text-green-400"
            >
              <CheckCircle className="mr-2 size-4" />
              Completed
            </Button>
          ) : (
            <Button onClick={onSubmit} disabled={pending} className="shrink-0">
              <CheckCircle className="mr-2 size-4" />

              {pending ? "Saving..." : "Mark Lesson Complete"}
            </Button>
          )}
        </div>
      </div>

      {/* DESCRIPTION */}

      {data.description && (
        <div
          className="
            rounded-2xl
            border
            border-border
            bg-card
            p-5
            sm:p-7
          "
        >
          <RenderDescription json={parseLessonDescription(data.description)} />
        </div>
      )}
    </div>
  );
}

function parseLessonDescription(description: string) {
  try {
    return JSON.parse(description);
  } catch {
    return {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: description.replace(/<[^>]*>/g, ""),
            },
          ],
        },
      ],
    };
  }
}
