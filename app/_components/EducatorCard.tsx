import Image from "next/image";
import { Calendar, User } from "lucide-react";
import { Card, CardContent } from "./ui/card";
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
    <Card className="group relative overflow-hidden border border-emerald-900/20 bg-emerald-950/10 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-emerald-600/40 hover:shadow-xl">
      {/* subtle gradient glow */}

      <CardContent className="p-5 h-full">
        <div className="flex items-stretch gap-4 h-full">
          {/* LEFT: IMAGE (full height match) */}
          <div className="relative w-28 h-full min-h-31 rounded-md overflow-hidden border border-emerald-500/20 bg-emerald-950/20 shrink-0">
            {educator.imageUrl ? (
              <Image
                src={educator.imageUrl}
                alt={educator.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <User className="w-8 h-8 text-emerald-400" />
              </div>
            )}
          </div>

          {/* RIGHT: CONTENT */}
          <div className="flex flex-col justify-between flex-1 h-full">
            <div>
              <h3 className="font-semibold text-white text-lg group-hover:text-emerald-300 transition-colors">
                {educator.name}
              </h3>

              <p className="text-sm text-muted-foreground mt-1">
                {educator.specialty}
              </p>

              <p className="text-xs text-muted-foreground mt-1">
                {educator.experience} years experience
              </p>
            </div>

            <Button
              asChild
              className="mt-4 w-full bg-emerald-500 hover:bg-emerald-600 text-black font-medium transition-all"
            >
              <Link
                href={`/educators/${educator.id}`}
                className="mt-4 w-full bg-emerald-500 hover:bg-emerald-600 text-black font-medium transition-all flex items-center justify-center gap-2 rounded-md py-2"
              >
                <Calendar className="size-4" />
                View Profile & Book
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// import Image from "next/image";
// import { Calendar, Star, User } from "lucide-react";
// import { Card, CardContent } from "./ui/card";
// import { Badge } from "./ui/badge";
// import { Button } from "./ui/button";
// import Link from "next/link";

// interface EducatorProps {
//   educator: {
//     id: string;
//     name: string;
//     imageUrl?: string;
//     specialty: string;
//     experience: string;
//     description: string;
//   };
// }
// export default function EducatorCard({ educator }: EducatorProps) {
//   return (
//     <Card className="border-emerald-900/20 hover:border-emerald-700/40 transition-all">
//       <CardContent className="pt-5">
//         <div>
//           <div className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden border border-emerald-500/20 bg-emerald-950/20">
//             {educator.imageUrl ? (
//               <Image
//                 src={educator.imageUrl}
//                 alt={educator.name}
//                 fill
//                 className="object-cover"
//               />
//             ) : (
//               <div className="flex items-center justify-center h-full">
//                 <User className="w-6 h-6 text-emerald-400" />
//               </div>
//             )}
//           </div>

//           <div className="flex-1">
//             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
//               <h3 className="font-medium text-white text-lg">
//                 {educator.name}
//               </h3>
//               <Badge
//                 variant="outline"
//                 className="bg-emerald-900/20 border-emerald-900/30 text-emerald-500 self-start"
//               >
//                 <Star className="size-3 mr-1" />
//                 Verified
//               </Badge>
//             </div>

//             <p className="text-sm text-muted-foreground mb-1">
//               {educator.specialty} • {educator.experience} years experience
//             </p>

//             <Button
//               asChild
//               className="w-full bg-emerald-500 hover:bg-emerald-600 mt-2"
//             >
//               <Link href={`/educators/${educator.specialty}/${educator.id}`}>
//                 <Calendar className="size-4 mr-2" />
//                 View Profile and Book
//               </Link>
//             </Button>
//           </div>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }
