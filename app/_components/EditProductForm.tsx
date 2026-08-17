"use client";
import {
  DndContext,
  DragEndEvent,
  DraggableSyntheticListeners,
  KeyboardSensor,
  PointerSensor,
  rectIntersection,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  ReactNode,
  useState,
  useEffect,
  useMemo,
  useRef,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import slugify from "slugify";
import { useForm, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Loader2,
  Save,
  UploadCloud,
  FileText,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Eye,
  Trash2,
  X,
} from "lucide-react";
import { tryCatch } from "@/hooks/try-catch";
import { uploadFiles, useUploadThing } from "@/lib/uploadthing";
import { deleteUTFile } from "@/app/actions/delete-file";

import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AdminCourseSingularType } from "@/app/actions/educator-get-course";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { NewChapterModal } from "./NewChapterModal";
import { NewLessonModal } from "./NewLessonModal";
import { DeleteLesson } from "./DeleteLesson";
import { DeleteChapter } from "./DeleteChapter";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/app/_components/ui/collapsible";
import { Button } from "@/app/_components/ui/button";
import {
  reorderChapters,
  reorderLessons,
  editCourse,
} from "../actions/manager-edit-course";
import { ProductStatus, ProductType } from "@/lib/generated/prisma/enums";
import {
  courseCategories,
  productSchema,
  ProductSchemaType,
  productType,
} from "@/lib/zodSchemas";
import { Input } from "@/app/_components/ui/input";
import { Label } from "@/app/_components/ui/label";
import { RichTextEditor } from "@/app/_components/rich-text-editor/Editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/_components/ui/form";
import {
  MultiImageUploader,
  SingleFileUploader,
} from "@/app/_components/file-uploader/Uploader";
import { updateProduct } from "../actions/manage-update-product";
import { deleteProductDeliverable } from "../actions/manage-delete-product-deliverable";
interface iAppProps {
  data: AdminCourseSingularType;
}
interface SortableItemsProps {
  productId: string;
  children: (listeners: DraggableSyntheticListeners) => ReactNode;
  className?: string;
  data?: {
    type: "chapter" | "lesson";
    chapterId?: string;
  };
}
type ChapterItemState = {
  id: string;
  title: string;
  order: number;
  isOpen: boolean;
  lessons: Array<{
    id: string;
    title: string;
    order: number;
  }>;
};
export function CourseStructure({ data }: iAppProps) {
  const formatChapters = (
    chapters: typeof data.chapters,
  ): ChapterItemState[] => {
    return (
      chapters?.map((chapter) => ({
        id: chapter.id,
        title: chapter.title,
        order: chapter.position,
        isOpen: true,
        lessons: chapter.lessons.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          order: lesson.position,
        })),
      })) ?? []
    );
  };

  const [items, setItems] = useState<ChapterItemState[]>(() =>
    formatChapters(data.chapters),
  );

  function SortableItem({
    children,
    productId,
    className,
    data,
  }: SortableItemsProps) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: productId,
      data,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        className={cn("touch-none", className, isDragging ? "z-10" : "")}
      >
        {children(listeners)}
      </div>
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);

    const activeType = active.data.current?.type as
      | "chapter"
      | "lesson"
      | undefined;

    const overType = over.data.current?.type as
      | "chapter"
      | "lesson"
      | undefined;

    const courseId = data.id;

    // ==========================================
    // REORDER CHAPTERS
    // ==========================================

    if (activeType === "chapter") {
      let targetChapterId: string | null = null;

      if (overType === "chapter") {
        targetChapterId = overId;
      } else if (overType === "lesson") {
        targetChapterId =
          (over.data.current?.chapterId as string | undefined) ?? null;
      }

      if (!targetChapterId) {
        toast.error("Could not determine the chapter for reordering");
        return;
      }

      const oldIndex = items.findIndex((item) => item.id === activeId);

      const newIndex = items.findIndex((item) => item.id === targetChapterId);

      if (oldIndex === -1 || newIndex === -1) {
        toast.error("Could not find chapter old/new index for reordering");
        return;
      }

      const reorderedLocalChapters = arrayMove(items, oldIndex, newIndex);

      const updatedChapterForState = reorderedLocalChapters.map(
        (chapter, index) => ({
          ...chapter,
          order: index + 1,
        }),
      );

      const previousItems = [...items];

      // Optimistically update the UI
      setItems(updatedChapterForState);

      const chaptersToUpdate = updatedChapterForState.map((chapter) => ({
        id: chapter.id,
        position: chapter.order,
      }));

      toast.promise(reorderChapters(courseId, chaptersToUpdate), {
        loading: "Reordering Chapters...",

        success: (result) => {
          if (result.status === "success") {
            return result.message;
          }

          throw new Error(result.message);
        },

        error: () => {
          setItems(previousItems);
          return "Failed to reorder chapters";
        },
      });

      return;
    }

    // ==========================================
    // REORDER LESSONS
    // ==========================================

    if (activeType === "lesson" && overType === "lesson") {
      const chapterId = active.data.current?.chapterId as string | undefined;

      const overChapterId = over.data.current?.chapterId as string | undefined;

      if (!chapterId || chapterId !== overChapterId) {
        toast.error(
          "Lesson move between different chapters or invalid chapter ID is not allowed.",
        );
        return;
      }

      const chapterIndex = items.findIndex(
        (chapter) => chapter.id === chapterId,
      );

      if (chapterIndex === -1) {
        toast.error("Could not find chapter for lesson");
        return;
      }

      const chapterToUpdate = items[chapterIndex];

      const oldLessonIndex = chapterToUpdate.lessons.findIndex(
        (lesson) => lesson.id === activeId,
      );

      const newLessonIndex = chapterToUpdate.lessons.findIndex(
        (lesson) => lesson.id === overId,
      );

      if (oldLessonIndex === -1 || newLessonIndex === -1) {
        toast.error("Could not find lesson for reordering");
        return;
      }

      const reorderedLessons = arrayMove(
        chapterToUpdate.lessons,
        oldLessonIndex,
        newLessonIndex,
      );

      const updatedLessonForState = reorderedLessons.map((lesson, index) => ({
        ...lesson,
        order: index + 1,
      }));

      const newItems = [...items];

      newItems[chapterIndex] = {
        ...chapterToUpdate,
        lessons: updatedLessonForState,
      };

      const previousItems = [...items];

      // Optimistically update the UI
      setItems(newItems);

      const lessonsToUpdate = updatedLessonForState.map((lesson) => ({
        id: lesson.id,
        position: lesson.order,
      }));

      toast.promise(reorderLessons(chapterId, lessonsToUpdate, courseId), {
        loading: "Reordering Lessons...",

        success: (result) => {
          if (result.status === "success") {
            return result.message;
          }

          throw new Error(result.message);
        },

        error: () => {
          setItems(previousItems);
          return "Failed to reorder lessons";
        },
      });
    }
  }

  function toggleChapter(chapterId: string) {
    setItems((prev) =>
      prev.map((chapter) =>
        chapter.id === chapterId
          ? {
              ...chapter,
              isOpen: !chapter.isOpen,
            }
          : chapter,
      ),
    );
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  return (
    <DndContext
      collisionDetection={rectIntersection}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-border">
          <CardTitle className="text-base font-semibold">
            Course Curriculum & Chapters
          </CardTitle>

          <NewChapterModal productId={data.id} />
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          <SortableContext
            items={items.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            {items.map((item) => (
              <SortableItem
                key={item.id}
                productId={item.id}
                data={{ type: "chapter" }}
              >
                {(listeners) => (
                  <Card>
                    <Collapsible
                      open={item.isOpen}
                      onOpenChange={() => toggleChapter(item.id)}
                    >
                      <div className="flex items-center justify-between p-3 border-b border-border">
                        <div className="flex items-center gap-2">
                          <Button size="icon" variant="ghost" {...listeners}>
                            <GripVertical className="size-4" />
                          </Button>

                          <CollapsibleTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="flex items-center"
                            >
                              {item.isOpen ? (
                                <ChevronDown className="size-4" />
                              ) : (
                                <ChevronRight className="size-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>

                          <p className="cursor-pointer hover:text-primary pl-2 font-medium text-sm">
                            {item.title}
                          </p>
                        </div>

                        <DeleteChapter chapterId={item.id} courseId={data.id} />
                      </div>

                      <CollapsibleContent>
                        <div className="p-1">
                          <SortableContext
                            items={item.lessons.map((lesson) => lesson.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            {item.lessons.map((lesson) => (
                              <SortableItem
                                key={lesson.id}
                                productId={lesson.id}
                                data={{
                                  type: "lesson",
                                  chapterId: item.id,
                                }}
                              >
                                {(lessonListeners) => (
                                  <div className="flex items-center justify-between p-2 hover:bg-accent rounded-sm text-sm">
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        {...lessonListeners}
                                      >
                                        <GripVertical className="size-4" />
                                      </Button>

                                      <FileText className="size-4" />

                                      <Link
                                        href={`/manage/products/${data.id}/${item.id}/${lesson.id}`}
                                        className="hover:underline"
                                      >
                                        {lesson.title}
                                      </Link>
                                    </div>

                                    <DeleteLesson
                                      chapterId={item.id}
                                      courseId={data.id}
                                      lessonId={lesson.id}
                                    />
                                  </div>
                                )}
                              </SortableItem>
                            ))}
                          </SortableContext>

                          <div className="p-2">
                            <NewLessonModal
                              chapterId={item.id}
                              productId={data.id}
                            />
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                )}
              </SortableItem>
            ))}
          </SortableContext>
        </CardContent>
      </Card>
    </DndContext>
  );
}
export interface DigitalImageItem {
  id?: string;
  imageKey: string | File;
  position: number;
}
interface LessonItem {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  position: number;
  thumbnailKey: string | null;
  videoKey: string | null;
  chapterId: string;
}
interface ChapterItem {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  position: number;
  productId: string;
  lessons: LessonItem[];
}
interface ProductWithRelations {
  id: string;
  title: string;
  description: string;
  price: number;
  printedPrice?: number | null;
  status: ProductStatus;
  type: ProductType;
  slug: string;
  duration: number | null;
  category: string | null;
  imageKey: string | null;
  fileKey: string | null;
  fileType: string | null;
  fileSize: number | null;
  chapters: ChapterItem[];
  images: DigitalImageItem[];
}
export function EditProductForm({
  product,
}: {
  product: ProductWithRelations;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const selectedProductType = product.type;
  const isCourse = selectedProductType === ProductType.Course;
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedDeliverableFile, setSelectedDeliverableFile] =
    useState<File | null>(null);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { startUpload: startMediaUpload } = useUploadThing("mediaUploader", {
    onUploadError: (error) => {
      console.error("Media upload error:", error);
      toast.error(error.message || "Failed to upload media.");
    },
  });
  const { startUpload: startDeliverableUpload } = useUploadThing(
    "deliverableUploader",
    {
      onUploadError: (error) => {
        console.error("Deliverable upload error:", error);
        toast.error(error.message || "Failed to upload deliverable file.");
      },
    },
  );
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [images, setImages] = useState<DigitalImageItem[]>(
    product.images ?? [],
  );

  const [, setIsChangingDeliverable] = useState(false);

  const [fileKey, setFileKey] = useState(product.fileKey ?? "");
  const [fileType, setFileType] = useState(product.fileType ?? "");
  const [fileSize, setFileSize] = useState<number>(product.fileSize ?? 0);
  const originalFileKey = product.fileKey ?? "";
  const [isDeletingDeliverable, setIsDeletingDeliverable] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const rawFileKey = product.imageKey ?? product.fileKey ?? "";
  const rawImageUrl = rawFileKey
    ? rawFileKey.startsWith("http://") || rawFileKey.startsWith("https://")
      ? rawFileKey
      : `https://utfs.io/f/${rawFileKey}`
    : "";

  const form = useForm<ProductSchemaType>({
    resolver: zodResolver(productSchema) as Resolver<ProductSchemaType>,
    defaultValues: {
      title: product.title || "",
      description: product.description || "",
      fileKey: rawFileKey || "",
      // Database stores prices in cents.
      // Form displays prices in dollars.
      price: product.price ? product.price / 100 : 0,
      // Same conversion for printed price.
      printedPrice:
        product.printedPrice != null ? product.printedPrice / 100 : undefined,
      duration: product.duration ?? null,
      category: (product.category as ProductSchemaType["category"]) || "",
      slug: product.slug || "",
      type: product.type as ProductSchemaType["type"],
      status: product.status as ProductSchemaType["status"],
    },
  });

  const [title, setTitle] = useState(product.title || "");
  const [description, setDescription] = useState(product.description || "");
  const [price, setPrice] = useState(
    (product.price ? product.price / 100 : 0).toString(),
  );

  const [printedPrice, setPrintedPrice] = useState(
    product.printedPrice != null ? (product.printedPrice / 100).toString() : "",
  );

  const previewUrl = useMemo(() => {
    if (!selectedImage) return null;
    return URL.createObjectURL(selectedImage);
  }, [selectedImage]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const existingImageUrl = useMemo(() => {
    if (rawImageUrl?.trim()) return rawImageUrl;
    return null;
  }, [rawImageUrl]);

  const imageSrc = useMemo(() => {
    if (previewUrl) return previewUrl;
    if (!imageError && existingImageUrl) return existingImageUrl;
    return "/images/no-image.jpeg";
  }, [previewUrl, imageError, existingImageUrl]);

  const multiUploaderValues: (string | File)[] = images.map(
    (img) => img.imageKey,
  );

  const handleMultiUploaderChange = (newFiles: (string | File)[]) => {
    setImages(
      newFiles.map((file, index) => {
        const existing = images.find((img) => img.imageKey === file);
        return {
          id: existing?.id,
          imageKey: file,
          position: index,
        };
      }),
    );
  };

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
          imageKey: uploadedFile.ufsUrl,
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
  const getDeliverableUrl = (key: string) => {
    if (!key) return "";
    const normalizedKey = extractKeyFromUrl(key);
    return normalizedKey ? `https://utfs.io/f/${normalizedKey}` : key;
  };

  const getFileName = (key: string) => {
    if (!key) return "Deliverable file";
    const normalizedKey = extractKeyFromUrl(key);
    return normalizedKey.split("/").pop() || "Deliverable file";
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "Unknown size";
    const units = ["B", "KB", "MB", "GB"];
    const index = Math.min(
      Math.floor(Math.log(bytes) / Math.log(1024)),
      units.length - 1,
    );
    return `${(bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
  };

  const handleDeleteDeliverable = async () => {
    if (!fileKey && !originalFileKey) return;

    const confirmed = window.confirm(
      "Delete this deliverable? This will remove it from the product and UploadThing. This action cannot be undone.",
    );

    if (!confirmed) return;

    setIsDeletingDeliverable(true);
    try {
      // If the user selected/replaced a file before saving, that new file is not
      // the file currently stored in Product.fileKey. Clean it up separately.
      const unsavedReplacementKey =
        fileKey && originalFileKey && fileKey !== originalFileKey
          ? extractKeyFromUrl(fileKey)
          : null;

      const result = await deleteProductDeliverable(product.id);

      if (result.status !== "success") {
        toast.error(result.message || "Failed to delete deliverable.");
        return;
      }

      if (unsavedReplacementKey) {
        try {
          await deleteUTFile(unsavedReplacementKey);
        } catch (error) {
          console.error("Failed to delete unsaved replacement file:", error);
        }
      }

      setFileKey("");
      setFileType("");
      setFileSize(0);
      setSelectedDeliverableFile(null);
      setIsPreviewOpen(false);
      toast.success(result.message || "Deliverable deleted successfully.");
      router.refresh();
    } catch (error) {
      console.error("Failed to delete deliverable:", error);
      toast.error("Failed to delete deliverable.");
    } finally {
      setIsDeletingDeliverable(false);
    }
  };

  const handleDeliverableChange = (
    fileData: {
      key: string;
      type: string;
      size: number;
      name: string;
    } | null,
    rawFile?: File | null,
  ) => {
    if (!fileData) {
      return;
    }

    setFileKey(fileData.key);
    setFileType(fileData.type);
    setFileSize(fileData.size);
    setSelectedDeliverableFile(rawFile ?? null);

    // We have selected a new file, so return to preview mode.
    setIsChangingDeliverable(false);
  };

  const handleSave = async (values: ProductSchemaType) => {
    startTransition(async () => {
      if (isCourse) {
        let finalFileKey = values.fileKey;
        let newlyUploadedKey: string | null = null;
        if (selectedImage) {
          const uploadRes = await startMediaUpload([selectedImage]);
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
          editCourse(submissionData, product.id),
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
          router.refresh();
        } else {
          toast.error(result.message);
        }
      } else {
        let finalFileKey = fileKey;
        let finalFileType = fileType;
        let finalFileSize = fileSize;
        let newlyUploadedPdfKey: string | null = null;
        if (selectedDeliverableFile) {
          setIsUploadingImages(true);
          try {
            const uploadRes = await startDeliverableUpload([
              selectedDeliverableFile,
            ]);
            if (!uploadRes || uploadRes.length === 0) {
              toast.error(
                "Failed to upload deliverable file to cloud storage.",
              );
              return;
            }
            finalFileKey = uploadRes[0].key;
            newlyUploadedPdfKey = uploadRes[0].key;
            finalFileType = selectedDeliverableFile.type;
            finalFileSize = selectedDeliverableFile.size;
          } catch (error: unknown) {
            console.error("Failed to upload deliverable:", error);
            toast.error(
              error instanceof Error
                ? error.message
                : "Failed to upload deliverable file.",
            );
            return;
          } finally {
            setIsUploadingImages(false);
          }
        }
        const uploadedImageKeys = await processAndUploadImages();
        if (!uploadedImageKeys) {
          if (newlyUploadedPdfKey) {
            await deleteUTFile(newlyUploadedPdfKey);
          }
          return;
        }
        if (!title || !description || !price) {
          toast.error("Please fill in all required basic information fields.");
          return;
        }
        if (!finalFileKey) {
          toast.error("Please upload the main digital asset file.");
          return;
        }
        const numericPrice = parseFloat(price);
        if (isNaN(numericPrice) || numericPrice < 1) {
          toast.error("Please enter a valid price of at least $1.");
          return;
        }
        const rawInitialImages =
          product.images
            ?.map((img: DigitalImageItem) =>
              typeof img.imageKey === "string" ? img.imageKey : "",
            )
            .filter(Boolean) || [];
        const initialKeys = rawInitialImages.map(extractKeyFromUrl);
        const currentKeys = uploadedImageKeys.map(extractKeyFromUrl);
        const keysToDelete = initialKeys.filter(
          (oldKey: string) => !currentKeys.includes(oldKey),
        );

        const numericPrintedPrice =
          printedPrice.trim() !== "" ? parseFloat(printedPrice) : null;

        const payload = {
          productId: product.id,
          title,
          description,
          type: selectedProductType,

          // Digital price in cents
          price: Math.round(numericPrice * 100),

          // Printed price in cents.
          // null means no printed version is offered.
          printedPrice:
            numericPrintedPrice !== null &&
            Number.isFinite(numericPrintedPrice) &&
            numericPrintedPrice > 0
              ? Math.round(numericPrintedPrice * 100)
              : null,

          imagesToDelete: keysToDelete,

          fileKey: finalFileKey,
          fileType: finalFileType,
          fileSize: finalFileSize,

          images: uploadedImageKeys.map((key, index) => ({
            imageKey: key,
            position: index,
          })),
        };
        const result = await updateProduct(payload);
        if (result.status === "success") {
          toast.success(result.message || "Changes saved successfully");
          router.refresh();
        } else {
          if (newlyUploadedPdfKey) {
            await deleteUTFile(newlyUploadedPdfKey);
          }
          toast.error(result.message || "Failed to save product");
        }
      }
    });
  };
  const isLoading = pending || isUploadingImages;
  const courseFormData = {
    id: product.id,
    title: product.title ?? "",
    type: selectedProductType as (typeof productType)[number],
    slug: product.slug ?? "",
    description: product.description ?? "",
    price: product.price ?? 0,
    status: product.status,
    fileKey: rawFileKey.trim(),
    imageUrl: rawImageUrl.trim(),
    duration: product.duration ?? 0,
    category: product.category ?? "",
    hasCourseRelation: selectedProductType === "Course",
    chapters: product.chapters ?? [],
  };
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSave, (errors) => {
          console.error("FORM VALIDATION ERRORS:", errors);
          Object.entries(errors).forEach(([field, error]) => {
            toast.error(`${field}: ${error?.message || "Invalid value"}`);
          });
        })}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Details Section */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="border-border bg-card/50 backdrop-blur-sm shadow-sm">
              <CardContent className="pt-0 space-y-5">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium">
                        Product Title
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Master Next.js 15"
                          className="h-10 text-sm"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            setTitle(e.target.value);
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium">
                        Description
                      </FormLabel>
                      <FormControl>
                        <RichTextEditor
                          field={{
                            value: field.value,
                            onChange: (val: string) => {
                              field.onChange(val);
                              setDescription(val);
                            },
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            {/* Embedded Course Structure Section */}
            {isCourse && <CourseStructure data={courseFormData} />}
            {/* Gallery Media: Hidden if product type is Course */}
            {!isCourse && (
              <Card className="border-border bg-card/50 backdrop-blur-sm shadow-sm">
                <CardContent className="pt-4 space-y-3">
                  <Label className="text-xs font-medium">Media Gallery</Label>
                  <MultiImageUploader
                    value={multiUploaderValues}
                    onChange={handleMultiUploaderChange}
                  />
                </CardContent>
              </Card>
            )}
          </div>
          {/* Sidebar Section */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
            <Card className="border-border bg-card/50 backdrop-blur-sm shadow-sm">
              <CardContent className="pt-0 space-y-4">
                {isCourse && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">
                      Course Thumbnail
                    </Label>
                    <FormField
                      control={form.control}
                      name="fileKey"
                      render={() => (
                        <FormItem>
                          <FormControl>
                            <div>
                              <div
                                className="relative aspect-video overflow-hidden rounded-lg border border-border bg-muted/40 cursor-pointer group hover:border-primary/50 transition-all"
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
                                  className="object-cover transition duration-300 group-hover:scale-105"
                                  onError={() => setImageError(true)}
                                />
                                <div
                                  className="absolute inset-0 bg-black/50 opacity-0
                                  group-hover:opacity-100 flex flex-col items-center justify-center
                                  gap-1.5 transition text-white"
                                >
                                  <UploadCloud className="size-5" />
                                  <span className="text-xs font-medium">
                                    Change Image
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
                  </div>
                )}
                {!isCourse && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium">
                        Deliverable Asset
                      </Label>
                      {fileKey && (
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="size-8"
                            onClick={() => setIsPreviewOpen(true)}
                            aria-label="Preview deliverable"
                          >
                            <Eye className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="size-8 text-destructive hover:text-destructive"
                            onClick={handleDeleteDeliverable}
                            disabled={isDeletingDeliverable}
                            aria-label="Delete deliverable"
                          >
                            {isDeletingDeliverable ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Trash2 className="size-4" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>

                    {fileKey ? (
                      <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
                            <FileText className="size-5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {getFileName(fileKey)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {fileType || "File"} • {formatFileSize(fileSize)}
                            </p>
                          </div>
                        </div>

                        <div className="pt-1">
                          <p className="mb-2 text-[11px] text-muted-foreground">
                            Use the uploader below to replace this file.
                          </p>
                          <SingleFileUploader
                            value=""
                            onChange={handleDeliverableChange}
                          />
                        </div>
                      </div>
                    ) : (
                      <SingleFileUploader
                        value={fileKey}
                        onChange={handleDeliverableChange}
                      />
                    )}

                    {isPreviewOpen && fileKey && (
                      <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Deliverable preview"
                        onClick={() => setIsPreviewOpen(false)}
                      >
                        <div
                          className="relative flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-background shadow-xl"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <div className="flex items-center justify-between border-b px-4 py-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">
                                {getFileName(fileKey)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Deliverable Preview
                              </p>
                            </div>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => setIsPreviewOpen(false)}
                              aria-label="Close preview"
                            >
                              <X className="size-4" />
                            </Button>
                          </div>

                          <div className="min-h-0 flex-1 bg-muted/20 p-2">
                            {fileType === "application/pdf" ? (
                              <iframe
                                src={getDeliverableUrl(fileKey)}
                                title="Deliverable PDF preview"
                                className="h-full w-full rounded-md border bg-background"
                              />
                            ) : fileType.startsWith("image/") ? (
                              <div className="flex h-full items-center justify-center overflow-auto">
                                <Image
                                  src={getDeliverableUrl(fileKey)}
                                  alt="Deliverable preview"
                                  className="max-h-full max-w-full object-contain"
                                />
                              </div>
                            ) : (
                              <div className="flex h-full flex-col items-center justify-center gap-3">
                                <FileText className="size-12 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground text-center">
                                  Preview is not available for this file type.
                                </p>
                                <Button type="button" asChild>
                                  <a
                                    href={getDeliverableUrl(fileKey)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Open File
                                  </a>
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {isCourse && (
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium">
                          Category
                        </FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className="h-9 text-sm">
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* ============================================================
      DIGITAL / COURSE PRICE
  ============================================================ */}

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium">
                          {isCourse ? "Course Price ($)" : "Digital Price ($)"}
                        </FormLabel>

                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            className="h-9 text-sm"
                            value={isCourse ? (field.value ?? 0) : price}
                            onChange={(e) => {
                              const value = e.target.value;

                              if (isCourse) {
                                field.onChange(
                                  value === "" ? 0 : Number(value),
                                );
                              } else {
                                setPrice(value);

                                field.onChange(
                                  value === "" ? 0 : Number(value),
                                );
                              }
                            }}
                          />
                        </FormControl>

                        <FormMessage />

                        {!isCourse && (
                          <p className="text-[11px] text-muted-foreground">
                            Price customers pay for the digital version.
                          </p>
                        )}
                      </FormItem>
                    )}
                  />

                  {/* ============================================================
      PRINTED PRICE — DIGITAL PRODUCTS ONLY
  ============================================================ */}

                  {!isCourse && (
                    <FormField
                      control={form.control}
                      name="printedPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium">
                            Printed Price ($)
                            <span className="ml-1 text-muted-foreground font-normal">
                              Optional
                            </span>
                          </FormLabel>

                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              className="h-9 text-sm"
                              placeholder="e.g. 29.99"
                              value={printedPrice}
                              onChange={(e) => {
                                const value = e.target.value;

                                setPrintedPrice(value);

                                field.onChange(
                                  value === "" ? undefined : Number(value),
                                );
                              }}
                            />
                          </FormControl>

                          <FormMessage />

                          <p className="text-[11px] text-muted-foreground">
                            Optional price for customers who want a physical
                            printed copy.
                          </p>
                        </FormItem>
                      )}
                    />
                  )}

                  {/* ============================================================
      COURSE DURATION
  ============================================================ */}

                  {isCourse && (
                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium">
                            Duration (hrs)
                          </FormLabel>

                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.5"
                              className="h-9 text-sm"
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    ? Number(e.target.value)
                                    : null,
                                )
                              }
                            />
                          </FormControl>

                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-9 font-medium shadow-xs"
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    {isUploadingImages
                      ? "Uploading..."
                      : pending
                        ? "Saving..."
                        : "Save Changes"}
                  </Button>
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
// import {
//   DndContext,
//   DragEndEvent,
//   DraggableSyntheticListeners,
//   KeyboardSensor,
//   PointerSensor,
//   rectIntersection,
//   useSensor,
//   useSensors,
// } from "@dnd-kit/core";
// import {
//   ReactNode,
//   useState,
//   useEffect,
//   useMemo,
//   useRef,
//   useTransition,
// } from "react";
// import { useRouter } from "next/navigation";
// import Image from "next/image";
// import slugify from "slugify";
// import { useForm, Resolver } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { toast } from "sonner";
// import {
//   Loader2,
//   Save,
//   UploadCloud,
//   FileText,
//   GripVertical,
//   ChevronDown,
//   ChevronRight,
//   Eye,
//   Trash2,
//   X,
// } from "lucide-react";
// import { tryCatch } from "@/hooks/try-catch";
// import { uploadFiles, useUploadThing } from "@/lib/uploadthing";
// import { deleteUTFile } from "@/app/actions/delete-file";

// import {
//   arrayMove,
//   SortableContext,
//   sortableKeyboardCoordinates,
//   useSortable,
//   verticalListSortingStrategy,
// } from "@dnd-kit/sortable";
// import { CSS } from "@dnd-kit/utilities";
// import { AdminCourseSingularType } from "@/app/actions/educator-get-course";
// import { cn } from "@/lib/utils";
// import Link from "next/link";
// import { NewChapterModal } from "./NewChapterModal";
// import { NewLessonModal } from "./NewLessonModal";
// import { DeleteLesson } from "./DeleteLesson";
// import { DeleteChapter } from "./DeleteChapter";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from "@/app/_components/ui/card";
// import {
//   Collapsible,
//   CollapsibleContent,
//   CollapsibleTrigger,
// } from "@/app/_components/ui/collapsible";
// import { Button } from "@/app/_components/ui/button";
// import {
//   reorderChapters,
//   reorderLessons,
//   editCourse,
// } from "../actions/manager-edit-course";
// import { ProductStatus, ProductType } from "@/lib/generated/prisma/enums";
// import {
//   courseCategories,
//   productSchema,
//   ProductSchemaType,
//   productType,
// } from "@/lib/zodSchemas";
// import { Input } from "@/app/_components/ui/input";
// import { Label } from "@/app/_components/ui/label";
// import { RichTextEditor } from "@/app/_components/rich-text-editor/Editor";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/app/_components/ui/select";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/app/_components/ui/form";
// import {
//   MultiImageUploader,
//   SingleFileUploader,
// } from "@/app/_components/file-uploader/Uploader";
// import { updateProduct } from "../actions/manage-update-product";
// import { deleteProductDeliverable } from "../actions/manage-delete-product-deliverable";
// interface iAppProps {
//   data: AdminCourseSingularType;
// }
// interface SortableItemsProps {
//   productId: string;
//   children: (listeners: DraggableSyntheticListeners) => ReactNode;
//   className?: string;
//   data?: {
//     type: "chapter" | "lesson";
//     chapterId?: string;
//   };
// }
// type ChapterItemState = {
//   id: string;
//   title: string;
//   order: number;
//   isOpen: boolean;
//   lessons: Array<{
//     id: string;
//     title: string;
//     order: number;
//   }>;
// };
// export function CourseStructure({ data }: iAppProps) {
//   const formatChapters = (
//     chapters: typeof data.chapter,
//   ): ChapterItemState[] => {
//     return (
//       chapters?.map(
//         (chapter: {
//           id: string;
//           title: string;
//           position: number;
//           lessons: Array<{ id: string; title: string; position: number }>;
//         }) => ({
//           id: chapter.id,
//           title: chapter.title,
//           order: chapter.position,
//           isOpen: true,
//           lessons: chapter.lessons.map(
//             (lesson: { id: string; title: string; position: number }) => ({
//               id: lesson.id,
//               title: lesson.title,
//               order: lesson.position,
//             }),
//           ),
//         }),
//       ) || []
//     );
//   };
//   const [items, setItems] = useState<ChapterItemState[]>(() =>
//     formatChapters(data.chapter),
//   );
//   const [prevChapters, setPrevChapters] = useState(data.chapter);
//   if (prevChapters !== data.chapter) {
//     setPrevChapters(data.chapter);
//     setItems(formatChapters(data.chapter));
//   }
//   function SortableItem({
//     children,
//     productId,
//     className,
//     data,
//   }: SortableItemsProps) {
//     const {
//       attributes,
//       listeners,
//       setNodeRef,
//       transform,
//       transition,
//       isDragging,
//     } = useSortable({ id: productId, data: data });
//     const style = {
//       transform: CSS.Transform.toString(transform),
//       transition,
//     };
//     return (
//       <div
//         ref={setNodeRef}
//         style={style}
//         {...attributes}
//         className={cn("touch-none", className, isDragging ? "z-10" : "")}
//       >
//         {children(listeners)}
//       </div>
//     );
//   }
//   function handleDragEnd(event: DragEndEvent) {
//     const { active, over } = event;
//     if (!over || active.id === over.id) {
//       return;
//     }
//     const activeId = active.id;
//     const overId = over.id;
//     const activeType = active.data.current?.type as "chapter" | "lesson";
//     const overType = over.data.current?.type as "chapter" | "lesson";
//     const courseId = data.id;
//     if (activeType === "chapter") {
//       let targetChapterId = null;
//       if (overType === "chapter") {
//         targetChapterId = overId;
//       } else if (overType === "lesson") {
//         targetChapterId = over.data.current?.chapterId ?? null;
//       }
//       if (!targetChapterId) {
//         toast.error("Could not determine the chapter for reordering");
//         return;
//       }
//       const oldIndex = items.findIndex(
//         (item: ChapterItemState) => item.id === activeId,
//       );
//       const newIndex = items.findIndex(
//         (item: ChapterItemState) => item.id === targetChapterId,
//       );
//       if (oldIndex === -1 || newIndex === -1) {
//         toast.error("Could not find chapter old/new index for reordering");
//         return;
//       }
//       const reordedLocalChapters = arrayMove(items, oldIndex, newIndex);
//       const updatedChapterForState = reordedLocalChapters.map(
//         (chapter: ChapterItemState, index: number) => ({
//           ...chapter,
//           order: index + 1,
//         }),
//       );
//       const previousItems = [...items];
//       setItems(updatedChapterForState);
//       if (courseId) {
//         const chaptersToUpdate = updatedChapterForState.map(
//           (chapter: ChapterItemState) => ({
//             id: chapter.id,
//             position: chapter.order,
//           }),
//         );
//         const reorderPromise = () =>
//           reorderChapters(courseId, chaptersToUpdate);
//         toast.promise(reorderPromise(), {
//           loading: "Reordering Chapters...",
//           success: (result) => {
//             if (result.status === "success") return result.message;
//             throw new Error(result.message);
//           },
//           error: () => {
//             setItems(previousItems);
//             return "Failed to reorder chapters";
//           },
//         });
//       }
//       return;
//     }
//     if (activeType === "lesson" && overType === "lesson") {
//       const chapterId = active.data.current?.chapterId;
//       const overChapterId = over.data.current?.chapterId;
//       if (!chapterId || chapterId !== overChapterId) {
//         toast.error(
//           "Lesson move between different chapters or invalid chapter ID is not allowed.",
//         );
//         return;
//       }
//       const chapterIndex = items.findIndex(
//         (chapter: ChapterItemState) => chapter.id === chapterId,
//       );
//       if (chapterIndex === -1) {
//         toast.error("Could not find chapter for lesson");
//         return;
//       }
//       const chapterToUpdate = items[chapterIndex];
//       const oldLessonIndex = chapterToUpdate.lessons.findIndex(
//         (lesson) => lesson.id === activeId,
//       );
//       const newLessonIndex = chapterToUpdate.lessons.findIndex(
//         (lesson) => lesson.id === overId,
//       );
//       if (oldLessonIndex === -1 || newLessonIndex === -1) {
//         toast.error("Could not find lesson for reordering");
//         return;
//       }
//       const reordedLessons = arrayMove(
//         chapterToUpdate.lessons,
//         oldLessonIndex,
//         newLessonIndex,
//       );
//       const updatedLessonForState = reordedLessons.map((lesson, index) => ({
//         ...lesson,
//         order: index + 1,
//       }));
//       const newItems = [...items];
//       newItems[chapterIndex] = {
//         ...chapterToUpdate,
//         lessons: updatedLessonForState,
//       };
//       const previousItems = [...items];
//       setItems(newItems);
//       if (courseId) {
//         const lessonToUpdate = updatedLessonForState.map((lesson) => ({
//           id: lesson.id,
//           position: lesson.order,
//         }));
//         const reorderLessonsPromise = () =>
//           reorderLessons(chapterId, lessonToUpdate, courseId);
//         toast.promise(reorderLessonsPromise(), {
//           loading: "Reordering Lessons...",
//           success: (result) => {
//             if (result.status === "success") return result.message;
//             throw new Error(result.message);
//           },
//           error: () => {
//             setItems(previousItems);
//             return "Failed to reorder lessons";
//           },
//         });
//       }
//       return;
//     }
//   }
//   function toggleChapter(chapterId: string) {
//     setItems((prev) =>
//       prev.map((chapter: ChapterItemState) =>
//         chapter.id === chapterId
//           ? { ...chapter, isOpen: !chapter.isOpen }
//           : chapter,
//       ),
//     );
//   }
//   const sensors = useSensors(
//     useSensor(PointerSensor),
//     useSensor(KeyboardSensor, {
//       coordinateGetter: sortableKeyboardCoordinates,
//     }),
//   );
//   return (
//     <DndContext
//       collisionDetection={rectIntersection}
//       onDragEnd={handleDragEnd}
//       sensors={sensors}
//     >
//       <Card>
//         <CardHeader className="flex flex-row items-center justify-between border-b border-border">
//           <CardTitle className="text-base font-semibold">
//             Course Curriculum & Chapters
//           </CardTitle>
//           <NewChapterModal productId={data.id} />
//         </CardHeader>
//         <CardContent className="space-y-4 pt-6">
//           <SortableContext items={items} strategy={verticalListSortingStrategy}>
//             {items.map((item: ChapterItemState) => (
//               <SortableItem
//                 productId={item.id}
//                 data={{ type: "chapter" }}
//                 key={item.id}
//               >
//                 {(listeners) => (
//                   <Card>
//                     <Collapsible
//                       open={item.isOpen}
//                       onOpenChange={() => toggleChapter(item.id)}
//                     >
//                       <div className="flex items-center justify-between p-3 border-b border-border">
//                         <div className="flex items-center gap-2">
//                           <Button size="icon" variant="ghost" {...listeners}>
//                             <GripVertical className="size-4" />
//                           </Button>
//                           <CollapsibleTrigger asChild>
//                             <Button
//                               size="icon"
//                               variant="ghost"
//                               className="flex items-center"
//                             >
//                               {item.isOpen ? (
//                                 <ChevronDown className="size-4" />
//                               ) : (
//                                 <ChevronRight className="size-4" />
//                               )}
//                             </Button>
//                           </CollapsibleTrigger>
//                           <p className="cursor-pointer hover:text-primary pl-2 font-medium text-sm">
//                             {item.title}
//                           </p>
//                         </div>
//                         <DeleteChapter chapterId={item.id} courseId={data.id} />
//                       </div>
//                       <CollapsibleContent>
//                         <div className="p-1">
//                           <SortableContext
//                             items={item.lessons.map((lesson) => lesson.id)}
//                             strategy={verticalListSortingStrategy}
//                           >
//                             {item.lessons.map((lesson) => (
//                               <SortableItem
//                                 key={lesson.id}
//                                 productId={lesson.id}
//                                 data={{ type: "lesson", chapterId: item.id }}
//                               >
//                                 {(lessonListeners) => (
//                                   <div className="flex items-center justify-between p-2 hover:bg-accent rounded-sm text-sm">
//                                     <div className="flex items-center gap-2">
//                                       <Button
//                                         size="icon"
//                                         variant="ghost"
//                                         {...lessonListeners}
//                                       >
//                                         <GripVertical className="size-4" />
//                                       </Button>
//                                       <FileText className="size-4" />
//                                       <Link
//                                         href={`/manage/products/${data.id}/${item.id}/${lesson.id}`}
//                                         className="hover:underline"
//                                       >
//                                         {lesson.title}
//                                       </Link>
//                                     </div>
//                                     <DeleteLesson
//                                       chapterId={item.id}
//                                       courseId={data.id}
//                                       lessonId={lesson.id}
//                                     />
//                                   </div>
//                                 )}
//                               </SortableItem>
//                             ))}
//                           </SortableContext>
//                           <div className="p-2">
//                             <NewLessonModal
//                               chapterId={item.id}
//                               productId={data.id}
//                             />
//                           </div>
//                         </div>
//                       </CollapsibleContent>
//                     </Collapsible>
//                   </Card>
//                 )}
//               </SortableItem>
//             ))}
//           </SortableContext>
//         </CardContent>
//       </Card>
//     </DndContext>
//   );
// }
// export interface DigitalImageItem {
//   id?: string;
//   imageKey: string | File;
//   position: number;
// }
// interface LessonItem {
//   id: string;
//   title: string;
//   description: string | null;
//   createdAt: Date;
//   updatedAt: Date;
//   position: number;
//   thumbnailKey: string | null;
//   videoKey: string | null;
//   chapterId: string;
// }
// interface ChapterItem {
//   id: string;
//   title: string;
//   createdAt: Date;
//   updatedAt: Date;
//   position: number;
//   productId: string;
//   lessons: LessonItem[];
// }
// interface ProductWithRelations {
//   id: string;
//   title: string | null;
//   description: string | null;
//   price: number;
//   printedPrice?: number | null;
//   status: ProductStatus;
//   type: ProductType;
//   slug: string | null;
//   duration?: number | null;
//   category?: string | null;
//   imageKey?: string | null;
//   fileKey?: string | null;
//   fileType?: string | null;
//   fileSize?: number | null;
//   chapters?: ChapterItem[];
//   images?: DigitalImageItem[];
// }
// export function EditProductForm({
//   product,
// }: {
//   product: ProductWithRelations;
// }) {
//   const router = useRouter();
//   const [pending, startTransition] = useTransition();
//   const [selectedProductType] = useState<string>(product.type ?? "Course");
//   const isCourse = selectedProductType.toLowerCase() === "course";
//   const [selectedImage, setSelectedImage] = useState<File | null>(null);
//   const [selectedDeliverableFile, setSelectedDeliverableFile] =
//     useState<File | null>(null);
//   const [imageError, setImageError] = useState(false);
//   const fileInputRef = useRef<HTMLInputElement>(null);
//   const { startUpload: startMediaUpload } = useUploadThing("mediaUploader", {
//     onUploadError: (error) => {
//       console.error("Media upload error:", error);
//       toast.error(error.message || "Failed to upload media.");
//     },
//   });
//   const { startUpload: startDeliverableUpload } = useUploadThing(
//     "deliverableUploader",
//     {
//       onUploadError: (error) => {
//         console.error("Deliverable upload error:", error);
//         toast.error(error.message || "Failed to upload deliverable file.");
//       },
//     },
//   );
//   const [isUploadingImages, setIsUploadingImages] = useState(false);
//   const [images, setImages] = useState<DigitalImageItem[]>(
//     product.images ?? [],
//   );

//   const [, setIsChangingDeliverable] = useState(false);

//   const [fileKey, setFileKey] = useState(product.fileKey ?? "");
//   const [fileType, setFileType] = useState(product.fileType ?? "");
//   const [fileSize, setFileSize] = useState<number>(product.fileSize ?? 0);
//   const originalFileKey = product.fileKey ?? "";
//   const [isDeletingDeliverable, setIsDeletingDeliverable] = useState(false);
//   const [isPreviewOpen, setIsPreviewOpen] = useState(false);
//   const rawFileKey = product.imageKey ?? product.fileKey ?? "";
//   const rawImageUrl = rawFileKey ? `https://utfs.io/f/${rawFileKey}` : "";

//   const form = useForm<ProductSchemaType>({
//     resolver: zodResolver(productSchema) as Resolver<ProductSchemaType>,
//     defaultValues: {
//       title: product.title || "",
//       description: product.description || "",
//       fileKey: rawFileKey || "",
//       // Database stores prices in cents.
//       // Form displays prices in dollars.
//       price: product.price ? product.price / 100 : 0,
//       // Same conversion for printed price.
//       printedPrice:
//         product.printedPrice != null ? product.printedPrice / 100 : undefined,
//       duration: product.duration ?? null,
//       category: (product.category as ProductSchemaType["category"]) || "",
//       slug: product.slug || "",
//       type: product.type as ProductSchemaType["type"],
//       status: product.status as ProductSchemaType["status"],
//     },
//   });

//   const [title, setTitle] = useState(product.title || "");
//   const [description, setDescription] = useState(product.description || "");
//   const [price, setPrice] = useState(
//     (product.price ? product.price / 100 : 0).toString(),
//   );

//   const [printedPrice, setPrintedPrice] = useState(
//     product.printedPrice != null ? (product.printedPrice / 100).toString() : "",
//   );

//   const previewUrl = useMemo(() => {
//     if (!selectedImage) return null;
//     return URL.createObjectURL(selectedImage);
//   }, [selectedImage]);

//   useEffect(() => {
//     return () => {
//       if (previewUrl) URL.revokeObjectURL(previewUrl);
//     };
//   }, [previewUrl]);

//   const existingImageUrl = useMemo(() => {
//     if (rawImageUrl?.trim()) return rawImageUrl;
//     return null;
//   }, [rawImageUrl]);

//   const imageSrc = useMemo(() => {
//     if (previewUrl) return previewUrl;
//     if (!imageError && existingImageUrl) return existingImageUrl;
//     return "/images/no-image.jpeg";
//   }, [previewUrl, imageError, existingImageUrl]);

//   const multiUploaderValues: (string | File)[] = images.map(
//     (img) => img.imageKey,
//   );

//   const handleMultiUploaderChange = (newFiles: (string | File)[]) => {
//     setImages(
//       newFiles.map((file, index) => {
//         const existing = images.find((img) => img.imageKey === file);
//         return {
//           id: existing?.id,
//           imageKey: file,
//           position: index,
//         };
//       }),
//     );
//   };

//   const processAndUploadImages = async (): Promise<string[] | null> => {
//     const newFilesToUpload: File[] = [];
//     const fileIndexes: number[] = [];
//     images.forEach((img, idx) => {
//       if (img.imageKey instanceof File) {
//         newFilesToUpload.push(img.imageKey);
//         fileIndexes.push(idx);
//       }
//     });
//     if (newFilesToUpload.length === 0) {
//       return images
//         .map((img) => (typeof img.imageKey === "string" ? img.imageKey : ""))
//         .filter(Boolean);
//     }
//     setIsUploadingImages(true);
//     try {
//       const uploadResults = await uploadFiles("mediaUploader", {
//         files: newFilesToUpload,
//       });
//       const updatedImagesList = [...images];
//       uploadResults.forEach((uploadedFile, i) => {
//         const targetIndex = fileIndexes[i];
//         updatedImagesList[targetIndex] = {
//           ...updatedImagesList[targetIndex],
//           imageKey: uploadedFile.ufsUrl,
//         };
//       });
//       setImages(updatedImagesList);
//       return updatedImagesList
//         .map((img) => (typeof img.imageKey === "string" ? img.imageKey : ""))
//         .filter(Boolean);
//     } catch (error) {
//       console.error("Failed to upload showcase images:", error);
//       toast.error("Failed to upload gallery images. Please try again.");
//       return null;
//     } finally {
//       setIsUploadingImages(false);
//     }
//   };
//   const extractKeyFromUrl = (url: string): string => {
//     if (!url) return "";
//     if (url.includes("/f/")) {
//       return url.split("/f/").pop() || "";
//     }
//     return url;
//   };
//   const getDeliverableUrl = (key: string) => {
//     if (!key) return "";
//     const normalizedKey = extractKeyFromUrl(key);
//     return normalizedKey ? `https://utfs.io/f/${normalizedKey}` : key;
//   };

//   const getFileName = (key: string) => {
//     if (!key) return "Deliverable file";
//     const normalizedKey = extractKeyFromUrl(key);
//     return normalizedKey.split("/").pop() || "Deliverable file";
//   };

//   const formatFileSize = (bytes: number) => {
//     if (!bytes) return "Unknown size";
//     const units = ["B", "KB", "MB", "GB"];
//     const index = Math.min(
//       Math.floor(Math.log(bytes) / Math.log(1024)),
//       units.length - 1,
//     );
//     return `${(bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
//   };

//   const handleDeleteDeliverable = async () => {
//     if (!fileKey && !originalFileKey) return;

//     const confirmed = window.confirm(
//       "Delete this deliverable? This will remove it from the product and UploadThing. This action cannot be undone.",
//     );

//     if (!confirmed) return;

//     setIsDeletingDeliverable(true);
//     try {
//       // If the user selected/replaced a file before saving, that new file is not
//       // the file currently stored in Product.fileKey. Clean it up separately.
//       const unsavedReplacementKey =
//         fileKey && originalFileKey && fileKey !== originalFileKey
//           ? extractKeyFromUrl(fileKey)
//           : null;

//       const result = await deleteProductDeliverable(product.id);

//       if (result.status !== "success") {
//         toast.error(result.message || "Failed to delete deliverable.");
//         return;
//       }

//       if (unsavedReplacementKey) {
//         try {
//           await deleteUTFile(unsavedReplacementKey);
//         } catch (error) {
//           console.error("Failed to delete unsaved replacement file:", error);
//         }
//       }

//       setFileKey("");
//       setFileType("");
//       setFileSize(0);
//       setSelectedDeliverableFile(null);
//       setIsPreviewOpen(false);
//       toast.success(result.message || "Deliverable deleted successfully.");
//       router.refresh();
//     } catch (error) {
//       console.error("Failed to delete deliverable:", error);
//       toast.error("Failed to delete deliverable.");
//     } finally {
//       setIsDeletingDeliverable(false);
//     }
//   };

//   const handleDeliverableChange = (
//     fileData: {
//       key: string;
//       type: string;
//       size: number;
//       name: string;
//     } | null,
//     rawFile?: File | null,
//   ) => {
//     if (!fileData) {
//       return;
//     }

//     setFileKey(fileData.key);
//     setFileType(fileData.type);
//     setFileSize(fileData.size);
//     setSelectedDeliverableFile(rawFile ?? null);

//     // We have selected a new file, so return to preview mode.
//     setIsChangingDeliverable(false);
//   };

//   const handleSave = async (values: ProductSchemaType) => {
//     startTransition(async () => {
//       if (isCourse) {
//         let finalFileKey = values.fileKey;
//         let newlyUploadedKey: string | null = null;
//         if (selectedImage) {
//           const uploadRes = await startMediaUpload([selectedImage]);
//           if (!uploadRes || uploadRes.length === 0) {
//             toast.error("Failed to upload thumbnail image to cloud storage.");
//             return;
//           }
//           finalFileKey = uploadRes[0].key;
//           newlyUploadedKey = uploadRes[0].key;
//         }
//         if (!finalFileKey) {
//           toast.error("Please upload a course thumbnail.");
//           return;
//         }
//         const submissionData = {
//           ...values,
//           fileKey: finalFileKey,
//         };
//         const { data: result, error } = await tryCatch(
//           editCourse(submissionData, product.id),
//         );
//         if (error || result?.status === "error") {
//           if (newlyUploadedKey) {
//             await deleteUTFile(newlyUploadedKey);
//           }
//           toast.error(result?.message || "An unexpected error occurred.");
//           return;
//         }
//         if (result.status === "success") {
//           toast.success(result.message);
//           router.refresh();
//         } else {
//           toast.error(result.message);
//         }
//       } else {
//         let finalFileKey = fileKey;
//         let finalFileType = fileType;
//         let finalFileSize = fileSize;
//         let newlyUploadedPdfKey: string | null = null;
//         if (selectedDeliverableFile) {
//           setIsUploadingImages(true);
//           try {
//             const uploadRes = await startDeliverableUpload([
//               selectedDeliverableFile,
//             ]);
//             if (!uploadRes || uploadRes.length === 0) {
//               toast.error(
//                 "Failed to upload deliverable file to cloud storage.",
//               );
//               return;
//             }
//             finalFileKey = uploadRes[0].key;
//             newlyUploadedPdfKey = uploadRes[0].key;
//             finalFileType = selectedDeliverableFile.type;
//             finalFileSize = selectedDeliverableFile.size;
//           } catch (error: unknown) {
//             console.error("Failed to upload deliverable:", error);
//             toast.error(
//               error instanceof Error
//                 ? error.message
//                 : "Failed to upload deliverable file.",
//             );
//             return;
//           } finally {
//             setIsUploadingImages(false);
//           }
//         }
//         const uploadedImageKeys = await processAndUploadImages();
//         if (!uploadedImageKeys) {
//           if (newlyUploadedPdfKey) {
//             await deleteUTFile(newlyUploadedPdfKey);
//           }
//           return;
//         }
//         if (!title || !description || !price) {
//           toast.error("Please fill in all required basic information fields.");
//           return;
//         }
//         if (!finalFileKey) {
//           toast.error("Please upload the main digital asset file.");
//           return;
//         }
//         const numericPrice = parseFloat(price);
//         if (isNaN(numericPrice) || numericPrice < 1) {
//           toast.error("Please enter a valid price of at least $1.");
//           return;
//         }
//         const rawInitialImages =
//           product.images
//             ?.map((img: DigitalImageItem) =>
//               typeof img.imageKey === "string" ? img.imageKey : "",
//             )
//             .filter(Boolean) || [];
//         const initialKeys = rawInitialImages.map(extractKeyFromUrl);
//         const currentKeys = uploadedImageKeys.map(extractKeyFromUrl);
//         const keysToDelete = initialKeys.filter(
//           (oldKey: string) => !currentKeys.includes(oldKey),
//         );

//         const numericPrintedPrice =
//           printedPrice.trim() !== "" ? parseFloat(printedPrice) : null;

//         const payload = {
//           productId: product.id,
//           title,
//           description,
//           type: selectedProductType,

//           // Digital price in cents
//           price: Math.round(numericPrice * 100),

//           // Printed price in cents.
//           // null means no printed version is offered.
//           printedPrice:
//             numericPrintedPrice !== null &&
//             Number.isFinite(numericPrintedPrice) &&
//             numericPrintedPrice > 0
//               ? Math.round(numericPrintedPrice * 100)
//               : null,

//           imagesToDelete: keysToDelete,

//           fileKey: finalFileKey,
//           fileType: finalFileType,
//           fileSize: finalFileSize,

//           images: uploadedImageKeys.map((key, index) => ({
//             imageKey: key,
//             position: index,
//           })),
//         };
//         const result = await updateProduct(payload);
//         if (result.status === "success") {
//           toast.success(result.message || "Changes saved successfully");
//           router.refresh();
//         } else {
//           if (newlyUploadedPdfKey) {
//             await deleteUTFile(newlyUploadedPdfKey);
//           }
//           toast.error(result.message || "Failed to save product");
//         }
//       }
//     });
//   };
//   const isLoading = pending || isUploadingImages;
//   const courseFormData = {
//     id: product.id,
//     title: product.title ?? "",
//     type: selectedProductType as (typeof productType)[number],
//     slug: product.slug ?? "",
//     description: product.description ?? "",
//     price: product.price ?? 0,
//     status: product.status,
//     fileKey: rawFileKey.trim(),
//     imageUrl: rawImageUrl.trim(),
//     duration: product.duration ?? 0,
//     category: product.category ?? "",
//     hasCourseRelation: Boolean(product.chapters && product.chapters.length > 0),
//     chapter: product.chapters || [],
//   };
//   return (
//     <Form {...form}>
//       <form
//         onSubmit={form.handleSubmit(handleSave, (errors) => {
//           console.error("FORM VALIDATION ERRORS:", errors);
//           Object.entries(errors).forEach(([field, error]) => {
//             toast.error(`${field}: ${error?.message || "Invalid value"}`);
//           });
//         })}
//         className="space-y-6"
//       >
//         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
//           {/* Main Details Section */}
//           <div className="lg:col-span-8 space-y-6">
//             <Card className="border-border bg-card/50 backdrop-blur-sm shadow-sm">
//               <CardContent className="pt-0 space-y-5">
//                 <FormField
//                   control={form.control}
//                   name="title"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel className="text-xs font-medium">
//                         Product Title
//                       </FormLabel>
//                       <FormControl>
//                         <Input
//                           placeholder="e.g. Master Next.js 15"
//                           className="h-10 text-sm"
//                           {...field}
//                           onChange={(e) => {
//                             field.onChange(e);
//                             setTitle(e.target.value);
//                             form.setValue(
//                               "slug",
//                               slugify(e.target.value, { lower: true }),
//                             );
//                           }}
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name="description"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel className="text-xs font-medium">
//                         Description
//                       </FormLabel>
//                       <FormControl>
//                         <RichTextEditor
//                           field={{
//                             value: field.value,
//                             onChange: (val: string) => {
//                               field.onChange(val);
//                               setDescription(val);
//                             },
//                           }}
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </CardContent>
//             </Card>
//             {/* Embedded Course Structure Section */}
//             {isCourse && <CourseStructure data={courseFormData} />}
//             {/* Gallery Media: Hidden if product type is Course */}
//             {!isCourse && (
//               <Card className="border-border bg-card/50 backdrop-blur-sm shadow-sm">
//                 <CardContent className="pt-4 space-y-3">
//                   <Label className="text-xs font-medium">Media Gallery</Label>
//                   <MultiImageUploader
//                     value={multiUploaderValues}
//                     onChange={handleMultiUploaderChange}
//                   />
//                 </CardContent>
//               </Card>
//             )}
//           </div>
//           {/* Sidebar Section */}
//           <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
//             <Card className="border-border bg-card/50 backdrop-blur-sm shadow-sm">
//               <CardContent className="pt-0 space-y-4">
//                 {isCourse && (
//                   <div className="space-y-2">
//                     <Label className="text-xs font-medium">
//                       Course Thumbnail
//                     </Label>
//                     <FormField
//                       control={form.control}
//                       name="fileKey"
//                       render={() => (
//                         <FormItem>
//                           <FormControl>
//                             <div>
//                               <div
//                                 className="relative aspect-video overflow-hidden rounded-lg border border-border bg-muted/40 cursor-pointer group hover:border-primary/50 transition-all"
//                                 onClick={() => fileInputRef.current?.click()}
//                               >
//                                 <Image
//                                   src={imageSrc}
//                                   alt="Course thumbnail"
//                                   fill
//                                   unoptimized={
//                                     typeof imageSrc === "string" &&
//                                     (imageSrc.startsWith("https://utfs.io") ||
//                                       imageSrc.includes("uploadthing"))
//                                   }
//                                   className="object-cover transition duration-300 group-hover:scale-105"
//                                   onError={() => setImageError(true)}
//                                 />
//                                 <div
//                                   className="absolute inset-0 bg-black/50 opacity-0
//                                   group-hover:opacity-100 flex flex-col items-center justify-center
//                                   gap-1.5 transition text-white"
//                                 >
//                                   <UploadCloud className="size-5" />
//                                   <span className="text-xs font-medium">
//                                     Change Image
//                                   </span>
//                                 </div>
//                               </div>
//                               <input
//                                 ref={fileInputRef}
//                                 type="file"
//                                 accept="image/*"
//                                 hidden
//                                 onChange={(e) => {
//                                   const file = e.target.files?.[0];
//                                   if (file) {
//                                     setSelectedImage(file);
//                                     setImageError(false);
//                                   }
//                                 }}
//                               />
//                             </div>
//                           </FormControl>
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />
//                   </div>
//                 )}
//                 {!isCourse && (
//                   <div className="space-y-3">
//                     <div className="flex items-center justify-between">
//                       <Label className="text-xs font-medium">
//                         Deliverable Asset
//                       </Label>
//                       {fileKey && (
//                         <div className="flex items-center gap-1">
//                           <Button
//                             type="button"
//                             size="icon"
//                             variant="ghost"
//                             className="size-8"
//                             onClick={() => setIsPreviewOpen(true)}
//                             aria-label="Preview deliverable"
//                           >
//                             <Eye className="size-4" />
//                           </Button>
//                           <Button
//                             type="button"
//                             size="icon"
//                             variant="ghost"
//                             className="size-8 text-destructive hover:text-destructive"
//                             onClick={handleDeleteDeliverable}
//                             disabled={isDeletingDeliverable}
//                             aria-label="Delete deliverable"
//                           >
//                             {isDeletingDeliverable ? (
//                               <Loader2 className="size-4 animate-spin" />
//                             ) : (
//                               <Trash2 className="size-4" />
//                             )}
//                           </Button>
//                         </div>
//                       )}
//                     </div>

//                     {fileKey ? (
//                       <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
//                         <div className="flex items-center gap-3 min-w-0">
//                           <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
//                             <FileText className="size-5 text-primary" />
//                           </div>
//                           <div className="min-w-0 flex-1">
//                             <p className="truncate text-sm font-medium">
//                               {getFileName(fileKey)}
//                             </p>
//                             <p className="text-xs text-muted-foreground">
//                               {fileType || "File"} • {formatFileSize(fileSize)}
//                             </p>
//                           </div>
//                         </div>

//                         <div className="pt-1">
//                           <p className="mb-2 text-[11px] text-muted-foreground">
//                             Use the uploader below to replace this file.
//                           </p>
//                           <SingleFileUploader
//                             value=""
//                             onChange={handleDeliverableChange}
//                           />
//                         </div>
//                       </div>
//                     ) : (
//                       <SingleFileUploader
//                         value={fileKey}
//                         onChange={handleDeliverableChange}
//                       />
//                     )}

//                     {isPreviewOpen && fileKey && (
//                       <div
//                         className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
//                         role="dialog"
//                         aria-modal="true"
//                         aria-label="Deliverable preview"
//                         onClick={() => setIsPreviewOpen(false)}
//                       >
//                         <div
//                           className="relative flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-background shadow-xl"
//                           onClick={(event) => event.stopPropagation()}
//                         >
//                           <div className="flex items-center justify-between border-b px-4 py-3">
//                             <div className="min-w-0">
//                               <p className="truncate text-sm font-semibold">
//                                 {getFileName(fileKey)}
//                               </p>
//                               <p className="text-xs text-muted-foreground">
//                                 Deliverable Preview
//                               </p>
//                             </div>
//                             <Button
//                               type="button"
//                               size="icon"
//                               variant="ghost"
//                               onClick={() => setIsPreviewOpen(false)}
//                               aria-label="Close preview"
//                             >
//                               <X className="size-4" />
//                             </Button>
//                           </div>

//                           <div className="min-h-0 flex-1 bg-muted/20 p-2">
//                             {fileType === "application/pdf" ? (
//                               <iframe
//                                 src={getDeliverableUrl(fileKey)}
//                                 title="Deliverable PDF preview"
//                                 className="h-full w-full rounded-md border bg-background"
//                               />
//                             ) : fileType.startsWith("image/") ? (
//                               <div className="flex h-full items-center justify-center overflow-auto">
//                                 <Image
//                                   src={getDeliverableUrl(fileKey)}
//                                   alt="Deliverable preview"
//                                   className="max-h-full max-w-full object-contain"
//                                 />
//                               </div>
//                             ) : (
//                               <div className="flex h-full flex-col items-center justify-center gap-3">
//                                 <FileText className="size-12 text-muted-foreground" />
//                                 <p className="text-sm text-muted-foreground text-center">
//                                   Preview is not available for this file type.
//                                 </p>
//                                 <Button type="button" asChild>
//                                   <a
//                                     href={getDeliverableUrl(fileKey)}
//                                     target="_blank"
//                                     rel="noopener noreferrer"
//                                   >
//                                     Open File
//                                   </a>
//                                 </Button>
//                               </div>
//                             )}
//                           </div>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 )}
//                 {isCourse && (
//                   <FormField
//                     control={form.control}
//                     name="category"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel className="text-xs font-medium">
//                           Category
//                         </FormLabel>
//                         <Select
//                           value={field.value}
//                           onValueChange={field.onChange}
//                         >
//                           <FormControl>
//                             <SelectTrigger className="h-9 text-sm">
//                               <SelectValue placeholder="Select category" />
//                             </SelectTrigger>
//                           </FormControl>
//                           <SelectContent>
//                             {courseCategories.map((item) => (
//                               <SelectItem key={item} value={item}>
//                                 {item}
//                               </SelectItem>
//                             ))}
//                           </SelectContent>
//                         </Select>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                 )}
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//                   {/* ============================================================
//       DIGITAL / COURSE PRICE
//   ============================================================ */}

//                   <FormField
//                     control={form.control}
//                     name="price"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel className="text-xs font-medium">
//                           {isCourse ? "Course Price ($)" : "Digital Price ($)"}
//                         </FormLabel>

//                         <FormControl>
//                           <Input
//                             type="number"
//                             min="0"
//                             step="0.01"
//                             className="h-9 text-sm"
//                             value={isCourse ? (field.value ?? 0) : price}
//                             onChange={(e) => {
//                               const value = e.target.value;

//                               if (isCourse) {
//                                 field.onChange(
//                                   value === "" ? 0 : Number(value),
//                                 );
//                               } else {
//                                 setPrice(value);

//                                 field.onChange(
//                                   value === "" ? 0 : Number(value),
//                                 );
//                               }
//                             }}
//                           />
//                         </FormControl>

//                         <FormMessage />

//                         {!isCourse && (
//                           <p className="text-[11px] text-muted-foreground">
//                             Price customers pay for the digital version.
//                           </p>
//                         )}
//                       </FormItem>
//                     )}
//                   />

//                   {/* ============================================================
//       PRINTED PRICE — DIGITAL PRODUCTS ONLY
//   ============================================================ */}

//                   {!isCourse && (
//                     <FormField
//                       control={form.control}
//                       name="printedPrice"
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel className="text-xs font-medium">
//                             Printed Price ($)
//                             <span className="ml-1 text-muted-foreground font-normal">
//                               Optional
//                             </span>
//                           </FormLabel>

//                           <FormControl>
//                             <Input
//                               type="number"
//                               min="0"
//                               step="0.01"
//                               className="h-9 text-sm"
//                               placeholder="e.g. 29.99"
//                               value={printedPrice}
//                               onChange={(e) => {
//                                 const value = e.target.value;

//                                 setPrintedPrice(value);

//                                 field.onChange(
//                                   value === "" ? undefined : Number(value),
//                                 );
//                               }}
//                             />
//                           </FormControl>

//                           <FormMessage />

//                           <p className="text-[11px] text-muted-foreground">
//                             Optional price for customers who want a physical
//                             printed copy.
//                           </p>
//                         </FormItem>
//                       )}
//                     />
//                   )}

//                   {/* ============================================================
//       COURSE DURATION
//   ============================================================ */}

//                   {isCourse && (
//                     <FormField
//                       control={form.control}
//                       name="duration"
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel className="text-xs font-medium">
//                             Duration (hrs)
//                           </FormLabel>

//                           <FormControl>
//                             <Input
//                               type="number"
//                               min="0"
//                               step="0.5"
//                               className="h-9 text-sm"
//                               value={field.value ?? ""}
//                               onChange={(e) =>
//                                 field.onChange(
//                                   e.target.value
//                                     ? Number(e.target.value)
//                                     : null,
//                                 )
//                               }
//                             />
//                           </FormControl>

//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />
//                   )}
//                 </div>
//                 <div className="pt-2">
//                   <Button
//                     type="submit"
//                     disabled={isLoading}
//                     className="w-full h-9 font-medium shadow-xs"
//                   >
//                     {isLoading ? (
//                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                     ) : (
//                       <Save className="mr-2 h-4 w-4" />
//                     )}
//                     {isUploadingImages
//                       ? "Uploading..."
//                       : pending
//                         ? "Saving..."
//                         : "Save Changes"}
//                   </Button>
//                 </div>
//               </CardContent>
//             </Card>
//           </aside>
//         </div>
//       </form>
//     </Form>
//   );
// }
