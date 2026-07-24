"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { enrollInCourseAction } from "@/app/actions/enroll-in-course-button";
import { Button } from "@/app/_components/ui/button";

interface EnrollmentButtonProps {
  courseId: string;
  buttonText?: string;
}

export function EnrollmentButton({
  courseId,
  buttonText = "Enroll Now",
}: EnrollmentButtonProps) {
  const [pending, startTransition] = useTransition();

  function onSubmit() {
    startTransition(async () => {
      await enrollInCourseAction(courseId);
    });
  }

  // Set contextual loading state based on button text
  const loadingText =
    buttonText === "Enroll Now" ? "Enrolling..." : "Processing...";

  return (
    <Button
      onClick={onSubmit}
      disabled={pending}
      className="w-full bg-[#857938] text-white hover:bg-[#857000] flex items-center justify-center gap-2"
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          <span>{loadingText}</span>
        </>
      ) : (
        <span>{buttonText}</span>
      )}
    </Button>
  );
}

// "use client";

// import { useTransition } from "react";
// import { Loader2 } from "lucide-react";
// import { enrollInCourseAction } from "@/app/actions/enroll-in-course-button";
// import { Button } from "@/app/_components/ui/button";

// interface EnrollmentButtonProps {
//   courseId: string;
// }

// export function EnrollmentButton({ courseId }: EnrollmentButtonProps) {
//   const [pending, startTransition] = useTransition();

//   function onSubmit() {
//     startTransition(async () => {
//       await enrollInCourseAction(courseId);
//     });
//   }

//   return (
//     <Button
//       onClick={onSubmit}
//       disabled={pending}
//       className="w-full bg-[#857938] text-white hover:bg-[#857000] flex items-center justify-center gap-2"
//     >
//       {pending ? (
//         <>
//           <Loader2 className="size-4 animate-spin" />
//           <span>Enrolling...</span>
//         </>
//       ) : (
//         <span>Enroll Now</span>
//       )}
//     </Button>
//   );
// }
