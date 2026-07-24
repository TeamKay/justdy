"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import slugify from "slugify";
import { toast } from "sonner";
import Image from "next/image";

import { Loader2, Save } from "lucide-react";
import {
  courseCategories,
  courseSchema,
  CourseSchemaType,
} from "@/lib/zodSchemas";
import { tryCatch } from "@/hooks/try-catch";
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
} from "@/app/_components/ui/card";
import { editCourse } from "../actions/educator-edit-course";
import { useUploadThing } from "@/lib/uploadthing";
import { deleteUTFile } from "../actions/delete-file";

type EditCourseFormProps = {
  data: {
    id: string;
    title: string;
    description: string;
    fileKey?: string | null;
    imageUrl?: string | null;
    price: number;
    duration: number | null;
    category: string;
    slug: string;
    smallDescription: string;
    hasCourseRelation?: boolean;
  };
};

export function EditCourseForm({ data }: EditCourseFormProps) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { startUpload } = useUploadThing("mediaUploader");

  const form = useForm<CourseSchemaType>({
    resolver: zodResolver(courseSchema) as Resolver<CourseSchemaType>,
    defaultValues: {
      title: data.title || "",
      description: data.description || "",
      fileKey: data.fileKey || "",
      price: data.price || 0,
      duration: data.duration ?? null,
      category: (data.category as CourseSchemaType["category"]) || "",
      slug: data.slug || "",
      smallDescription: data.smallDescription || "",
    },
  });

  async function onSubmit(values: CourseSchemaType) {
    startTransition(async () => {
      let finalFileKey = values.fileKey;
      let newlyUploadedKey: string | null = null;

      if (selectedImage) {
        const uploadRes = await startUpload([selectedImage]);

        if (!uploadRes || uploadRes.length === 0) {
          toast.error("Failed to upload thumbnail image to cloud storage.");
          return;
        }

        finalFileKey = uploadRes[0].key;
        newlyUploadedKey = uploadRes[0].key;
      }

      if (!finalFileKey) {
        toast.error("Please upload a course thumbnail.");
        return;
      }

      const submissionData = {
        ...values,
        fileKey: finalFileKey,
      };

      const { data: result, error } = await tryCatch(
        editCourse(submissionData, data.id),
      );

      if (error || result?.status === "error") {
        if (newlyUploadedKey) {
          await deleteUTFile(newlyUploadedKey);
        }
        toast.error(result?.message || "An unexpected error occurred.");
        return;
      }

      if (result.status === "success") {
        toast.success(result.message);
        router.push("/educator/products");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  const previewUrl = useMemo(() => {
    if (!selectedImage) return null;
    return URL.createObjectURL(selectedImage);
  }, [selectedImage]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Safely compute existing database image URL
  const existingImageUrl = useMemo(() => {
    if (
      data.imageUrl &&
      typeof data.imageUrl === "string" &&
      data.imageUrl.trim() !== ""
    ) {
      return data.imageUrl;
    }
    if (
      data.fileKey &&
      typeof data.fileKey === "string" &&
      data.fileKey.trim() !== ""
    ) {
      return `https://utfs.io/f/${data.fileKey}`;
    }
    return null;
  }, [data.imageUrl, data.fileKey]);

  // Strict fallback guarantee: Returns previewUrl -> existingImageUrl -> default fallback path
  const imageSrc = useMemo(() => {
    if (previewUrl) return previewUrl;
    if (!imageError && existingImageUrl) return existingImageUrl;
    return "/images/no-image.jpeg";
  }, [previewUrl, imageError, existingImageUrl]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-w-7xl mx-auto px-4 lg:px-0 pb-5 space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Complete Course Details
            </h2>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button type="submit" disabled={pending} className="shadow-sm">
              {pending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8">
          <div className="space-y-8">
            <Card>
              <CardContent className="space-y-6 pt-0">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Build a React SaaS App"
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
                      <FormLabel>Short Description</FormLabel>
                      <FormControl>
                        <Textarea
                          className="min-h-20"
                          placeholder="Explain what students will learn..."
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
                <CardTitle>Course Content</CardTitle>
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

          <aside className="space-y-6 xl:sticky xl:top-0 h-fit">
            <Card className="overflow-hidden">
              <CardHeader className="pb-0">
                <CardTitle className="text-sm font-semibold">
                  Course Thumbnail
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-5">
                <FormField
                  control={form.control}
                  name="fileKey"
                  render={() => (
                    <FormItem>
                      <FormControl>
                        <div>
                          <div
                            className="relative aspect-video overflow-hidden rounded-xl border cursor-pointer group bg-zinc-100 dark:bg-zinc-800"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Image
                              src={imageSrc}
                              alt="Course thumbnail"
                              fill
                              unoptimized={
                                typeof imageSrc === "string" &&
                                (imageSrc.startsWith("https://utfs.io") ||
                                  imageSrc.includes("uploadthing"))
                              }
                              className="object-cover transition group-hover:scale-105"
                              onError={() => setImageError(true)}
                            />

                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                              <span className="text-white text-sm font-medium">
                                Change Thumbnail
                              </span>
                            </div>
                          </div>

                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setSelectedImage(file);
                                setImageError(false);
                              }
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-5">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Category</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>

                        <SelectContent>
                          {courseCategories.map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
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
                        <FormLabel>Hours</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value ? Number(e.target.value) : null,
                              )
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </form>
    </Form>
  );
}

// "use client";

// import { useEffect, useMemo, useRef, useState, useTransition } from "react";
// import { useRouter } from "next/navigation";
// import { useForm, Resolver, useWatch } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import slugify from "slugify";
// import { toast } from "sonner";
// import Image from "next/image";

// import { Loader2, Save } from "lucide-react";
// import {
//   courseCategories,
//   courseSchema,
//   CourseSchemaType,
// } from "@/lib/zodSchemas";
// import { tryCatch } from "@/hooks/try-catch";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/app/_components/ui/form";
// import { Input } from "@/app/_components/ui/input";
// import { Textarea } from "@/app/_components/ui/textarea";
// import { RichTextEditor } from "@/app/_components/rich-text-editor/Editor";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/app/_components/ui/select";
// import { Button } from "@/app/_components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from "@/app/_components/ui/card";
// import { editCourse } from "../actions/educator-edit-course";
// import { useUploadThing } from "@/lib/uploadthing";
// import { deleteUTFile } from "../actions/delete-file";

// type EditCourseFormProps = {
//   data: {
//     id: string;
//     title: string;
//     description: string;
//     fileKey: string;
//     imageUrl: string;
//     price: number;
//     duration: number | null;
//     category: string;
//     slug: string;
//     smallDescription: string;
//     hasCourseRelation?: boolean;
//   };
// };

// export function EditCourseForm({ data }: EditCourseFormProps) {
//   const [pending, startTransition] = useTransition();
//   const router = useRouter();
//   const [selectedImage, setSelectedImage] = useState<File | null>(null);
//   const fileInputRef = useRef<HTMLInputElement>(null);
//   const { startUpload } = useUploadThing("mediaUploader");
//   // const showCourseFields = data.hasCourseRelation ?? true;

//   const form = useForm<CourseSchemaType>({
//     resolver: zodResolver(courseSchema) as Resolver<CourseSchemaType>,
//     defaultValues: {
//       title: data.title,
//       description: data.description,
//       fileKey: data.fileKey,
//       price: data.price,
//       duration: data.duration,
//       category: data.category as CourseSchemaType["category"],
//       slug: data.slug,
//       smallDescription: data.smallDescription,
//     },
//   });

//   const currentSlug = useWatch({
//     control: form.control,
//     name: "slug",
//   });

//   async function onSubmit(values: CourseSchemaType) {
//     startTransition(async () => {
//       let finalFileKey = values.fileKey;
//       let newlyUploadedKey: string | null = null;

//       if (selectedImage) {
//         const uploadRes = await startUpload([selectedImage]);

//         if (!uploadRes || uploadRes.length === 0) {
//           toast.error("Failed to upload thumbnail image to cloud storage.");
//           return;
//         }

//         finalFileKey = uploadRes[0].key;
//         newlyUploadedKey = uploadRes[0].key;
//       }

//       if (!finalFileKey) {
//         toast.error("Please upload a course thumbnail.");
//         return;
//       }

//       const submissionData = {
//         ...values,
//         fileKey: finalFileKey,
//       };

//       if (!submissionData.fileKey) {
//         toast.error("Please upload a course thumbnail.");
//         return;
//       }

//       const { data: result, error } = await tryCatch(
//         editCourse(submissionData, data.id),
//       );

//       if (error || result?.status === "error") {
//         // If DB update failed, delete the newly uploaded file to avoid orphans
//         if (newlyUploadedKey) {
//           await deleteUTFile(newlyUploadedKey);
//         }
//         toast.error(result?.message || "An unexpected error occurred.");
//         return;
//       }

//       if (result.status === "success") {
//         toast.success(result.message);
//         router.push("/educator/products");
//         router.refresh();
//       } else {
//         toast.error(result.message);
//       }
//     });
//   }

//   const previewUrl = useMemo(() => {
//     if (!selectedImage) return null;
//     return URL.createObjectURL(selectedImage);
//   }, [selectedImage]);

//   useEffect(() => {
//     return () => {
//       if (previewUrl) {
//         URL.revokeObjectURL(previewUrl);
//       }
//     };
//   }, [previewUrl]);

//   const [imageError, setImageError] = useState(false);

//   const imageSrc =
//     previewUrl ??
//     (!imageError && data.fileKey
//       ? `https://utfs.io/f/${data.fileKey}`
//       : "/images/no-image.jpeg");

//   return (
//     <Form {...form}>
//       <form
//         onSubmit={form.handleSubmit(onSubmit)}
//         className="max-w-7xl mx-auto px-4 lg:px-0 pb-5 space-y-4"
//       >
//         {/* Modern SaaS Sub-Header Topbar */}
//         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-200 dark:border-zinc-800">
//           <div>
//             <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
//               Complete Course Details
//             </h2>
//           </div>
//           <div className="flex items-center gap-3 shrink-0">
//             <Button
//               type="button"
//               variant="outline"
//               onClick={() => router.back()}
//               disabled={pending}
//             >
//               Cancel
//             </Button>
//             <Button type="submit" disabled={pending} className="shadow-sm">
//               {pending ? (
//                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//               ) : (
//                 <Save className="mr-2 h-4 w-4" />
//               )}
//               Save Changes
//             </Button>
//           </div>
//         </div>

//         {/* Master Two-Column Workspace Layout */}
//         <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8">
//           {/* LEFT CONTENT */}
//           <div className="space-y-8">
//             <Card>
//               <CardContent className="space-y-6">
//                 <FormField
//                   control={form.control}
//                   name="title"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Course Title</FormLabel>

//                       <FormControl>
//                         <Input
//                           placeholder="Build a React SaaS App"
//                           {...field}
//                           onChange={(e) => {
//                             field.onChange(e);

//                             form.setValue(
//                               "slug",
//                               slugify(e.target.value, {
//                                 lower: true,
//                               }),
//                             );
//                           }}
//                         />
//                       </FormControl>

//                       {currentSlug && (
//                         <p className="text-xs text-muted-foreground mt-2 hidden">
//                           /{currentSlug}
//                         </p>
//                       )}

//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 <FormField
//                   control={form.control}
//                   name="smallDescription"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Short Description</FormLabel>

//                       <FormControl>
//                         <Textarea
//                           className="min-h-30"
//                           placeholder="Explain what students will learn..."
//                           {...field}
//                         />
//                       </FormControl>

//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader>
//                 <CardTitle>Course Content</CardTitle>
//               </CardHeader>

//               <CardContent>
//                 <FormField
//                   control={form.control}
//                   name="description"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormControl>
//                         <RichTextEditor field={field} />
//                       </FormControl>

//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </CardContent>
//             </Card>
//           </div>

//           {/* RIGHT SIDEBAR */}

//           <aside className="space-y-6 xl:sticky xl:top-6 h-fit">
//             <Card className="overflow-hidden">
//               <CardHeader className="pb-3">
//                 <CardTitle className="text-sm font-semibold">
//                   Course Thumbnail
//                 </CardTitle>
//               </CardHeader>

//               <CardContent className="space-y-5">
//                 <FormField
//                   control={form.control}
//                   name="fileKey"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormControl>
//                         <div>
//                           <div
//                             className="relative aspect-video overflow-hidden rounded-xl border cursor-pointer group"
//                             onClick={() => fileInputRef.current?.click()}
//                           >
//                             <Image
//                               src={imageSrc}
//                               alt="Course thumbnail"
//                               fill
//                               className="object-cover transition group-hover:scale-105"
//                               onError={() => setImageError(true)}
//                             />

//                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
//                               <span className="text-white text-sm font-medium">
//                                 Change Thumbnail
//                               </span>
//                             </div>
//                           </div>

//                           <input
//                             ref={fileInputRef}
//                             type="file"
//                             accept="image/*"
//                             hidden
//                             onChange={(e) => {
//                               const file = e.target.files?.[0];

//                               if (file) {
//                                 setSelectedImage(file);
//                               }
//                             }}
//                           />
//                         </div>
//                       </FormControl>

//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader>
//                 <CardTitle>Publishing Settings</CardTitle>
//               </CardHeader>

//               <CardContent className="space-y-5">
//                 <FormField
//                   control={form.control}
//                   name="category"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Category</FormLabel>

//                       <Select
//                         value={field.value}
//                         onValueChange={field.onChange}
//                       >
//                         <FormControl>
//                           <SelectTrigger>
//                             <SelectValue placeholder="Select category" />
//                           </SelectTrigger>
//                         </FormControl>

//                         <SelectContent>
//                           {courseCategories.map((item) => (
//                             <SelectItem key={item} value={item}>
//                               {item}
//                             </SelectItem>
//                           ))}
//                         </SelectContent>
//                       </Select>
//                     </FormItem>
//                   )}
//                 />

//                 <div className="grid grid-cols-2 gap-4">
//                   <FormField
//                     control={form.control}
//                     name="price"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Price</FormLabel>

//                         <FormControl>
//                           <Input
//                             type="number"
//                             {...field}
//                             onChange={(e) =>
//                               field.onChange(Number(e.target.value))
//                             }
//                           />
//                         </FormControl>
//                       </FormItem>
//                     )}
//                   />

//                   <FormField
//                     control={form.control}
//                     name="duration"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Hours</FormLabel>

//                         <FormControl>
//                           <Input
//                             type="number"
//                             value={field.value ?? ""}
//                             onChange={(e) =>
//                               field.onChange(
//                                 e.target.value ? Number(e.target.value) : null,
//                               )
//                             }
//                           />
//                         </FormControl>
//                       </FormItem>
//                     )}
//                   />
//                 </div>
//               </CardContent>
//             </Card>
//           </aside>
//         </div>
//       </form>
//     </Form>
//   );
// }

// "use client";

// import { useState, useTransition } from "react";
// import { useRouter } from "next/navigation";
// import { useForm, Resolver, useWatch } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import slugify from "slugify";
// import { toast } from "sonner";
// import {
//   Loader2,
//   Save,
//   LayoutGrid,
//   DollarSign,
//   Clock,
//   Image as ImageIcon,
//   X,
// } from "lucide-react";
// import {
//   courseCategories,
//   courseSchema,
//   CourseSchemaType,
// } from "@/lib/zodSchemas";
// import { tryCatch } from "@/hooks/try-catch";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/app/_components/ui/form";
// import { Input } from "@/app/_components/ui/input";
// import { Textarea } from "@/app/_components/ui/textarea";
// import { RichTextEditor } from "@/app/_components/rich-text-editor/Editor";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/app/_components/ui/select";
// import { Button } from "@/app/_components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
//   CardDescription,
// } from "@/app/_components/ui/card";
// import { editCourse } from "../actions/educator-edit-course";
// import { ImageUploader } from "./file-uploader/Uploader";
// import { useUploadThing } from "@/lib/uploadthing";

// type EditCourseFormProps = {
//   data: {
//     id: string;
//     title: string;
//     description: string;
//     fileKey: string; // This holds our image URL or key
//     price: number;
//     duration: number | null;
//     category: string;
//     slug: string;
//     smallDescription: string;
//     hasCourseRelation?: boolean;
//   };
// };

// export function EditCourseForm({ data }: EditCourseFormProps) {
//   const [pending, startTransition] = useTransition();
//   const router = useRouter();
//   const [selectedImage, setSelectedImage] = useState<File | null>(null);

//   // Track if we want to bypass the current fileKey display view to upload a replacement
//   const [isReplacingImage, setIsReplacingImage] = useState(false);

//   const { startUpload } = useUploadThing("mediaUploader");
//   const showCourseFields = data.hasCourseRelation ?? true;

//   const form = useForm<CourseSchemaType>({
//     resolver: zodResolver(courseSchema) as Resolver<CourseSchemaType>,
//     defaultValues: {
//       title: data.title,
//       description: data.description,
//       fileKey: data.fileKey,
//       price: data.price,
//       duration: data.duration,
//       category: data.category as CourseSchemaType["category"],
//       slug: data.slug,
//       smallDescription: data.smallDescription,
//     },
//   });

//   const currentSlug = useWatch({
//     control: form.control,
//     name: "slug",
//   });

//   // Watch fileKey state changes to conditionally show current image view
//   const currentFileKey = useWatch({
//     control: form.control,
//     name: "fileKey",
//   });

//   async function onSubmit(values: CourseSchemaType) {
//     startTransition(async () => {
//       let finalFileKey = values.fileKey;

//       if (showCourseFields && selectedImage) {
//         const uploadRes = await startUpload([selectedImage]);

//         if (!uploadRes || uploadRes.length === 0) {
//           toast.error("Failed to upload thumbnail image to cloud storage.");
//           return;
//         }

//         finalFileKey = uploadRes[0].url;
//       }

//       const submissionData = {
//         ...values,
//         fileKey: finalFileKey,
//       };

//       const { data: result, error } = await tryCatch(
//         editCourse(submissionData, data.id),
//       );

//       if (error) {
//         toast.error("An unexpected error occurred.");
//         return;
//       }

//       if (result.status === "success") {
//         toast.success(result.message);
//         router.push("/educator/products");
//         router.refresh();
//       } else {
//         toast.error(result.message);
//       }
//     });
//   }

//   return (
//     <Form {...form}>
//       <form
//         onSubmit={form.handleSubmit(onSubmit)}
//         className="max-w-7xl mx-auto px-4 lg:px-8 pb-24 space-y-8"
//       >
//         {/* Modern SaaS Sub-Header Topbar */}
//         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-200 dark:border-zinc-800">
//           <div>
//             <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
//               Edit Course Settings
//             </h2>
//             <p className="text-sm text-muted-foreground mt-1">
//               Modify course parameters, pricing structures, and media
//               configurations.
//             </p>
//           </div>
//           <div className="flex items-center gap-3 shrink-0">
//             <Button
//               type="button"
//               variant="outline"
//               onClick={() => router.back()}
//               disabled={pending}
//             >
//               Cancel
//             </Button>
//             <Button type="submit" disabled={pending} className="shadow-sm">
//               {pending ? (
//                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//               ) : (
//                 <Save className="mr-2 h-4 w-4" />
//               )}
//               Save Changes
//             </Button>
//           </div>
//         </div>

//         {/* Master Two-Column Workspace Layout */}
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
//           {/* LEFT: Main Content Stream (Takes 2 columns if sidebar is visible) */}
//           <div
//             className={
//               showCourseFields
//                 ? "lg:col-span-2 space-y-6"
//                 : "lg:col-span-3 space-y-6"
//             }
//           >
//             <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
//               <CardHeader>
//                 <CardTitle className="text-base font-medium">
//                   General Information
//                 </CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-5">
//                 <FormField
//                   control={form.control}
//                   name="title"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel className="text-zinc-700 dark:text-zinc-300">
//                         Course Title
//                       </FormLabel>
//                       <FormControl>
//                         <div className="space-y-1.5">
//                           <Input
//                             placeholder="e.g. Advanced Next.js and Architectural Patterns"
//                             className="bg-transparent"
//                             {...field}
//                             onChange={(e) => {
//                               field.onChange(e);
//                               form.setValue(
//                                 "slug",
//                                 slugify(e.target.value, {
//                                   lower: true,
//                                   strict: true,
//                                 }),
//                                 { shouldValidate: true },
//                               );
//                             }}
//                           />
//                           {currentSlug && (
//                             <div className="flex items-center gap-1.5 px-1">
//                               <span className="text-[11px] font-mono text-muted-foreground">
//                                 URL Path:
//                               </span>
//                               <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/30">
//                                 /{currentSlug}
//                               </span>
//                             </div>
//                           )}
//                         </div>
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 <FormField
//                   control={form.control}
//                   name="smallDescription"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel className="text-zinc-700 dark:text-zinc-300">
//                         Short Summary
//                       </FormLabel>
//                       <FormControl>
//                         <Textarea
//                           placeholder="Provide a high-conversion 2-sentence breakdown for search snippets..."
//                           className="resize-none h-20 bg-transparent"
//                           {...field}
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </CardContent>
//             </Card>

//             <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
//                 <div>
//                   <CardTitle className="text-base font-medium">
//                     Detailed Curriculum Description
//                   </CardTitle>
//                 </div>
//               </CardHeader>
//               <CardContent className="min-h-[300px]">
//                 <FormField
//                   control={form.control}
//                   name="description"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormControl>
//                         <RichTextEditor field={field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </CardContent>
//             </Card>

//             {/* Flat Single Column Fallback Form Placement for Pricing if layout doesn't use course data */}
//             {!showCourseFields && (
//               <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
//                 <CardHeader>
//                   <CardTitle className="text-base font-medium">
//                     Pricing Configurations
//                   </CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <FormField
//                     control={form.control}
//                     name="price"
//                     render={({ field }) => (
//                       <FormItem className="max-w-xs">
//                         <FormLabel className="flex items-center gap-2">
//                           <DollarSign className="h-4 w-4 text-muted-foreground" />{" "}
//                           Price (USD)
//                         </FormLabel>
//                         <FormControl>
//                           <Input
//                             type="number"
//                             className="bg-transparent"
//                             {...field}
//                             onChange={(e) => {
//                               const val = e.target.value;
//                               field.onChange(val === "" ? 0 : Number(val));
//                             }}
//                           />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                 </CardContent>
//               </Card>
//             )}
//           </div>

//           {/* RIGHT: Metadata, Operations, and Images Sidecar Pane */}
//           {showCourseFields && (
//             <div className="space-y-6 lg:col-span-1">
//               {/* Media Hub Card featuring Dynamic Thumbnail Display Mode */}
//               <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 overflow-hidden">
//                 <CardHeader className="pb-3">
//                   <CardTitle className="text-base font-medium">
//                     Course Thumbnail
//                   </CardTitle>
//                   <CardDescription>
//                     Visual identity layout asset
//                   </CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                   <FormField
//                     control={form.control}
//                     name="fileKey"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormControl>
//                           {currentFileKey && !isReplacingImage ? (
//                             /* DISPLAY VIEW MODE */
//                             <div className="relative group border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-zinc-50 dark:bg-zinc-900/50 p-2">
//                               <div className="relative aspect-video w-full rounded-md overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200/60 dark:border-zinc-700/40">
//                                 {/* eslint-disable-next-line @next/next/no-img-element */}
//                                 <img
//                                   src={currentFileKey}
//                                   alt="Course Cover Preview"
//                                   className="object-cover w-full h-full"
//                                   onError={(e) => {
//                                     // Fallback if key isn't a direct standard address format
//                                     e.currentTarget.style.display = "none";
//                                   }}
//                                 />
//                                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
//                                   <ImageIcon className="h-6 w-6 text-white" />
//                                 </div>
//                               </div>
//                               <div className="mt-3 flex items-center justify-between gap-2 px-1">
//                                 <span className="text-xs text-muted-foreground truncate max-w-[180px] font-mono">
//                                   {currentFileKey.split("/").pop()}
//                                 </span>
//                                 <Button
//                                   type="button"
//                                   variant="ghost"
//                                   size="sm"
//                                   onClick={() => {
//                                     setIsReplacingImage(true);
//                                     setSelectedImage(null);
//                                     form.setValue("fileKey", "");
//                                   }}
//                                   className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 px-2 rounded"
//                                 >
//                                   <X className="h-3 w-3 mr-1" /> Remove
//                                 </Button>
//                               </div>
//                             </div>
//                           ) : (
//                             /* IMAGE FILE UPLOADER VIEW */
//                             <div className="relative">
//                               <ImageUploader
//                                 onChange={(file) => {
//                                   setSelectedImage(file);
//                                   form.setValue(
//                                     "fileKey",
//                                     file ? file.name : "",
//                                   );
//                                 }}
//                                 value={selectedImage as unknown as File}
//                               />
//                               {data.fileKey && (
//                                 <Button
//                                   type="button"
//                                   variant="link"
//                                   className="text-xs mt-1 text-muted-foreground h-auto p-0 hover:text-foreground"
//                                   onClick={() => {
//                                     setIsReplacingImage(false);
//                                     form.setValue("fileKey", data.fileKey);
//                                   }}
//                                 >
//                                   Revert to current image
//                                 </Button>
//                               )}
//                             </div>
//                           )}
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                 </CardContent>
//               </Card>

//               {/* Taxonomy and Monetization Parameters */}
//               <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
//                 <CardHeader className="pb-4">
//                   <CardTitle className="text-base font-medium">
//                     Classification & Value
//                   </CardTitle>
//                 </CardHeader>
//                 <CardContent className="space-y-5">
//                   <FormField
//                     control={form.control}
//                     name="category"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
//                           <LayoutGrid className="h-3.5 w-3.5 text-zinc-400" />{" "}
//                           Category
//                         </FormLabel>
//                         <Select
//                           onValueChange={field.onChange}
//                           defaultValue={field.value}
//                         >
//                           <FormControl>
//                             <SelectTrigger className="bg-transparent">
//                               <SelectValue placeholder="Select context category" />
//                             </SelectTrigger>
//                           </FormControl>
//                           <SelectContent>
//                             {courseCategories.map((cat) => (
//                               <SelectItem key={cat} value={cat}>
//                                 {cat}
//                               </SelectItem>
//                             ))}
//                           </SelectContent>
//                         </Select>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />

//                   <div className="grid grid-cols-2 gap-4">
//                     <FormField
//                       control={form.control}
//                       name="price"
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
//                             <DollarSign className="h-3.5 w-3.5 text-zinc-400" />{" "}
//                             Price
//                           </FormLabel>
//                           <FormControl>
//                             <div className="relative">
//                               <Input
//                                 type="number"
//                                 className="bg-transparent"
//                                 {...field}
//                                 onChange={(e) => {
//                                   const val = e.target.value;
//                                   field.onChange(val === "" ? 0 : Number(val));
//                                 }}
//                               />
//                             </div>
//                           </FormControl>
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />

//                     <FormField
//                       control={form.control}
//                       name="duration"
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
//                             <Clock className="h-3.5 w-3.5 text-zinc-400" />{" "}
//                             Duration
//                           </FormLabel>
//                           <FormControl>
//                             <div className="relative">
//                               <Input
//                                 type="number"
//                                 placeholder="Hours"
//                                 className="bg-transparent"
//                                 {...field}
//                                 value={field.value ?? ""}
//                                 onChange={(e) => {
//                                   const val = e.target.value;
//                                   field.onChange(
//                                     val === "" ? null : Number(val),
//                                   );
//                                 }}
//                               />
//                             </div>
//                           </FormControl>
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />
//                   </div>
//                 </CardContent>
//               </Card>
//             </div>
//           )}
//         </div>
//       </form>
//     </Form>
//   );
// }

// "use client";

// import { useState, useTransition } from "react";
// import { useRouter } from "next/navigation";
// import { useForm, Resolver, useWatch } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import slugify from "slugify";
// import { toast } from "sonner";
// import { Loader2, Save, LayoutGrid, DollarSign, Clock } from "lucide-react";
// import {
//   courseCategories,
//   courseSchema,
//   CourseSchemaType,
// } from "@/lib/zodSchemas";
// import { tryCatch } from "@/hooks/try-catch";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/app/_components/ui/form";
// import { Input } from "@/app/_components/ui/input";
// import { Textarea } from "@/app/_components/ui/textarea";
// import { RichTextEditor } from "@/app/_components/rich-text-editor/Editor";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/app/_components/ui/select";
// import { Button } from "@/app/_components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from "@/app/_components/ui/card";
// import { editCourse } from "../actions/educator-edit-course";
// import { ImageUploader } from "./file-uploader/Uploader";
// import { useUploadThing } from "@/lib/uploadthing";

// type EditCourseFormProps = {
//   data: {
//     id: string;
//     title: string;
//     description: string;
//     fileKey: string;
//     price: number;
//     duration: number | null;
//     category: string;
//     slug: string;
//     smallDescription: string;
//     hasCourseRelation?: boolean; // Accept the new flag
//   };
// };

// export function EditCourseForm({ data }: EditCourseFormProps) {
//   const [pending, startTransition] = useTransition();
//   const router = useRouter();
//   const [selectedImage, setSelectedImage] = useState<File | null>(null);
//   const { startUpload } = useUploadThing("mediaUploader");

//   // Determine if course details should be visible
//   const showCourseFields = data.hasCourseRelation ?? true;

//   const form = useForm<CourseSchemaType>({
//     resolver: zodResolver(courseSchema) as Resolver<CourseSchemaType>,
//     defaultValues: {
//       title: data.title,
//       description: data.description,
//       fileKey: data.fileKey,
//       price: data.price,
//       duration: data.duration,
//       category: data.category as CourseSchemaType["category"],
//       slug: data.slug,
//       smallDescription: data.smallDescription,
//     },
//   });

//   const currentSlug = useWatch({
//     control: form.control,
//     name: "slug",
//   });

//   async function onSubmit(values: CourseSchemaType) {
//     startTransition(async () => {
//       let finalFileKey = values.fileKey;

//       // Only perform upload tasks if we actually have course relation fields active
//       if (showCourseFields && selectedImage) {
//         const uploadRes = await startUpload([selectedImage]);

//         if (!uploadRes || uploadRes.length === 0) {
//           toast.error("Failed to upload thumbnail image to cloud storage.");
//           return;
//         }

//         finalFileKey = uploadRes[0].url;
//       }

//       const submissionData = {
//         ...values,
//         fileKey: finalFileKey,
//       };

//       const { data: result, error } = await tryCatch(
//         editCourse(submissionData, data.id),
//       );

//       if (error) {
//         toast.error("An unexpected error occurred.");
//         return;
//       }

//       if (result.status === "success") {
//         toast.success(result.message);
//         router.push("/educator/products");
//         router.refresh();
//       } else {
//         toast.error(result.message);
//       }
//     });
//   }

//   return (
//     <Form {...form}>
//       <form
//         onSubmit={form.handleSubmit(onSubmit)}
//         className="max-w-6xl mx-auto pb-20"
//       >
//         {/* Header Section */}
//         <div className="flex items-center justify-between gap-4 mb-8 border-b pb-4 border-zinc-100 dark:border-zinc-800">
//           <div>
//             <h2 className="text-xl font-bold tracking-tight">Course Details</h2>
//           </div>
//           <div className="flex items-center gap-3">
//             <Button type="submit" disabled={pending} className="min-w-30">
//               {pending ? (
//                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//               ) : (
//                 <Save className="mr-2 h-4 w-4" />
//               )}
//               Save Changes
//             </Button>
//           </div>
//         </div>

//         {/* Adjust grid layout dynamically: 3 columns if course elements exist, otherwise 1 column */}
//         <div
//           className={`grid grid-cols-1 ${showCourseFields ? "lg:grid-cols-3" : "lg:grid-cols-1"} gap-8`}
//         >
//           {/* Main Content Column */}
//           <div
//             className={
//               showCourseFields ? "lg:col-span-2 space-y-8" : "space-y-8"
//             }
//           >
//             <Card>
//               <CardContent className="space-y-6 pt-6">
//                 <FormField
//                   control={form.control}
//                   name="title"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Title</FormLabel>
//                       <FormControl>
//                         <div className="relative">
//                           <Input
//                             placeholder="e.g. Advanced React Patterns"
//                             {...field}
//                             onChange={(e) => {
//                               field.onChange(e);
//                               form.setValue(
//                                 "slug",
//                                 slugify(e.target.value, { lower: true }),
//                                 { shouldValidate: true },
//                               );
//                             }}
//                           />
//                           {currentSlug && (
//                             <div className="text-right mt-1.5">
//                               <span className="text-xs italic text-muted-foreground bg-muted/40 px-2 py-0.5 rounded">
//                                 {currentSlug}
//                               </span>
//                             </div>
//                           )}
//                         </div>
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 <FormField
//                   control={form.control}
//                   name="smallDescription"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Short Summary</FormLabel>
//                       <FormControl>
//                         <Textarea
//                           placeholder="Briefly describe what this covers..."
//                           className="resize-none h-24"
//                           {...field}
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader>
//                 <CardTitle>Detailed Content</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <FormField
//                   control={form.control}
//                   name="description"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormControl>
//                         <RichTextEditor field={field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </CardContent>
//             </Card>

//             {/* If the course doesn't exist, render ONLY pricing inside the main column */}
//             {!showCourseFields && (
//               <Card>
//                 <CardHeader>
//                   <CardTitle>Pricing</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <FormField
//                     control={form.control}
//                     name="price"
//                     render={({ field }) => (
//                       <FormItem className="max-w-xs">
//                         <FormLabel className="flex items-center gap-2">
//                           <DollarSign className="h-4 w-4 text-muted-foreground" />{" "}
//                           Price
//                         </FormLabel>
//                         <FormControl>
//                           <Input
//                             type="number"
//                             {...field}
//                             onChange={(e) => {
//                               const val = e.target.value;
//                               field.onChange(val === "" ? 0 : Number(val));
//                             }}
//                           />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                 </CardContent>
//               </Card>
//             )}
//           </div>

//           {/* Sidebar Column (Rendered only if Course data exists) */}
//           {showCourseFields && (
//             <div className="space-y-8">
//               <Card>
//                 <CardHeader>
//                   <CardTitle>Course Thumbnail</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <FormField
//                     control={form.control}
//                     name="fileKey"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormControl>
//                           <ImageUploader
//                             onChange={(file) => {
//                               setSelectedImage(file);
//                               form.setValue("fileKey", file ? file.name : "");
//                             }}
//                             value={field.value as unknown as File}
//                           />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                 </CardContent>
//               </Card>

//               <Card>
//                 <CardHeader>
//                   <CardTitle>Organization & Pricing</CardTitle>
//                 </CardHeader>
//                 <CardContent className="space-y-6">
//                   <div className="grid grid-cols-1 gap-4">
//                     <FormField
//                       control={form.control}
//                       name="category"
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel className="flex items-center gap-2">
//                             <LayoutGrid className="h-4 w-4 text-muted-foreground" />{" "}
//                             Category
//                           </FormLabel>
//                           <Select
//                             onValueChange={field.onChange}
//                             defaultValue={field.value}
//                           >
//                             <FormControl>
//                               <SelectTrigger>
//                                 <SelectValue placeholder="Select Category" />
//                               </SelectTrigger>
//                             </FormControl>
//                             <SelectContent>
//                               {courseCategories.map((c) => (
//                                 <SelectItem key={c} value={c}>
//                                   {c}
//                                 </SelectItem>
//                               ))}
//                             </SelectContent>
//                           </Select>
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />
//                   </div>

//                   <div className="grid grid-cols-2 gap-4">
//                     <FormField
//                       control={form.control}
//                       name="price"
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel className="flex items-center gap-2">
//                             <DollarSign className="h-4 w-4 text-muted-foreground" />{" "}
//                             Price
//                           </FormLabel>
//                           <FormControl>
//                             <Input
//                               type="number"
//                               {...field}
//                               onChange={(e) => {
//                                 const val = e.target.value;
//                                 field.onChange(val === "" ? 0 : Number(val));
//                               }}
//                             />
//                           </FormControl>
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />
//                     <FormField
//                       control={form.control}
//                       name="duration"
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel className="flex items-center gap-2">
//                             <Clock className="h-4 w-4 text-muted-foreground" />{" "}
//                             Hours
//                           </FormLabel>
//                           <FormControl>
//                             <Input
//                               type="number"
//                               {...field}
//                               value={field.value ?? ""}
//                               onChange={(e) => {
//                                 const val = e.target.value;
//                                 field.onChange(val === "" ? null : Number(val));
//                               }}
//                             />
//                           </FormControl>
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />
//                   </div>
//                 </CardContent>
//               </Card>
//             </div>
//           )}
//         </div>
//       </form>
//     </Form>
//   );
// }

// "use client";

// import { useState, useTransition } from "react";
// import { useRouter } from "next/navigation";
// import { useForm, Resolver, useWatch } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import slugify from "slugify";
// import { toast } from "sonner";
// import { Loader2, Save, LayoutGrid, DollarSign, Clock } from "lucide-react";
// import {
//   courseCategories,
//   courseSchema,
//   CourseSchemaType,
// } from "@/lib/zodSchemas";
// import { tryCatch } from "@/hooks/try-catch";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/app/_components/ui/form";
// import { Input } from "@/app/_components/ui/input";
// import { Textarea } from "@/app/_components/ui/textarea";
// import { RichTextEditor } from "@/app/_components/rich-text-editor/Editor";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/app/_components/ui/select";
// import { Button } from "@/app/_components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from "@/app/_components/ui/card";
// import { editCourse } from "../actions/educator-edit-course";
// import { ImageUploader } from "./file-uploader/Uploader";
// import { useUploadThing } from "@/lib/uploadthing";

// type EditCourseFormProps = {
//   data: {
//     id: string;
//     title: string;
//     description: string;
//     fileKey: string;
//     price: number;
//     duration: number | null;
//     category: string;
//     slug: string;
//     smallDescription: string;
//   };
// };

// export function EditCourseForm({ data }: EditCourseFormProps) {
//   const [pending, startTransition] = useTransition();
//   const router = useRouter();
//   const [selectedImage, setSelectedImage] = useState<File | null>(null);
//   const { startUpload } = useUploadThing("mediaUploader");

//   const form = useForm<CourseSchemaType>({
//     resolver: zodResolver(courseSchema) as Resolver<CourseSchemaType>,
//     defaultValues: {
//       title: data.title,
//       description: data.description,
//       fileKey: data.fileKey, // Holds the existing image URL initially
//       price: data.price,
//       duration: data.duration,
//       category: data.category as CourseSchemaType["category"],
//       slug: data.slug,
//       smallDescription: data.smallDescription,
//     },
//   });

//   const currentSlug = useWatch({
//     control: form.control,
//     name: "slug",
//   });

//   async function onSubmit(values: CourseSchemaType) {
//     startTransition(async () => {
//       let finalFileKey = values.fileKey;

//       // 4. Check if the user selected a brand new image during editing
//       if (selectedImage) {
//         const uploadRes = await startUpload([selectedImage]);

//         if (!uploadRes || uploadRes.length === 0) {
//           toast.error("Failed to upload thumbnail image to cloud storage.");
//           return;
//         }

//         finalFileKey = uploadRes[0].url;
//       }

//       // 5. Merge the final file key (whether existing or freshly uploaded) into submission
//       const submissionData = {
//         ...values,
//         fileKey: finalFileKey,
//       };

//       const { data: result, error } = await tryCatch(
//         editCourse(submissionData, data.id),
//       );

//       if (error) {
//         toast.error("An unexpected error occurred.");
//         return;
//       }

//       if (result.status === "success") {
//         toast.success(result.message);
//         router.push("/educator/products");
//         router.refresh();
//       } else {
//         toast.error(result.message);
//       }
//     });
//   }

//   return (
//     <Form {...form}>
//       <form
//         onSubmit={form.handleSubmit(onSubmit)}
//         className="max-w-6xl mx-auto pb-20"
//       >
//         {/* Header Section */}
//         <div className="flex items-center justify-between gap-4 mb-8 border-b pb-4 border-zinc-100 dark:border-zinc-800">
//           <div>
//             <h2 className="text-xl font-bold tracking-tight">
//               Basic Specifications
//             </h2>
//           </div>
//           <div className="flex items-center gap-3">
//             <Button type="submit" disabled={pending} className="min-w-30">
//               {pending ? (
//                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//               ) : (
//                 <Save className="mr-2 h-4 w-4" />
//               )}
//               Save Changes
//             </Button>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//           {/* Main Content Column */}
//           <div className="lg:col-span-2 space-y-8">
//             <Card>
//               <CardContent className="space-y-6">
//                 <FormField
//                   control={form.control}
//                   name="title"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Course Title</FormLabel>
//                       <FormControl>
//                         <div className="relative">
//                           <Input
//                             placeholder="e.g. Advanced React Patterns"
//                             {...field}
//                             onChange={(e) => {
//                               field.onChange(e);
//                               form.setValue(
//                                 "slug",
//                                 slugify(e.target.value, { lower: true }),
//                                 { shouldValidate: true },
//                               );
//                             }}
//                           />
//                           {/* Italicized live slug preview at the bottom right */}
//                           {currentSlug && (
//                             <div className="text-right mt-1.5">
//                               <span className="text-xs italic text-muted-foreground bg-muted/40 px-2 py-0.5 rounded">
//                                 {currentSlug}
//                               </span>
//                             </div>
//                           )}
//                         </div>
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 <FormField
//                   control={form.control}
//                   name="smallDescription"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Short Summary</FormLabel>
//                       <FormControl>
//                         <Textarea
//                           placeholder="Briefly describe what this course covers..."
//                           className="resize-none h-24"
//                           {...field}
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader>
//                 <CardTitle>Detailed Content</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <FormField
//                   control={form.control}
//                   name="description"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormControl>
//                         <RichTextEditor field={field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </CardContent>
//             </Card>
//           </div>

//           {/* Sidebar Column */}
//           <div className="space-y-8">
//             <Card>
//               <CardHeader>
//                 <CardTitle>Course Thumbnail</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <FormField
//                   control={form.control}
//                   name="fileKey"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormControl>
//                         <ImageUploader
//                           onChange={(file) => {
//                             setSelectedImage(file);
//                             form.setValue("fileKey", file ? file.name : "");
//                           }}
//                           // ✅ FIX: Cast through unknown to avoid the 'unexpected any' lint error
//                           value={field.value as unknown as File}
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader>
//                 <CardTitle>Organization & Pricing</CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-6">
//                 {/* ✅ Wrap both fields in a grid to align them horizontally with equal width */}
//                 <div className="grid grid-cols-2 gap-4">
//                   <FormField
//                     control={form.control}
//                     name="category"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel className="flex items-center gap-2">
//                           <LayoutGrid className="h-4 w-4 text-muted-foreground" />{" "}
//                           Category
//                         </FormLabel>
//                         <Select
//                           onValueChange={field.onChange}
//                           defaultValue={field.value}
//                         >
//                           <FormControl>
//                             <SelectTrigger>
//                               <SelectValue placeholder="Select Category" />
//                             </SelectTrigger>
//                           </FormControl>
//                           <SelectContent>
//                             {courseCategories.map((c) => (
//                               <SelectItem key={c} value={c}>
//                                 {c}
//                               </SelectItem>
//                             ))}
//                           </SelectContent>
//                         </Select>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                 </div>

//                 <div className="grid grid-cols-2 gap-4">
//                   <FormField
//                     control={form.control}
//                     name="price"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel className="flex items-center gap-2">
//                           <DollarSign className="h-4 w-4 text-muted-foreground" />{" "}
//                           Price
//                         </FormLabel>
//                         <FormControl>
//                           <Input
//                             type="number"
//                             {...field}
//                             // Parse string input to number before sending to React Hook Form
//                             onChange={(e) => {
//                               const val = e.target.value;
//                               field.onChange(val === "" ? 0 : Number(val));
//                             }}
//                           />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                   <FormField
//                     control={form.control}
//                     name="duration"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel className="flex items-center gap-2">
//                           <Clock className="h-4 w-4 text-muted-foreground" />{" "}
//                           Hours
//                         </FormLabel>
//                         <FormControl>
//                           <Input
//                             type="number"
//                             {...field}
//                             value={field.value ?? ""}
//                             onChange={(e) => {
//                               const val = e.target.value;
//                               field.onChange(val === "" ? null : Number(val));
//                             }}
//                           />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         </div>
//       </form>
//     </Form>
//   );
// }

// "use client";

// import { useTransition } from "react";
// import { useRouter } from "next/navigation";
// import { useForm, Resolver, useWatch } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import slugify from "slugify";
// import { toast } from "sonner";
// import { Loader2, Save, LayoutGrid, DollarSign, Clock } from "lucide-react";
// import {
//   productCategories,
//   productSchema,
//   ProductSchemaType,
//   productStatus,
// } from "@/lib/zodSchemas";
// import { tryCatch } from "@/hooks/try-catch";
// import { AdminProductSingularType } from "@/app/actions/educator-get-product";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/app/_components/ui/form";
// import { Input } from "@/app/_components/ui/input";
// import { Textarea } from "@/app/_components/ui/textarea";
// import { RichTextEditor } from "@/app/_components/rich-text-editor/Editor";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/app/_components/ui/select";
// import { Button } from "@/app/_components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
//   CardDescription,
// } from "@/app/_components/ui/card";
// import { Separator } from "@/app/_components/ui/separator";
// import { editProduct } from "../actions/educator-edit-product";
// import { ImageUploader } from "./file-uploader/Uploader";

// interface iAppProps {
//   data: AdminProductSingularType;
// }

// export function EditProductForm({ data }: iAppProps) {
//   const [pending, startTransition] = useTransition();
//   const router = useRouter();

//   const form = useForm<ProductSchemaType>({
//     resolver: zodResolver(productSchema) as Resolver<ProductSchemaType>,
//     defaultValues: {
//       title: data.title,
//       description: data.description,
//       fileKey: data.fileKey,
//       price: data.price,
//       duration: data.duration,
//       category: data.category as ProductSchemaType["category"],
//       status: data.status,
//       slug: data.slug,
//       smallDescription: data.smallDescription,
//     },
//   });

//   const currentSlug = useWatch({
//     control: form.control,
//     name: "slug",
//   });

//   async function onSubmit(values: ProductSchemaType) {
//     startTransition(async () => {
//       const { data: result, error } = await tryCatch(
//         editProduct(values, data.id),
//       );

//       if (error) {
//         toast.error("An unexpected error occurred.");
//         return;
//       }

//       if (result.status === "success") {
//         toast.success(result.message);
//         router.push("/educator/courses");
//         router.refresh();
//       } else {
//         toast.error(result.message);
//       }
//     });
//   }

//   return (
//     <Form {...form}>
//       <form
//         onSubmit={form.handleSubmit(onSubmit)}
//         className="max-w-6xl mx-auto pb-20"
//       >
//         {/* Header Section */}
//         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
//           <div>
//             <h1 className="text-3xl font-bold tracking-tight">Edit Course</h1>
//             <p className="text-muted-foreground">
//               Update your course details and settings.
//             </p>
//           </div>
//           <div className="flex items-center gap-3">
//             <Button
//               variant="outline"
//               type="button"
//               onClick={() => router.back()}
//             >
//               Cancel
//             </Button>
//             <Button type="submit" disabled={pending} className="min-w-30">
//               {pending ? (
//                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//               ) : (
//                 <Save className="mr-2 h-4 w-4" />
//               )}
//               Save Changes
//             </Button>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//           {/* Main Content Column */}
//           <div className="lg:col-span-2 space-y-8">
//             <Card>
//               <CardContent className="space-y-6">
//                 <FormField
//                   control={form.control}
//                   name="title"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Course Title</FormLabel>
//                       <FormControl>
//                         <div className="relative">
//                           <Input
//                             placeholder="e.g. Advanced React Patterns"
//                             {...field}
//                             onChange={(e) => {
//                               field.onChange(e);
//                               form.setValue(
//                                 "slug",
//                                 slugify(e.target.value, { lower: true }),
//                                 { shouldValidate: true },
//                               );
//                             }}
//                           />
//                           {/* Italicized live slug preview at the bottom right */}
//                           {currentSlug && (
//                             <div className="text-right mt-1.5">
//                               <span className="text-xs italic text-muted-foreground bg-muted/40 px-2 py-0.5 rounded">
//                                 {currentSlug}
//                               </span>
//                             </div>
//                           )}
//                         </div>
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 <FormField
//                   control={form.control}
//                   name="smallDescription"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Short Summary</FormLabel>
//                       <FormControl>
//                         <Textarea
//                           placeholder="Briefly describe what this course covers..."
//                           className="resize-none h-24"
//                           {...field}
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader>
//                 <CardTitle>Detailed Content</CardTitle>
//                 <CardDescription>
//                   Provide a full curriculum and learning outcomes.
//                 </CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <FormField
//                   control={form.control}
//                   name="description"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormControl>
//                         <RichTextEditor field={field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </CardContent>
//             </Card>
//           </div>

//           {/* Sidebar Column */}
//           <div className="space-y-8">
//             <Card>
//               <CardHeader>
//                 <CardTitle>Course Image</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <FormField
//                   control={form.control}
//                   name="fileKey"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormControl>
//                         {/* ✅ FIX: Avoids 'any' by using unknown-to-File casting contract */}
//                         <ImageUploader
//                           onChange={field.onChange}
//                           value={field.value as unknown as File}
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader>
//                 <CardTitle>Organization & Pricing</CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-6">
//                 <FormField
//                   control={form.control}
//                   name="category"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel className="flex items-center gap-2">
//                         <LayoutGrid className="h-4 w-4 text-muted-foreground" />{" "}
//                         Category
//                       </FormLabel>
//                       <Select
//                         onValueChange={field.onChange}
//                         defaultValue={field.value}
//                       >
//                         <FormControl>
//                           <SelectTrigger>
//                             <SelectValue placeholder="Select Category" />
//                           </SelectTrigger>
//                         </FormControl>
//                         <SelectContent>
//                           {productCategories.map((c) => (
//                             <SelectItem key={c} value={c}>
//                               {c}
//                             </SelectItem>
//                           ))}
//                         </SelectContent>
//                       </Select>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 <div className="grid grid-cols-2 gap-4">
//                   <FormField
//                     control={form.control}
//                     name="price"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel className="flex items-center gap-2">
//                           <DollarSign className="h-4 w-4 text-muted-foreground" />{" "}
//                           Price
//                         </FormLabel>
//                         <FormControl>
//                           <Input type="number" {...field} />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                   <FormField
//                     control={form.control}
//                     name="duration"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel className="flex items-center gap-2">
//                           <Clock className="h-4 w-4 text-muted-foreground" />{" "}
//                           Hours
//                         </FormLabel>
//                         <FormControl>
//                           <Input
//                             type="number"
//                             {...field}
//                             // Fallback null to an empty string so the HTML input stays happy
//                             value={field.value ?? ""}
//                             // Safely handle number conversions on change
//                             onChange={(e) => {
//                               const val = e.target.value;
//                               field.onChange(val === "" ? null : Number(val));
//                             }}
//                           />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                 </div>

//                 <Separator />

//                 <FormField
//                   control={form.control}
//                   name="status"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Publishing Status</FormLabel>
//                       <Select
//                         onValueChange={field.onChange}
//                         defaultValue={field.value}
//                       >
//                         <FormControl>
//                           <SelectTrigger>
//                             <SelectValue placeholder="Status" />
//                           </SelectTrigger>
//                         </FormControl>
//                         <SelectContent>
//                           {productStatus.map((s) => (
//                             <SelectItem key={s} value={s}>
//                               {s}
//                             </SelectItem>
//                           ))}
//                         </SelectContent>
//                       </Select>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </CardContent>
//             </Card>
//           </div>
//         </div>
//       </form>
//     </Form>
//   );
// }
