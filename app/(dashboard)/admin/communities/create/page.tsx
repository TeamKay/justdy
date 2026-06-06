"use client";

import {
  CommunitySchemaType,
  communityCategories,
  communitySchema,
} from "@/lib/zodSchemas";

import { ArrowLeft, Loader2, SendHorizonal } from "lucide-react";
import Link from "next/link";
import { useForm, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { useConfetti } from "@/hooks/use-confetti";
import { useUploadThing } from "@/lib/uploadthing";

import { createCommunity } from "@/app/actions/admin-communities";

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

export default function CommunityCreationPage() {
  const router = useRouter();
  const { triggerConfetti } = useConfetti();

  const { startUpload } = useUploadThing("mediaUploader");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);

  const form = useForm<CommunitySchemaType>({
    resolver: zodResolver(communitySchema) as Resolver<CommunitySchemaType>,
    defaultValues: {
      name: "",
      smallDescription: "",
      description: "",
      category: "",
      fileKey: "",
      videoKey: "",
      price: 0,
      slug: "",
    },
  });

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  async function handleProcess(values: CommunitySchemaType) {
    if (!selectedImage) {
      toast.error("Please upload a thumbnail image.");
      return;
    }

    setIsSubmitting(true);

    try {
      // IMAGE UPLOAD
      setLoadingMessage("Uploading thumbnail...");

      const uploadedImages = await startUpload([selectedImage]).catch((err) => {
        console.error("IMAGE UPLOAD ERROR:", err);
        throw err;
      });

      if (!uploadedImages?.length) {
        throw new Error("Image upload failed");
      }

      const imageKey = uploadedImages[0].key;

      // VIDEO UPLOAD (OPTIONAL)
      let videoKey = "";

      if (selectedVideo) {
        setLoadingMessage("Uploading intro video...");

        const uploadedVideos = await startUpload([selectedVideo]).catch(
          (err) => {
            console.error("VIDEO UPLOAD ERROR:", err);
            throw err;
          },
        );

        if (!uploadedVideos?.length) {
          throw new Error("Video upload failed");
        }

        videoKey = uploadedVideos[0].key;
      }

      // CREATE COMMUNITY
      setLoadingMessage("Creating community...");

      const result = await createCommunity({
        ...values,
        fileKey: imageKey,
        videoKey,
      });

      if (result.status === "success") {
        toast.success("Community created successfully!");

        triggerConfetti();

        form.reset();
        setSelectedImage(null);
        setSelectedVideo(null);

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
        onSubmit={form.handleSubmit(handleProcess)}
        className="max-w-6xl mx-auto px-4 md:px-0 pb-20 pt-5 space-y-8"
      >
        {/* HEADER */}
        <div className="flex justify-between items-center">
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

            <h1 className="text-3xl font-bold">Create Community</h1>
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
                Submit
              </>
            )}
          </Button>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-6">
                {/* NAME */}
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
            {/* THUMBNAIL */}
            <ImageUploader
              onChange={(file) => {
                setSelectedImage(file);
                form.setValue("fileKey", file ? file.name : "");
              }}
            />

            {/* VIDEO */}
            <VideoUploader
              onChange={(file) => {
                setSelectedVideo(file);
                form.setValue("videoKey", file ? file.name : "");
              }}
            />

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
