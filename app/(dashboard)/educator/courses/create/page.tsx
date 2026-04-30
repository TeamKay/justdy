"use client";

import {
  courseCategories,
  courseLevels,
  courseSchema,
  CourseSchemaType,
} from "@/lib/zodSchemas";
import { ArrowLeft, Loader2, SendHorizonal } from "lucide-react"; // Added SendHorizonal
import Link from "next/link";
import { Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { tryCatch } from "@/hooks/try-catch";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useConfetti } from "@/hooks/use-confetti";
import slugify from "slugify";
import { Button, buttonVariants } from "@/app/_components/ui/button";
import {
  Card,
  CardContent,
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
import { Textarea } from "@/app/_components/ui/textarea";
import { RichTextEditor } from "@/app/_components/rich-text-editor/Editor";
import { Uploader } from "@/app/_components/file-uploader/Uploader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { FileText, Image as ImageIcon, Settings } from "lucide-react";
import { CreateCourse } from "@/app/actions/educator-create-course";

export default function CourseCreationPage() {
  const router = useRouter();
  const { triggerConfetti } = useConfetti();
  const [isSubmitting, setIsSubmitting] = useState<"Draft" | "Pending" | null>(
    null,
  );

  const form = useForm<CourseSchemaType>({
    resolver: zodResolver(courseSchema) as Resolver<CourseSchemaType>,
    defaultValues: {
      title: "",
      description: "",
      fileKey: "",
      price: 0,
      duration: 0,
      level: "Beginner",
      category: "Teaching & Academics",
      status: "Draft",
      slug: "",
      smallDescription: "",
    },
  });

  async function handleProcess(
    values: CourseSchemaType,
    targetStatus: "Draft" | "Pending",
  ) {
    // 2. Set the specific status to trigger the correct loader
    setIsSubmitting(targetStatus);

    try {
      // Update the form value manually before sending to Server Action
      const submissionData = { ...values, status: targetStatus };

      const { data: result, error } = await tryCatch(
        CreateCourse(submissionData),
      );

      if (error) {
        toast.error("An unexpected error occurred.");
        return;
      }

      if (result.status === "success") {
        toast.success(
          targetStatus === "Pending"
            ? "Course submitted for review!"
            : "Draft saved successfully!",
        );

        if (targetStatus === "Pending") triggerConfetti();

        form.reset();
        router.push("/educator/courses");
      } else if (result.status === "error") {
        toast.error(result.message);
      }
    } catch (error) {
      throw new Error("Something went wrong" + error);
    } finally {
      // 3. Always reset the loading state, even on error
      setIsSubmitting(null);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => e.preventDefault()}
        className="max-w-6xl mx-auto pb-20 pt-5"
      >
        {/* --- HEADER SECTION --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/educator/courses"
              className={buttonVariants({ variant: "secondary", size: "icon" })}
            >
              <ArrowLeft className="size-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Create New Course
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting !== null}
              onClick={form.handleSubmit((v) => handleProcess(v, "Draft"))}
            >
              {isSubmitting === "Draft" ? (
                <Loader2 className="animate-spin mr-2 size-4" />
              ) : null}
              Save Draft
            </Button>
            <Button
              type="button"
              className="bg-primary hover:bg-primary/90 min-w-40"
              disabled={isSubmitting !== null}
              onClick={form.handleSubmit((v) => handleProcess(v, "Pending"))}
            >
              {isSubmitting === "Pending" ? (
                <Loader2 className="animate-spin mr-2 size-4" />
              ) : (
                <SendHorizonal className="mr-2 size-4" />
              )}
              Submit for review
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* --- MAIN COLUMN --- */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="size-5 text-primary" />
                  Course Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-base">
                        Course Title
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="text-lg h-12 focus-visible:ring-primary"
                          placeholder="Enter a catchy title..."
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            form.setValue(
                              "slug",
                              slugify(e.target.value, { lower: true }),
                            );
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="smallDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">
                        Short Summary
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="A short hook to grab students' attention..."
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
                      <FormLabel className="font-semibold">
                        Full Course Description
                      </FormLabel>
                      <FormControl>
                        <div className="min-h-75 border rounded-md">
                          <RichTextEditor field={field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* --- SIDEBAR COLUMN --- */}
          <div className="space-y-6">
            {/* Status & Actions Card */}
            <Card className="shadow-sm border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Organization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      {/* Use field.value to ensure the UI stays in sync with the form state */}
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {courseCategories.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Difficulty Level</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Select difficulty level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {courseLevels.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Pricing & Logistics Card */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Settings className="size-4" /> Logistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Price"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (hrs)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Duration"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">
                        URL Slug (Auto)
                      </FormLabel>
                      <FormControl>
                        <Input
                          readOnly
                          className="bg-muted text-xs h-8"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Media Card */}
            <Card className="shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/50">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ImageIcon className="size-4" /> Thumbnail
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <FormField
                  control={form.control}
                  name="fileKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Uploader
                          fileTypeAccepted="image"
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
        </div>
      </form>
    </Form>
  );
}

// "use client";

// import { courseCategories, courseLevels, courseSchema, CourseSchemaType, courseStatus } from "@/lib/zodSchemas";
// import { ArrowLeft, Loader2, PlusIcon } from "lucide-react";
// import Link from "next/link";
// import { Resolver, useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod"
// import { useTransition } from "react";
// import { tryCatch } from "@/hooks/try-catch";
// import { CreateCourse } from "./actions";
// import { toast } from "sonner";
// import { useRouter } from "next/navigation";
// import { useConfetti } from "@/hooks/use-confetti";
// import slugify from "slugify";
// import { Button, buttonVariants } from "@/app/_components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
// import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/app/_components/ui/form";
// import { Input } from "@/app/_components/ui/input";
// import { Textarea } from "@/app/_components/ui/textarea";
// import { RichTextEditor } from "@/app/_components/rich-text-editor/Editor";
// import { Uploader } from "@/app/_components/file-uploader/Uploader";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/_components/ui/select";

// export default function CourseCreationPage(){
//     const [pending, startTransition] = useTransition();
//     const router = useRouter();
//     const {triggerConfetti} = useConfetti();

//     const form = useForm<CourseSchemaType>({
//         resolver: zodResolver(courseSchema) as Resolver<CourseSchemaType>,
//         defaultValues: {
//             title: "",
//             description: "",
//             fileKey: "",
//             price: 0,
//             duration: 0,
//             level: "Beginner",
//             category: "Teaching & Academics",
//             status: "Draft",
//             slug: "",
//             smallDescription: "",
//         },
//     });

//     function onSubmit(values: CourseSchemaType){
//         startTransition(async()=>{
//             const {data: result, error} = await tryCatch(CreateCourse(values));

//             if (error) {
//                 toast.error("An unexpected error occurred.");
//                 return;
//             }

//             if(result.status === 'success'){
//                 toast.success(result.message);
//                 triggerConfetti();
//                 form.reset();
//                 router.push('/dashboard/admin/courses');
//             } else if(result.status === 'error'){
//                 toast.error(result.message);
//             }
//         });
//     }

//     return (
//         <>
//         <div className="flex items-center gap-4">
//             <Link href="/dashboard/educator/courses" className={buttonVariants({
//                 variant: "outline",
//                 size: "icon"
//             })}>
//                 <ArrowLeft className="size-4" />

//             </Link>
//             <h1 className="text-2xl font-bold">Create Courses</h1>
//         </div>

//         <Card>
//             <CardHeader>
//                 <CardTitle>
//                     Provide Basic Information about the Course
//                 </CardTitle>
//             </CardHeader>
//             <CardContent>

//                 <Form {...form}>
//                     <form
//                        className="space-y-6"
//                        onSubmit={form.handleSubmit(onSubmit)}>

//                          <div className="flex gap-4 items-end">

//                             <FormField
//                             control={form.control}
//                             name="title"
//                             render={({ field }) => (
//                                 <FormItem className="w-full">
//                                 <FormLabel>Title</FormLabel>
//                                 <FormControl>
//                                     <Input
//                                     placeholder="Title"
//                                     {...field}
//                                     onChange={(e) => {
//                                         field.onChange(e); // keep react-hook-form change handling
//                                         const slug = slugify(e.target.value, { lower: true });
//                                         form.setValue("slug", slug, { shouldValidate: true });
//                                     }}
//                                     />
//                                 </FormControl>
//                                 <FormMessage />
//                                 </FormItem>
//                             )}
//                             />

//                             <FormField
//                             control={form.control}
//                             name="slug"
//                             render={({ field }) => (
//                                 <FormItem className="w-full">
//                                 <FormLabel>Slug</FormLabel>
//                                 <FormControl>
//                                     <Input placeholder="Slug" {...field} readOnly />
//                                 </FormControl>
//                                 </FormItem>
//                             )}
//                             />

//                             </div>

//                             <FormField
//                             control={form.control}
//                             name="smallDescription"
//                             render={({field})=>(
//                                 <FormItem className="w-full">
//                                     <FormLabel>Small Description</FormLabel>
//                                     <FormControl>
//                                         <Textarea
//                                            placeholder="Small Description"
//                                            className="min-h-30" {...field}/>
//                                     </FormControl>
//                                     <FormMessage />
//                                 </FormItem>
//                             )}
//                             />

//                             <FormField
//                             control={form.control}
//                             name="description"
//                             render={({field})=>(
//                                 <FormItem className="w-full">
//                                     <FormLabel>Description</FormLabel>
//                                     <FormControl>
//                                         <RichTextEditor field={field}/>
//                                     </FormControl>
//                                     <FormMessage />
//                                 </FormItem>
//                             )}
//                             />

//                             <FormField
//                             control={form.control}
//                             name="fileKey"
//                             render={({field})=>(
//                                 <FormItem className="w-full">
//                                     <FormLabel>Thumbnail image</FormLabel>
//                                     <FormControl>
//                                          <Uploader fileTypeAccepted="image" onChange={field.onChange} value={field.value} />
//                                     </FormControl>
//                                     <FormMessage />
//                                 </FormItem>
//                             )}
//                             />

//                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                             <FormField
//                             control={form.control}
//                             name="category"
//                             render={({field})=>(
//                                 <FormItem className="w-full">
//                                     <FormLabel>Category</FormLabel>
//                                     <Select
//                                        onValueChange={field.onChange}
//                                        defaultValue={field.value}>
//                                         <FormControl>
//                                             <SelectTrigger className="w-full">
//                                                 <SelectValue placeholder="Select Category"/>
//                                             </SelectTrigger>
//                                         </FormControl>
//                                         <SelectContent>
//                                             {courseCategories.map((category)=>(
//                                                 <SelectItem key={category} value={category}>
//                                                     {category}
//                                                 </SelectItem>
//                                             ))}
//                                         </SelectContent>
//                                     </Select>

//                                     <FormMessage />
//                                 </FormItem>
//                             )}
//                             />

//                             <FormField
//                             control={form.control}
//                             name="level"
//                             render={({field})=>(
//                                 <FormItem className="w-full">
//                                     <FormLabel>Level</FormLabel>
//                                     <Select
//                                        onValueChange={field.onChange}
//                                        defaultValue={field.value}>
//                                         <FormControl>
//                                             <SelectTrigger className="w-full">
//                                                 <SelectValue placeholder="Select Value"/>
//                                             </SelectTrigger>
//                                         </FormControl>
//                                         <SelectContent>
//                                             {courseLevels.map((category)=>(
//                                                 <SelectItem key={category} value={category}>
//                                                     {category}
//                                                 </SelectItem>
//                                             ))}
//                                         </SelectContent>
//                                     </Select>

//                                     <FormMessage />
//                                 </FormItem>
//                             )}
//                             />

//                             <FormField
//                             control={form.control}
//                             name="duration"
//                             render={({field})=>(
//                                 <FormItem className="w-full">
//                                     <FormLabel>Duration (hours)</FormLabel>
//                                     <FormControl>
//                                         <Input
//                                            placeholder="Duration"
//                                            type="number"
//                                            {...field}/>
//                                     </FormControl>
//                                     <FormMessage />
//                                 </FormItem>
//                             )}
//                             />

//                             <FormField
//                             control={form.control}
//                             name="price"
//                             render={({field})=>(
//                                 <FormItem className="w-full">
//                                     <FormLabel>Price ($)</FormLabel>
//                                     <FormControl>
//                                         <Input
//                                            placeholder="Price"
//                                            type="number"
//                                            {...field}/>
//                                     </FormControl>
//                                     <FormMessage />
//                                 </FormItem>
//                             )}
//                             />
//                             </div>

//                         <FormField
//                             control={form.control}
//                             name="status"
//                             render={({field})=>(
//                                 <FormItem className="w-full">
//                                     <FormLabel>Status</FormLabel>
//                                     <Select
//                                        onValueChange={field.onChange}
//                                        defaultValue={field.value}>
//                                         <FormControl>
//                                             <SelectTrigger className="w-full">
//                                                 <SelectValue placeholder="Select Status"/>
//                                             </SelectTrigger>
//                                         </FormControl>
//                                         <SelectContent>
//                                             {courseStatus.map((category)=>(
//                                                 <SelectItem key={category} value={category}>
//                                                     {category}
//                                                 </SelectItem>
//                                             ))}
//                                         </SelectContent>
//                                     </Select>

//                                     <FormMessage />
//                                 </FormItem>
//                             )}
//                             />
//                             <Button type="submit" disabled={pending}>
//                                 {pending ? (
//                                     <>
//                                     Creating...

//                                     <Loader2 className="animate-spin ml-1"/>
//                                     </>
//                                 ):(
//                                     <>
//                                     Create Course <PlusIcon className="ml-1" size={16}/>
//                                     </>
//                                 )}
//                             </Button>
//                     </form>
//                 </Form>
//             </CardContent>
//         </Card>
//         </>
//     )
// }
