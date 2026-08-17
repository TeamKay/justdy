"use client";

import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "../ui/card"; // Adjust paths as necessary
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { X, Plus } from "lucide-react";
import { uploadFiles } from "@/lib/uploadthing";
import { Upload, FileCheck } from "lucide-react";
import { Input } from "@/app/_components/ui/input";

interface UploaderProps {
  onChange: (value: string | null) => void;
  value?: string | null;
}

interface MultiUploaderProps {
  value: (File | string)[];
  onChange: (files: (File | string)[]) => void;
  maxFiles?: number;
}

export interface FileDetails {
  key: string;
  type: string;
  size: number;
}

export type PreviewItem = {
  id: string;
  url: string;
  origin: File | string;
};

export function ImageUploader({ onChange, value }: UploaderProps) {
  // 1. Keep track of the last value we rendered to detect prop changes inline
  const [prevValue, setPrevValue] = useState<File | string | null | undefined>(
    value,
  );

  // Safe helper to check if value is a real URL string
  const isUrl = (val: unknown): val is string => {
    return (
      typeof val === "string" && (val.startsWith("http") || val.startsWith("/"))
    );
  };

  const [preview, setPreview] = useState<string | null>(
    isUrl(value) ? value : null,
  );

  // 2. Inline synchronization (React Compiler-approved pattern)
  if (value !== prevValue) {
    setPrevValue(value);
    // Only update preview if the value is an actual URL or path, not a simple filename string
    if (isUrl(value)) {
      setPreview(value);
    } else if (!value) {
      setPreview(null);
    }
  }

  // 3. Keep ONLY the cleanup effect for local blob URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    maxFiles: 1,
    multiple: false,
    onDrop: async (files) => {
      const file = files[0];
      if (!file) return;
      setPreview(URL.createObjectURL(file));

      try {
        const result = await uploadFiles("mediaUploader", {
          files: [file],
        });

        onChange(result[0].url);
      } catch (error) {
        console.error("Image upload failed:", error);
      }
    },
    // onDrop: (files) => {
    //   const selectedFile = files[0] || null;
    //   if (selectedFile) {
    //     setPreview(URL.createObjectURL(selectedFile));
    //   } else {
    //     setPreview(null);
    //   }
    //   onChange(selectedFile);
    // },
  });

  return (
    <Card
      {...getRootProps()}
      className={cn(
        "relative border-2 border-dashed w-full h-64 cursor-pointer transition-colors overflow-hidden",
        isDragActive
          ? "border-primary bg-primary/10"
          : "border-border hover:border-primary",
      )}
    >
      <CardContent className="flex items-center justify-center h-full w-full p-0 relative">
        <input {...getInputProps()} />
        {!preview ? (
          <p className="text-muted-foreground p-4">Drag Profile Image Here</p>
        ) : (
          <div className="relative w-full h-full">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-cover"
              unoptimized={preview.startsWith("blob:")}
            />
            {/* Optional: Add a small reset button over the preview if desired */}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function VideoUploader({ onChange, value }: UploaderProps) {
  const [preview, setPreview] = useState<string | null>(
    typeof value === "string" ? value : null,
  );

  const displayPreview = preview ?? (typeof value === "string" ? value : null);

  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "video/mp4": [],
      "video/webm": [],
      "video/quicktime": [],
    },
    maxFiles: 1,
    multiple: false,

    onDrop: async (files) => {
      const file = files[0];

      if (!file) return;

      const localPreview = URL.createObjectURL(file);

      // Show local preview immediately
      setPreview(localPreview);

      try {
        const result = await uploadFiles("mediaUploader", {
          files: [file],
        });

        const uploadedFile = result[0];

        // Store UploadThing URL in react-hook-form
        onChange(uploadedFile.url);

        // Replace blob preview with permanent URL
        setPreview(uploadedFile.url);
      } catch (error) {
        console.error("Video upload failed:", error);
        setPreview(null);
        onChange(null);
      }
    },
  });

  return (
    <Card
      {...getRootProps()}
      className={cn(
        "relative border-2 border-dashed w-full h-64 cursor-pointer transition-colors",
        isDragActive
          ? "border-primary bg-primary/10"
          : "border-border hover:border-primary",
      )}
    >
      <CardContent className="flex items-center justify-center h-full w-full p-4">
        <input {...getInputProps()} />

        {!displayPreview ? (
          <div className="text-center text-muted-foreground">
            <p>Drag Intro Video Here</p>
            <p className="text-xs mt-1">MP4, MOV, WEBM</p>
          </div>
        ) : (
          <video
            src={displayPreview}
            controls
            className="w-full h-full rounded object-cover"
          />
        )}
      </CardContent>
    </Card>
  );
}

export function MultiImageUploader({
  value,
  onChange,
  maxFiles = 6,
}: MultiUploaderProps) {
  const formatImageUrl = (item: string): string => {
    if (!item) return "";

    // Already a complete URL, blob URL, or base64 image
    if (
      item.startsWith("http://") ||
      item.startsWith("https://") ||
      item.startsWith("blob:") ||
      item.startsWith("data:")
    ) {
      return item;
    }

    // UploadThing key
    //
    // Database values such as:
    // abc123xyz456
    //
    // should become:
    // https://utfs.io/f/abc123xyz456
    if (!item.startsWith("/")) {
      return `https://utfs.io/f/${item}`;
    }

    // Local public-folder asset
    return item;
  };

  const previews = useMemo<PreviewItem[]>(() => {
    return value.flatMap((item, index): PreviewItem[] => {
      if (!item) return [];

      if (typeof item === "string") {
        const url = formatImageUrl(item);

        if (!url) return [];

        return [
          {
            id: `url-${index}-${item}`,
            url,
            origin: item,
          },
        ];
      }

      if (item instanceof File) {
        return [
          {
            id: `file-${index}-${item.name}-${item.lastModified}`,
            url: URL.createObjectURL(item),
            origin: item,
          },
        ];
      }

      return [];
    });
  }, [value]);

  // Clean up temporary blob URLs
  useEffect(() => {
    return () => {
      previews.forEach((preview) => {
        if (preview.url.startsWith("blob:")) {
          URL.revokeObjectURL(preview.url);
        }
      });
    };
  }, [previews]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [],
    },
    maxFiles: Math.max(0, maxFiles - value.length),
    disabled: value.length >= maxFiles,

    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;

      const updatedList = [...value, ...acceptedFiles].slice(0, maxFiles);

      onChange(updatedList);
    },
  });

  const removeImage = (idToRemove: string) => {
    const itemToRemove = previews.find((preview) => preview.id === idToRemove);

    if (!itemToRemove) return;

    const nextValue = value.filter((item) => item !== itemToRemove.origin);

    onChange(nextValue);
  };

  return (
    <div className="space-y-4 w-full">
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        {previews.map((previewItem) => {
          const isRemoteImage =
            previewItem.url.startsWith("https://") ||
            previewItem.url.startsWith("http://");

          const isBlobImage = previewItem.url.startsWith("blob:");

          const isDataImage = previewItem.url.startsWith("data:");

          return (
            <div
              key={previewItem.id}
              className="relative group aspect-square rounded-xl border border-border/80 overflow-hidden bg-muted shadow-2xs transition-all hover:border-primary/50"
            >
              {previewItem.url ? (
                <Image
                  src={previewItem.url}
                  alt="Product Preview Element"
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  unoptimized={isRemoteImage || isBlobImage || isDataImage}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted text-xs text-muted-foreground">
                  Invalid Image
                </div>
              )}

              <button
                type="button"
                onClick={() => removeImage(previewItem.id)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur-xs text-foreground hover:bg-destructive hover:text-destructive-foreground transition-all shadow-md opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label="Remove image"
              >
                <X className="size-3.5" />
              </button>
            </div>
          );
        })}

        {value.length < maxFiles && (
          <div
            {...getRootProps()}
            className={cn(
              "relative group aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all bg-muted/30 overflow-hidden",
              isDragActive
                ? "border-primary bg-primary/5 scale-[0.99]"
                : "border-border/80 hover:border-primary hover:bg-muted/60",
            )}
          >
            <input {...getInputProps()} />

            <div className="size-10 rounded-full bg-background border border-border/80 flex items-center justify-center shadow-2xs mb-2 transition-transform group-hover:scale-110">
              <Plus className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>

            <p className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              Add Image
            </p>

            <p className="text-[10px] text-muted-foreground/60 mt-0.5">
              {maxFiles - value.length} left
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function SingleFileUploader({
  value,
  onChange,
}: {
  value: string;
  onChange: (
    fileInfo: {
      key: string;
      type: string;
      size: number;
      name: string;
    } | null,
    rawFile?: File | null,
  ) => void;
}) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    console.log("Selected deliverable:", {
      name: file.name,
      type: file.type,
      size: file.size,
      sizeMB: (file.size / 1024 / 1024).toFixed(2),
    });

    onChange(
      {
        key: file.name,
        name: file.name,
        type: file.type || "application/octet-stream",
        size: file.size,
      },
      file,
    );
  };

  return (
    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-accent/50 transition-colors">
      <Input
        type="file"
        id="digital-file-upload"
        className="hidden"
        onChange={handleFileChange}
      />

      <label
        htmlFor="digital-file-upload"
        className="cursor-pointer flex flex-col items-center justify-center gap-2"
      >
        {value ? (
          <>
            <FileCheck className="size-8 text-green-500" />

            <span className="text-sm font-medium text-foreground">
              File Selected
            </span>

            <span className="text-xs text-muted-foreground truncate max-w-xs">
              {value}
            </span>

            <span className="text-xs text-primary underline mt-1">
              Click to replace file
            </span>
          </>
        ) : (
          <>
            <Upload className="size-8 text-muted-foreground" />

            <span className="text-sm font-medium">
              Click to upload product file
            </span>

            <span className="text-xs text-muted-foreground">
              ZIP, PDF, MP4, RAR up to 512MB
            </span>
          </>
        )}
      </label>
    </div>
  );
}
