"use client";

import { Button } from "@/app/_components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/_components/ui/dropdown-menu";
import {
  Eye,
  MoreVertical,
  Pencil,
  Trash2,
  BookOpen,
  ShieldAlert,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/app/_components/ui/badge";
import { EducatorProductType } from "../actions/educator-get-products";
import LogoImg from "@/public/images/no-image.jpeg";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface EducatorProductRowProps {
  data: EducatorProductType;
}

export function EducatorProductRow({ data }: EducatorProductRowProps) {
  const router = useRouter();
  const isPublished = data.status === "Published";

  // 1. Is this product a Course?
  const isCourse = data.type === "Course";

  // 2. Extract digitalProductImages array safely
  const digitalImages: string[] = data.digitalProductImages ?? [];

  // 3. Helper to get the first non-empty digital image string
  const getFirstValidImage = (images: string[]) => {
    return images.find((img) => Boolean(img && img.trim())) || null;
  };

  const firstAvailableDigitalImage = getFirstValidImage(digitalImages);

  // 4. Select target key/URL
  const targetImageKey = isCourse
    ? data.course?.imageKey || data.fileKey
    : firstAvailableDigitalImage || data.fileKey;

  // 5. Construct full URL or fallback
  const thumbnailUrl = targetImageKey
    ? targetImageKey.startsWith("http")
      ? targetImageKey
      : `https://utfs.io/f/${targetImageKey}`
    : LogoImg;

  // Dynamic Edit Link routing
  const editUrl = `/educator/products/${data.id}/edit`;

  // Handler for delete button click
  const handleDeleteClick = (e: React.MouseEvent) => {
    if (isPublished) {
      e.preventDefault();
      toast.error("Action Denied", {
        description:
          "Only administrators can delete published products to protect existing student access.",
        icon: <ShieldAlert className="size-4 text-destructive" />,
      });
      return;
    }

    router.push(`/educator/products/${data.id}/delete`);
  };

  return (
    <tr className="group hover:bg-muted/40 transition-colors border-b last:border-0">
      <td className="px-6 py-4 max-w-md">
        <div className="flex items-center gap-4">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border shadow-sm bg-muted">
            <Image
              src={thumbnailUrl}
              alt={data.title}
              fill
              sizes="48px"
              priority={false}
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <Link
              href={editUrl}
              className="font-semibold text-sm hover:underline truncate group-hover:text-primary transition-colors"
            >
              {data.title}
            </Link>
            <p className="text-xs text-muted-foreground line-clamp-1 italic">
              {data.smallDescription}
            </p>
          </div>
        </div>
      </td>

      {/* Category */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-1.5 font-medium text-sm">
          <BookOpen className="size-3.5 text-muted-foreground" />
          {data.type}
        </div>
      </td>

      {/* Status */}
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge
          variant={isPublished ? "default" : "secondary"}
          className="text-[10px] uppercase rounded-md"
        >
          {data.status || "Draft"}
        </Badge>
      </td>

      {/* Price */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
        <div className="flex items-center gap-1.5 font-medium">
          ${data.price}
        </div>
      </td>

      {/* Actions */}
      <td className="px-6 py-4 whitespace-nowrap text-right">
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
            <DropdownMenuItem asChild>
              <Link href={`/educator/products/${data.slug}`}>
                <Eye className="size-4 mr-2" /> Preview
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDeleteClick}
              className="text-destructive cursor-pointer"
            >
              <Trash2 className="size-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

// import { Button } from "@/app/_components/ui/button";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/app/_components/ui/dropdown-menu";
// import { Eye, MoreVertical, Pencil, Trash2, BookOpen } from "lucide-react";
// import Image from "next/image";
// import Link from "next/link";
// import { Badge } from "@/app/_components/ui/badge";
// import { EducatorProductType } from "../actions/educator-get-products";
// import LogoImg from "@/public/images/no-image.jpeg";

// interface EducatorProductRowProps {
//   data: EducatorProductType;
// }

// export function EducatorProductRow({ data }: EducatorProductRowProps) {
//   // 1. Is this product a Course?
//   const isCourse = data.type === "Course";

//   // 2. Extract digitalProductImages array safely
//   const digitalImages: string[] = data.digitalProductImages ?? [];

//   // 3. Helper to get the first non-empty digital image string
//   const getFirstValidImage = (images: string[]) => {
//     return images.find((img) => Boolean(img && img.trim())) || null;
//   };

//   const firstAvailableDigitalImage = getFirstValidImage(digitalImages);

//   // 4. Select the target key/URL:
//   //    - Courses check course.imageKey or data.fileKey
//   //    - Non-courses check digitalProductImages first, then fileKey
//   const targetImageKey = isCourse
//     ? data.course?.imageKey || data.fileKey
//     : firstAvailableDigitalImage || data.fileKey;

//   // 5. Construct full URL or fallback to your default LogoImg placeholder
//   const thumbnailUrl = targetImageKey
//     ? targetImageKey.startsWith("http")
//       ? targetImageKey
//       : `https://utfs.io/f/${targetImageKey}`
//     : LogoImg;

//   // Dynamic Edit Link routing
//   const editUrl = `/educator/products/${data.id}/edit`;

//   return (
//     <tr className="group hover:bg-muted/40 transition-colors border-b last:border-0">
//       <td className="px-6 py-4 max-w-md">
//         <div className="flex items-center gap-4">
//           <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border shadow-sm bg-muted">
//             <Image
//               src={thumbnailUrl}
//               alt={data.title}
//               fill
//               sizes="48px"
//               priority={false}
//               className="object-cover transition-transform duration-300 group-hover:scale-105"
//             />
//           </div>
//           <div className="flex flex-col min-w-0">
//             <Link
//               href={editUrl}
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

//       {/* Category */}
//       <td className="px-6 py-4 whitespace-nowrap">
//         <div className="flex items-center gap-1.5 font-medium text-sm">
//           <BookOpen className="size-3.5 text-muted-foreground" />
//           {data.type}
//         </div>
//       </td>

//       {/* Status */}
//       <td className="px-6 py-4 whitespace-nowrap">
//         <Badge
//           variant={data.status === "Published" ? "default" : "secondary"}
//           className="text-[10px] uppercase rounded-md"
//         >
//           {data.status || "Draft"}
//         </Badge>
//       </td>

//       {/* Price */}
//       <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
//         <div className="flex items-center gap-1.5 font-medium">
//           ${data.price}
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
//               <Link href={editUrl}>
//                 <Pencil className="size-4 mr-2" /> Edit
//               </Link>
//             </DropdownMenuItem>
//             <DropdownMenuItem asChild>
//               <Link href={`/educator/products/${data.slug}`}>
//                 <Eye className="size-4 mr-2" /> Preview
//               </Link>
//             </DropdownMenuItem>
//             <DropdownMenuSeparator />
//             <DropdownMenuItem asChild className="text-destructive">
//               <Link href={`/educator/products/${data.id}/delete`}>
//                 <Trash2 className="size-4 mr-2" /> Delete
//               </Link>
//             </DropdownMenuItem>
//           </DropdownMenuContent>
//         </DropdownMenu>
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
// import { Eye, MoreVertical, Pencil, Trash2, BookOpen } from "lucide-react";
// import Image from "next/image";
// import Link from "next/link";
// import { Badge } from "@/app/_components/ui/badge";
// import { EducatorProductType } from "../actions/educator-get-products";
// import LogoImg from "@/public/images/no-image.jpeg";

// interface EducatorProductRowProps {
//   data: EducatorProductType;
// }

// export function EducatorProductRow({ data }: EducatorProductRowProps) {
//   // 1. Get the imageKey from the course object
//   const imageKey = data.course?.imageKey;

//   // 2. Build the UploadThing URL or use a fallback image
//   const thumbnailUrl = imageKey
//     ? imageKey.startsWith("http")
//       ? imageKey
//       : `https://utfs.io/f/${imageKey}`
//     : LogoImg; // Your default placeholder

//   // 3. Dynamic Edit Link routing logic (adjust "Course" casing to match your DB schema)
//   const editUrl = `/educator/products/${data.id}/edit`;

//   return (
//     <tr className="group hover:bg-muted/40 transition-colors border-b last:border-0">
//       <td className="px-6 py-4 max-w-md">
//         <div className="flex items-center gap-4">
//           <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border shadow-sm bg-muted">
//             <Image
//               src={thumbnailUrl}
//               alt={data.title}
//               fill
//               sizes="48px"
//               priority={false}
//               className="object-cover transition-transform duration-300 group-hover:scale-105"
//             />
//           </div>
//           <div className="flex flex-col min-w-0">
//             {/* Click on product title now uses the dynamic edit URL */}
//             <Link
//               href={editUrl}
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

//       {/* Category */}
//       <td className="px-6 py-4 whitespace-nowrap">
//         <div className="flex items-center gap-1.5 font-medium text-sm">
//           <BookOpen className="size-3.5 text-muted-foreground" />
//           {data.type}
//         </div>
//       </td>

//       {/* Status */}
//       <td className="px-6 py-4 whitespace-nowrap ">
//         <Badge
//           variant={data.status === "Published" ? "default" : "secondary"}
//           className="text-[10px] uppercase rounded-md"
//         >
//           {data.status || "Draft"}
//         </Badge>
//       </td>

//       {/* Enrolled Students Column */}
//       <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
//         <div className="flex items-center gap-1.5 font-medium">
//           ${data.price}
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
//             {/* The dropdown Edit button now uses the dynamic edit URL */}
//             <DropdownMenuItem asChild>
//               <Link href={editUrl}>
//                 <Pencil className="size-4 mr-2" /> Edit
//               </Link>
//             </DropdownMenuItem>
//             <DropdownMenuItem asChild>
//               <Link href={`/educator/products/${data.slug}`}>
//                 <Eye className="size-4 mr-2" /> Preview
//               </Link>
//             </DropdownMenuItem>
//             <DropdownMenuSeparator />
//             <DropdownMenuItem asChild className="text-destructive">
//               <Link href={`/educator/products/${data.id}/delete`}>
//                 <Trash2 className="size-4 mr-2" /> Delete
//               </Link>
//             </DropdownMenuItem>
//           </DropdownMenuContent>
//         </DropdownMenu>
//       </td>
//     </tr>
//   );
// }

// export function EducatorProductRowSkeleton() {
//   return (
//     <tr className="animate-pulse border-b last:border-0">
//       <td className="px-6 py-4">
//         <div className="flex items-center gap-4">
//           <div className="h-12 w-12 rounded-md bg-muted shrink-0" />
//           <div className="space-y-2 flex-1">
//             <div className="h-4 w-32 bg-muted rounded" />
//             <div className="h-3 w-48 bg-muted rounded" />
//           </div>
//         </div>
//       </td>
//       <td className="px-6 py-4">
//         <div className="h-6 w-16 bg-muted rounded-full" />
//       </td>
//       <td className="px-6 py-4">
//         <div className="h-4 w-12 bg-muted rounded" />
//       </td>
//       <td className="px-6 py-4">
//         <div className="h-4 w-20 bg-muted rounded" />
//       </td>
//       <td className="px-6 py-4 text-right">
//         <div className="h-8 w-8 bg-muted rounded inline-block" />
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
// import {
//   Eye,
//   MoreVertical,
//   Pencil,
//   Trash2,
//   Users,
//   BookOpen,
// } from "lucide-react";
// import Image from "next/image";
// import Link from "next/link";
// import { Badge } from "@/app/_components/ui/badge";
// import { EducatorProductType } from "../actions/educator-get-products";

// interface EducatorProductRowProps {
//   data: EducatorProductType;
// }

// export function EducatorProductRow({ data }: EducatorProductRowProps) {
//   // ✅ FIX: Safely determine if data.fileKey is already a full URL or a raw key string
//   const thumbnailUrl = data.fileKey
//     ? data.fileKey.startsWith("http")
//       ? data.fileKey
//       : `https://utfs.io/f/${data.fileKey}`
//     : "/placeholder-course.jpg";

//   return (
//     <tr className="group hover:bg-muted/40 transition-colors border-b last:border-0">
//       <td className="px-6 py-4 max-w-md">
//         <div className="flex items-center gap-4">
//           <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border shadow-sm bg-muted">
//             <Image
//               src={thumbnailUrl}
//               alt={data.title}
//               fill
//               sizes="48px"
//               priority={false}
//               className="object-cover transition-transform duration-300 group-hover:scale-110"
//             />
//           </div>
//           <div className="flex flex-col min-w-0">
//             <Link
//               href={`/educator/products/${data.id}/edit`}
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

//       {/* Category */}
//       <td className="px-6 py-4 whitespace-nowrap">
//         <div className="flex items-center gap-1.5 font-medium">
//           <BookOpen className="size-3.5 text-muted-foreground" />
//           {data.type}
//         </div>
//       </td>

//       {/* Status */}
//       <td className="px-6 py-4 whitespace-nowrap ">
//         <Badge
//           variant={data.status === "Published" ? "default" : "secondary"}
//           className="text-[10px] uppercase rounded-md"
//         >
//           {data.status || "Draft"}
//         </Badge>
//       </td>

//       {/* Enrolled Students Column */}
//       <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
//         <div className="flex items-center gap-1.5 font-medium">
//           <Users className="size-3.5 text-muted-foreground" />
//           {data.course?._count?.enrollment || 0} students
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
//               <Link href={`/educator/productd/${data.id}/edit`}>
//                 <Pencil className="size-4 mr-2" /> Edit
//               </Link>
//             </DropdownMenuItem>
//             <DropdownMenuItem asChild>
//               <Link href={`/educator/products/${data.slug}`}>
//                 <Eye className="size-4 mr-2" /> Preview
//               </Link>
//             </DropdownMenuItem>
//             <DropdownMenuSeparator />
//             <DropdownMenuItem asChild className="text-destructive">
//               <Link href={`/educator/products/${data.id}/delete`}>
//                 <Trash2 className="size-4 mr-2" /> Delete
//               </Link>
//             </DropdownMenuItem>
//           </DropdownMenuContent>
//         </DropdownMenu>
//       </td>
//     </tr>
//   );
// }

// // ✅ FIX: Added missing columns to the skeleton row layout so it aligns perfectly with your table headers
// export function EducatorProductRowSkeleton() {
//   return (
//     <tr className="animate-pulse border-b last:border-0">
//       <td className="px-6 py-4">
//         <div className="flex items-center gap-4">
//           <div className="h-12 w-12 rounded-full bg-muted shrink-0" />
//           <div className="space-y-2 flex-1">
//             <div className="h-4 w-32 bg-muted rounded" />
//             <div className="h-3 w-48 bg-muted rounded" />
//           </div>
//         </div>
//       </td>
//       <td className="px-6 py-4">
//         <div className="h-6 w-16 bg-muted rounded-full" />
//       </td>
//       <td className="px-6 py-4">
//         <div className="h-4 w-12 bg-muted rounded" />
//       </td>
//       <td className="px-6 py-4">
//         <div className="h-4 w-20 bg-muted rounded" />
//       </td>
//       <td className="px-6 py-4 text-right">
//         <div className="h-8 w-8 bg-muted rounded inline-block" />
//       </td>
//     </tr>
//   );
// }
