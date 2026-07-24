"use client";

import { lessonSchema, LessonSchemaType } from "@/lib/zodSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Image as ImageIcon, Save } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/app/_components/ui/button";
import { Card, CardContent } from "@/app/_components/ui/card";
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
import { EducatorLessonType } from "../actions/educator-get-lesson";
import { Separator } from "@/app/_components/ui/separator";
import { tryCatch } from "@/hooks/try-catch";
import { useRouter } from "next/navigation";

interface iAppProps {
  data: EducatorLessonType;
  chapterId: string;
  productId: string;
}

export function LessonForm({ productId, chapterId, data }: iAppProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const form = useForm<LessonSchemaType>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      name: data.title,
      chapterId,
      productId,
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
        router.refresh();
      } else if (result.status === "error") {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="max-w-6xl w-full pt-5 mx-auto space-y-6">
      {/* Header Bar with Action Elements */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200/10">
        <div className="flex items-center gap-3">
          <Link
            className={buttonVariants({ variant: "ghost", size: "icon" })}
            href={`/dashboard/educator/products/${productId}/edit`}
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Lesson Configuration
            </h1>
          </div>
        </div>

        {/* Floating Top Save Button for rapid workflows */}
        <Button
          disabled={pending}
          onClick={form.handleSubmit(onSubmit, (errors) => {
            console.log("Form Validation Errors:", errors);
            toast.error("Please fix the validation errors in the form.");
          })}
          className="w-full sm:w-auto shadow-sm"
        >
          {pending ? (
            "Saving..."
          ) : (
            <>
              <Save className="size-4 mr-2" /> Save Lesson
            </>
          )}
        </Button>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start"
        >
          {/* Main Column: Textual Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-zinc-200/10 shadow-sm">
              <CardContent className="space-y-5">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lesson Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Introduction to State Management"
                          {...field}
                        />
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
                      <FormLabel>Lesson Description / Notes</FormLabel>
                      <FormControl>
                        <RichTextEditor field={field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Column: Media & Assets (Sticky) */}
          <div className="space-y-6 lg:sticky lg:top-6">
            <Card className="border-zinc-200/10 shadow-sm bg-zinc-50/50 dark:bg-zinc-900/30">
              <CardContent className="space-y-6">
                {/* Video Uploader Container */}
                <FormField
                  control={form.control}
                  name="videoKey"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Lecture Video
                      </FormLabel>
                      <FormControl>
                        <VideoUploader
                          onChange={field.onChange}
                          value={field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator className="bg-zinc-200/10" />

                {/* Thumbnail Uploader Container */}
                <FormField
                  control={form.control}
                  name="thumbnailKey"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <ImageIcon className="size-3.5" /> Cover Thumbnail
                      </FormLabel>
                      <FormControl>
                        <ImageUploader
                          onChange={field.onChange}
                          value={field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </form>
      </Form>
    </div>
  );
}
