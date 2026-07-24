"use client";

import { useState, useTransition } from "react";
import {
  Save,
  ImageIcon,
  Send,
  FileUp,
  HardDrive,
  Loader2,
  CheckCircle2,
  Clock,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { Label } from "@/app/_components/ui/label";
import { Textarea } from "@/app/_components/ui/textarea";
import { RichTextEditor } from "@/app/_components/rich-text-editor/Editor";
import { updateDigitalProduct } from "../actions/educator-update-digital-product";
import {
  MultiImageUploader,
  SingleFileUploader,
} from "./file-uploader/Uploader";
import { submitProductForReview } from "../actions/submit-for-review";
import { uploadFiles } from "@/lib/uploadthing";

export interface DigitalImageItem {
  id?: string;
  imageKey: string | File;
  position: number;
}

interface FileDetails {
  key: string;
  type: string;
  size: number;
}

interface DifitalProductType {
  id: string;
  title: string;
  smallDescription: string;
  description: string | null;
  price: number;
  images?: string[];
  status: string;
  digitalProduct?: {
    id: string;
    fileKey: string;
    fileType: string;
    fileSize: number;
    images: DigitalImageItem[];
  } | null;
}

interface EditDigitalProductPageProps {
  data: DifitalProductType;
}

// Helper functions to handle both { status, message } and { success, error } response formats safely
function isActionSuccess(res: Record<string, unknown>): boolean {
  if ("status" in res) return res.status === "success";
  if ("success" in res) return Boolean(res.success);
  return false;
}

function getActionMessage(
  res: Record<string, unknown>,
  fallback: string,
): string {
  if ("message" in res && typeof res.message === "string" && res.message)
    return res.message;
  if ("error" in res && typeof res.error === "string" && res.error)
    return res.error;
  return fallback;
}

export function EditDigitalProduct({ data }: EditDigitalProductPageProps) {
  const [pending, startTransition] = useTransition();
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // Core Product States
  const [title, setTitle] = useState(data.title);
  const [smallDescription, setSmallDescription] = useState(
    data.smallDescription,
  );
  const [description, setDescription] = useState(data.description ?? "");
  const [price, setPrice] = useState((data.price / 100).toString());

  // DigitalProduct Specific States
  const [fileKey, setFileKey] = useState(data.digitalProduct?.fileKey ?? "");
  const [fileType, setFileType] = useState(data.digitalProduct?.fileType ?? "");
  const [fileSize, setFileSize] = useState<number>(
    data.digitalProduct?.fileSize ?? 0,
  );

  // Gallery Images State (contains both existing string keys and new File objects)
  const [images, setImages] = useState<DigitalImageItem[]>(
    data.digitalProduct?.images ?? [],
  );

  const processAndUploadImages = async (): Promise<string[] | null> => {
    const newFilesToUpload: File[] = [];
    const fileIndexes: number[] = [];

    images.forEach((img, idx) => {
      if (img.imageKey instanceof File) {
        newFilesToUpload.push(img.imageKey);
        fileIndexes.push(idx);
      }
    });

    if (newFilesToUpload.length === 0) {
      return images
        .map((img) => (typeof img.imageKey === "string" ? img.imageKey : ""))
        .filter(Boolean);
    }

    setIsUploadingImages(true);
    try {
      const uploadResults = await uploadFiles("mediaUploader", {
        files: newFilesToUpload,
      });

      const updatedImagesList = [...images];

      uploadResults.forEach((uploadedFile, i) => {
        const targetIndex = fileIndexes[i];
        updatedImagesList[targetIndex] = {
          ...updatedImagesList[targetIndex],
          imageKey: uploadedFile.url,
        };
      });

      setImages(updatedImagesList);

      return updatedImagesList
        .map((img) => (typeof img.imageKey === "string" ? img.imageKey : ""))
        .filter(Boolean);
    } catch (error) {
      console.error("Failed to upload showcase images:", error);
      toast.error("Failed to upload gallery images. Please try again.");
      return null;
    } finally {
      setIsUploadingImages(false);
    }
  };

  const extractKeyFromUrl = (url: string): string => {
    if (!url) return "";
    if (url.includes("/f/")) {
      return url.split("/f/").pop() || "";
    }
    return url;
  };

  const prepareProductData = (uploadedImageKeys: string[]) => {
    if (!title || !smallDescription || !description || !price) {
      toast.error("Please fill in all required basic information fields.");
      return null;
    }

    if (!fileKey) {
      toast.error("Please upload the main digital asset file.");
      return null;
    }

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      toast.error("Please enter a valid price.");
      return null;
    }

    const rawInitialImages =
      data.digitalProduct?.images
        ?.map((img: DigitalImageItem) => {
          if (typeof img.imageKey === "string") {
            return img.imageKey;
          }
          if (
            "url" in img &&
            typeof (img as Record<string, unknown>).url === "string"
          ) {
            return (img as Record<string, unknown>).url as string;
          }
          return "";
        })
        .filter(Boolean) || [];

    const initialKeys = rawInitialImages.map(extractKeyFromUrl);
    const currentKeys = uploadedImageKeys.map(extractKeyFromUrl);
    const keysToDelete = initialKeys.filter(
      (oldKey: string) => !currentKeys.includes(oldKey),
    );

    return {
      productId: data.id,
      title,
      smallDescription,
      description,
      price: Math.round(parseFloat(price) * 100),
      images: uploadedImageKeys,
      imagesToDelete: keysToDelete,
      digitalProduct: {
        fileKey,
        fileType,
        fileSize,
        images: uploadedImageKeys.map((key, index) => ({
          imageKey: key,
          position: index,
        })),
      },
    };
  };

  const handleSave = async () => {
    const uploadedImageKeys = await processAndUploadImages();
    if (!uploadedImageKeys) return;

    const payload = prepareProductData(uploadedImageKeys);
    if (!payload) return;

    startTransition(async () => {
      const result = await updateDigitalProduct(payload);

      if (isActionSuccess(result)) {
        toast.success(getActionMessage(result, "Draft saved successfully"));
      } else {
        toast.error(getActionMessage(result, "Failed to save draft"));
      }
    });
  };

  const handleSubmitForReview = async () => {
    const uploadedImageKeys = await processAndUploadImages();
    if (!uploadedImageKeys) return;

    const payload = prepareProductData(uploadedImageKeys);
    if (!payload) return;

    startTransition(async () => {
      const updateResult = await updateDigitalProduct(payload);

      if (!isActionSuccess(updateResult)) {
        toast.error(
          getActionMessage(
            updateResult,
            "Failed to save progress prior to review submission.",
          ),
        );
        return;
      }

      const reviewResult = await submitProductForReview(data.id);

      if (isActionSuccess(reviewResult)) {
        toast.success(
          getActionMessage(
            reviewResult,
            "Product submitted for review successfully!",
          ),
        );
      } else {
        toast.error(
          getActionMessage(reviewResult, "Failed to submit for review."),
        );
      }
    });
  };

  const statusLower = data.status.toLowerCase();
  const isSubmittedOrPublished =
    statusLower === "pending" || statusLower === "published";
  const isLoading = pending || isUploadingImages;

  const getStatusBadge = () => {
    switch (statusLower) {
      case "published":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="size-3.5" /> Published
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="size-3.5" /> In Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
            Draft
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-5 py-0 space-y-10">
      {/* SaaS Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Edit Product
            </h1>
            {getStatusBadge()}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={handleSave}
            className="h-9 px-4 font-medium transition-colors"
          >
            {isLoading ? (
              <Loader2 className="size-4 mr-2 animate-spin text-muted-foreground" />
            ) : (
              <Save className="size-4 mr-2 text-muted-foreground" />
            )}
            {isUploadingImages
              ? "Uploading..."
              : pending
                ? "Saving..."
                : "Save Draft"}
          </Button>

          <Button
            size="sm"
            disabled={isLoading || isSubmittedOrPublished}
            onClick={handleSubmitForReview}
            className="h-9 px-4 font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs transition-colors"
          >
            {isLoading ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <Send className="size-4 mr-2" />
            )}
            {isUploadingImages
              ? "Uploading..."
              : pending
                ? "Submitting..."
                : isSubmittedOrPublished
                  ? "Under Review"
                  : "Submit for Review"}
          </Button>
        </div>
      </div>

      {/* Main Form Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Main Content Area (8 Cols) */}
        <div className="lg:col-span-8 space-y-10">
          {/* General Information Section */}
          <section className="space-y-6">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label
                  htmlFor="title"
                  className="text-xs font-medium text-foreground"
                >
                  Product Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Design Systems Masterclass Handbook"
                  className="h-10 text-sm bg-background border-input focus-visible:ring-1"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="smallDescription"
                  className="text-xs font-medium text-foreground"
                >
                  Short Summary <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="smallDescription"
                  value={smallDescription}
                  onChange={(e) => setSmallDescription(e.target.value)}
                  placeholder="A concise 1-2 sentence pitch shown on catalog cards..."
                  rows={2}
                  className="resize-none text-sm bg-background border-input focus-visible:ring-1"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-foreground">
                  Detailed Description
                </Label>
                <div className="rounded-lg border border-input overflow-hidden bg-background">
                  <RichTextEditor
                    field={{
                      value: description,
                      onChange: (val: string) => setDescription(val),
                    }}
                  />
                </div>
              </div>
            </div>
          </section>

          <hr className="border-border/60" />

          {/* Digital Deliverable Section */}
          <section className="space-y-6">
            <div>
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <FileUp className="size-4 text-primary" />
                Source File
              </h2>
              <p className="text-xs text-muted-foreground">
                Upload the primary asset buyers receive after successful
                checkout.
              </p>
            </div>

            <div className="space-y-4">
              <SingleFileUploader
                value={fileKey}
                onChange={(fileDetails: FileDetails) => {
                  setFileKey(fileDetails.key);
                  setFileType(fileDetails.type);
                  setFileSize(fileDetails.size);
                }}
              />

              {fileKey && (
                <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-muted/30 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <HardDrive className="size-4 text-muted-foreground shrink-0" />
                    <span className="font-mono truncate text-foreground font-medium">
                      {fileKey}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground shrink-0 font-medium">
                    <span className="uppercase text-[10px] tracking-wider px-2 py-0.5 rounded bg-background border border-border">
                      {fileType || "FILE"}
                    </span>
                    <span>{(fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar Configuration (4 Cols) */}
        <div className="lg:col-span-4 space-y-8">
          {/* Pricing Section */}
          <section className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Pricing
              </h2>
              <p className="text-xs text-muted-foreground">
                Set the price customers will pay for access.
              </p>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="price"
                className="text-xs font-medium text-foreground"
              >
                Price (USD) <span className="text-destructive">*</span>
              </Label>
              <div className="relative rounded-md shadow-xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <DollarSign className="size-4 text-muted-foreground" />
                </div>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="pl-8 h-10 text-sm font-medium bg-background border-input"
                />
              </div>
            </div>
          </section>

          <hr className="border-border/60" />

          {/* Gallery Showcase Section */}
          <section className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <ImageIcon className="size-4 text-muted-foreground" />
                Showcase Gallery
              </h2>
              <p className="text-xs text-muted-foreground">
                Screenshots, previews, and promotional media.
              </p>
            </div>

            <div>
              <MultiImageUploader
                value={images.map((img) => img.imageKey)}
                onChange={(updatedItems) => {
                  setImages(
                    updatedItems.map((item, index) => ({
                      imageKey: item,
                      position: index,
                    })),
                  );
                }}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// "use client";

// import { useState, useTransition } from "react";
// import {
//   Save,
//   Image as ImageIcon,
//   Send,
//   FileUp,
//   HardDrive,
//   Loader2,
//   CheckCircle2,
//   Clock,
// } from "lucide-react";
// import { toast } from "sonner";
// import { Button } from "@/app/_components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/app/_components/ui/card";
// import { Input } from "@/app/_components/ui/input";
// import { Label } from "@/app/_components/ui/label";
// import { Textarea } from "@/app/_components/ui/textarea";
// import { RichTextEditor } from "@/app/_components/rich-text-editor/Editor";
// import { updateDigitalProduct } from "../actions/educator-update-digital-product";
// import {
//   MultiImageUploader,
//   SingleFileUploader,
// } from "./file-uploader/Uploader";
// import { submitProductForReview } from "../actions/submit-for-review";

// export interface DigitalImageItem {
//   id?: string;
//   imageKey: string | File;
//   position: number;
// }

// interface FileDetails {
//   key: string;
//   type: string;
//   size: number;
// }

// interface EducatorProductType {
//   id: string;
//   title: string;
//   smallDescription: string;
//   description: string | null;
//   price: number;
//   status: string;
//   digitalProduct?: {
//     id: string;
//     fileKey: string;
//     fileType: string;
//     fileSize: number;
//     images: DigitalImageItem[];
//   } | null;
// }

// interface EditDigitalProductPageProps {
//   data: EducatorProductType;
// }

// export function EditDigitalProduct({ data }: EditDigitalProductPageProps) {
//   const [pending, startTransition] = useTransition();

//   // Core Product States
//   const [title, setTitle] = useState(data.title);
//   const [smallDescription, setSmallDescription] = useState(
//     data.smallDescription,
//   );
//   const [description, setDescription] = useState(data.description ?? "");
//   const [price, setPrice] = useState((data.price / 100).toString());

//   // DigitalProduct Specific States
//   const [fileKey, setFileKey] = useState(data.digitalProduct?.fileKey ?? "");
//   const [fileType, setFileType] = useState(data.digitalProduct?.fileType ?? "");
//   const [fileSize, setFileSize] = useState<number>(
//     data.digitalProduct?.fileSize ?? 0,
//   );

//   // Gallery Images State
//   const [images, setImages] = useState<DigitalImageItem[]>(
//     data.digitalProduct?.images ?? [],
//   );

//   const prepareProductData = () => {
//     if (!title || !smallDescription || !description || !price) {
//       toast.error("Please fill in all required basic information fields.");
//       return null;
//     }

//     if (!fileKey) {
//       toast.error("Please upload the main digital asset file.");
//       return null;
//     }

//     // Filter down to valid string keys for backend submission
//     const imageKeys = images
//       .map((img) =>
//         typeof img.imageKey === "string" ? img.imageKey : img.imageKey.name,
//       )
//       .filter(Boolean);

//     return {
//       productId: data.id,
//       title,
//       smallDescription,
//       description,
//       price: Math.round(parseFloat(price) * 100),
//       images: imageKeys,
//       digitalProduct: {
//         fileKey,
//         fileType,
//         fileSize,
//         images: images.map((img, index) => ({
//           imageKey:
//             typeof img.imageKey === "string" ? img.imageKey : img.imageKey.name,
//           position: index,
//         })),
//       },
//     };
//   };

//   const handleSave = () => {
//     const payload = prepareProductData();
//     if (!payload) return;

//     startTransition(async () => {
//       const result = await updateDigitalProduct(payload);

//       if (result.status === "success") {
//         toast.success(result.message || "Draft saved successfully");
//       } else {
//         toast.error(result.message || "Failed to save draft");
//       }
//     });
//   };

//   const handleSubmitForReview = () => {
//     const payload = prepareProductData();
//     if (!payload) return;

//     startTransition(async () => {
//       const updateResult = await updateDigitalProduct(payload);

//       if (updateResult.status !== "success") {
//         toast.error("Failed to save progress prior to review submission.");
//         return;
//       }

//       const reviewResult = await submitProductForReview(data.id);

//       if (reviewResult.status === "success") {
//         toast.success("Product submitted for review successfully!");
//       } else {
//         toast.error(reviewResult.message || "Failed to submit for review.");
//       }
//     });
//   };

//   const statusLower = data.status.toLowerCase();
//   const isSubmittedOrPublished =
//     statusLower === "pending" || statusLower === "published";

//   const getStatusBadge = () => {
//     switch (statusLower) {
//       case "published":
//         return (
//           <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
//             <CheckCircle2 className="size-3.5" /> Published
//           </span>
//         );
//       case "pending":
//         return (
//           <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
//             <Clock className="size-3.5" /> In Review
//           </span>
//         );
//       default:
//         return (
//           <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
//             Draft
//           </span>
//         );
//     }
//   };

//   return (
//     <div className="min-h-screen bg-slate-50/50 dark:bg-zinc-950/50 pb-12">
//       {/* Top Header / Sticky Bar */}
//       <div className="sticky top-0 z-20 backdrop-blur-md bg-background/80 border-b border-border/60 px-4 sm:px-8 py-4 mb-8 transition-all">
//         <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//           <div className="space-y-1">
//             <div className="flex items-center gap-3">
//               <h1 className="text-xl font-semibold tracking-tight text-foreground">
//                 Edit Digital Product
//               </h1>
//               {getStatusBadge()}
//             </div>
//             <p className="text-xs text-muted-foreground">
//               Configure product details, asset package, and listing media.
//             </p>
//           </div>

//           {/* Action Bar */}
//           <div className="flex items-center gap-2.5">
//             <Button
//               variant="outline"
//               size="sm"
//               disabled={pending}
//               onClick={handleSave}
//               className="h-9 px-4 font-medium transition-all"
//             >
//               {pending ? (
//                 <Loader2 className="size-4 mr-2 animate-spin text-muted-foreground" />
//               ) : (
//                 <Save className="size-4 mr-2 text-muted-foreground" />
//               )}
//               {pending ? "Saving..." : "Save Draft"}
//             </Button>

//             <Button
//               size="sm"
//               disabled={pending || isSubmittedOrPublished}
//               onClick={handleSubmitForReview}
//               className="h-9 px-4 font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
//             >
//               {pending ? (
//                 <Loader2 className="size-4 mr-2 animate-spin" />
//               ) : (
//                 <Send className="size-4 mr-2" />
//               )}
//               {pending
//                 ? "Submitting..."
//                 : isSubmittedOrPublished
//                   ? "Under Review"
//                   : "Submit for Review"}
//             </Button>
//           </div>
//         </div>
//       </div>

//       {/* Main Layout */}
//       <div className="max-w-6xl mx-auto px-4 sm:px-8">
//         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
//           {/* Left / Primary Column (8 Cols) */}
//           <div className="lg:col-span-8 space-y-6">
//             {/* Core Details */}
//             <Card className="shadow-xs border-border/60">
//               <CardHeader className="pb-4">
//                 <CardTitle className="text-base font-semibold">
//                   Product Details
//                 </CardTitle>
//                 <CardDescription className="text-xs">
//                   This information will be publicly shown on your store front
//                   page.
//                 </CardDescription>
//               </CardHeader>
//               <CardContent className="space-y-5">
//                 <div className="space-y-2">
//                   <Label htmlFor="title" className="text-xs font-medium">
//                     Title <span className="text-destructive">*</span>
//                   </Label>
//                   <Input
//                     id="title"
//                     value={title}
//                     onChange={(e) => setTitle(e.target.value)}
//                     placeholder="e.g. Design Systems Masterclass Handbook"
//                     className="h-10 text-sm"
//                   />
//                 </div>

//                 <div className="space-y-2">
//                   <Label
//                     htmlFor="smallDescription"
//                     className="text-xs font-medium"
//                   >
//                     Short Summary <span className="text-destructive">*</span>
//                   </Label>
//                   <Textarea
//                     id="smallDescription"
//                     value={smallDescription}
//                     onChange={(e) => setSmallDescription(e.target.value)}
//                     placeholder="Brief 1-2 sentence overview to display on catalog cards..."
//                     rows={2}
//                     className="resize-none text-sm"
//                   />
//                 </div>

//                 <div className="space-y-2">
//                   <Label className="text-xs font-medium">
//                     Detailed Description
//                   </Label>
//                   <div className="rounded-lg border border-input overflow-hidden">
//                     <RichTextEditor
//                       field={{
//                         value: description,
//                         onChange: (val: string) => setDescription(val),
//                       }}
//                     />
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>

//             {/* Asset Upload */}
//             <Card className="shadow-xs border-border/60">
//               <CardHeader className="pb-4">
//                 <div className="flex items-center gap-2">
//                   <div className="p-2 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
//                     <FileUp className="size-4" />
//                   </div>
//                   <div>
//                     <CardTitle className="text-base font-semibold">
//                       Digital Source File
//                     </CardTitle>
//                     <CardDescription className="text-xs">
//                       The primary file downloaded by users upon purchase (ZIP,
//                       PDF, etc.).
//                     </CardDescription>
//                   </div>
//                 </div>
//               </CardHeader>
//               <CardContent className="space-y-4">
//                 <SingleFileUploader
//                   value={fileKey}
//                   onChange={(fileDetails: FileDetails) => {
//                     setFileKey(fileDetails.key);
//                     setFileType(fileDetails.type);
//                     setFileSize(fileDetails.size);
//                   }}
//                 />

//                 {fileKey && (
//                   <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-slate-50/50 dark:bg-zinc-900/50 text-xs">
//                     <div className="flex items-center gap-2.5 min-w-0">
//                       <HardDrive className="size-4 text-muted-foreground shrink-0" />
//                       <span className="font-mono truncate text-foreground font-medium">
//                         {fileKey}
//                       </span>
//                     </div>
//                     <div className="flex items-center gap-2 text-muted-foreground shrink-0 font-medium">
//                       <span className="uppercase text-[10px] tracking-wider px-1.5 py-0.5 rounded bg-muted">
//                         {fileType || "FILE"}
//                       </span>
//                       <span>{(fileSize / (1024 * 1024)).toFixed(2)} MB</span>
//                     </div>
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           </div>

//           {/* Right Sidebar Column (4 Cols) */}
//           <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
//             {/* Pricing Card */}
//             <Card className="shadow-xs border-border/60">
//               <CardHeader className="pb-3">
//                 <CardTitle className="text-base font-semibold">
//                   Pricing
//                 </CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="price" className="text-xs font-medium">
//                     Price (USD) <span className="text-destructive">*</span>
//                   </Label>
//                   <div className="relative rounded-md shadow-xs">
//                     <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
//                       <span className="text-muted-foreground text-sm">$</span>
//                     </div>
//                     <Input
//                       id="price"
//                       type="number"
//                       min="0"
//                       step="0.01"
//                       value={price}
//                       onChange={(e) => setPrice(e.target.value)}
//                       placeholder="0.00"
//                       className="pl-7 h-10 text-sm font-medium"
//                     />
//                   </div>
//                 </div>

//                 <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
//                   <span className="text-muted-foreground">Listing Status</span>
//                   <span className="font-medium capitalize text-foreground">
//                     {data.status.toLowerCase()}
//                   </span>
//                 </div>
//               </CardContent>
//             </Card>

//             {/* Showcase Gallery */}
//             {/* Showcase Gallery */}
//             {/* Showcase Gallery Card in JSX */}
//             <Card className="shadow-xs border-border/60">
//               <CardHeader className="pb-3">
//                 <div className="flex items-center gap-2">
//                   <ImageIcon className="size-4 text-muted-foreground" />
//                   <CardTitle className="text-base font-semibold">
//                     Showcase Gallery
//                   </CardTitle>
//                 </div>
//                 <CardDescription className="text-xs">
//                   Screenshots and previews for your storefront.
//                 </CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <MultiImageUploader
//                   value={images.map((img) => img.imageKey)}
//                   onChange={(updatedItems) => {
//                     setImages(
//                       updatedItems.map((item, index) => ({
//                         imageKey: item, // Keeps raw File objects intact so MultiImageUploader creates valid blob previews
//                         position: index,
//                       })),
//                     );
//                   }}
//                 />
//               </CardContent>
//             </Card>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
