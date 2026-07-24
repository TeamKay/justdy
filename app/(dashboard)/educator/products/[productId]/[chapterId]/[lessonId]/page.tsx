import { LessonForm } from "@/app/_components/LessonForm";
import { educatorGetLesson } from "@/app/actions/educator-get-lesson";

type Params = Promise<{
  productId: string;
  chapterId: string;
  lessonId: string;
}>;

export default async function LessonIdPage({ params }: { params: Params }) {
  const { productId, chapterId, lessonId } = await params;
  const lesson = await educatorGetLesson(lessonId);

  return (
    <LessonForm data={lesson} chapterId={chapterId} productId={productId} />
  );
}
