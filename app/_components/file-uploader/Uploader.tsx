"use client";

import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "../ui/card"; // Adjust paths as necessary
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { X, UploadCloud } from "lucide-react";
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

interface SingleFileUploaderProps {
  value: string;
  onChange: (details: FileDetails) => void;
}

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

    // Absolute URLs, local blobs, or inline base64
    if (
      item.startsWith("http://") ||
      item.startsWith("https://") ||
      item.startsWith("blob:") ||
      item.startsWith("data:")
    ) {
      return item;
    }

    // UploadThing public CDN handling (if using UploadThing keys)
    if (item.startsWith("utfs.io") || item.startsWith("uploadthing")) {
      return `https://utfs.io/f/${item}`;
    }

    // Local public folder assets
    return item.startsWith("/") ? item : `/${item}`;
  };

  // Compute previews with explicit PreviewItem return types inside flatMap
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

  // Memory cleanup for local blob URLs
  useEffect(() => {
    return () => {
      previews.forEach((p) => {
        if (p.url.startsWith("blob:")) {
          URL.revokeObjectURL(p.url);
        }
      });
    };
  }, [previews]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    maxFiles: maxFiles - value.length,
    disabled: value.length >= maxFiles,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;

      const updatedList = [...value, ...acceptedFiles].slice(0, maxFiles);
      onChange(updatedList);
    },
  });

  const removeImage = (idToRemove: string) => {
    const itemToFilter = previews.find((p) => p.id === idToRemove);
    if (!itemToFilter) return;

    const nextValue = value.filter((item) => item !== itemToFilter.origin);
    onChange(nextValue);
  };

  return (
    <div className="space-y-4 w-full">
      {value.length < maxFiles && (
        <Card
          {...getRootProps()}
          className={cn(
            "relative border-2 border-dashed w-full h-40 cursor-pointer transition-colors overflow-hidden",
            isDragActive
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary",
          )}
        >
          <CardContent className="flex flex-col items-center justify-center h-full w-full p-4 text-center">
            <input {...getInputProps()} />
            <UploadCloud className="size-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium text-muted-foreground">
              Drag Showcase Images Here
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Supports PNG, JPG, WebP (Up to {maxFiles - value.length} more)
            </p>
          </CardContent>
        </Card>
      )}

      {previews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {previews.map((previewItem) => (
            <div
              key={previewItem.id}
              className="relative group aspect-square rounded-lg border border-border/80 overflow-hidden bg-muted"
            >
              {previewItem.url ? (
                <Image
                  src={previewItem.url}
                  alt="Product Preview Element"
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  unoptimized={
                    previewItem.url.startsWith("blob:") ||
                    previewItem.url.startsWith("data:")
                  }
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted text-xs text-muted-foreground">
                  Invalid Image
                </div>
              )}

              <button
                type="button"
                onClick={() => removeImage(previewItem.id)}
                className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 text-white hover:bg-black transition-colors shadow-md"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SingleFileUploader({
  value,
  onChange,
}: SingleFileUploaderProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // TODO: Connect this to your actual file upload logic (Uploadthing, S3, Cloudflare R2, etc.)
    // For now, this captures metadata and simulates returning a file key:
    const mockKey = `uploads/${Date.now()}-${file.name}`;

    onChange({
      key: mockKey,
      type: file.type || file.name.split(".").pop() || "unknown",
      size: file.size,
    });
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
              File Selected / Uploaded
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
              ZIP, PDF, MP4, RAR up to 500MB
            </span>
          </>
        )}
      </label>
    </div>
  );
}
