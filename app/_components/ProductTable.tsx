"use client";

import { useState, useTransition } from "react";
import { Button } from "@/app/_components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/_components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/app/_components/ui/dialog";
import LogoImg from "@/public/images/no-image.jpeg";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/_components/ui/alert-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/app/_components/ui/accordion";
import { Textarea } from "@/app/_components/ui/textarea";
import { Checkbox } from "@/app/_components/ui/checkbox";
import { Label } from "@/app/_components/ui/label";

import {
  Eye,
  MoreVertical,
  Trash2,
  User,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Video,
  BookOpen,
  DollarSign,
  AlertCircle,
  Play,
  ClipboardCheck,
  MessageSquare,
  FileText,
  ImageIcon,
  DownloadCloud,
  Pencil,
} from "lucide-react";
import Image from "next/image";
import { Badge } from "@/app/_components/ui/badge";
import { toast } from "sonner";

import { ProductTableType } from "../actions/manage-get-all-products";
import { updateProductStatus } from "../actions/admin-publish-product";

import Link from "next/link";
import { deleteProduct } from "../actions/manager-delete-product";

interface ProductTableProps {
  data: ProductTableType;
}

const stripHtmlTags = (html: string) => {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, "").trim();
};

export function ProductTable({ data }: ProductTableProps) {
  const { mainVideoUrl } = data;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [adminFeedback, setAdminFeedback] = useState("");
  const [selectedLesson, setSelectedLesson] = useState<{
    title: string;
    videoUrl?: string;
  } | null>(null);

  const isCourse = data.type === "Course";
  const activeVideoUrl =
    (selectedLesson?.videoUrl || mainVideoUrl) ?? undefined;
  const digitalImages: string[] = data.digitalProductImages ?? [];

  const getFirstValidImage = (images: string[]) => {
    return images.find((img) => Boolean(img && img.trim())) || null;
  };

  const firstAvailableDigitalImage = getFirstValidImage(digitalImages);

  const [activeDigitalImage, setActiveDigitalImage] = useState<string | null>(
    firstAvailableDigitalImage,
  );

  const [checklist, setChecklist] = useState({
    mediaQuality: false,
    curriculumComplete: false,
    guidelinesMet: false,
    pricingValid: false,
  });

  const targetImageKey = isCourse
    ? data.fileKey
    : firstAvailableDigitalImage || data.fileKey;

  const thumbnailUrl = targetImageKey
    ? targetImageKey.startsWith("http")
      ? targetImageKey
      : `https://utfs.io/f/${targetImageKey}`
    : LogoImg.src;

  const editUrl = `/manage/products/${data.id}/edit`;

  const handleStatusUpdate = (newStatus: "Published" | "Rejected") => {
    startTransition(async () => {
      const result = await updateProductStatus(data.id, newStatus);

      if (result.success) {
        toast.success(`Product ${newStatus.toLowerCase()} successfully`);
        setIsDialogOpen(false);
      } else {
        toast.error("Something went wrong");
      }
    });
  };

  const handleDeleteProduct = () => {
    startDeleteTransition(async () => {
      const result = await deleteProduct(data.id);

      if (result.status === "success") {
        toast.success(
          result.message || "Product and associated records deleted",
        );
        setIsDeleteDialogOpen(false);
      } else {
        toast.error(result.message || "Failed to delete product");
      }
    });
  };

  const initials = data.educatorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <tr className="group hover:bg-muted/40 transition-colors border-b last:border-0">
        <td className="px-6 py-4 max-w-md">
          <div className="flex items-center gap-4">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border shadow-sm">
              <Image
                src={thumbnailUrl}
                alt={data.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-110"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                {data.title}
              </span>
              <span className="text-xs text-muted-foreground line-clamp-1 italic">
                {stripHtmlTags(data.description) || "No description provided."}
              </span>
            </div>
          </div>
        </td>

        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
          <div className="flex items-center gap-1.5 font-medium">
            <Clock className="size-3.5 text-muted-foreground" />
            {data.type}
          </div>
        </td>

        <td className="px-6 py-4 whitespace-nowrap text-sm">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-secondary-foreground border">
              {initials || <User className="h-3 w-3" />}
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {data.educatorName}
            </span>
          </div>
        </td>

        <td className="px-6 py-4 whitespace-nowrap text-sm">
          <Badge
            variant={data.status === "Published" ? "default" : "secondary"}
            className="text-[10px] uppercase"
          >
            {data.status || "Draft"}
          </Badge>
        </td>

        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
          <div className="flex items-center gap-1.5 font-medium">
            ${data.price.toFixed(2)}
          </div>
        </td>

        {/* Actions */}
        <td className="px-6 py-4 whitespace-nowrap text-right">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem asChild>
                  <Link href={editUrl}>
                    <Pencil className="size-4 mr-2" /> Edit
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Eye className="size-4 mr-2" /> Approve
                  </DropdownMenuItem>
                </DialogTrigger>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="size-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* SINGLE-COLUMN MODAL CONTENT */}
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-xl shadow-2xl border">
              {/* Modal Sticky Header */}
              <div className="p-5 border-b sticky top-0 bg-background/95 backdrop-blur-md z-20 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <DialogTitle className="text-lg font-bold tracking-tight">
                      {data.title}
                    </DialogTitle>
                    <Badge
                      variant="outline"
                      className="text-[10px] uppercase font-semibold"
                    >
                      {data.status || "Pending"}
                    </Badge>
                  </div>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Reviewing submission by{" "}
                    <span className="font-medium text-foreground">
                      {data.educatorName}
                    </span>
                  </DialogDescription>
                </div>
              </div>

              {/* Single-Column Body Stream */}
              <div className="p-6 space-y-8">
                {/* SECTION 1: Media Preview / Image Gallery */}
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      {isCourse ? (
                        <>
                          <Video className="size-4 text-primary" />
                          Video Preview
                        </>
                      ) : (
                        <>
                          <ImageIcon className="size-4 text-primary" />
                          Product Gallery Preview
                        </>
                      )}
                    </h3>
                    {isCourse && selectedLesson && (
                      <Badge
                        variant="secondary"
                        className="text-[11px] font-normal"
                      >
                        Playing: {selectedLesson.title}
                      </Badge>
                    )}
                  </div>

                  {/* CONDITION: Course Video Player vs. Digital Product Image Gallery */}
                  {isCourse ? (
                    <div className="aspect-video w-full overflow-hidden rounded-xl border bg-black shadow-inner relative group">
                      {activeVideoUrl ? (
                        <video
                          src={activeVideoUrl}
                          controls
                          className="h-full w-full object-contain"
                          poster={thumbnailUrl}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2 bg-muted/20">
                          <AlertCircle className="size-8 stroke-[1.5]" />
                          <span className="text-xs">
                            No media preview available for this selection
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Main Image Display */}
                      <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-muted/30">
                        {activeDigitalImage || firstAvailableDigitalImage ? (
                          <Image
                            src={
                              (activeDigitalImage ||
                                firstAvailableDigitalImage)!.startsWith("http")
                                ? (activeDigitalImage ||
                                    firstAvailableDigitalImage)!
                                : `https://utfs.io/f/${activeDigitalImage || firstAvailableDigitalImage}`
                            }
                            alt={data.title}
                            fill
                            className="object-contain"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2">
                            <ImageIcon className="size-8 stroke-[1.5]" />
                            <span className="text-xs">
                              No preview images uploaded
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Image Thumbnail Selector Strip */}
                      {digitalImages.length > 1 && (
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                          {digitalImages.map((imgKey, idx) => {
                            const imgUrl = imgKey.startsWith("http")
                              ? imgKey
                              : `https://utfs.io/f/${imgKey}`;
                            const isSelected =
                              (activeDigitalImage ||
                                firstAvailableDigitalImage) === imgKey;

                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setActiveDigitalImage(imgKey)}
                                className={`relative h-16 w-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                                  isSelected
                                    ? "border-primary ring-2 ring-primary/20"
                                    : "border-border opacity-70 hover:opacity-100"
                                }`}
                              >
                                <Image
                                  src={imgUrl}
                                  alt={`Preview ${idx + 1}`}
                                  fill
                                  className="object-cover"
                                />
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </section>

                {/* SECTION 2: Quick Metadata */}
                <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-lg border bg-card/50 flex flex-col justify-between space-y-1">
                    <span className="text-[11px] font-medium text-muted-foreground">
                      Product Type
                    </span>
                    <p className="text-sm font-semibold">
                      {data.type || "General"}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-lg border bg-card/50 flex flex-col justify-between space-y-1">
                    <span className="text-[11px] font-medium text-muted-foreground">
                      Pricing
                    </span>
                    <p className="text-sm font-semibold flex items-center">
                      <DollarSign className="size-3.5 text-muted-foreground" />$
                      {data.price.toFixed(2)}
                    </p>
                  </div>
                </section>

                {/* SECTION 3: Description */}
                <section className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Overview & Description
                  </h3>
                  <p className="text-sm leading-relaxed text-foreground/90 p-4 rounded-xl border bg-card">
                    {stripHtmlTags(data.description) ||
                      "No description provided."}
                  </p>
                </section>

                {/* SECTION 4: CONDITION - Curriculum vs Digital Download Info */}
                {isCourse ? (
                  <section className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <BookOpen className="size-4 text-primary" />
                      Curriculum Structure
                    </h3>

                    {data.course?.chapter && data.course.chapter.length > 0 ? (
                      <Accordion
                        type="single"
                        collapsible
                        className="w-full border rounded-xl overflow-hidden divide-y shadow-sm"
                      >
                        {data.course.chapter.map((chap, idx) => (
                          <AccordionItem
                            key={chap.id || idx}
                            value={`chap-${idx}`}
                            className="border-b-0"
                          >
                            <AccordionTrigger className="px-4 py-3.5 hover:no-underline hover:bg-muted/30 transition-colors bg-card">
                              <span className="text-xs font-semibold text-left">
                                Chapter {idx + 1}: {chap.title}
                              </span>
                            </AccordionTrigger>
                            <AccordionContent className="p-0 divide-y bg-muted/10">
                              {chap.lessons && chap.lessons.length > 0 ? (
                                chap.lessons.map((lesson) => {
                                  const isSelected =
                                    selectedLesson?.title === lesson.title;
                                  return (
                                    <div
                                      key={lesson.id}
                                      className={`flex items-center justify-between p-3 px-5 text-xs transition-colors cursor-pointer ${
                                        isSelected
                                          ? "bg-primary/10 text-primary font-medium"
                                          : "hover:bg-muted/40 text-foreground"
                                      }`}
                                      onClick={() =>
                                        setSelectedLesson({
                                          title: lesson.title,
                                          videoUrl:
                                            lesson.videoUrl ?? undefined,
                                        })
                                      }
                                    >
                                      <div className="flex items-center gap-2.5">
                                        <Play
                                          className={`size-3.5 ${
                                            isSelected
                                              ? "fill-primary text-primary"
                                              : "text-muted-foreground"
                                          }`}
                                        />
                                        <span>{lesson.title}</span>
                                      </div>
                                      {isSelected && (
                                        <Badge
                                          variant="outline"
                                          className="text-[9px] py-0 border-primary text-primary"
                                        >
                                          Active Preview
                                        </Badge>
                                      )}
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="p-3 text-xs text-muted-foreground italic px-5">
                                  No lessons in this chapter.
                                </div>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    ) : (
                      <div className="p-6 border border-dashed rounded-xl text-center text-xs text-muted-foreground">
                        No chapter structure configured for this course.
                      </div>
                    )}
                  </section>
                ) : (
                  <section className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <DownloadCloud className="size-4 text-primary" />
                      Digital Asset Details
                    </h3>
                    <div className="p-4 rounded-xl border bg-card space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 text-xs">
                        <div className="flex items-center gap-3">
                          <FileText className="size-5 text-primary shrink-0" />
                          <div>
                            <p className="font-semibold text-foreground">
                              Main Downloadable Asset
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate max-w-xs">
                              {data.fileKey || "No primary file key linked"}
                            </p>
                          </div>
                        </div>
                        {data.fileKey && (
                          <a
                            href={
                              data.fileKey.startsWith("http")
                                ? data.fileKey
                                : `https://utfs.io/f/${data.fileKey}`
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                          >
                            Download / Inspect
                          </a>
                        )}
                      </div>
                    </div>
                  </section>
                )}

                {/* SECTION 5: Instructor Card & Dynamic Quality Checklist */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Educator Info */}
                  <div className="p-4 rounded-xl border bg-card space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <User className="size-3.5" /> Instructor / Creator
                    </h4>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-xs font-bold border shrink-0">
                        {initials || <User className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">
                          {data.educatorName}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          Product Author
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quality Audit Checklist */}
                  <div className="p-4 rounded-xl border bg-card space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <ClipboardCheck className="size-3.5" /> Review Audit
                      Checklist
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="media"
                          checked={checklist.mediaQuality}
                          onCheckedChange={(checked) =>
                            setChecklist((prev) => ({
                              ...prev,
                              mediaQuality: !!checked,
                            }))
                          }
                        />
                        <Label
                          htmlFor="media"
                          className="text-xs font-normal cursor-pointer"
                        >
                          {isCourse
                            ? "High video resolution & clear audio"
                            : "High quality preview images uploaded"}
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="curriculum"
                          checked={checklist.curriculumComplete}
                          onCheckedChange={(checked) =>
                            setChecklist((prev) => ({
                              ...prev,
                              curriculumComplete: !!checked,
                            }))
                          }
                        />
                        <Label
                          htmlFor="curriculum"
                          className="text-xs font-normal cursor-pointer"
                        >
                          {isCourse
                            ? "Complete structure & filled lessons"
                            : "Digital asset uploaded and accessible"}
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="guidelines"
                          checked={checklist.guidelinesMet}
                          onCheckedChange={(checked) =>
                            setChecklist((prev) => ({
                              ...prev,
                              guidelinesMet: !!checked,
                            }))
                          }
                        />
                        <Label
                          htmlFor="guidelines"
                          className="text-xs font-normal cursor-pointer"
                        >
                          Complies with publishing standards
                        </Label>
                      </div>
                    </div>
                  </div>
                </section>

                {/* SECTION 6: Admin Review Feedback */}
                <section className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <MessageSquare className="size-3.5" /> Reviewer Feedback /
                    Rejection Notes
                  </h3>
                  <Textarea
                    placeholder="Provide constructive feedback if rejecting or requesting changes..."
                    className="text-xs h-24 resize-none bg-card rounded-xl"
                    value={adminFeedback}
                    onChange={(e) => setAdminFeedback(e.target.value)}
                  />
                </section>
              </div>

              {/* Modal Sticky Action Bar */}
              <div className="p-4 border-t sticky bottom-0 bg-background/95 backdrop-blur-md z-20 flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  disabled={isPending}
                  size="sm"
                  className="border-destructive/40 text-destructive hover:bg-destructive/10"
                  onClick={() => handleStatusUpdate("Rejected")}
                >
                  {isPending ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="mr-1.5 size-4" />
                  )}
                  Reject Product
                </Button>
                <Button
                  disabled={isPending}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white font-medium"
                  onClick={() => handleStatusUpdate("Published")}
                >
                  {isPending ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-1.5 size-4" />
                  )}
                  Approve & Publish
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </td>
      </tr>

      {/* DELETE CONFIRMATION DIALOG */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-semibold text-foreground">
                &quot;{data.title}&quot;
              </span>{" "}
              and all of its associated records (chapters, lessons, assets, and
              purchases). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                handleDeleteProduct();
              }}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Product"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Place this at the bottom of AdminProductRow.tsx

export function ProductTableSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4">
        <div className="h-4 w-32 bg-muted rounded" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-24 bg-muted rounded" />
      </td>
      <td className="px-6 py-4">
        <div className="h-6 w-16 bg-muted rounded-full" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-12 bg-muted rounded" />
      </td>
      <td className="px-6 py-4 text-right">
        <div className="h-8 w-8 bg-muted rounded-md ml-auto" />
      </td>
      <td className="px-6 py-4 text-right">
        <div className="h-8 w-8 bg-muted rounded-md ml-auto" />
      </td>
    </tr>
  );
}

// "use client";

// import { useState, useTransition } from "react";
// import { Button } from "@/app/_components/ui/button";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/app/_components/ui/dropdown-menu";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogTitle,
//   DialogTrigger,
// } from "@/app/_components/ui/dialog";
// import {
//   Accordion,
//   AccordionContent,
//   AccordionItem,
//   AccordionTrigger,
// } from "@/app/_components/ui/accordion";
// import { Textarea } from "@/app/_components/ui/textarea";
// import { Checkbox } from "@/app/_components/ui/checkbox";
// import { Label } from "@/app/_components/ui/label";

// import {
//   Eye,
//   MoreVertical,
//   Trash2,
//   User,
//   CheckCircle,
//   XCircle,
//   Clock,
//   Loader2,
//   Video,
//   BookOpen,
//   DollarSign,
//   AlertCircle,
//   Play,
//   ClipboardCheck,
//   MessageSquare,
//   FileText,
//   ImageIcon,
//   DownloadCloud,
// } from "lucide-react";
// import Image from "next/image";
// import { Badge } from "@/app/_components/ui/badge";
// import { toast } from "sonner";

// import { AdminProductType } from "../actions/admin-get-all-products";
// import { updateProductStatus } from "../actions/admin-publish-product";

// interface AdminProductRowProps {
//   data: AdminProductType;
// }

// export function AdminProductRow({ data }: AdminProductRowProps) {
//   // 1. Extract mainVideoUrl and sanitize for video element src
//   const { mainVideoUrl } = data;
//   const [isDialogOpen, setIsDialogOpen] = useState(false);
//   const [isPending, startTransition] = useTransition();
//   const [adminFeedback, setAdminFeedback] = useState("");
//   const [selectedLesson, setSelectedLesson] = useState<{
//     title: string;
//     videoUrl?: string;
//   } | null>(null);

//   // Is this product a Course?
//   const isCourse = data.type === "Course";

//   // Active video source sanitized (converts `null` to `undefined` for React <video src>)
//   const activeVideoUrl =
//     (selectedLesson?.videoUrl || mainVideoUrl) ?? undefined;

//   // Safely grab the array of strings your backend mapped
//   const digitalImages: string[] = data.digitalProductImages ?? [];

//   // Helper function to extract the first non-empty image string
//   const getFirstValidImage = (images: string[]) => {
//     return images.find((img) => Boolean(img && img.trim())) || null;
//   };

//   const firstAvailableDigitalImage = getFirstValidImage(digitalImages);

//   // Active Selected Image for Non-Course Product Gallery Modal State
//   const [activeDigitalImage, setActiveDigitalImage] = useState<string | null>(
//     firstAvailableDigitalImage,
//   );

//   // Quality Audit Checklist State
//   const [checklist, setChecklist] = useState({
//     mediaQuality: false,
//     curriculumComplete: false,
//     guidelinesMet: false,
//     pricingValid: false,
//   });

//   // Calculate Thumbnail for Table Row
//   const targetImageKey = isCourse
//     ? data.fileKey
//     : firstAvailableDigitalImage || data.fileKey;

//   const thumbnailUrl = targetImageKey
//     ? targetImageKey.startsWith("http")
//       ? targetImageKey
//       : `https://utfs.io/f/${targetImageKey}`
//     : "/placeholder-course.jpg";

//   const handleStatusUpdate = (newStatus: "Published" | "Rejected") => {
//     startTransition(async () => {
//       const result = await updateProductStatus(data.id, newStatus);

//       if (result.success) {
//         toast.success(`Product ${newStatus.toLowerCase()} successfully`);
//         setIsDialogOpen(false);
//       } else {
//         toast.error("Something went wrong");
//       }
//     });
//   };

//   const initials = data.educatorName
//     .split(" ")
//     .map((n) => n[0])
//     .join("")
//     .toUpperCase()
//     .slice(0, 2);

//   return (
//     <tr className="group hover:bg-muted/40 transition-colors border-b last:border-0">
//       <td className="px-6 py-4 max-w-md">
//         <div className="flex items-center gap-4">
//           <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border shadow-sm">
//             <Image
//               src={thumbnailUrl}
//               alt={data.title}
//               fill
//               className="object-cover transition-transform duration-300 group-hover:scale-110"
//             />
//           </div>
//           <div className="flex flex-col min-w-0">
//             <span className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
//               {data.title}
//             </span>
//             <p className="text-xs text-muted-foreground line-clamp-1 italic">
//               {data.smallDescription}
//             </p>
//           </div>
//         </div>
//       </td>

//       <td className="px-6 py-4 whitespace-nowrap text-sm">
//         <div className="flex items-center gap-3">
//           <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-secondary-foreground border">
//             {initials || <User className="h-3 w-3" />}
//           </div>
//           <span className="text-sm font-medium text-muted-foreground">
//             {data.educatorName}
//           </span>
//         </div>
//       </td>

//       <td className="px-6 py-4 whitespace-nowrap text-sm">
//         <Badge
//           variant={data.status === "Published" ? "default" : "secondary"}
//           className="text-[10px] uppercase"
//         >
//           {data.status || "Draft"}
//         </Badge>
//       </td>

//       <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
//         <div className="flex items-center gap-1.5 font-medium">
//           <Clock className="size-3.5 text-muted-foreground" />
//           {data.type}
//         </div>
//       </td>

//       {/* Actions */}
//       <td className="px-6 py-4 whitespace-nowrap text-right">
//         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//           <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//               <Button variant="ghost" size="icon" className="h-8 w-8">
//                 <MoreVertical className="size-4" />
//               </Button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent align="end" className="w-44">
//               <DialogTrigger asChild>
//                 <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
//                   <Eye className="size-4 mr-2" /> Review Product
//                 </DropdownMenuItem>
//               </DialogTrigger>
//               <DropdownMenuSeparator />
//               <DropdownMenuItem className="text-destructive">
//                 <Trash2 className="size-4 mr-2" /> Suspend
//               </DropdownMenuItem>
//             </DropdownMenuContent>
//           </DropdownMenu>

//           {/* SINGLE-COLUMN MODAL CONTENT */}
//           <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-xl shadow-2xl border">
//             {/* Modal Sticky Header */}
//             <div className="p-5 border-b sticky top-0 bg-background/95 backdrop-blur-md z-20 flex items-center justify-between">
//               <div className="space-y-1">
//                 <div className="flex items-center gap-2">
//                   <DialogTitle className="text-lg font-bold tracking-tight">
//                     {data.title}
//                   </DialogTitle>
//                   <Badge
//                     variant="outline"
//                     className="text-[10px] uppercase font-semibold"
//                   >
//                     {data.status || "Pending"}
//                   </Badge>
//                 </div>
//                 <DialogDescription className="text-xs text-muted-foreground">
//                   Reviewing submission by{" "}
//                   <span className="font-medium text-foreground">
//                     {data.educatorName}
//                   </span>
//                 </DialogDescription>
//               </div>
//             </div>

//             {/* Single-Column Body Stream */}
//             <div className="p-6 space-y-8">
//               {/* SECTION 1: Media Preview / Image Gallery */}
//               <section className="space-y-3">
//                 <div className="flex items-center justify-between">
//                   <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
//                     {isCourse ? (
//                       <>
//                         <Video className="size-4 text-primary" />
//                         Video Preview
//                       </>
//                     ) : (
//                       <>
//                         <ImageIcon className="size-4 text-primary" />
//                         Product Gallery Preview
//                       </>
//                     )}
//                   </h3>
//                   {isCourse && selectedLesson && (
//                     <Badge
//                       variant="secondary"
//                       className="text-[11px] font-normal"
//                     >
//                       Playing: {selectedLesson.title}
//                     </Badge>
//                   )}
//                 </div>

//                 {/* CONDITION: Course Video Player vs. Digital Product Image Gallery */}
//                 {isCourse ? (
//                   <div className="aspect-video w-full overflow-hidden rounded-xl border bg-black shadow-inner relative group">
//                     {activeVideoUrl ? (
//                       <video
//                         src={activeVideoUrl}
//                         controls
//                         className="h-full w-full object-contain"
//                         poster={thumbnailUrl}
//                       />
//                     ) : (
//                       <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2 bg-muted/20">
//                         <AlertCircle className="size-8 stroke-[1.5]" />
//                         <span className="text-xs">
//                           No media preview available for this selection
//                         </span>
//                       </div>
//                     )}
//                   </div>
//                 ) : (
//                   <div className="space-y-3">
//                     {/* Main Image Display */}
//                     <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-muted/30">
//                       {activeDigitalImage || firstAvailableDigitalImage ? (
//                         <Image
//                           src={
//                             (activeDigitalImage ||
//                               firstAvailableDigitalImage)!.startsWith("http")
//                               ? (activeDigitalImage ||
//                                   firstAvailableDigitalImage)!
//                               : `https://utfs.io/f/${activeDigitalImage || firstAvailableDigitalImage}`
//                           }
//                           alt={data.title}
//                           fill
//                           className="object-contain"
//                         />
//                       ) : (
//                         <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2">
//                           <ImageIcon className="size-8 stroke-[1.5]" />
//                           <span className="text-xs">
//                             No preview images uploaded
//                           </span>
//                         </div>
//                       )}
//                     </div>

//                     {/* Image Thumbnail Selector Strip */}
//                     {digitalImages.length > 1 && (
//                       <div className="flex items-center gap-2 overflow-x-auto pb-1">
//                         {digitalImages.map((imgKey, idx) => {
//                           const imgUrl = imgKey.startsWith("http")
//                             ? imgKey
//                             : `https://utfs.io/f/${imgKey}`;
//                           const isSelected =
//                             (activeDigitalImage ||
//                               firstAvailableDigitalImage) === imgKey;

//                           return (
//                             <button
//                               key={idx}
//                               type="button"
//                               onClick={() => setActiveDigitalImage(imgKey)}
//                               className={`relative h-16 w-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
//                                 isSelected
//                                   ? "border-primary ring-2 ring-primary/20"
//                                   : "border-border opacity-70 hover:opacity-100"
//                               }`}
//                             >
//                               <Image
//                                 src={imgUrl}
//                                 alt={`Preview ${idx + 1}`}
//                                 fill
//                                 className="object-cover"
//                               />
//                             </button>
//                           );
//                         })}
//                       </div>
//                     )}
//                   </div>
//                 )}
//               </section>

//               {/* SECTION 2: Quick Metadata */}
//               <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//                 <div className="p-3.5 rounded-lg border bg-card/50 flex flex-col justify-between space-y-1">
//                   <span className="text-[11px] font-medium text-muted-foreground">
//                     Product Type
//                   </span>
//                   <p className="text-sm font-semibold">
//                     {data.type || "General"}
//                   </p>
//                 </div>
//                 <div className="p-3.5 rounded-lg border bg-card/50 flex flex-col justify-between space-y-1">
//                   <span className="text-[11px] font-medium text-muted-foreground">
//                     Pricing
//                   </span>
//                   <p className="text-sm font-semibold flex items-center">
//                     <DollarSign className="size-3.5 text-muted-foreground" />
//                     {data.price ? (data.price / 100).toFixed(2) : "Free"}
//                   </p>
//                 </div>
//               </section>

//               {/* SECTION 3: Description */}
//               <section className="space-y-2">
//                 <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
//                   Overview & Description
//                 </h3>
//                 <p className="text-sm leading-relaxed text-foreground/90 p-4 rounded-xl border bg-card">
//                   {data.smallDescription || "No description provided."}
//                 </p>
//               </section>

//               {/* SECTION 4: CONDITION - Curriculum vs Digital Download Info */}
//               {isCourse ? (
//                 <section className="space-y-3">
//                   <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
//                     <BookOpen className="size-4 text-primary" />
//                     Curriculum Structure
//                   </h3>

//                   {data.course?.chapter && data.course.chapter.length > 0 ? (
//                     <Accordion
//                       type="single"
//                       collapsible
//                       className="w-full border rounded-xl overflow-hidden divide-y shadow-sm"
//                     >
//                       {data.course.chapter.map((chap, idx) => (
//                         <AccordionItem
//                           key={chap.id || idx}
//                           value={`chap-${idx}`}
//                           className="border-b-0"
//                         >
//                           <AccordionTrigger className="px-4 py-3.5 hover:no-underline hover:bg-muted/30 transition-colors bg-card">
//                             <span className="text-xs font-semibold text-left">
//                               Chapter {idx + 1}: {chap.title}
//                             </span>
//                           </AccordionTrigger>
//                           <AccordionContent className="p-0 divide-y bg-muted/10">
//                             {chap.lessons && chap.lessons.length > 0 ? (
//                               chap.lessons.map((lesson) => {
//                                 const isSelected =
//                                   selectedLesson?.title === lesson.title;
//                                 return (
//                                   <div
//                                     key={lesson.id}
//                                     className={`flex items-center justify-between p-3 px-5 text-xs transition-colors cursor-pointer ${
//                                       isSelected
//                                         ? "bg-primary/10 text-primary font-medium"
//                                         : "hover:bg-muted/40 text-foreground"
//                                     }`}
//                                     onClick={() =>
//                                       setSelectedLesson({
//                                         title: lesson.title,
//                                         videoUrl: lesson.videoUrl ?? undefined,
//                                       })
//                                     }
//                                   >
//                                     <div className="flex items-center gap-2.5">
//                                       <Play
//                                         className={`size-3.5 ${
//                                           isSelected
//                                             ? "fill-primary text-primary"
//                                             : "text-muted-foreground"
//                                         }`}
//                                       />
//                                       <span>{lesson.title}</span>
//                                     </div>
//                                     {isSelected && (
//                                       <Badge
//                                         variant="outline"
//                                         className="text-[9px] py-0 border-primary text-primary"
//                                       >
//                                         Active Preview
//                                       </Badge>
//                                     )}
//                                   </div>
//                                 );
//                               })
//                             ) : (
//                               <div className="p-3 text-xs text-muted-foreground italic px-5">
//                                 No lessons in this chapter.
//                               </div>
//                             )}
//                           </AccordionContent>
//                         </AccordionItem>
//                       ))}
//                     </Accordion>
//                   ) : (
//                     <div className="p-6 border border-dashed rounded-xl text-center text-xs text-muted-foreground">
//                       No chapter structure configured for this course.
//                     </div>
//                   )}
//                 </section>
//               ) : (
//                 <section className="space-y-3">
//                   <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
//                     <DownloadCloud className="size-4 text-primary" />
//                     Digital Asset Details
//                   </h3>
//                   <div className="p-4 rounded-xl border bg-card space-y-3">
//                     <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 text-xs">
//                       <div className="flex items-center gap-3">
//                         <FileText className="size-5 text-primary shrink-0" />
//                         <div>
//                           <p className="font-semibold text-foreground">
//                             Main Downloadable Asset
//                           </p>
//                           <p className="text-[11px] text-muted-foreground truncate max-w-xs">
//                             {data.fileKey || "No primary file key linked"}
//                           </p>
//                         </div>
//                       </div>
//                       {data.fileKey && (
//                         <a
//                           href={
//                             data.fileKey.startsWith("http")
//                               ? data.fileKey
//                               : `https://utfs.io/f/${data.fileKey}`
//                           }
//                           target="_blank"
//                           rel="noreferrer"
//                           className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
//                         >
//                           Download / Inspect
//                         </a>
//                       )}
//                     </div>
//                   </div>
//                 </section>
//               )}

//               {/* SECTION 5: Instructor Card & Dynamic Quality Checklist */}
//               <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 {/* Educator Info */}
//                 <div className="p-4 rounded-xl border bg-card space-y-3">
//                   <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
//                     <User className="size-3.5" /> Instructor / Creator
//                   </h4>
//                   <div className="flex items-center gap-3">
//                     <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-xs font-bold border shrink-0">
//                       {initials || <User className="h-4 w-4" />}
//                     </div>
//                     <div>
//                       <p className="text-sm font-semibold">
//                         {data.educatorName}
//                       </p>
//                       <span className="text-xs text-muted-foreground">
//                         Product Author
//                       </span>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Quality Audit Checklist */}
//                 <div className="p-4 rounded-xl border bg-card space-y-3">
//                   <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
//                     <ClipboardCheck className="size-3.5" /> Review Audit
//                     Checklist
//                   </h4>
//                   <div className="space-y-2 text-xs">
//                     <div className="flex items-center space-x-2">
//                       <Checkbox
//                         id="media"
//                         checked={checklist.mediaQuality}
//                         onCheckedChange={(checked) =>
//                           setChecklist((prev) => ({
//                             ...prev,
//                             mediaQuality: !!checked,
//                           }))
//                         }
//                       />
//                       <Label
//                         htmlFor="media"
//                         className="text-xs font-normal cursor-pointer"
//                       >
//                         {isCourse
//                           ? "High video resolution & clear audio"
//                           : "High quality preview images uploaded"}
//                       </Label>
//                     </div>

//                     <div className="flex items-center space-x-2">
//                       <Checkbox
//                         id="curriculum"
//                         checked={checklist.curriculumComplete}
//                         onCheckedChange={(checked) =>
//                           setChecklist((prev) => ({
//                             ...prev,
//                             curriculumComplete: !!checked,
//                           }))
//                         }
//                       />
//                       <Label
//                         htmlFor="curriculum"
//                         className="text-xs font-normal cursor-pointer"
//                       >
//                         {isCourse
//                           ? "Complete structure & filled lessons"
//                           : "Digital asset uploaded and accessible"}
//                       </Label>
//                     </div>

//                     <div className="flex items-center space-x-2">
//                       <Checkbox
//                         id="guidelines"
//                         checked={checklist.guidelinesMet}
//                         onCheckedChange={(checked) =>
//                           setChecklist((prev) => ({
//                             ...prev,
//                             guidelinesMet: !!checked,
//                           }))
//                         }
//                       />
//                       <Label
//                         htmlFor="guidelines"
//                         className="text-xs font-normal cursor-pointer"
//                       >
//                         Complies with publishing standards
//                       </Label>
//                     </div>
//                   </div>
//                 </div>
//               </section>

//               {/* SECTION 6: Admin Review Feedback */}
//               <section className="space-y-2">
//                 <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
//                   <MessageSquare className="size-3.5" /> Reviewer Feedback /
//                   Rejection Notes
//                 </h3>
//                 <Textarea
//                   placeholder="Provide constructive feedback if rejecting or requesting changes..."
//                   className="text-xs h-24 resize-none bg-card rounded-xl"
//                   value={adminFeedback}
//                   onChange={(e) => setAdminFeedback(e.target.value)}
//                 />
//               </section>
//             </div>

//             {/* Modal Sticky Action Bar */}
//             <div className="p-4 border-t sticky bottom-0 bg-background/95 backdrop-blur-md z-20 flex items-center justify-end gap-3">
//               <Button
//                 variant="outline"
//                 disabled={isPending}
//                 size="sm"
//                 className="border-destructive/40 text-destructive hover:bg-destructive/10"
//                 onClick={() => handleStatusUpdate("Rejected")}
//               >
//                 {isPending ? (
//                   <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
//                 ) : (
//                   <XCircle className="mr-1.5 size-4" />
//                 )}
//                 Reject Product
//               </Button>
//               <Button
//                 disabled={isPending}
//                 size="sm"
//                 className="bg-green-600 hover:bg-green-700 text-white font-medium"
//                 onClick={() => handleStatusUpdate("Published")}
//               >
//                 {isPending ? (
//                   <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
//                 ) : (
//                   <CheckCircle className="mr-1.5 size-4" />
//                 )}
//                 Approve & Publish
//               </Button>
//             </div>
//           </DialogContent>
//         </Dialog>
//       </td>
//     </tr>
//   );
// }

// export function AdminProductRowSkeleton() {
//   return (
//     <tr className="animate-pulse">
//       <td className="px-6 py-4">
//         <div className="h-4 w-32 bg-muted rounded" />
//       </td>
//       <td className="px-6 py-4">
//         <div className="h-4 w-24 bg-muted rounded" />
//       </td>
//       <td className="px-6 py-4">
//         <div className="h-6 w-16 bg-muted rounded-full" />
//       </td>
//       <td className="px-6 py-4">
//         <div className="h-4 w-12 bg-muted rounded" />
//       </td>
//       <td className="px-6 py-4">
//         <div className="h-4 w-8 bg-muted rounded ml-auto" />
//       </td>
//     </tr>
//   );
// }

// "use client";

// import { useState, useTransition } from "react";
// import { Button } from "@/app/_components/ui/button";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/app/_components/ui/dropdown-menu";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogTitle,
//   DialogTrigger,
// } from "@/app/_components/ui/dialog";
// import {
//   Accordion,
//   AccordionContent,
//   AccordionItem,
//   AccordionTrigger,
// } from "@/app/_components/ui/accordion";
// import { Textarea } from "@/app/_components/ui/textarea";
// import { Checkbox } from "@/app/_components/ui/checkbox";
// import { Label } from "@/app/_components/ui/label";

// import {
//   Eye,
//   MoreVertical,
//   Trash2,
//   User,
//   CheckCircle,
//   XCircle,
//   Clock,
//   Loader2,
//   Video,
//   BookOpen,
//   DollarSign,
//   AlertCircle,
//   Play,
//   ClipboardCheck,
//   MessageSquare,
//   FileText,
//   ImageIcon,
//   DownloadCloud,
// } from "lucide-react";
// import Image from "next/image";
// import { Badge } from "@/app/_components/ui/badge";
// import { toast } from "sonner";

// import { AdminProductType } from "../actions/admin-get-all-products";
// import { updateProductStatus } from "../actions/admin-publish-product";

// interface AdminProductRowProps {
//   data: AdminProductType;
// }

// export function AdminProductRow({ data }: AdminProductRowProps) {
//   // 1. Destructure or extract mainVideoUrl from your data object
//   const { mainVideoUrl } = data;
//   const [isDialogOpen, setIsDialogOpen] = useState(false);
//   const [isPending, startTransition] = useTransition();
//   const [adminFeedback, setAdminFeedback] = useState("");
//   const [selectedLesson, setSelectedLesson] = useState<{
//     title: string;
//     videoUrl?: string;
//   } | null>(null);

//   // Is this product a Course?
//   const isCourse = data.type === "Course";

//   // Safely grab the array of strings your backend mapped
//   const digitalImages: string[] = data.digitalProductImages ?? [];

//   // Helper function to extract the first non-empty image string
//   const getFirstValidImage = (images: string[]) => {
//     return images.find((img) => Boolean(img && img.trim())) || null;
//   };

//   const firstAvailableDigitalImage = getFirstValidImage(digitalImages);

//   // Active Selected Image for Non-Course Product Gallery Modal State
//   const [activeDigitalImage, setActiveDigitalImage] = useState<string | null>(
//     firstAvailableDigitalImage,
//   );

//   // Quality Audit Checklist State
//   const [checklist, setChecklist] = useState({
//     mediaQuality: false,
//     curriculumComplete: false,
//     guidelinesMet: false,
//     pricingValid: false,
//   });

//   // Calculate Thumbnail for Table Row
//   const targetImageKey = isCourse
//     ? data.fileKey
//     : firstAvailableDigitalImage || data.fileKey;

//   const thumbnailUrl = targetImageKey
//     ? targetImageKey.startsWith("http")
//       ? targetImageKey
//       : `https://utfs.io/f/${targetImageKey}`
//     : "/placeholder-course.jpg";

//   const handleStatusUpdate = (newStatus: "Published" | "Rejected") => {
//     startTransition(async () => {
//       const result = await updateProductStatus(data.id, newStatus);

//       if (result.success) {
//         toast.success(`Product ${newStatus.toLowerCase()} successfully`);
//         setIsDialogOpen(false);
//       } else {
//         toast.error("Something went wrong");
//       }
//     });
//   };

//   const initials = data.educatorName
//     .split(" ")
//     .map((n) => n[0])
//     .join("")
//     .toUpperCase()
//     .slice(0, 2);

//   return (
//     <tr className="group hover:bg-muted/40 transition-colors border-b last:border-0">
//       <td className="px-6 py-4 max-w-md">
//         <div className="flex items-center gap-4">
//           <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border shadow-sm">
//             <Image
//               src={thumbnailUrl}
//               alt={data.title}
//               fill
//               className="object-cover transition-transform duration-300 group-hover:scale-110"
//             />
//           </div>
//           <div className="flex flex-col min-w-0">
//             <span className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
//               {data.title}
//             </span>
//             <p className="text-xs text-muted-foreground line-clamp-1 italic">
//               {data.smallDescription}
//             </p>
//           </div>
//         </div>
//       </td>

//       <td className="px-6 py-4 whitespace-nowrap text-sm">
//         <div className="flex items-center gap-3">
//           <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-secondary-foreground border">
//             {initials || <User className="h-3 w-3" />}
//           </div>
//           <span className="text-sm font-medium text-muted-foreground">
//             {data.educatorName}
//           </span>
//         </div>
//       </td>

//       <td className="px-6 py-4 whitespace-nowrap text-sm">
//         <Badge
//           variant={data.status === "Published" ? "default" : "secondary"}
//           className="text-[10px] uppercase"
//         >
//           {data.status || "Draft"}
//         </Badge>
//       </td>

//       <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
//         <div className="flex items-center gap-1.5 font-medium">
//           <Clock className="size-3.5 text-muted-foreground" />
//           {data.type}
//         </div>
//       </td>

//       {/* Actions */}
//       <td className="px-6 py-4 whitespace-nowrap text-right">
//         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//           <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//               <Button variant="ghost" size="icon" className="h-8 w-8">
//                 <MoreVertical className="size-4" />
//               </Button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent align="end" className="w-44">
//               <DialogTrigger asChild>
//                 <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
//                   <Eye className="size-4 mr-2" /> Review Product
//                 </DropdownMenuItem>
//               </DialogTrigger>
//               <DropdownMenuSeparator />
//               <DropdownMenuItem className="text-destructive">
//                 <Trash2 className="size-4 mr-2" /> Suspend
//               </DropdownMenuItem>
//             </DropdownMenuContent>
//           </DropdownMenu>

//           {/* SINGLE-COLUMN MODAL CONTENT */}
//           <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-xl shadow-2xl border">
//             {/* Modal Sticky Header */}
//             <div className="p-5 border-b sticky top-0 bg-background/95 backdrop-blur-md z-20 flex items-center justify-between">
//               <div className="space-y-1">
//                 <div className="flex items-center gap-2">
//                   <DialogTitle className="text-lg font-bold tracking-tight">
//                     {data.title}
//                   </DialogTitle>
//                   <Badge
//                     variant="outline"
//                     className="text-[10px] uppercase font-semibold"
//                   >
//                     {data.status || "Pending"}
//                   </Badge>
//                 </div>
//                 <DialogDescription className="text-xs text-muted-foreground">
//                   Reviewing submission by{" "}
//                   <span className="font-medium text-foreground">
//                     {data.educatorName}
//                   </span>
//                 </DialogDescription>
//               </div>
//             </div>

//             {/* Single-Column Body Stream */}
//             <div className="p-6 space-y-8">
//               {/* SECTION 1: Media Preview / Image Gallery */}
//               <section className="space-y-3">
//                 <div className="flex items-center justify-between">
//                   <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
//                     {isCourse ? (
//                       <>
//                         <Video className="size-4 text-primary" />
//                         Video Preview
//                       </>
//                     ) : (
//                       <>
//                         <ImageIcon className="size-4 text-primary" />
//                         Product Gallery Preview
//                       </>
//                     )}
//                   </h3>
//                   {isCourse && selectedLesson && (
//                     <Badge
//                       variant="secondary"
//                       className="text-[11px] font-normal"
//                     >
//                       Playing: {selectedLesson.title}
//                     </Badge>
//                   )}
//                 </div>

//                 {/* CONDITION: Course Video Player vs. Digital Product Image Gallery */}
//                 {isCourse ? (
//                   <div className="aspect-video w-full overflow-hidden rounded-xl border bg-black shadow-inner relative group">
//                     {selectedLesson?.videoUrl || mainVideoUrl ? (
//                       <video
//                         src={selectedLesson?.videoUrl || mainVideoUrl}
//                         controls
//                         className="h-full w-full object-contain"
//                         poster={thumbnailUrl}
//                       />
//                     ) : (
//                       <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2 bg-muted/20">
//                         <AlertCircle className="size-8 stroke-[1.5]" />
//                         <span className="text-xs">
//                           No media preview available for this selection
//                         </span>
//                       </div>
//                     )}
//                   </div>
//                 ) : (
//                   <div className="space-y-3">
//                     {/* Main Image Display */}
//                     <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-muted/30">
//                       {activeDigitalImage || firstAvailableDigitalImage ? (
//                         <Image
//                           src={
//                             (activeDigitalImage ||
//                               firstAvailableDigitalImage)!.startsWith("http")
//                               ? (activeDigitalImage ||
//                                   firstAvailableDigitalImage)!
//                               : `https://utfs.io/f/${activeDigitalImage || firstAvailableDigitalImage}`
//                           }
//                           alt={data.title}
//                           fill
//                           className="object-contain"
//                         />
//                       ) : (
//                         <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2">
//                           <ImageIcon className="size-8 stroke-[1.5]" />
//                           <span className="text-xs">
//                             No preview images uploaded
//                           </span>
//                         </div>
//                       )}
//                     </div>

//                     {/* Image Thumbnail Selector Strip */}
//                     {digitalImages.length > 1 && (
//                       <div className="flex items-center gap-2 overflow-x-auto pb-1">
//                         {digitalImages.map((imgKey, idx) => {
//                           const imgUrl = imgKey.startsWith("http")
//                             ? imgKey
//                             : `https://utfs.io/f/${imgKey}`;
//                           const isSelected =
//                             (activeDigitalImage ||
//                               firstAvailableDigitalImage) === imgKey;

//                           return (
//                             <button
//                               key={idx}
//                               type="button"
//                               onClick={() => setActiveDigitalImage(imgKey)}
//                               className={`relative h-16 w-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
//                                 isSelected
//                                   ? "border-primary ring-2 ring-primary/20"
//                                   : "border-border opacity-70 hover:opacity-100"
//                               }`}
//                             >
//                               <Image
//                                 src={imgUrl}
//                                 alt={`Preview ${idx + 1}`}
//                                 fill
//                                 className="object-cover"
//                               />
//                             </button>
//                           );
//                         })}
//                       </div>
//                     )}
//                   </div>
//                 )}
//               </section>

//               {/* SECTION 2: Quick Metadata */}
//               <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//                 <div className="p-3.5 rounded-lg border bg-card/50 flex flex-col justify-between space-y-1">
//                   <span className="text-[11px] font-medium text-muted-foreground">
//                     Product Type
//                   </span>
//                   <p className="text-sm font-semibold">
//                     {data.type || "General"}
//                   </p>
//                 </div>
//                 <div className="p-3.5 rounded-lg border bg-card/50 flex flex-col justify-between space-y-1">
//                   <span className="text-[11px] font-medium text-muted-foreground">
//                     Pricing
//                   </span>
//                   <p className="text-sm font-semibold flex items-center">
//                     <DollarSign className="size-3.5 text-muted-foreground" />
//                     {data.price ? (data.price / 100).toFixed(2) : "Free"}
//                   </p>
//                 </div>
//               </section>

//               {/* SECTION 3: Description */}
//               <section className="space-y-2">
//                 <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
//                   Overview & Description
//                 </h3>
//                 <p className="text-sm leading-relaxed text-foreground/90 p-4 rounded-xl border bg-card">
//                   {data.smallDescription || "No description provided."}
//                 </p>
//               </section>

//               {/* SECTION 4: CONDITION - Curriculum vs Digital Download Info */}
//               {isCourse ? (
//                 <section className="space-y-3">
//                   <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
//                     <BookOpen className="size-4 text-primary" />
//                     Curriculum Structure
//                   </h3>

//                   {data.course?.chapter && data.course.chapter.length > 0 ? (
//                     <Accordion
//                       type="single"
//                       collapsible
//                       className="w-full border rounded-xl overflow-hidden divide-y shadow-sm"
//                     >
//                       {data.course.chapter.map((chap, idx) => (
//                         <AccordionItem
//                           key={chap.id || idx}
//                           value={`chap-${idx}`}
//                           className="border-b-0"
//                         >
//                           <AccordionTrigger className="px-4 py-3.5 hover:no-underline hover:bg-muted/30 transition-colors bg-card">
//                             <span className="text-xs font-semibold text-left">
//                               Chapter {idx + 1}: {chap.title}
//                             </span>
//                           </AccordionTrigger>
//                           <AccordionContent className="p-0 divide-y bg-muted/10">
//                             {chap.lessons && chap.lessons.length > 0 ? (
//                               chap.lessons.map((lesson) => {
//                                 const isSelected =
//                                   selectedLesson?.title === lesson.title;
//                                 return (
//                                   <div
//                                     key={lesson.id}
//                                     className={`flex items-center justify-between p-3 px-5 text-xs transition-colors cursor-pointer ${
//                                       isSelected
//                                         ? "bg-primary/10 text-primary font-medium"
//                                         : "hover:bg-muted/40 text-foreground"
//                                     }`}
//                                     onClick={() =>
//                                       setSelectedLesson({
//                                         title: lesson.title,
//                                         videoUrl: lesson.videoUrl ?? undefined,
//                                       })
//                                     }
//                                   >
//                                     <div className="flex items-center gap-2.5">
//                                       <Play
//                                         className={`size-3.5 ${
//                                           isSelected
//                                             ? "fill-primary text-primary"
//                                             : "text-muted-foreground"
//                                         }`}
//                                       />
//                                       <span>{lesson.title}</span>
//                                     </div>
//                                     {isSelected && (
//                                       <Badge
//                                         variant="outline"
//                                         className="text-[9px] py-0 border-primary text-primary"
//                                       >
//                                         Active Preview
//                                       </Badge>
//                                     )}
//                                   </div>
//                                 );
//                               })
//                             ) : (
//                               <div className="p-3 text-xs text-muted-foreground italic px-5">
//                                 No lessons in this chapter.
//                               </div>
//                             )}
//                           </AccordionContent>
//                         </AccordionItem>
//                       ))}
//                     </Accordion>
//                   ) : (
//                     <div className="p-6 border border-dashed rounded-xl text-center text-xs text-muted-foreground">
//                       No chapter structure configured for this course.
//                     </div>
//                   )}
//                 </section>
//               ) : (
//                 <section className="space-y-3">
//                   <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
//                     <DownloadCloud className="size-4 text-primary" />
//                     Digital Asset Details
//                   </h3>
//                   <div className="p-4 rounded-xl border bg-card space-y-3">
//                     <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 text-xs">
//                       <div className="flex items-center gap-3">
//                         <FileText className="size-5 text-primary shrink-0" />
//                         <div>
//                           <p className="font-semibold text-foreground">
//                             Main Downloadable Asset
//                           </p>
//                           <p className="text-[11px] text-muted-foreground truncate max-w-xs">
//                             {data.fileKey || "No primary file key linked"}
//                           </p>
//                         </div>
//                       </div>
//                       {data.fileKey && (
//                         <a
//                           href={
//                             data.fileKey.startsWith("http")
//                               ? data.fileKey
//                               : `https://utfs.io/f/${data.fileKey}`
//                           }
//                           target="_blank"
//                           rel="noreferrer"
//                           className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
//                         >
//                           Download / Inspect
//                         </a>
//                       )}
//                     </div>
//                   </div>
//                 </section>
//               )}

//               {/* SECTION 5: Instructor Card & Dynamic Quality Checklist */}
//               <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 {/* Educator Info */}
//                 <div className="p-4 rounded-xl border bg-card space-y-3">
//                   <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
//                     <User className="size-3.5" /> Instructor / Creator
//                   </h4>
//                   <div className="flex items-center gap-3">
//                     <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-xs font-bold border shrink-0">
//                       {initials || <User className="h-4 w-4" />}
//                     </div>
//                     <div>
//                       <p className="text-sm font-semibold">
//                         {data.educatorName}
//                       </p>
//                       <span className="text-xs text-muted-foreground">
//                         Product Author
//                       </span>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Quality Audit Checklist */}
//                 <div className="p-4 rounded-xl border bg-card space-y-3">
//                   <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
//                     <ClipboardCheck className="size-3.5" /> Review Audit
//                     Checklist
//                   </h4>
//                   <div className="space-y-2 text-xs">
//                     <div className="flex items-center space-x-2">
//                       <Checkbox
//                         id="media"
//                         checked={checklist.mediaQuality}
//                         onCheckedChange={(checked) =>
//                           setChecklist((prev) => ({
//                             ...prev,
//                             mediaQuality: !!checked,
//                           }))
//                         }
//                       />
//                       <Label
//                         htmlFor="media"
//                         className="text-xs font-normal cursor-pointer"
//                       >
//                         {isCourse
//                           ? "High video resolution & clear audio"
//                           : "High quality preview images uploaded"}
//                       </Label>
//                     </div>

//                     <div className="flex items-center space-x-2">
//                       <Checkbox
//                         id="curriculum"
//                         checked={checklist.curriculumComplete}
//                         onCheckedChange={(checked) =>
//                           setChecklist((prev) => ({
//                             ...prev,
//                             curriculumComplete: !!checked,
//                           }))
//                         }
//                       />
//                       <Label
//                         htmlFor="curriculum"
//                         className="text-xs font-normal cursor-pointer"
//                       >
//                         {isCourse
//                           ? "Complete structure & filled lessons"
//                           : "Digital asset uploaded and accessible"}
//                       </Label>
//                     </div>

//                     <div className="flex items-center space-x-2">
//                       <Checkbox
//                         id="guidelines"
//                         checked={checklist.guidelinesMet}
//                         onCheckedChange={(checked) =>
//                           setChecklist((prev) => ({
//                             ...prev,
//                             guidelinesMet: !!checked,
//                           }))
//                         }
//                       />
//                       <Label
//                         htmlFor="guidelines"
//                         className="text-xs font-normal cursor-pointer"
//                       >
//                         Complies with publishing standards
//                       </Label>
//                     </div>
//                   </div>
//                 </div>
//               </section>

//               {/* SECTION 6: Admin Review Feedback */}
//               <section className="space-y-2">
//                 <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
//                   <MessageSquare className="size-3.5" /> Reviewer Feedback /
//                   Rejection Notes
//                 </h3>
//                 <Textarea
//                   placeholder="Provide constructive feedback if rejecting or requesting changes..."
//                   className="text-xs h-24 resize-none bg-card rounded-xl"
//                   value={adminFeedback}
//                   onChange={(e) => setAdminFeedback(e.target.value)}
//                 />
//               </section>
//             </div>

//             {/* Modal Sticky Action Bar */}
//             <div className="p-4 border-t sticky bottom-0 bg-background/95 backdrop-blur-md z-20 flex items-center justify-end gap-3">
//               <Button
//                 variant="outline"
//                 disabled={isPending}
//                 size="sm"
//                 className="border-destructive/40 text-destructive hover:bg-destructive/10"
//                 onClick={() => handleStatusUpdate("Rejected")}
//               >
//                 {isPending ? (
//                   <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
//                 ) : (
//                   <XCircle className="mr-1.5 size-4" />
//                 )}
//                 Reject Product
//               </Button>
//               <Button
//                 disabled={isPending}
//                 size="sm"
//                 className="bg-green-600 hover:bg-green-700 text-white font-medium"
//                 onClick={() => handleStatusUpdate("Published")}
//               >
//                 {isPending ? (
//                   <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
//                 ) : (
//                   <CheckCircle className="mr-1.5 size-4" />
//                 )}
//                 Approve & Publish
//               </Button>
//             </div>
//           </DialogContent>
//         </Dialog>
//       </td>
//     </tr>
//   );
// }

// export function AdminProductRowSkeleton() {
//   return (
//     <tr className="animate-pulse">
//       <td className="px-6 py-4">
//         <div className="h-4 w-32 bg-muted rounded" />
//       </td>
//       <td className="px-6 py-4">
//         <div className="h-4 w-24 bg-muted rounded" />
//       </td>
//       <td className="px-6 py-4">
//         <div className="h-6 w-16 bg-muted rounded-full" />
//       </td>
//       <td className="px-6 py-4">
//         <div className="h-4 w-12 bg-muted rounded" />
//       </td>
//       <td className="px-6 py-4">
//         <div className="h-4 w-8 bg-muted rounded ml-auto" />
//       </td>
//     </tr>
//   );
// }

// "use client";

// import { useState, useTransition } from "react";
// import { Button } from "@/app/_components/ui/button";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/app/_components/ui/dropdown-menu";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogTitle,
//   DialogTrigger,
// } from "@/app/_components/ui/dialog";
// import {
//   Accordion,
//   AccordionContent,
//   AccordionItem,
//   AccordionTrigger,
// } from "@/app/_components/ui/accordion";
// import { Textarea } from "@/app/_components/ui/textarea";
// import { Checkbox } from "@/app/_components/ui/checkbox";
// import { Label } from "@/app/_components/ui/label";

// import {
//   Eye,
//   MoreVertical,
//   Trash2,
//   User,
//   CheckCircle,
//   XCircle,
//   Clock,
//   Loader2,
//   Video,
//   BookOpen,
//   DollarSign,
//   AlertCircle,
//   Play,
//   ClipboardCheck,
//   MessageSquare,
//   FileText,
//   ImageIcon,
//   DownloadCloud,
// } from "lucide-react";
// import Image from "next/image";
// import { Badge } from "@/app/_components/ui/badge";
// import { toast } from "sonner";

// import { AdminProductType } from "../actions/admin-get-all-products";
// import { updateProductStatus } from "../actions/admin-publish-product";

// interface AdminProductRowProps {
//   data: AdminProductType;
// }

// export function AdminProductRow({ data }: AdminProductRowProps) {
//   const [isDialogOpen, setIsDialogOpen] = useState(false);
//   const [isPending, startTransition] = useTransition();
//   const [adminFeedback, setAdminFeedback] = useState("");
//   const [selectedLesson, setSelectedLesson] = useState<{
//     title: string;
//     videoUrl?: string;
//   } | null>(null);

//   // Is this product a Course?
//   const isCourse = data.type === "Course";

//   // Safely grab digital images array
//   const digitalImages = data.digitalProductImages ?? [];

//   // Helper function to extract the first non-empty image key/URL from an array
//   const getFirstValidImage = (images: string[]) => {
//     return images.find((img) => img && img.trim() !== "") || null;
//   };

//   // Find the first valid image available for non-course products
//   const firstAvailableDigitalImage = getFirstValidImage(digitalImages);

//   // Active Selected Image for Non-Course Product Gallery Modal State
//   const [activeDigitalImage, setActiveDigitalImage] = useState<string | null>(
//     firstAvailableDigitalImage,
//   );

//   // Quality Audit Checklist State
//   const [checklist, setChecklist] = useState({
//     mediaQuality: false,
//     curriculumComplete: false,
//     guidelinesMet: false,
//     pricingValid: false,
//   });

//   // Calculate Thumbnail for Table Row (First available digital image -> fallback to fileKey -> placeholder)
//   const targetImageKey = isCourse
//     ? data.fileKey
//     : firstAvailableDigitalImage || data.fileKey;

//   const thumbnailUrl = targetImageKey
//     ? targetImageKey.startsWith("http")
//       ? targetImageKey
//       : `https://utfs.io/f/${targetImageKey}`
//     : "/placeholder-course.jpg";

//   const mainVideoUrl = data.fileKey
//     ? data.fileKey.startsWith("http")
//       ? data.fileKey
//       : `https://utfs.io/f/${data.fileKey}`
//     : undefined;

//   const handleStatusUpdate = (newStatus: "Published" | "Rejected") => {
//     startTransition(async () => {
//       const result = await updateProductStatus(data.id, newStatus);

//       if (result.success) {
//         toast.success(`Product ${newStatus.toLowerCase()} successfully`);
//         setIsDialogOpen(false);
//       } else {
//         toast.error("Something went wrong");
//       }
//     });
//   };

//   const initials = data.educatorName
//     .split(" ")
//     .map((n) => n[0])
//     .join("")
//     .toUpperCase()
//     .slice(0, 2);

//   return (
//     <tr className="group hover:bg-muted/40 transition-colors border-b last:border-0">
//       <td className="px-6 py-4 max-w-md">
//         <div className="flex items-center gap-4">
//           <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border shadow-sm">
//             <Image
//               src={thumbnailUrl}
//               alt={data.title}
//               fill
//               className="object-cover transition-transform duration-300 group-hover:scale-110"
//             />
//           </div>
//           <div className="flex flex-col min-w-0">
//             <span className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
//               {data.title}
//             </span>
//             <p className="text-xs text-muted-foreground line-clamp-1 italic">
//               {data.smallDescription}
//             </p>
//           </div>
//         </div>
//       </td>

//       <td className="px-6 py-4 whitespace-nowrap text-sm">
//         <div className="flex items-center gap-3">
//           <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-secondary-foreground border">
//             {initials || <User className="h-3 w-3" />}
//           </div>
//           <span className="text-sm font-medium text-muted-foreground">
//             {data.educatorName}
//           </span>
//         </div>
//       </td>

//       <td className="px-6 py-4 whitespace-nowrap text-sm">
//         <Badge
//           variant={data.status === "Published" ? "default" : "secondary"}
//           className="text-[10px] uppercase"
//         >
//           {data.status || "Draft"}
//         </Badge>
//       </td>

//       <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
//         <div className="flex items-center gap-1.5 font-medium">
//           <Clock className="size-3.5 text-muted-foreground" />
//           {data.type}
//         </div>
//       </td>

//       {/* Actions */}
//       <td className="px-6 py-4 whitespace-nowrap text-right">
//         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//           <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//               <Button variant="ghost" size="icon" className="h-8 w-8">
//                 <MoreVertical className="size-4" />
//               </Button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent align="end" className="w-44">
//               <DialogTrigger asChild>
//                 <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
//                   <Eye className="size-4 mr-2" /> Review Product
//                 </DropdownMenuItem>
//               </DialogTrigger>
//               <DropdownMenuSeparator />
//               <DropdownMenuItem className="text-destructive">
//                 <Trash2 className="size-4 mr-2" /> Suspend
//               </DropdownMenuItem>
//             </DropdownMenuContent>
//           </DropdownMenu>

//           {/* SINGLE-COLUMN MODAL CONTENT */}
//           <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-xl shadow-2xl border">
//             {/* Modal Sticky Header */}
//             <div className="p-5 border-b sticky top-0 bg-background/95 backdrop-blur-md z-20 flex items-center justify-between">
//               <div className="space-y-1">
//                 <div className="flex items-center gap-2">
//                   <DialogTitle className="text-lg font-bold tracking-tight">
//                     {data.title}
//                   </DialogTitle>
//                   <Badge
//                     variant="outline"
//                     className="text-[10px] uppercase font-semibold"
//                   >
//                     {data.status || "Pending"}
//                   </Badge>
//                 </div>
//                 <DialogDescription className="text-xs text-muted-foreground">
//                   Reviewing submission by{" "}
//                   <span className="font-medium text-foreground">
//                     {data.educatorName}
//                   </span>
//                 </DialogDescription>
//               </div>
//             </div>

//             {/* Single-Column Body Stream */}
//             <div className="p-6 space-y-8">
//               {/* SECTION 1: Media Preview / Image Gallery */}
//               <section className="space-y-3">
//                 <div className="flex items-center justify-between">
//                   <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
//                     {isCourse ? (
//                       <>
//                         <Video className="size-4 text-primary" />
//                         Video Preview
//                       </>
//                     ) : (
//                       <>
//                         <ImageIcon className="size-4 text-primary" />
//                         Product Gallery Preview
//                       </>
//                     )}
//                   </h3>
//                   {isCourse && selectedLesson && (
//                     <Badge
//                       variant="secondary"
//                       className="text-[11px] font-normal"
//                     >
//                       Playing: {selectedLesson.title}
//                     </Badge>
//                   )}
//                 </div>

//                 {/* CONDITION: Course Video Player vs. Digital Product Image Gallery */}
//                 {isCourse ? (
//                   <div className="aspect-video w-full overflow-hidden rounded-xl border bg-black shadow-inner relative group">
//                     {selectedLesson?.videoUrl || mainVideoUrl ? (
//                       <video
//                         src={selectedLesson?.videoUrl || mainVideoUrl}
//                         controls
//                         className="h-full w-full object-contain"
//                         poster={thumbnailUrl}
//                       />
//                     ) : (
//                       <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2 bg-muted/20">
//                         <AlertCircle className="size-8 stroke-[1.5]" />
//                         <span className="text-xs">
//                           No media preview available for this selection
//                         </span>
//                       </div>
//                     )}
//                   </div>
//                 ) : (
//                   <div className="space-y-3">
//                     {/* Main Image Display */}
//                     <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-muted/30">
//                       {activeDigitalImage || firstAvailableDigitalImage ? (
//                         <Image
//                           src={
//                             (activeDigitalImage ||
//                               firstAvailableDigitalImage)!.startsWith("http")
//                               ? (activeDigitalImage ||
//                                   firstAvailableDigitalImage)!
//                               : `https://utfs.io/f/${activeDigitalImage || firstAvailableDigitalImage}`
//                           }
//                           alt={data.title}
//                           fill
//                           className="object-contain"
//                         />
//                       ) : (
//                         <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2">
//                           <ImageIcon className="size-8 stroke-[1.5]" />
//                           <span className="text-xs">
//                             No preview images uploaded
//                           </span>
//                         </div>
//                       )}
//                     </div>

//                     {/* Image Thumbnail Selector Strip */}
//                     {digitalImages.filter(Boolean).length > 1 && (
//                       <div className="flex items-center gap-2 overflow-x-auto pb-1">
//                         {digitalImages.filter(Boolean).map((imgKey, idx) => {
//                           const imgUrl = imgKey.startsWith("http")
//                             ? imgKey
//                             : `https://utfs.io/f/${imgKey}`;
//                           const isSelected =
//                             (activeDigitalImage ||
//                               firstAvailableDigitalImage) === imgKey;

//                           return (
//                             <button
//                               key={idx}
//                               type="button"
//                               onClick={() => setActiveDigitalImage(imgKey)}
//                               className={`relative h-16 w-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
//                                 isSelected
//                                   ? "border-primary ring-2 ring-primary/20"
//                                   : "border-border opacity-70 hover:opacity-100"
//                               }`}
//                             >
//                               <Image
//                                 src={imgUrl}
//                                 alt={`Preview ${idx + 1}`}
//                                 fill
//                                 className="object-cover"
//                               />
//                             </button>
//                           );
//                         })}
//                       </div>
//                     )}
//                   </div>
//                 )}
//               </section>

//               {/* SECTION 2: Quick Metadata */}
//               <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//                 <div className="p-3.5 rounded-lg border bg-card/50 flex flex-col justify-between space-y-1">
//                   <span className="text-[11px] font-medium text-muted-foreground">
//                     Product Type
//                   </span>
//                   <p className="text-sm font-semibold">
//                     {data.type || "General"}
//                   </p>
//                 </div>
//                 <div className="p-3.5 rounded-lg border bg-card/50 flex flex-col justify-between space-y-1">
//                   <span className="text-[11px] font-medium text-muted-foreground">
//                     Pricing
//                   </span>
//                   <p className="text-sm font-semibold flex items-center">
//                     <DollarSign className="size-3.5 text-muted-foreground" />
//                     {data.price ? (data.price / 100).toFixed(2) : "Free"}
//                   </p>
//                 </div>
//               </section>

//               {/* SECTION 3: Description */}
//               <section className="space-y-2">
//                 <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
//                   Overview & Description
//                 </h3>
//                 <p className="text-sm leading-relaxed text-foreground/90 p-4 rounded-xl border bg-card">
//                   {data.smallDescription || "No description provided."}
//                 </p>
//               </section>

//               {/* SECTION 4: CONDITION - Curriculum vs Digital Download Info */}
//               {isCourse ? (
//                 <section className="space-y-3">
//                   <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
//                     <BookOpen className="size-4 text-primary" />
//                     Curriculum Structure
//                   </h3>

//                   {data.course?.chapter && data.course.chapter.length > 0 ? (
//                     <Accordion
//                       type="single"
//                       collapsible
//                       className="w-full border rounded-xl overflow-hidden divide-y shadow-sm"
//                     >
//                       {data.course.chapter.map((chap, idx) => (
//                         <AccordionItem
//                           key={chap.id || idx}
//                           value={`chap-${idx}`}
//                           className="border-b-0"
//                         >
//                           <AccordionTrigger className="px-4 py-3.5 hover:no-underline hover:bg-muted/30 transition-colors bg-card">
//                             <span className="text-xs font-semibold text-left">
//                               Chapter {idx + 1}: {chap.title}
//                             </span>
//                           </AccordionTrigger>
//                           <AccordionContent className="p-0 divide-y bg-muted/10">
//                             {chap.lessons && chap.lessons.length > 0 ? (
//                               chap.lessons.map((lesson) => {
//                                 const isSelected =
//                                   selectedLesson?.title === lesson.title;
//                                 return (
//                                   <div
//                                     key={lesson.id}
//                                     className={`flex items-center justify-between p-3 px-5 text-xs transition-colors cursor-pointer ${
//                                       isSelected
//                                         ? "bg-primary/10 text-primary font-medium"
//                                         : "hover:bg-muted/40 text-foreground"
//                                     }`}
//                                     onClick={() =>
//                                       setSelectedLesson({
//                                         title: lesson.title,
//                                         videoUrl: lesson.videoUrl ?? undefined,
//                                       })
//                                     }
//                                   >
//                                     <div className="flex items-center gap-2.5">
//                                       <Play
//                                         className={`size-3.5 ${
//                                           isSelected
//                                             ? "fill-primary text-primary"
//                                             : "text-muted-foreground"
//                                         }`}
//                                       />
//                                       <span>{lesson.title}</span>
//                                     </div>
//                                     {isSelected && (
//                                       <Badge
//                                         variant="outline"
//                                         className="text-[9px] py-0 border-primary text-primary"
//                                       >
//                                         Active Preview
//                                       </Badge>
//                                     )}
//                                   </div>
//                                 );
//                               })
//                             ) : (
//                               <div className="p-3 text-xs text-muted-foreground italic px-5">
//                                 No lessons in this chapter.
//                               </div>
//                             )}
//                           </AccordionContent>
//                         </AccordionItem>
//                       ))}
//                     </Accordion>
//                   ) : (
//                     <div className="p-6 border border-dashed rounded-xl text-center text-xs text-muted-foreground">
//                       No chapter structure configured for this course.
//                     </div>
//                   )}
//                 </section>
//               ) : (
//                 <section className="space-y-3">
//                   <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
//                     <DownloadCloud className="size-4 text-primary" />
//                     Digital Asset Details
//                   </h3>
//                   <div className="p-4 rounded-xl border bg-card space-y-3">
//                     <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 text-xs">
//                       <div className="flex items-center gap-3">
//                         <FileText className="size-5 text-primary shrink-0" />
//                         <div>
//                           <p className="font-semibold text-foreground">
//                             Main Downloadable Asset
//                           </p>
//                           <p className="text-[11px] text-muted-foreground truncate max-w-xs">
//                             {data.fileKey || "No primary file key linked"}
//                           </p>
//                         </div>
//                       </div>
//                       {data.fileKey && (
//                         <a
//                           href={
//                             data.fileKey.startsWith("http")
//                               ? data.fileKey
//                               : `https://utfs.io/f/${data.fileKey}`
//                           }
//                           target="_blank"
//                           rel="noreferrer"
//                           className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
//                         >
//                           Download / Inspect
//                         </a>
//                       )}
//                     </div>
//                   </div>
//                 </section>
//               )}

//               {/* SECTION 5: Instructor Card & Dynamic Quality Checklist */}
//               <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 {/* Educator Info */}
//                 <div className="p-4 rounded-xl border bg-card space-y-3">
//                   <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
//                     <User className="size-3.5" /> Instructor / Creator
//                   </h4>
//                   <div className="flex items-center gap-3">
//                     <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-xs font-bold border shrink-0">
//                       {initials || <User className="h-4 w-4" />}
//                     </div>
//                     <div>
//                       <p className="text-sm font-semibold">
//                         {data.educatorName}
//                       </p>
//                       <span className="text-xs text-muted-foreground">
//                         Product Author
//                       </span>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Quality Audit Checklist */}
//                 <div className="p-4 rounded-xl border bg-card space-y-3">
//                   <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
//                     <ClipboardCheck className="size-3.5" /> Review Audit
//                     Checklist
//                   </h4>
//                   <div className="space-y-2 text-xs">
//                     <div className="flex items-center space-x-2">
//                       <Checkbox
//                         id="media"
//                         checked={checklist.mediaQuality}
//                         onCheckedChange={(checked) =>
//                           setChecklist((prev) => ({
//                             ...prev,
//                             mediaQuality: !!checked,
//                           }))
//                         }
//                       />
//                       <Label
//                         htmlFor="media"
//                         className="text-xs font-normal cursor-pointer"
//                       >
//                         {isCourse
//                           ? "High video resolution & clear audio"
//                           : "High quality preview images uploaded"}
//                       </Label>
//                     </div>

//                     <div className="flex items-center space-x-2">
//                       <Checkbox
//                         id="curriculum"
//                         checked={checklist.curriculumComplete}
//                         onCheckedChange={(checked) =>
//                           setChecklist((prev) => ({
//                             ...prev,
//                             curriculumComplete: !!checked,
//                           }))
//                         }
//                       />
//                       <Label
//                         htmlFor="curriculum"
//                         className="text-xs font-normal cursor-pointer"
//                       >
//                         {isCourse
//                           ? "Complete structure & filled lessons"
//                           : "Digital asset uploaded and accessible"}
//                       </Label>
//                     </div>

//                     <div className="flex items-center space-x-2">
//                       <Checkbox
//                         id="guidelines"
//                         checked={checklist.guidelinesMet}
//                         onCheckedChange={(checked) =>
//                           setChecklist((prev) => ({
//                             ...prev,
//                             guidelinesMet: !!checked,
//                           }))
//                         }
//                       />
//                       <Label
//                         htmlFor="guidelines"
//                         className="text-xs font-normal cursor-pointer"
//                       >
//                         Complies with publishing standards
//                       </Label>
//                     </div>
//                   </div>
//                 </div>
//               </section>

//               {/* SECTION 6: Admin Review Feedback */}
//               <section className="space-y-2">
//                 <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
//                   <MessageSquare className="size-3.5" /> Reviewer Feedback /
//                   Rejection Notes
//                 </h3>
//                 <Textarea
//                   placeholder="Provide constructive feedback if rejecting or requesting changes..."
//                   className="text-xs h-24 resize-none bg-card rounded-xl"
//                   value={adminFeedback}
//                   onChange={(e) => setAdminFeedback(e.target.value)}
//                 />
//               </section>
//             </div>

//             {/* Modal Sticky Action Bar */}
//             <div className="p-4 border-t sticky bottom-0 bg-background/95 backdrop-blur-md z-20 flex items-center justify-end gap-3">
//               <Button
//                 variant="outline"
//                 disabled={isPending}
//                 size="sm"
//                 className="border-destructive/40 text-destructive hover:bg-destructive/10"
//                 onClick={() => handleStatusUpdate("Rejected")}
//               >
//                 {isPending ? (
//                   <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
//                 ) : (
//                   <XCircle className="mr-1.5 size-4" />
//                 )}
//                 Reject Product
//               </Button>
//               <Button
//                 disabled={isPending}
//                 size="sm"
//                 className="bg-green-600 hover:bg-green-700 text-white font-medium"
//                 onClick={() => handleStatusUpdate("Published")}
//               >
//                 {isPending ? (
//                   <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
//                 ) : (
//                   <CheckCircle className="mr-1.5 size-4" />
//                 )}
//                 Approve & Publish
//               </Button>
//             </div>
//           </DialogContent>
//         </Dialog>
//       </td>
//     </tr>
//   );
// }

// export function AdminProductRowSkeleton() {
//   return (
//     <tr className="animate-pulse">
//       <td className="px-6 py-4">
//         <div className="h-4 w-32 bg-muted rounded" />
//       </td>
//       <td className="px-6 py-4">
//         <div className="h-4 w-24 bg-muted rounded" />
//       </td>
//       <td className="px-6 py-4">
//         <div className="h-6 w-16 bg-muted rounded-full" />
//       </td>
//       <td className="px-6 py-4">
//         <div className="h-4 w-12 bg-muted rounded" />
//       </td>
//       <td className="px-6 py-4">
//         <div className="h-4 w-8 bg-muted rounded ml-auto" />
//       </td>
//     </tr>
//   );
// }

// "use client";

// import { useState, useTransition } from "react";
// import { Button } from "@/app/_components/ui/button";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/app/_components/ui/dropdown-menu";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogTitle,
//   DialogTrigger,
// } from "@/app/_components/ui/dialog";
// import {
//   Accordion,
//   AccordionContent,
//   AccordionItem,
//   AccordionTrigger,
// } from "@/app/_components/ui/accordion";
// import { Textarea } from "@/app/_components/ui/textarea";
// import { Checkbox } from "@/app/_components/ui/checkbox";
// import { Label } from "@/app/_components/ui/label";

// import {
//   Eye,
//   MoreVertical,
//   Trash2,
//   User,
//   CheckCircle,
//   XCircle,
//   Clock,
//   Loader2,
//   Video,
//   BookOpen,
//   DollarSign,
//   AlertCircle,
//   Play,
//   ClipboardCheck,
//   MessageSquare,
// } from "lucide-react";
// import Image from "next/image";
// import { Badge } from "@/app/_components/ui/badge";
// import { toast } from "sonner";

// import { AdminProductType } from "../actions/admin-get-all-products";
// import { updateProductStatus } from "../actions/admin-publish-product";

// interface AdminProductRowProps {
//   data: AdminProductType;
// }

// export function AdminProductRow({ data }: AdminProductRowProps) {
//   const [isDialogOpen, setIsDialogOpen] = useState(false);
//   const [isPending, startTransition] = useTransition();
//   const [adminFeedback, setAdminFeedback] = useState("");
//   const [selectedLesson, setSelectedLesson] = useState<{
//     title: string;
//     videoUrl?: string;
//   } | null>(null);

//   // Quality Audit Checklist State
//   const [checklist, setChecklist] = useState({
//     mediaQuality: false,
//     curriculumComplete: false,
//     guidelinesMet: false,
//     pricingValid: false,
//   });

//   const isCourse = data.type === "Course";

//   // For non-course products, pick the first image key in position order, or fall back to fileKey
//   const digitalImageKey = data.digitalProductImages?.[0];
//   const targetImageKey = isCourse
//     ? data.fileKey
//     : digitalImageKey || data.fileKey;

//   const thumbnailUrl = targetImageKey
//     ? targetImageKey.startsWith("http")
//       ? targetImageKey
//       : `https://utfs.io/f/${targetImageKey}`
//     : "/placeholder-course.jpg";

//   // const thumbnailUrl = data.fileKey
//   //   ? data.fileKey.startsWith("http")
//   //     ? data.fileKey
//   //     : `https://utfs.io/f/${data.fileKey}`
//   //   : "/placeholder-course.jpg";

//   const mainVideoUrl = data.fileKey
//     ? data.fileKey.startsWith("http")
//       ? data.fileKey
//       : `https://utfs.io/f/${data.fileKey}`
//     : undefined;

//   const handleStatusUpdate = (newStatus: "Published" | "Rejected") => {
//     startTransition(async () => {
//       const result = await updateProductStatus(data.id, newStatus);

//       if (result.success) {
//         toast.success(`Course ${newStatus.toLowerCase()} successfully`);
//         setIsDialogOpen(false);
//       } else {
//         toast.error("Something went wrong");
//       }
//     });
//   };

//   const initials = data.educatorName
//     .split(" ")
//     .map((n) => n[0])
//     .join("")
//     .toUpperCase()
//     .slice(0, 2);

//   return (
//     <tr className="group hover:bg-muted/40 transition-colors border-b last:border-0">
//       <td className="px-6 py-4 max-w-md">
//         <div className="flex items-center gap-4">
//           <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border shadow-sm">
//             <Image
//               src={thumbnailUrl}
//               alt={data.title}
//               fill
//               className="object-cover transition-transform duration-300 group-hover:scale-110"
//             />
//           </div>
//           <div className="flex flex-col min-w-0">
//             <span className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
//               {data.title}
//             </span>
//             <p className="text-xs text-muted-foreground line-clamp-1 italic">
//               {data.smallDescription}
//             </p>
//           </div>
//         </div>
//       </td>

//       <td className="px-6 py-4 whitespace-nowrap text-sm">
//         <div className="flex items-center gap-3">
//           <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-secondary-foreground border">
//             {initials || <User className="h-3 w-3" />}
//           </div>
//           <span className="text-sm font-medium text-muted-foreground">
//             {data.educatorName}
//           </span>
//         </div>
//       </td>

//       <td className="px-6 py-4 whitespace-nowrap text-sm">
//         <Badge
//           variant={data.status === "Published" ? "default" : "secondary"}
//           className="text-[10px] uppercase"
//         >
//           {data.status || "Draft"}
//         </Badge>
//       </td>

//       <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
//         <div className="flex items-center gap-1.5 font-medium">
//           <Clock className="size-3.5 text-muted-foreground" />
//           {data.type}
//         </div>
//       </td>

//       {/* Actions */}
//       <td className="px-6 py-4 whitespace-nowrap text-right">
//         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//           <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//               <Button variant="ghost" size="icon" className="h-8 w-8">
//                 <MoreVertical className="size-4" />
//               </Button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent align="end" className="w-44">
//               <DialogTrigger asChild>
//                 <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
//                   <Eye className="size-4 mr-2" /> Review Course
//                 </DropdownMenuItem>
//               </DialogTrigger>
//               <DropdownMenuSeparator />
//               <DropdownMenuItem className="text-destructive">
//                 <Trash2 className="size-4 mr-2" /> Suspend
//               </DropdownMenuItem>
//             </DropdownMenuContent>
//           </DropdownMenu>

//           {/* REDESIGNED SINGLE-COLUMN MODAL CONTENT */}
//           <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-xl shadow-2xl border">
//             {/* Modal Sticky Header */}
//             <div className="p-5 border-b sticky top-0 bg-background/95 backdrop-blur-md z-20 flex items-center justify-between">
//               <div className="space-y-1">
//                 <div className="flex items-center gap-2">
//                   <DialogTitle className="text-lg font-bold tracking-tight">
//                     {data.title}
//                   </DialogTitle>
//                   <Badge
//                     variant="outline"
//                     className="text-[10px] uppercase font-semibold"
//                   >
//                     {data.status || "Pending"}
//                   </Badge>
//                 </div>
//                 <DialogDescription className="text-xs text-muted-foreground">
//                   Reviewing submission by{" "}
//                   <span className="font-medium text-foreground">
//                     {data.educatorName}
//                   </span>
//                 </DialogDescription>
//               </div>
//             </div>

//             {/* Single-Column Body Stream */}
//             <div className="p-6 space-y-8">
//               {/* SECTION 1: Media Preview Player */}
//               <section className="space-y-3">
//                 <div className="flex items-center justify-between">
//                   <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
//                     <Video className="size-4 text-primary" />
//                     Media Preview
//                   </h3>
//                   {selectedLesson && (
//                     <Badge
//                       variant="secondary"
//                       className="text-[11px] font-normal"
//                     >
//                       Playing: {selectedLesson.title}
//                     </Badge>
//                   )}
//                 </div>

//                 <div className="aspect-video w-full overflow-hidden rounded-xl border bg-black shadow-inner relative group">
//                   {selectedLesson?.videoUrl || mainVideoUrl ? (
//                     <video
//                       src={selectedLesson?.videoUrl || mainVideoUrl}
//                       controls
//                       className="h-full w-full object-contain"
//                       poster={thumbnailUrl}
//                     />
//                   ) : (
//                     <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2 bg-muted/20">
//                       <AlertCircle className="size-8 stroke-[1.5]" />
//                       <span className="text-xs">
//                         No media preview available for this selection
//                       </span>
//                     </div>
//                   )}
//                 </div>
//               </section>

//               {/* SECTION 2: Course Quick Metadata */}
//               <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//                 <div className="p-3.5 rounded-lg border bg-card/50 flex flex-col justify-between space-y-1">
//                   <span className="text-[11px] font-medium text-muted-foreground">
//                     Category / Type
//                   </span>
//                   <p className="text-sm font-semibold">
//                     {data.type || "General"}
//                   </p>
//                 </div>
//                 <div className="p-3.5 rounded-lg border bg-card/50 flex flex-col justify-between space-y-1">
//                   <span className="text-[11px] font-medium text-muted-foreground">
//                     Pricing
//                   </span>
//                   <p className="text-sm font-semibold flex items-center">
//                     <DollarSign className="size-3.5 text-muted-foreground" />
//                     {data.price ? data.price.toFixed(2) : "Free"}
//                   </p>
//                 </div>
//               </section>

//               {/* SECTION 3: Short Description */}
//               <section className="space-y-2">
//                 <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
//                   Overview & Description
//                 </h3>
//                 <p className="text-sm leading-relaxed text-foreground/90 p-4 rounded-xl border bg-card">
//                   {data.smallDescription || "No short description provided."}
//                 </p>
//               </section>

//               {/* SECTION 4: Curriculum Accordion */}
//               <section className="space-y-3">
//                 <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
//                   <BookOpen className="size-4 text-primary" />
//                   Curriculum Structure
//                 </h3>

//                 {data.course?.chapter && data.course.chapter.length > 0 ? (
//                   <Accordion
//                     type="single"
//                     collapsible
//                     className="w-full border rounded-xl overflow-hidden divide-y shadow-sm"
//                   >
//                     {data.course.chapter.map((chap, idx) => (
//                       <AccordionItem
//                         key={chap.id || idx}
//                         value={`chap-${idx}`}
//                         className="border-b-0"
//                       >
//                         <AccordionTrigger className="px-4 py-3.5 hover:no-underline hover:bg-muted/30 transition-colors bg-card">
//                           <span className="text-xs font-semibold text-left">
//                             Chapter {idx + 1}: {chap.title}
//                           </span>
//                         </AccordionTrigger>
//                         <AccordionContent className="p-0 divide-y bg-muted/10">
//                           {chap.lessons && chap.lessons.length > 0 ? (
//                             chap.lessons.map((lesson) => {
//                               const isSelected =
//                                 selectedLesson?.title === lesson.title;
//                               return (
//                                 <div
//                                   key={lesson.id}
//                                   className={`flex items-center justify-between p-3 px-5 text-xs transition-colors cursor-pointer ${
//                                     isSelected
//                                       ? "bg-primary/10 text-primary font-medium"
//                                       : "hover:bg-muted/40 text-foreground"
//                                   }`}
//                                   onClick={() =>
//                                     setSelectedLesson({
//                                       title: lesson.title,
//                                       videoUrl: lesson.videoUrl ?? undefined,
//                                     })
//                                   }
//                                 >
//                                   <div className="flex items-center gap-2.5">
//                                     <Play
//                                       className={`size-3.5 ${isSelected ? "fill-primary text-primary" : "text-muted-foreground"}`}
//                                     />
//                                     <span>{lesson.title}</span>
//                                   </div>
//                                   {isSelected && (
//                                     <Badge
//                                       variant="outline"
//                                       className="text-[9px] py-0 border-primary text-primary"
//                                     >
//                                       Active Preview
//                                     </Badge>
//                                   )}
//                                 </div>
//                               );
//                             })
//                           ) : (
//                             <div className="p-3 text-xs text-muted-foreground italic px-5">
//                               No lessons in this chapter.
//                             </div>
//                           )}
//                         </AccordionContent>
//                       </AccordionItem>
//                     ))}
//                   </Accordion>
//                 ) : (
//                   <div className="p-6 border border-dashed rounded-xl text-center text-xs text-muted-foreground">
//                     No chapter structure configured for this course.
//                   </div>
//                 )}
//               </section>

//               {/* SECTION 5: Instructor Card & Quality Checklist */}
//               <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 {/* Educator Info */}
//                 <div className="p-4 rounded-xl border bg-card space-y-3">
//                   <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
//                     <User className="size-3.5" /> Instructor
//                   </h4>
//                   <div className="flex items-center gap-3">
//                     <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-xs font-bold border shrink-0">
//                       {initials || <User className="h-4 w-4" />}
//                     </div>
//                     <div>
//                       <p className="text-sm font-semibold">
//                         {data.educatorName}
//                       </p>
//                       <span className="text-xs text-muted-foreground">
//                         Course Creator
//                       </span>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Quality Audit Checklist */}
//                 <div className="p-4 rounded-xl border bg-card space-y-3">
//                   <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
//                     <ClipboardCheck className="size-3.5" /> Review Audit
//                     Checklist
//                   </h4>
//                   <div className="space-y-2 text-xs">
//                     <div className="flex items-center space-x-2">
//                       <Checkbox
//                         id="media"
//                         checked={checklist.mediaQuality}
//                         onCheckedChange={(checked) =>
//                           setChecklist((prev) => ({
//                             ...prev,
//                             mediaQuality: !!checked,
//                           }))
//                         }
//                       />
//                       <Label
//                         htmlFor="media"
//                         className="text-xs font-normal cursor-pointer"
//                       >
//                         High video resolution & clear audio
//                       </Label>
//                     </div>

//                     <div className="flex items-center space-x-2">
//                       <Checkbox
//                         id="curriculum"
//                         checked={checklist.curriculumComplete}
//                         onCheckedChange={(checked) =>
//                           setChecklist((prev) => ({
//                             ...prev,
//                             curriculumComplete: !!checked,
//                           }))
//                         }
//                       />
//                       <Label
//                         htmlFor="curriculum"
//                         className="text-xs font-normal cursor-pointer"
//                       >
//                         Complete structure & filled lessons
//                       </Label>
//                     </div>

//                     <div className="flex items-center space-x-2">
//                       <Checkbox
//                         id="guidelines"
//                         checked={checklist.guidelinesMet}
//                         onCheckedChange={(checked) =>
//                           setChecklist((prev) => ({
//                             ...prev,
//                             guidelinesMet: !!checked,
//                           }))
//                         }
//                       />
//                       <Label
//                         htmlFor="guidelines"
//                         className="text-xs font-normal cursor-pointer"
//                       >
//                         Complies with publishing standards
//                       </Label>
//                     </div>
//                   </div>
//                 </div>
//               </section>

//               {/* SECTION 6: Admin Review Feedback */}
//               <section className="space-y-2">
//                 <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
//                   <MessageSquare className="size-3.5" /> Reviewer Feedback /
//                   Rejection Notes
//                 </h3>
//                 <Textarea
//                   placeholder="Provide constructive feedback if rejecting or requesting changes..."
//                   className="text-xs h-24 resize-none bg-card rounded-xl"
//                   value={adminFeedback}
//                   onChange={(e) => setAdminFeedback(e.target.value)}
//                 />
//               </section>
//             </div>

//             {/* Modal Sticky Action Bar */}
//             <div className="p-4 border-t sticky bottom-0 bg-background/95 backdrop-blur-md z-20 flex items-center justify-end gap-3">
//               <Button
//                 variant="outline"
//                 disabled={isPending}
//                 size="sm"
//                 className="border-destructive/40 text-destructive hover:bg-destructive/10"
//                 onClick={() => handleStatusUpdate("Rejected")}
//               >
//                 {isPending ? (
//                   <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
//                 ) : (
//                   <XCircle className="mr-1.5 size-4" />
//                 )}
//                 Reject Course
//               </Button>
//               <Button
//                 disabled={isPending}
//                 size="sm"
//                 className="bg-green-600 hover:bg-green-700 text-white font-medium"
//                 onClick={() => handleStatusUpdate("Published")}
//               >
//                 {isPending ? (
//                   <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
//                 ) : (
//                   <CheckCircle className="mr-1.5 size-4" />
//                 )}
//                 Approve & Publish
//               </Button>
//             </div>
//           </DialogContent>
//         </Dialog>
//       </td>
//     </tr>
//   );
// }

// export function AdminProductRowSkeleton() {
//   return (
//     <tr className="animate-pulse">
//       <td className="px-6 py-4">
//         <div className="h-4 w-32 bg-muted rounded" />
//       </td>
//       <td className="px-6 py-4">
//         <div className="h-4 w-24 bg-muted rounded" />
//       </td>
//       <td className="px-6 py-4">
//         <div className="h-6 w-16 bg-muted rounded-full" />
//       </td>
//       <td className="px-6 py-4">
//         <div className="h-4 w-12 bg-muted rounded" />
//       </td>
//       <td className="px-6 py-4">
//         <div className="h-4 w-8 bg-muted rounded ml-auto" />
//       </td>
//     </tr>
//   );
// }

// "use client";

// import { useState, useTransition } from "react";
// import { Button } from "@/app/_components/ui/button";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/app/_components/ui/dropdown-menu";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/app/_components/ui/dialog";

// import {
//   Eye,
//   MoreVertical,
//   Trash2,
//   User,
//   CheckCircle,
//   XCircle,
//   Clock,
//   Loader2,
// } from "lucide-react";
// import Image from "next/image";
// import { Badge } from "@/app/_components/ui/badge";
// import { toast } from "sonner";

// import { AdminProductType } from "../actions/admin-get-all-products";
// import { updateProductStatus } from "../actions/admin-publish-course";

// interface AdminProductRowProps {
//   data: AdminProductType;
// }

// export function AdminProductRow({ data }: AdminProductRowProps) {
//   const [isDialogOpen, setIsDialogOpen] = useState(false);
//   const [isPending, startTransition] = useTransition();

//   // 🔥 FIXED: Swapped out custom useConstructUrl hooks for explicit UploadThing CDN strings
//   const thumbnailUrl = data.fileKey
//     ? data.fileKey.startsWith("http")
//       ? data.fileKey
//       : `https://utfs.io/f/${data.fileKey}`
//     : "/placeholder-course.jpg";

//   const videoUrl = data.fileKey
//     ? data.fileKey.startsWith("http")
//       ? data.fileKey
//       : `https://utfs.io/f/${data.fileKey}`
//     : undefined;

//   const handleStatusUpdate = (newStatus: "Published" | "Rejected") => {
//     startTransition(async () => {
//       const result = await updateProductStatus(data.id, newStatus);

//       if (result.success) {
//         toast.success(`Course ${newStatus.toLowerCase()} successfully`);
//         setIsDialogOpen(false);
//       } else {
//         toast.error("Something went wrong");
//       }
//     });
//   };

//   const initials = data.educatorName
//     .split(" ")
//     .map((n) => n[0])
//     .join("")
//     .toUpperCase()
//     .slice(0, 2);

//   return (
//     <tr className="group hover:bg-muted/40 transition-colors border-b last:border-0">
//       <td className="px-6 py-4 max-w-md">
//         <div className="flex items-center gap-4">
//           <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border shadow-sm">
//             <Image
//               src={thumbnailUrl || "/placeholder-course.jpg"}
//               alt={data.title}
//               fill
//               className="object-cover transition-transform duration-300 group-hover:scale-110"
//             />
//           </div>
//           <div className="flex flex-col min-w-0">
//             <span className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
//               {data.title}
//             </span>
//             <p className="text-xs text-muted-foreground line-clamp-1 italic">
//               {data.smallDescription}
//             </p>
//           </div>
//         </div>
//       </td>

//       <td className="px-6 py-4 whitespace-nowrap text-sm">
//         <div className="flex items-center gap-3">
//           <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-secondary-foreground border">
//             {initials || <User className="h-3 w-3" />}
//           </div>
//           <span className="text-sm font-medium text-muted-foreground">
//             {data.educatorName}
//           </span>
//         </div>
//       </td>

//       <td className="px-6 py-4 whitespace-nowrap text-sm">
//         <Badge
//           variant={data.status === "Published" ? "default" : "secondary"}
//           className="text-[10px] uppercase"
//         >
//           {data.status || "Draft"}
//         </Badge>
//       </td>

//       <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
//         <div className="flex items-center gap-1.5 font-medium">
//           <Clock className="size-3.5 text-muted-foreground" />
//           {data.type}
//         </div>
//       </td>

//       {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
//         <div className="flex items-center gap-1.5 font-medium">
//           <Users className="size-3.5 text-muted-foreground" />
//           {data._count.enrollment || 0} students
//         </div>
//       </td> */}

//       {/* Actions */}
//       <td className="px-6 py-4 whitespace-nowrap text-right">
//         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//           <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//               <Button variant="ghost" size="icon" className="h-8 w-8">
//                 <MoreVertical className="size-4" />
//               </Button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent align="end" className="w-44">
//               <DialogTrigger asChild>
//                 <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
//                   <Eye className="size-4 mr-2" /> Review Course
//                 </DropdownMenuItem>
//               </DialogTrigger>
//               <DropdownMenuSeparator />
//               <DropdownMenuItem className="text-destructive">
//                 <Trash2 className="size-4 mr-2" /> Suspend
//               </DropdownMenuItem>
//             </DropdownMenuContent>
//           </DropdownMenu>

//           <DialogContent className="sm:max-w-150">
//             <DialogHeader>
//               <DialogTitle>Review Course: {data.title}</DialogTitle>
//               <DialogDescription>
//                 Watch the introductory video and educator content before
//                 approving.
//               </DialogDescription>
//             </DialogHeader>

//             <div className="aspect-video w-full overflow-hidden rounded-md border bg-black">
//               {videoUrl ? (
//                 <video
//                   src={videoUrl}
//                   controls
//                   className="h-full w-full"
//                   poster={thumbnailUrl}
//                 />
//               ) : (
//                 <div className="flex h-full items-center justify-center text-muted-foreground">
//                   No preview video available
//                 </div>
//               )}
//             </div>

//             <div className="space-y-2 py-4">
//               <h4 className="text-sm font-medium">Description</h4>
//               <p className="text-sm text-muted-foreground leading-relaxed">
//                 {data.smallDescription}
//               </p>
//             </div>

//             <DialogFooter className="gap-2 sm:gap-0">
//               <Button
//                 variant="outline"
//                 disabled={isPending}
//                 className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
//                 onClick={() => handleStatusUpdate("Rejected")}
//               >
//                 {isPending ? (
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                 ) : (
//                   <XCircle className="mr-2 size-4" />
//                 )}
//                 Reject
//               </Button>
//               <Button
//                 disabled={isPending}
//                 className="flex-1 bg-green-600 hover:bg-green-700"
//                 onClick={() => handleStatusUpdate("Published")}
//               >
//                 {isPending ? (
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                 ) : (
//                   <CheckCircle className="mr-2 size-4" />
//                 )}
//                 Approve Course
//               </Button>
//             </DialogFooter>
//           </DialogContent>
//         </Dialog>
//       </td>
//     </tr>
//   );
// }

// export function AdminProductRowSkeleton() {
//   return (
//     <tr className="animate-pulse">
//       <td className="px-6 py-4">
//         <div className="h-4 w-32 bg-muted rounded" />
//       </td>
//       <td className="px-6 py-4">
//         <div className="h-4 w-24 bg-muted rounded" />
//       </td>
//       <td className="px-6 py-4">
//         <div className="h-6 w-16 bg-muted rounded-full" />
//       </td>
//     </tr>
//   );
// }
