import { LessonForm } from "@/app/_components/LessonForm";
import { adminGetLesson } from "@/app/actions/admin-get-lesson";


type Params = Promise<{
    courseId: string;
    chapterId: string;
    lessonId: string;
}>;

export default async function LessonIdPage({params}: {params: Params}){
    const {chapterId, courseId, lessonId} = await params;
    const lesson = await adminGetLesson(lessonId);

    return (
        <LessonForm data={lesson} chapterId={chapterId} courseId={courseId}/>
    )
}