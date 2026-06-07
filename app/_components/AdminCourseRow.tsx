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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/_components/ui/dialog";

import {
  Eye,
  MoreVertical,
  Trash2,
  User,
  CheckCircle,
  XCircle,
  Users,
  Clock,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { Badge } from "@/app/_components/ui/badge";
import { toast } from "sonner";
import { updateCourseStatus } from "../actions/admin-publish-course";
import { AdminCourseType } from "../actions/admin-get-all-courses";

interface AdminCourseRowProps {
  data: AdminCourseType;
}

export function AdminCourseRow({ data }: AdminCourseRowProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // 🔥 FIXED: Swapped out custom useConstructUrl hooks for explicit UploadThing CDN strings
  const thumbnailUrl = data.fileKey
    ? `https://utfs.io/f/${data.fileKey}`
    : undefined;
  const videoUrl = data.fileKey
    ? `https://utfs.io/f/${data.fileKey}`
    : undefined;

  const handleStatusUpdate = (newStatus: "Published" | "Rejected") => {
    startTransition(async () => {
      const result = await updateCourseStatus(data.id, newStatus);

      if (result.success) {
        toast.success(`Course ${newStatus.toLowerCase()} successfully`);
        setIsDialogOpen(false);
      } else {
        toast.error("Something went wrong");
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
    <tr className="group hover:bg-muted/40 transition-colors border-b last:border-0">
      <td className="px-6 py-4 max-w-md">
        <div className="flex items-center gap-4">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border shadow-sm">
            <Image
              src={thumbnailUrl || "/placeholder-course.jpg"}
              alt={data.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
              {data.title}
            </span>
            <p className="text-xs text-muted-foreground line-clamp-1 italic">
              {data.smallDescription}
            </p>
          </div>
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
          <Clock className="size-3.5 text-muted-foreground" />
          {data.duration}h
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
        <div className="flex items-center gap-1.5 font-medium">
          <Users className="size-3.5 text-muted-foreground" />
          {data._count.enrollment || 0} students
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
              <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Eye className="size-4 mr-2" /> Review Course
                </DropdownMenuItem>
              </DialogTrigger>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="size-4 mr-2" /> Suspend
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DialogContent className="sm:max-w-150">
            <DialogHeader>
              <DialogTitle>Review Course: {data.title}</DialogTitle>
              <DialogDescription>
                Watch the introductory video and educator content before
                approving.
              </DialogDescription>
            </DialogHeader>

            <div className="aspect-video w-full overflow-hidden rounded-md border bg-black">
              {videoUrl ? (
                <video
                  src={videoUrl}
                  controls
                  className="h-full w-full"
                  poster={thumbnailUrl}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No preview video available
                </div>
              )}
            </div>

            <div className="space-y-2 py-4">
              <h4 className="text-sm font-medium">Description</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {data.smallDescription}
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                disabled={isPending}
                className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
                onClick={() => handleStatusUpdate("Rejected")}
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="mr-2 size-4" />
                )}
                Reject
              </Button>
              <Button
                disabled={isPending}
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => handleStatusUpdate("Published")}
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 size-4" />
                )}
                Approve Course
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
//   Users,
//   Clock,
//   Loader2,
// } from "lucide-react";
// import Image from "next/image";
// import { Badge } from "@/app/_components/ui/badge";
// import { toast } from "sonner";
// import { updateCourseStatus } from "../actions/admin-publish-course";
// import { AdminCourseType } from "../actions/admin-get-all-courses";

// interface AdminCourseRowProps {
//   data: AdminCourseType;
// }

// export function AdminCourseRow({ data }: AdminCourseRowProps) {
//   const [isDialogOpen, setIsDialogOpen] = useState(false);
//   const [isPending, startTransition] = useTransition();
//   const thumbnailUrl = useConstructUrl(data.fileKey);
//   // Assuming videoKey exists in your data type
//   const videoUrl = useConstructUrl(data.fileKey);

//   const handleStatusUpdate = (newStatus: "Published" | "Rejected") => {
//     startTransition(async () => {
//       const result = await updateCourseStatus(data.id, newStatus);

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
//           {data.duration}h
//         </div>
//       </td>

//       <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
//         <div className="flex items-center gap-1.5 font-medium">
//           <Users className="size-3.5 text-muted-foreground" />
//           {data._count.enrollment || 0} students
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

// import { Button } from "@/app/_components/ui/button";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/app/_components/ui/dropdown-menu";
// import { AdminCourseType } from "@/app/actions/educator-get-courses";
// import { useConstructUrl } from "@/hooks/use-construct-url";
// import { Eye, MoreVertical, Trash2, User } from "lucide-react";
// import Image from "next/image";
// import Link from "next/link";
// import { Badge } from "@/app/_components/ui/badge";
// import { Users, Clock } from "lucide-react";

// interface AdminCourseRowProps {
//   data: AdminCourseType;
// }

// export function AdminCourseRow({ data }: AdminCourseRowProps) {
//   const thumbnailUrl = useConstructUrl(data.fileKey);
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
//               className="object-cover transition-transform duration-300 group-hover:scale-110" // Add these classes
//             />
//           </div>
//           <div className="flex flex-col min-w-0">
//             <Link
//               href={`/educator/courses/${data.id}/edit`}
//               className="font-semibold text-sm hover:underline truncate group-hover:text-primary transition-colors"
//             >
//               {data.title}
//             </Link>
//             <p className="text-xs text-muted-foreground line-clamp-1 italic">
//               {data.smallDescription}
//             </p>
//           </div>
//         </div>
//       </td>

//       <td className="px-6 py-4 whitespace-nowrap">
//         <div className="flex items-center gap-3">
//           <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-secondary-foreground border">
//             {initials || <User className="h-3 w-3" />}
//           </div>
//           <span className="text-sm font-medium text-muted-foreground">
//             {data.educatorName}
//           </span>
//         </div>
//       </td>

//       {/* Status */}
//       <td className="px-6 py-4 whitespace-nowrap">
//         <Badge
//           variant={data.status === "Published" ? "default" : "secondary"}
//           className="text-[10px] uppercase"
//         >
//           {data.status || "Draft"}
//         </Badge>
//       </td>

//       {/* Added Duration Column */}
//       <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
//         <div className="flex items-center gap-1.5 font-medium">
//           <Clock className="size-3.5 text-muted-foreground" />
//           {data.duration}h
//         </div>
//       </td>

//       {/* Added Enrolled Students Column */}
//       <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
//         <div className="flex items-center gap-1.5 font-medium">
//           <Users className="size-3.5 text-muted-foreground" />
//           {/* Assuming you have an enrollment count in your data, or use 0 as fallback */}
//           {data._count.enrollment || 0} students
//         </div>
//       </td>

//       {/* Actions */}
//       <td className="px-6 py-4 whitespace-nowrap text-right">
//         <DropdownMenu>
//           <DropdownMenuTrigger asChild>
//             <Button variant="ghost" size="icon" className="h-8 w-8">
//               <MoreVertical className="size-4" />
//             </Button>
//           </DropdownMenuTrigger>
//           <DropdownMenuContent align="end" className="w-44">
//             <DropdownMenuItem asChild>
//               <Link href={`/courses/${data.slug}`}>
//                 <Eye className="size-4 mr-2" /> Review
//               </Link>
//             </DropdownMenuItem>
//             <DropdownMenuSeparator />
//             <DropdownMenuItem asChild className="text-destructive">
//               <Link href={`/educator/courses/${data.id}/delete`}>
//                 <Trash2 className="size-4 mr-2" /> Suspend
//               </Link>
//             </DropdownMenuItem>
//           </DropdownMenuContent>
//         </DropdownMenu>
//       </td>
//     </tr>
//   );
// }

export function AdminCourseRowSkeleton() {
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
    </tr>
  );
}
