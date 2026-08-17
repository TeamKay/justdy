"use client";

import { ChevronDown, Play } from "lucide-react";
import { LessonItem } from "./LessonItem";
import { usePathname } from "next/navigation";
import { useCourseProgress } from "@/hooks/use-course-progress";
import { CourseSidebarDataType } from "@/app/actions/manage-get-course-sidebar-data";
import { Progress } from "@/app/_components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/app/_components/ui/collapsible";
import { Button } from "@/app/_components/ui/button";

interface CourseSidebarProps {
  course: CourseSidebarDataType["course"];
}

export function CourseSidebar({ course }: CourseSidebarProps) {
  const pathname = usePathname();

  const currentLessonId = pathname.split("/").pop();

  const { completedLessons, totalLessons, progressPercentage } =
    useCourseProgress({
      courseData: course,
    });

  const chapters = course.chapters ?? [];

  return (
    <div className="flex h-full flex-col">
      {/* ====================================================== */}
      {/* COURSE HEADER */}
      {/* ====================================================== */}

      <div className="border-b border-border pb-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Play className="size-5 text-primary" />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold">{course.title}</h1>

            <p className="mt-1 truncate text-xs text-muted-foreground">
              {course.category}
            </p>
          </div>
        </div>

        {/* PROGRESS */}

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Course progress</span>

            <span className="font-medium">{progressPercentage}%</span>
          </div>

          <Progress value={progressPercentage} className="h-1.5" />

          <p className="text-[11px] text-muted-foreground">
            {completedLessons} of {totalLessons} lessons completed
          </p>
        </div>
      </div>

      {/* ====================================================== */}
      {/* CHAPTERS */}
      {/* ====================================================== */}

      <div className="flex-1 space-y-3 overflow-y-auto py-5 pr-2">
        {chapters.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-5 text-center">
            <p className="text-sm text-muted-foreground">
              No chapters available yet.
            </p>
          </div>
        ) : (
          chapters.map((chapter, index) => (
            <Collapsible key={chapter.id} defaultOpen={index === 0}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  className="
                    flex
                    h-auto
                    w-full
                    items-center
                    gap-3
                    rounded-xl
                    p-3
                    text-left
                  "
                >
                  <ChevronDown className="size-4 shrink-0 text-primary" />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {chapter.position}. {chapter.title}
                    </p>

                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {chapter.lessons.length}{" "}
                      {chapter.lessons.length === 1 ? "lesson" : "lessons"}
                    </p>
                  </div>
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent className="mt-2 space-y-1 border-l-2 border-border pl-4">
                {chapter.lessons.map((lesson) => {
                  const completed =
                    lesson.lessonProgress?.some(
                      (progress) =>
                        progress.lessonId === lesson.id && progress.completed,
                    ) ?? false;

                  return (
                    <LessonItem
                      key={lesson.id}
                      lesson={lesson}
                      slug={course.slug}
                      isActive={currentLessonId === lesson.id}
                      completed={completed}
                    />
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          ))
        )}
      </div>
    </div>
  );
}
