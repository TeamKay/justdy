"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import slugify from "slugify";
import { toast } from "sonner";
import {
  Loader2,
  Save,
  ArrowLeft,
  Globe,
  LayoutGrid,
  DollarSign,
  Clock,
} from "lucide-react";
import {
  courseCategories,
  courseLevels,
  courseSchema,
  CourseSchemaType,
  courseStatus,
} from "@/lib/zodSchemas";
import { tryCatch } from "@/hooks/try-catch";
import { AdminCourseSingularType } from "@/app/actions/educator-get-course";

// UI Components
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
import { Button } from "@/app/_components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/app/_components/ui/card";
import { Separator } from "@/app/_components/ui/separator";
import { editCourse } from "../actions/educator-edit-course";

interface iAppProps {
  data: AdminCourseSingularType;
}

export function EditCourseForm({ data }: iAppProps) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<CourseSchemaType>({
    resolver: zodResolver(courseSchema) as Resolver<CourseSchemaType>,
    defaultValues: {
      title: data.title,
      description: data.description,
      fileKey: data.fileKey,
      price: data.price,
      duration: data.duration,
      level: data.level as CourseSchemaType["level"],
      category: data.category as CourseSchemaType["category"],
      status: data.status,
      slug: data.slug,
      smallDescription: data.smallDescription,
    },
  });

  async function onSubmit(values: CourseSchemaType) {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(
        editCourse(values, data.id),
      );

      if (error) {
        toast.error("An unexpected error occurred.");
        return;
      }

      if (result.status === "success") {
        toast.success(result.message);
        router.push("/educator/courses");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-w-6xl mx-auto pb-20"
      >
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <Button
              variant="secondary"
              size="sm"
              className="mb-2 -ml-2 text-muted-foreground"
              onClick={() => router.back()}
              type="button"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Courses
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Edit Course</h1>
            <p className="text-muted-foreground">
              Update your course details and settings.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending} className="min-w-30">
              {pending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>General Information</CardTitle>
                <CardDescription>
                  The core details that students will see first.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Advanced React Patterns"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            form.setValue(
                              "slug",
                              slugify(e.target.value, { lower: true }),
                              { shouldValidate: true },
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
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" /> URL
                        Slug
                      </FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground hidden sm:inline">
                            justdy.com/courses/
                          </span>
                          <Input {...field} readOnly className="bg-muted/50" />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Generated automatically from the title.
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="smallDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Short Summary</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Briefly describe what this course covers..."
                          className="resize-none h-24"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detailed Content</CardTitle>
                <CardDescription>
                  Provide a full curriculum and learning outcomes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
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

          {/* Sidebar Column */}
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Course Image</CardTitle>
              </CardHeader>
              <CardContent>
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

            <Card>
              <CardHeader>
                <CardTitle>Organization & Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <LayoutGrid className="h-4 w-4 text-muted-foreground" />{" "}
                        Category
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Category" />
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />{" "}
                          Price
                        </FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />{" "}
                          Hours
                        </FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                          <SelectTrigger>
                            <SelectValue placeholder="Select Level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {courseLevels.map((l) => (
                            <SelectItem key={l} value={l}>
                              {l}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Publishing Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {courseStatus.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
// import { Loader2, PlusIcon } from "lucide-react";
// import { Resolver, useForm } from "react-hook-form";
// import slugify from "slugify";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { useTransition } from "react";
// import { tryCatch } from "@/hooks/try-catch";
// import { toast } from "sonner";
// import { useRouter } from "next/navigation";
// import { AdminCourseSingularType } from "@/app/actions/educator-get-course";
// import { editCourse } from "../actions";
// import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/app/_components/ui/form";
// import { Input } from "@/app/_components/ui/input";
// import { Textarea } from "@/app/_components/ui/textarea";
// import { RichTextEditor } from "@/app/_components/rich-text-editor/Editor";
// import { Uploader } from "@/app/_components/file-uploader/Uploader";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/_components/ui/select";
// import { Button } from "@/app/_components/ui/button";

// interface iAppProps {
//     data: AdminCourseSingularType
// }

// export function EditCourseForm({data}: iAppProps){
//      const [pending, startTransition] = useTransition();
//     const router = useRouter();

//     const form = useForm<CourseSchemaType>({
//             resolver: zodResolver(courseSchema) as Resolver<CourseSchemaType>,
//             defaultValues: {
//                 title: data.title,
//                 description: data.description,
//                 fileKey: data.fileKey,
//                 price: data.price,
//                 duration: data.duration,
//                 level: data.level as CourseSchemaType["level"],
//                 category: data.category as CourseSchemaType["category"],
//                 status: data.status,
//                 slug: data.slug,
//                 smallDescription: data.smallDescription,
//             },
//         });

//         function onSubmit(values: CourseSchemaType){
//         startTransition(async()=>{
//             const {data: result, error} = await tryCatch(editCourse(values, data.id));

//             if (error) {
//                 toast.error("An unexpected error occurred.");
//                 return;
//             }

//             if(result.status === 'success'){
//                 toast.success(result.message);
//                 form.reset();
//                 router.push('/dashboard/educator/courses');
//             } else if(result.status === 'error'){
//                 toast.error(result.message);
//             }
//         });
//     }

//     return(
//          <Form {...form}>
//                     <form
//                        className="space-y-6"
//                        onSubmit={form.handleSubmit(onSubmit)}>

//                         <FormField
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
//                             )}/>

//                         <div className="flex gap-4 items-end">

//                        <FormField
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
//                                         <Uploader fileTypeAccepted="image" onChange={field.onChange} value={field.value} />
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
//                                            {...field}
//                                            />
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

//                                  <FormField
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
//                                     Updating...

//                                     <Loader2 className="animate-spin ml-1"/>
//                                     </>
//                                 ):(
//                                     <>
//                                     Update Course <PlusIcon className="ml-1" size={16}/>
//                                     </>
//                                 )}
//                             </Button>
//                     </form>
//                 </Form>
//     )
// }
