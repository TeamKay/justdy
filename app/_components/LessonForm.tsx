"use client";

import { AdminLessonType } from "@/app/actions/admin-get-lesson";
import { tryCatch } from "@/hooks/try-catch";
import { lessonSchema, LessonSchemaType } from "@/lib/zodSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/app/_components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/_components/ui/form";
import { Input } from "@/app/_components/ui/input";
import { RichTextEditor } from "@/app/_components/rich-text-editor/Editor";
import { updateLesson } from "../actions/update-lesson";
import { ImageUploader, VideoUploader } from "./file-uploader/Uploader";

interface iAppProps {
  data: AdminLessonType;
  chapterId: string;
  courseId: string;
}

export function LessonForm({ chapterId, data, courseId }: iAppProps) {
  const [pending, startTransition] = useTransition();
  const form = useForm<LessonSchemaType>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      name: data.title,
      chapterId: chapterId,
      courseId: courseId,
      description: data.description ?? undefined,
      videoKey: data.videoKey ?? undefined,
      thumbnailKey: data.thumbnailKey ?? undefined,
    },
  });

  async function onSubmit(values: LessonSchemaType) {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(
        updateLesson(values, data.id),
      );

      if (error) {
        toast.error("An unexpected error occurred.");
        return;
      }

      if (result.status === "success") {
        toast.success(result.message);
      } else if (result.status === "error") {
        toast.error(result.message);
      }
    });
  }

  return (
    <div>
      <Link
        className={buttonVariants({ variant: "outline", className: "mb-6" })}
        href={`/dashboard/educator/courses/${courseId}/edit`}
      >
        <ArrowLeft className="size-4" />
        <span>Go Back</span>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Lesson Setup</CardTitle>
          <CardDescription>
            Setup the video and description of the lesson
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lesson Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Lesson Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <RichTextEditor field={field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="thumbnailKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thumbnail Image</FormLabel>
                    <FormControl>
                      {/* ✅ FIX: Cast string value safely to unknown then to File to satisfy component props without using 'any' */}
                      <ImageUploader
                        onChange={field.onChange}
                        value={field.value as unknown as File}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="videoKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Video File</FormLabel>
                    <FormControl>
                      {/* ✅ FIX: Cast string value safely to unknown then to File to satisfy component props without using 'any' */}
                      <VideoUploader
                        onChange={field.onChange}
                        value={field.value as unknown as File}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button disabled={pending} type="submit">
                {pending ? "Saving..." : "Save Lesson"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

// "use client"

// import { AdminLessonType } from "@/app/actions/admin-get-lesson";
// import { tryCatch } from "@/hooks/try-catch";
// import { lessonSchema, LessonSchemaType } from "@/lib/zodSchemas";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { ArrowLeft } from "lucide-react";
// import Link from "next/link";
// import { useTransition } from "react";
// import { useForm } from "react-hook-form";
// import { toast } from "sonner";
// import { Button, buttonVariants } from "@/app/_components/ui/button";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/_components/ui/card";
// import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/app/_components/ui/form";
// import { Input } from "@/app/_components/ui/input";
// import { RichTextEditor } from "@/app/_components/rich-text-editor/Editor";
// import { Uploader } from "@/app/_components/file-uploader/Uploader";
// import { updateLesson } from "../actions/update-lesson";

// interface iAppProps {
//     data: AdminLessonType;
//     chapterId: string;
//     courseId: string;
// }

// export function LessonForm({chapterId, data, courseId}: iAppProps){
//     const [pending, startTransition] = useTransition();
//       const form = useForm<LessonSchemaType>({
//             resolver: zodResolver(lessonSchema),
//             defaultValues: {
//                 name: data.title,
//                 chapterId: chapterId,
//                 courseId: courseId,
//                 description: data.description ?? undefined,
//                 videoKey: data.videoKey ?? undefined,
//                 thumbnailKey: data.thumbnailKey ?? undefined
//             },
//         });

//         async function onSubmit(values: LessonSchemaType){
//              startTransition(async()=>{
//             const {data: result, error} = await tryCatch(updateLesson(values, data.id));

//             if (error) {
//                 toast.error("An unexpected error occurred.");
//                 return;
//             }

//             if(result.status === 'success'){
//                 toast.success(result.message);
//             } else if(result.status === 'error'){
//                 toast.error(result.message);
//             }
//         });
//         }

//     return(
//         <div>
//             <Link
//             className={buttonVariants({variant: "outline", className: "mb-6"})} href={`/dashboard/educator/courses/${courseId}/edit`}>
//             <ArrowLeft className="size-4" />
//             <span>Go Back</span>
//             </Link>

//             <Card>
//                 <CardHeader>
//                     <CardTitle>Lesson Setup</CardTitle>
//                     <CardDescription>Setup the video and description ofthe lesson</CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                     <Form {...form}>
//                         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

//                             <FormField
//                                control={form.control}
//                                name="name"
//                                render={({field}) => (
//                                 <FormItem>
//                                     <FormLabel>Lesson Name</FormLabel>
//                                     <FormControl>
//                                         <Input placeholder="Lesson Name" {...field}/>
//                                     </FormControl>
//                                     <FormMessage/>
//                                 </FormItem>
//                                )}
//                                />

//                                <FormField
//                                control={form.control}
//                                name="description"
//                                render={({field}) => (
//                                 <FormItem>
//                                     <FormLabel>Description</FormLabel>
//                                     <FormControl>
//                                         <RichTextEditor field={field}/>
//                                     </FormControl>
//                                     <FormMessage/>
//                                 </FormItem>
//                                )}
//                                />

//                                <FormField
//                                control={form.control}
//                                name="thumbnailKey"
//                                render={({field}) => (
//                                 <FormItem>
//                                     <FormLabel>Thumbnail Image</FormLabel>
//                                     <FormControl>
//                                         <Uploader onChange={field.onChange} value={field.value} fileTypeAccepted="image"/>
//                                     </FormControl>
//                                     <FormMessage/>
//                                 </FormItem>
//                                )}
//                                />

//                                <FormField
//                                control={form.control}
//                                name="videoKey"
//                                render={({field}) => (
//                                 <FormItem>
//                                     <FormLabel>Video File</FormLabel>
//                                     <FormControl>
//                                         <Uploader onChange={field.onChange} value={field.value} fileTypeAccepted="video"/>
//                                     </FormControl>
//                                     <FormMessage/>
//                                 </FormItem>
//                                )}
//                                />

//                                <Button disabled={pending} type="submit">
//                                 {pending ? 'Saving...' : 'Save Lesson'}
//                                </Button>
//                         </form>
//                     </Form>
//                 </CardContent>
//             </Card>
//         </div>
//     )
// }
