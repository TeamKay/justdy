"use client";

import {
  CommunitySchemaType,
  communityCategories,
  communitySchema,
} from "@/lib/zodSchemas";

import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useForm, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useConfetti } from "@/hooks/use-confetti";
import { useUploadThing } from "@/lib/uploadthing";
import { updateCommunity } from "@/app/actions/admin-communities";
import { Button, buttonVariants } from "@/app/_components/ui/button";
import { Card, CardContent } from "@/app/_components/ui/card";
import Image from "next/image";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import {
  ImageUploader,
  VideoUploader,
} from "@/app/_components/file-uploader/Uploader";

interface Community {
  id: string;
  name: string;
  smallDescription: string | null; // ✅ added
  description: string | null;
  category: string;
  fileKey: string | null;
  videoKey: string | null; // ✅ added
  price: number | null;
  slug?: string | null; // ✅ added
}

interface CommunityEditFormProps {
  initialData: Community;
}

export default function CommunityEditForm({
  initialData,
}: CommunityEditFormProps) {
  const router = useRouter();
  const { triggerConfetti } = useConfetti();
  const { startUpload } = useUploadThing("mediaUploader");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);

  const existingImageUrl = initialData.fileKey
    ? `https://utfs.io/f/${initialData.fileKey}`
    : null;

  const existingVideoUrl = initialData.videoKey
    ? `https://utfs.io/f/${initialData.videoKey}`
    : null;

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  const form = useForm<CommunitySchemaType>({
    resolver: zodResolver(communitySchema) as Resolver<CommunitySchemaType>,
    defaultValues: {
      name: initialData.name,
      smallDescription: initialData.smallDescription || "", // ✅ added
      description:
        typeof initialData.description === "object"
          ? JSON.stringify(initialData.description)
          : initialData.description || "",
      category: initialData.category,
      fileKey: initialData.fileKey || "",
      videoKey: initialData.videoKey || "", // ✅ added
      price: initialData.price || 0,
      slug: initialData.slug || slugify(initialData.name), // ✅ added
    },
  });

  async function handleProcess(values: CommunitySchemaType) {
    console.log("SUBMIT FIRED");

    setIsSubmitting(true);

    let fileKey = initialData.fileKey;
    let videoKey = initialData.videoKey || "";

    try {
      // IMAGE
      if (selectedFile) {
        setLoadingMessage("Uploading image...");

        const uploaded = await startUpload([selectedFile]);
        if (!uploaded?.length) throw new Error("Image upload failed");

        fileKey = uploaded[0].key;
      }

      // VIDEO (MISSING IN YOUR CODE)
      if (selectedVideo) {
        setLoadingMessage("Uploading video...");

        const uploadedVideo = await startUpload([selectedVideo]);
        if (!uploadedVideo?.length) throw new Error("Video upload failed");

        videoKey = uploadedVideo[0].key;
      }

      setLoadingMessage("Updating community...");

      const result = await updateCommunity(initialData.id, {
        ...values,
        fileKey,
        videoKey, // 🔥 IMPORTANT FIX
        slug: values.slug || slugify(values.name),
      });

      if (result.status === "success") {
        toast.success("Community updated successfully!");
        triggerConfetti();
        router.push("/admin/communities");
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
        className="w-full px-4 md:px-8 pb-20 pt-5"
        onSubmit={form.handleSubmit(handleProcess)}
      >
        <div className="flex justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/communities"
              className={buttonVariants({
                variant: "secondary",
                size: "icon",
              })}
            >
              <ArrowLeft className="size-5" />
            </Link>

            <h1 className="text-3xl font-bold">Edit Community</h1>
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin size-4" />
                <span>{loadingMessage || "Saving..."}</span>
              </div>
            ) : (
              <>
                <Save className="mr-2 size-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="pt-0 space-y-6">
                {/* NAME (auto-updates slug) */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Community Name</FormLabel>

                      <FormControl>
                        <Input
                          {...field}
                          disabled={isSubmitting}
                          onChange={(e) => {
                            const value = e.target.value;

                            field.onChange(value);

                            form.setValue("slug", slugify(value));
                          }}
                        />
                      </FormControl>

                      <p className="text-xs text-muted-foreground">
                        URL:
                        <span className="font-mono ml-1">
                          {form.watch("slug")}
                        </span>
                      </p>

                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* SHORT DESCRIPTION (NEW FIELD) */}
                <FormField
                  control={form.control}
                  name="smallDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Small Description</FormLabel>

                      <FormControl>
                        <Input
                          {...field}
                          disabled={isSubmitting}
                          placeholder="Brief summary of your community"
                          maxLength={500}
                        />
                      </FormControl>

                      <p className="text-xs text-muted-foreground">
                        This appears in community listings and cards.
                      </p>

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

          {/* RIGHT */}
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="relative w-full h-40 overflow-hidden rounded-xl group border">
                {selectedFile ? (
                  <Image
                    src={URL.createObjectURL(selectedFile)}
                    alt="New Thumbnail"
                    fill
                    className="object-cover"
                  />
                ) : existingImageUrl ? (
                  <Image
                    src={existingImageUrl}
                    alt="Current Thumbnail"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No image
                  </div>
                )}

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-60 transition flex items-center justify-center">
                  <ImageUploader
                    onChange={(file) => {
                      setSelectedFile(file);
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative w-full aspect-video rounded-xl overflow-hidden border bg-black">
                {selectedVideo ? (
                  <video
                    src={URL.createObjectURL(selectedVideo)}
                    controls
                    className="w-full h-full object-cover"
                  />
                ) : existingVideoUrl ? (
                  <video
                    src={existingVideoUrl}
                    controls
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No video uploaded
                  </div>
                )}

                {/* overlay replace button */}
                <div className="absolute inset-0 opacity-0 hover:opacity-100 transition flex items-center justify-center bg-black/40">
                  <VideoUploader
                    onChange={(file) => {
                      setSelectedVideo(file);
                      form.setValue("videoKey", file?.name || "");
                    }}
                  />
                </div>
              </div>
            </div>

            {/* SETTINGS */}
            <Card>
              <CardContent className="pt-0 flex flex-col sm:flex-row gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {communityCategories.map((c) => (
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

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem className="flex-1">
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
