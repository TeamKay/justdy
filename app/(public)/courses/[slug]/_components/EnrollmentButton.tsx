"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { enrollInCourseAction } from "@/app/actions/enroll-in-course-button";
import { Button } from "@/app/_components/ui/button";


export function EnrollmentButton({ courseId }: { courseId: string }) {
  const [pending, startTransition] = useTransition();

  function onSubmit() {
  startTransition(async () => {
    await enrollInCourseAction(courseId);
  });
}

  return (
    <Button onClick={onSubmit} disabled={pending} className="w-full bg-[#857938] text-white hover:bg-[#857000]">
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Loading...
        </>
      ) : (
        "Enroll Now"
      )}
    </Button>
  );
}
