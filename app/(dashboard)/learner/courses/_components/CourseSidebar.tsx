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

interface IAppProps {
  course: CourseSidebarDataType["course"];
}

export function CourseSidebar({ course }: IAppProps) {
  const pathname = usePathname();

  // ==========================================================
  // CURRENT LESSON
  // ==========================================================

  const currentLessonId = pathname.split("/").pop();

  // ==========================================================
  // COURSE PROGRESS
  // ==========================================================

  const { completedLessons, totalLessons, progressPercentage } =
    useCourseProgress({
      courseData: course,
    });

  // ==========================================================
  // CHAPTERS
  // ==========================================================

  const chapters = course.chapters ?? [];

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="flex h-full flex-col">
      {/* ====================================================== */}
      {/* COURSE HEADER */}
      {/* ====================================================== */}

      <div className="border-b border-border pb-4 pr-4">
        <div className="mb-3 flex items-center gap-3">
          {/* COURSE ICON */}

          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Play className="size-5 text-primary" />
          </div>

          {/* COURSE INFORMATION */}

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold leading-tight">
              {course.title}
            </h1>

            <p className="mt-1 truncate text-xs text-muted-foreground">
              {course.category}
            </p>
          </div>
        </div>

        {/* ================================================== */}
        {/* PROGRESS */}
        {/* ================================================== */}

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>

            <span className="font-medium">
              {completedLessons}/{totalLessons} lessons
            </span>
          </div>

          <Progress value={progressPercentage} className="h-1.5" />

          <p className="text-xs text-muted-foreground">
            {progressPercentage}% complete
          </p>
        </div>
      </div>

      {/* ====================================================== */}
      {/* CHAPTERS */}
      {/* ====================================================== */}

      <div className="space-y-3 py-4 pr-4">
        {chapters.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-4 text-center">
            <p className="text-sm text-muted-foreground">
              No chapters available yet.
            </p>
          </div>
        ) : (
          chapters.map((chapter, index) => (
            <Collapsible key={chapter.id} defaultOpen={index === 0}>
              {/* ================================================= */}
              {/* CHAPTER HEADER */}
              {/* ================================================= */}

              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  className="
                    flex
                    h-auto
                    w-full
                    items-center
                    gap-2
                    p-3
                  "
                >
                  {/* CHEVRON */}

                  <div className="shrink-0">
                    <ChevronDown className="size-4 text-primary" />
                  </div>

                  {/* CHAPTER INFORMATION */}

                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-semibold text-muted-foreground">
                      {chapter.position} : {chapter.title}
                    </p>

                    <p className="truncate text-[10px] font-medium text-muted-foreground">
                      {chapter.lessons.length}{" "}
                      {chapter.lessons.length === 1 ? "lesson" : "lessons"}
                    </p>
                  </div>
                </Button>
              </CollapsibleTrigger>

              {/* ================================================= */}
              {/* LESSONS */}
              {/* ================================================= */}

              <CollapsibleContent className="mt-3 space-y-3 border-l-2 pl-6">
                {chapter.lessons.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No lessons available.
                  </p>
                ) : (
                  chapter.lessons.map((lesson) => {
                    const isCompleted =
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
                        completed={isCompleted}
                      />
                    );
                  })
                )}
              </CollapsibleContent>
            </Collapsible>
          ))
        )}
      </div>
    </div>
  );
}
