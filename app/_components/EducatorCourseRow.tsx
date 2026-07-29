
import { Button } from "@/app/_components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/app/_components/ui/dropdown-menu";
import { Skeleton } from "@/app/_components/ui/skeleton";
import { AdminCourseType } from "@/app/actions/educator-get-courses";
import { useConstructUrl } from "@/hooks/use-construct-url";
import { Eye, MoreVertical, Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/app/_components/ui/badge";
import { Users, Clock } from "lucide-react";

interface iAppProps {
data: AdminCourseType
}


export function EducatorCourseRow({ data }: iAppProps) {
const thumbnailUrl = useConstructUrl(data.fileKey);

return (
<tr className="group hover:bg-muted/40 transition-colors border-b last:border-0">
      <td className="px-6 py-4 max-w-md">
        <div className="flex items-center gap-4">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border shadow-sm">
            <Image
              src={thumbnailUrl || "/placeholder-course.jpg"}
              alt={data.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110" // Add these classes
            />
          </div>
          <div className="flex flex-col min-w-0">
            <Link
              href={`/dashboard/educator/courses/${data.id}/edit`}
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
<Badge variant={data.status === 'Published' ? 'default' : 'secondary'} className="text-[10px] uppercase">
{data.status || "Draft"}
</Badge>
</td>

{/* Added Duration Column */}
<td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
<div className="flex items-center gap-1.5 font-medium">
<Clock className="size-3.5 text-muted-foreground" />
{data.duration}h
</div>
</td>

{/* Added Enrolled Students Column */}
<td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
<div className="flex items-center gap-1.5 font-medium">
<Users className="size-3.5 text-muted-foreground" />
{/* Assuming you have an enrollment count in your data, or use 0 as fallback */}
{data._count.enrollment || 0} students
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
<Link href={`/dashboard/educator/courses/${data.id}/edit`}>
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
<Link href={`/dashboard/educator/courses/${data.id}/delete`}>
<Trash2 className="size-4 mr-2" /> Delete
</Link>
</DropdownMenuItem>
</DropdownMenuContent>
</DropdownMenu>
</td>
</tr>
);
}

export function EducatorCourseRowSkeleton() {
  return (
    <tr>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          {/* Changed w-20 to w-12 and rounded-md to rounded-full */}
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-6 w-16 rounded-full" />
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-4 w-12" />
      </td>
      <td className="px-6 py-4 text-right">
        <Skeleton className="h-8 w-8 ml-auto rounded-md" />
      </td>
    </tr>
  );
}

