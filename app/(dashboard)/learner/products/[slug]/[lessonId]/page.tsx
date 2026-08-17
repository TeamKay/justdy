import { getLessonContent } from "@/app/actions/manage-get-lesson-content";
import { CourseContent } from "../../_components/CourseContent";

interface LessonPageProps {
  params: Promise<{
    slug: string;
    lessonId: string;
  }>;
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { lessonId } = await params;

  const lesson = await getLessonContent(lessonId);

  return <CourseContent data={lesson} />;
}
