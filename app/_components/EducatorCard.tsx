import Image from "next/image";
import { Calendar, Star, User } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import Link from "next/link";

interface EducatorProps {
  educator: {
    id: string;
    name: string;
    imageUrl?: string;
    specialty: string;
    experience: string;
    description: string;
  };
}
export default function EducatorCard({ educator }: EducatorProps) {
  return (
    <Card className="border-emerald-900/20 hover:border-emerald-700/40 transition-all">
      <CardContent className="pt-5">
        <div>
          <div className="size-12 rounded-full bg-emerald-900/20 flex items-center justify-center shrink-0 overflow-hidden">
            {educator.imageUrl ? (
              <Image
                src={educator.imageUrl}
                alt={educator.name}
                width={48} // Next/Image requires width/height or 'fill'
                height={48}
                className="size-12 rounded-full object-cover"
              />
            ) : (
              <User className="size-6 text-emerald-400" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
              <h3 className="font-medium text-white text-lg">
                {educator.name}
              </h3>
              <Badge
                variant="outline"
                className="bg-emerald-900/20 border-emerald-900/30 text-emerald-500 self-start"
              >
                <Star className="size-3 mr-1" />
                Verified
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground mb-1">
              {educator.specialty} • {educator.experience} years experience
            </p>

            <div className="mt-4 line-clamp-2 text-sm text-muted-foreground mb-4">
              {educator.description}
            </div>

            <Button
              asChild
              className="w-full bg-emerald-500 hover:bg-emerald-600 mt-2"
            >
              <Link href={`/educators/${educator.specialty}/${educator.id}`}>
                <Calendar className="size-4 mr-2" />
                View Profile and Book
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
