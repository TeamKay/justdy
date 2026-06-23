"use client";

import { SubjectSchemaType, subjectSchema } from "@/lib/zodSchemas";
import { useForm, Resolver } from "react-hook-form";
import { ArrowLeft, Loader2, SendHorizonal } from "lucide-react";
import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { useConfetti } from "@/hooks/use-confetti";
import { updateSubject } from "@/app/actions/admin-subjects";

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

interface SubjectEditFormProps {
  subject: {
    id: string;
    name: string;
    description: string | null;
  };
}

export default function SubjectEditForm({ subject }: SubjectEditFormProps) {
  const router = useRouter();
  const { triggerConfetti } = useConfetti();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  const form = useForm<SubjectSchemaType>({
    resolver: zodResolver(subjectSchema) as Resolver<SubjectSchemaType>,
    defaultValues: {
      name: subject.name,
      description: subject.description || "",
    },
  });

  async function handleProcess(values: SubjectSchemaType) {
    setIsSubmitting(true);
    setLoadingMessage("Saving changes...");

    try {
      const result = await updateSubject(subject.id, values);

      if (result.status === "success") {
        toast.success("Subject updated successfully!");
        triggerConfetti();
        router.push("/admin/subjects");
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Something went wrong",
      );
    } finally {
      setIsSubmitting(false);
      setLoadingMessage("");
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleProcess)}
        className="max-w-6xl mx-auto px-4 md:px-0 pb-20 pt-5 space-y-8"
      >
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/subjects"
              className={buttonVariants({
                variant: "secondary",
                size: "icon",
              })}
            >
              <ArrowLeft className="size-5" />
            </Link>

            <h1 className="text-3xl font-bold">Edit Subject</h1>
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin size-4" />
                {loadingMessage || "Processing..."}
              </div>
            ) : (
              <>
                <SendHorizonal className="mr-2 size-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        {/* MAIN STRUCTURAL LAYOUT */}
        <div className="grid grid-cols-1 gap-8">
          <Card>
            <CardContent className="pt-6 space-y-6">
              {/* SUBJECT NAME */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isSubmitting}
                        placeholder="e.g., Mathematics, Quantum Physics, Programming"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* FULL DESCRIPTION */}
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
            </CardContent>
          </Card>
        </div>
      </form>
    </Form>
  );
}
