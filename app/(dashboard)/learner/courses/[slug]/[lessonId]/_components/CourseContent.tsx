"use client";

import { tryCatch } from "@/hooks/try-catch";
import { BookIcon, CheckCircle } from "lucide-react";
import { useTransition } from "react";
import { markLessonComplete } from "../actions";
import { toast } from "sonner";
import { useConfetti } from "@/hooks/use-confetti";
import { LessonContentType } from "@/app/actions/manage-get-lesson-content";
import { Button } from "@/app/_components/ui/button";

interface IAppProps {
  data: LessonContentType;
}

// ==========================================================
// UPLOADTHING URL HELPER
// ==========================================================

function getUploadThingUrl(key?: string | null): string | undefined {
  if (!key) {
    return undefined;
  }

  if (key.startsWith("http://") || key.startsWith("https://")) {
    return key;
  }

  return `https://utfs.io/f/${key}`;
}

// ==========================================================
// VIDEO PLAYER
// ==========================================================

function VideoPlayer({
  thumbnailKey,
  videoKey,
}: {
  thumbnailKey?: string | null;
  videoKey?: string | null;
}) {
  const videoUrl = getUploadThingUrl(videoKey);
  const thumbnailUrl = getUploadThingUrl(thumbnailKey);

  // ========================================================
  // NO VIDEO
  // ========================================================

  if (!videoUrl) {
    return (
      <div className="flex aspect-video flex-col items-center justify-center rounded-lg bg-muted">
        <BookIcon className="mx-auto mb-4 size-16 text-primary" />

        <p className="text-muted-foreground">
          This lesson does not have a video yet!
        </p>
      </div>
    );
  }

  // ========================================================
  // VIDEO
  // ========================================================

  return (
    <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
      <video
        src={videoUrl}
        className="h-full w-full object-cover"
        controls
        preload="metadata"
        poster={thumbnailUrl}
      >
        Your browser does not support the video element.
      </video>
    </div>
  );
}

// ==========================================================
// LESSON DESCRIPTION
// ==========================================================

function LessonDescription({ description }: { description?: string | null }) {
  if (!description) {
    return null;
  }

  return (
    <div
      className="
        text-base
        leading-7
        text-muted-foreground

        [&_p]:mb-4
        [&_p:last-child]:mb-0

        [&_strong]:font-semibold
        [&_strong]:text-foreground

        [&_b]:font-semibold
        [&_b]:text-foreground

        [&_em]:italic

        [&_ul]:mb-4
        [&_ul]:ml-6
        [&_ul]:list-disc

        [&_ol]:mb-4
        [&_ol]:ml-6
        [&_ol]:list-decimal

        [&_li]:mb-1

        [&_h1]:mb-4
        [&_h1]:text-2xl
        [&_h1]:font-bold
        [&_h1]:text-foreground

        [&_h2]:mb-3
        [&_h2]:mt-6
        [&_h2]:text-xl
        [&_h2]:font-bold
        [&_h2]:text-foreground

        [&_h3]:mb-2
        [&_h3]:mt-5
        [&_h3]:text-lg
        [&_h3]:font-semibold
        [&_h3]:text-foreground

        [&_a]:text-primary
        [&_a]:underline
        [&_a]:underline-offset-2
      "
      dangerouslySetInnerHTML={{
        __html: description,
      }}
    />
  );
}

// ==========================================================
// COURSE CONTENT
// ==========================================================

export function CourseContent({ data }: IAppProps) {
  const [pending, startTransition] = useTransition();

  const { triggerConfetti } = useConfetti();

  // ========================================================
  // MARK LESSON COMPLETE
  // ========================================================

  function onSubmit() {
    startTransition(async () => {
      // ----------------------------------------------------
      // Current schema:
      //
      // lesson
      //   └── chapter
      //        └── product
      //             └── slug
      // ----------------------------------------------------

      const slug = data.chapter?.product?.slug;

      if (!slug) {
        toast.error("Unable to determine the course.");

        return;
      }

      const { data: result, error } = await tryCatch(
        markLessonComplete(data.id, slug),
      );

      if (error) {
        console.error("MARK LESSON COMPLETE ERROR:", error);

        toast.error("An unexpected error occurred.");

        return;
      }

      if (result.status === "success") {
        toast.success(result.message);

        triggerConfetti();
      } else if (result.status === "error") {
        toast.error(result.message);
      }
    });
  }

  // ========================================================
  // CHECK COMPLETION
  // ========================================================

  const isCompleted =
    data.lessonProgress?.some(
      (progress) => progress.lessonId === data.id && progress.completed,
    ) ?? false;

  // ========================================================
  // RENDER
  // ========================================================

  return (
    <div className="flex h-full flex-col bg-background pl-6">
      {/* ================================================== */}
      {/* VIDEO */}
      {/* ================================================== */}

      <VideoPlayer thumbnailKey={data.thumbnailKey} videoKey={data.videoKey} />

      {/* ================================================== */}
      {/* COMPLETE BUTTON */}
      {/* ================================================== */}

      <div className="border-b py-4">
        {isCompleted ? (
          <Button
            variant="outline"
            className="
              bg-green-500/10
              text-green-600
              hover:bg-green-500/20
              hover:text-green-700
            "
            disabled
          >
            <CheckCircle className="mr-2 size-4 text-green-500" />
            Completed
          </Button>
        ) : (
          <Button variant="outline" onClick={onSubmit} disabled={pending}>
            <CheckCircle className="mr-2 size-4 text-green-500" />

            {pending ? "Saving..." : "Mark as Complete"}
          </Button>
        )}
      </div>

      {/* ================================================== */}
      {/* LESSON CONTENT */}
      {/* ================================================== */}

      <div className="space-y-5 pt-5 pb-10">
        {/* LESSON TITLE */}

        <h1
          className="
            text-3xl
            font-bold
            tracking-tight
            text-foreground
          "
        >
          {data.title}
        </h1>

        {/* LESSON DESCRIPTION */}

        <LessonDescription description={data.description} />
      </div>
    </div>
  );
}

// "use client";

// import { tryCatch } from "@/hooks/try-catch";

// import { BookIcon, CheckCircle } from "lucide-react";
// import { useTransition } from "react";
// import { markLessonComplete } from "../actions";
// import { toast } from "sonner";
// import { useConfetti } from "@/hooks/use-confetti";
// import { LessonContentType } from "@/app/actions/get-lesson-content";
// import { Button } from "@/app/_components/ui/button";
// import { RenderDescription } from "@/app/_components/rich-text-editor/RenderDescription";

// interface iAppProps {
//     data: LessonContentType
// }

// export function CourseContent({data}: iAppProps){
//     const [pending, startTransition] = useTransition();
//     const {triggerConfetti} = useConfetti();

//     function VideoPlayer({thumbnailKey, videoKey}: { thumbnailKey: string; videoKey: string;}){
//         const videoUrl = useConstructUrl(videoKey);
//         const thumbnailUrl = useConstructUrl(thumbnailKey);

//         if(!videoKey){
//             return (
//                 <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center">
//                 <BookIcon className="size-16 text-primary mx-auto mb-4" />
//                 <p className="text-muted-foreground">This lesson does not have a video yet! </p>
//             </div>
//             );
//         }

//         return (
//             <div className="aspect-video bg-black rounded-lg relative overflow-hidden">
//                 <video src={videoUrl} className="w-full h-full object-cover" controls poster={thumbnailUrl} />
//             </div>
//         )
//     }

//   function onSubmit(){
//         startTransition(async()=>{
//             const {data: result, error} = await tryCatch(markLessonComplete(data.id, data.chapter.course.slug));

//             if (error) {
//                 toast.error("An unexpected error occurred.");
//                 return;
//             }

//             if(result.status === 'success'){
//                 toast.success(result.message);
//                 triggerConfetti();
//             } else if(result.status === 'error'){
//                 toast.error(result.message);
//             }
//         });
//     }

// return (
//     <div className="flex flex-col h-full bg-background pl-6">
//         <VideoPlayer
//            thumbnailKey={data.thumbnailKey ?? ""}
//            videoKey={data.videoKey ?? ''}/>

//         <div className="py-4 border-b">
//             {data.lessonProgress.length > 0 ? (
//                 <Button variant="outline" className="bg-green-500/10 text-green-500 hover:text-green-600">
//                     <CheckCircle className="size-4 mr-2 text-green-500" />
//                     Completed
//                 </Button>
//             ): (
//                 <Button variant="outline" onClick={onSubmit} disabled={pending}>
//                 <CheckCircle className="size-4 mr-2 text-green-500"/>
//                 Mark as Complete
//             </Button>
//             )}
//         </div>

//         <div className="space-y-3 pt-3">
//             <h1 className="text-3xl font-bold tracking-tight text-foreground">{data.title}</h1>

//             {data.description && (
//                 <RenderDescription json={JSON.parse(data.description)} />
//             )}
//         </div>
//     </div>
// )
// }
