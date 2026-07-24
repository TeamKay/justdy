"use client";

import { useState, useTransition, useMemo } from "react";
import { Button } from "@/app/_components/ui/button";
import { Send, Loader2, AlertCircle } from "lucide-react";
import { useConfetti } from "@/hooks/use-confetti";
import { toast } from "sonner";
import { submitProductForReview } from "../actions/submit-for-review";

// Define shape of chapters and lessons for type-safety
interface Lesson {
  id: string;
}

interface Chapter {
  id: string;
  lessons?: Lesson[];
}

interface SubmitButtonProps {
  id: string;
  status: string;
  isReadyForReview?: boolean;
  // 1. Accept the course's chapters as a prop
  chapters?: Chapter[];
}

export function SubmitForReviewButton({
  id,
  status,
  isReadyForReview = true,
  chapters = [], // Default to empty array
}: SubmitButtonProps) {
  const [isPending, startTransition] = useTransition();
  const { triggerConfetti } = useConfetti();
  const [error, setError] = useState<string | null>(null);

  const isAlreadySubmitted = status === "Pending" || status === "pending";

  // 2. Validate course structure: At least 1 chapter AND at least 1 lesson total across chapters
  const { hasChapters, hasLessons, isStructureValid } = useMemo(() => {
    const hasChapters = chapters.length > 0;
    const hasLessons = chapters.some(
      (chapter) => chapter.lessons && chapter.lessons.length > 0,
    );

    return {
      hasChapters,
      hasLessons,
      isStructureValid: hasChapters && hasLessons,
    };
  }, [chapters]);

  // Determine if the button should be disabled
  const isDisabled =
    !isReadyForReview || !isStructureValid || isAlreadySubmitted || isPending;

  const handleSubmitting = () => {
    setError(null);
    startTransition(async () => {
      const result = await submitProductForReview(id);
      if (result.success) {
        toast.success("Product submitted for review!");
        triggerConfetti();
      } else {
        setError(result.error || "Failed to submit");
        toast.error(result.error || "Failed to submit");
      }
    });
  };

  // Helper to render the specific structural requirement message
  const getValidationMessage = () => {
    if (!hasChapters) {
      return "Add at least one chapter to submit.";
    }
    if (!hasLessons) {
      return "Add at least one lesson to submit.";
    }
    return null;
  };

  const validationMessage = getValidationMessage();

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        disabled={isDisabled}
        variant={isReadyForReview && isStructureValid ? "default" : "secondary"}
        className="font-semibold shadow-sm min-w-37.5"
        onClick={handleSubmitting}
      >
        {isPending ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : (
          <Send className="mr-2 size-4" />
        )}
        {isAlreadySubmitted
          ? "Under Review"
          : isPending
            ? "Submitting..."
            : "Submit for Review"}
      </Button>

      {/* 3. Display specific structure errors or server action errors */}
      {validationMessage && !isAlreadySubmitted && (
        <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
          <AlertCircle className="size-3 text-amber-500" /> {validationMessage}
        </span>
      )}
      {error && <p className="text-[10px] text-destructive mt-1">{error}</p>}
    </div>
  );
}
