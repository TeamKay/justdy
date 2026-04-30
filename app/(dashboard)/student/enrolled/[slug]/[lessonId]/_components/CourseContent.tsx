"use client";

import { tryCatch } from "@/hooks/try-catch";
import { useConstructUrl } from "@/hooks/use-construct-url";
import { BookIcon, CheckCircle } from "lucide-react";
import { useTransition } from "react";
import { markLessonComplete } from "../actions";
import { toast } from "sonner";
import { useConfetti } from "@/hooks/use-confetti";
import { LessonContentType } from "@/app/actions/get-lesson-content";
import { Button } from "@/app/_components/ui/button";
import { RenderDescription } from "@/app/_components/rich-text-editor/RenderDescription";

interface iAppProps {
    data: LessonContentType
}

export function CourseContent({data}: iAppProps){
    const [pending, startTransition] = useTransition();
    const {triggerConfetti} = useConfetti();

    function VideoPlayer({thumbnailKey, videoKey}: { thumbnailKey: string; videoKey: string;}){
        const videoUrl = useConstructUrl(videoKey);
        const thumbnailUrl = useConstructUrl(thumbnailKey);

        if(!videoKey){
            return (
                <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center">
                <BookIcon className="size-16 text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">This lesson does not have a video yet! </p>
            </div>
            );
        }

        return (
            <div className="aspect-video bg-black rounded-lg relative overflow-hidden">
                <video src={videoUrl} className="w-full h-full object-cover" controls poster={thumbnailUrl} />
            </div>
        )
    }

  function onSubmit(){
        startTransition(async()=>{
            const {data: result, error} = await tryCatch(markLessonComplete(data.id, data.chapter.course.slug));

            if (error) {
                toast.error("An unexpected error occurred.");
                return;
            }

            if(result.status === 'success'){
                toast.success(result.message);
                triggerConfetti();
            } else if(result.status === 'error'){
                toast.error(result.message);
            }
        });
    }

return (
    <div className="flex flex-col h-full bg-background pl-6">
        <VideoPlayer 
           thumbnailKey={data.thumbnailKey ?? ""} 
           videoKey={data.videoKey ?? ''}/>

        <div className="py-4 border-b">
            {data.lessonProgress.length > 0 ? (
                <Button variant="outline" className="bg-green-500/10 text-green-500 hover:text-green-600">
                    <CheckCircle className="size-4 mr-2 text-green-500" />
                    Completed
                </Button>
            ): (
                <Button variant="outline" onClick={onSubmit} disabled={pending}>
                <CheckCircle className="size-4 mr-2 text-green-500"/>
                Mark as Complete
            </Button>
            )}
        </div>


        <div className="space-y-3 pt-3">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{data.title}</h1>

            {data.description && (
                <RenderDescription json={JSON.parse(data.description)} />
            )}
        </div>
    </div>
)
}