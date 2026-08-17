"use client";

import { useMemo } from "react";

interface LessonProgress {
  id: string;
  completed: boolean;
  lessonId: string;
}

interface Lesson {
  id: string;
  title?: string | null;
  description?: string | null;
  thumbnailKey?: string | null;
  videoKey?: string | null;
  position?: number;
  lessonProgress: LessonProgress[];
}

interface Chapter {
  id: string;
  title?: string | null;
  position?: number;
  lessons: Lesson[];
}

interface CourseData {
  id: string;
  title: string;
  description?: string | null;
  fileKey?: string | null;
  category?: string | null;
  duration?: number | null;
  slug: string;
  imageKey?: string | null;
  chapters: Chapter[];
}

interface CourseProgressResult {
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
}

interface IAppProps {
  courseData: CourseData;
}

export function useCourseProgress({
  courseData,
}: IAppProps): CourseProgressResult {
  return useMemo(() => {
    let totalLessons = 0;
    let completedLessons = 0;

    // ----------------------------------------------------------
    // SAFETY CHECK
    // ----------------------------------------------------------

    if (!courseData?.chapters) {
      return {
        totalLessons: 0,
        completedLessons: 0,
        progressPercentage: 0,
      };
    }

    // ----------------------------------------------------------
    // CALCULATE LESSON PROGRESS
    // ----------------------------------------------------------

    courseData.chapters.forEach((chapter) => {
      if (!chapter?.lessons) {
        return;
      }

      chapter.lessons.forEach((lesson) => {
        totalLessons++;

        const isCompleted =
          lesson.lessonProgress?.some(
            (progress) =>
              progress.lessonId === lesson.id && progress.completed === true,
          ) ?? false;

        if (isCompleted) {
          completedLessons++;
        }
      });
    });

    // ----------------------------------------------------------
    // CALCULATE PERCENTAGE
    // ----------------------------------------------------------

    const progressPercentage =
      totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;

    // ----------------------------------------------------------
    // RETURN
    // ----------------------------------------------------------

    return {
      totalLessons,
      completedLessons,
      progressPercentage,
    };
  }, [courseData]);
}
