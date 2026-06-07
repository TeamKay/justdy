import { Button } from "@/app/_components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/_components/ui/dropdown-menu";
import { EducatorCourseType } from "@/app/actions/educator-get-courses";
import { Eye, MoreVertical, Pencil, Trash2, Users, Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/app/_components/ui/badge";

interface EducatorCourseRowProps {
  data: EducatorCourseType;
}

export function EducatorCourseRow({ data }: EducatorCourseRowProps) {
  // ✅ FIX: Safely determine if data.fileKey is already a full URL or a raw key string
  const thumbnailUrl = data.fileKey
    ? data.fileKey.startsWith("http")
      ? data.fileKey
      : `https://utfs.io/f/${data.fileKey}`
    : "/placeholder-course.jpg";

  return (
    <tr className="group hover:bg-muted/40 transition-colors border-b last:border-0">
      <td className="px-6 py-4 max-w-md">
        <div className="flex items-center gap-4">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border shadow-sm bg-muted">
            <Image
              src={thumbnailUrl}
              alt={data.title}
              fill
              sizes="48px"
              priority={false}
              className="object-cover transition-transform duration-300 group-hover:scale-110"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <Link
              href={`/educator/courses/${data.id}/edit`}
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

      {/* Status */}
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge
          variant={data.status === "Published" ? "default" : "secondary"}
          className="text-[10px] uppercase"
        >
          {data.status || "Draft"}
        </Badge>
      </td>

      {/* Duration Column */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
        <div className="flex items-center gap-1.5 font-medium">
          <Clock className="size-3.5 text-muted-foreground" />
          {data.duration}h
        </div>
      </td>

      {/* Enrolled Students Column */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
        <div className="flex items-center gap-1.5 font-medium">
          <Users className="size-3.5 text-muted-foreground" />
          {data._count?.enrollment || 0} students
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
              <Link href={`/educator/courses/${data.id}/edit`}>
                <Pencil className="size-4 mr-2" /> Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/courses/${data.slug}`}>
                <Eye className="size-4 mr-2" /> Preview
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="text-destructive">
              <Link href={`/educator/courses/${data.id}/delete`}>
                <Trash2 className="size-4 mr-2" /> Delete
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

// ✅ FIX: Added missing columns to the skeleton row layout so it aligns perfectly with your table headers
export function EducatorCourseRowSkeleton() {
  return (
    <tr className="animate-pulse border-b last:border-0">
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-muted shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="h-3 w-48 bg-muted rounded" />
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="h-6 w-16 bg-muted rounded-full" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-12 bg-muted rounded" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-20 bg-muted rounded" />
      </td>
      <td className="px-6 py-4 text-right">
        <div className="h-8 w-8 bg-muted rounded inline-block" />
      </td>
    </tr>
  );
}
