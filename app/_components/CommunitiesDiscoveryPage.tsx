"use client";

import React, { useState } from "react";
import {
  Search,
  Flame,
  Palette,
  Music,
  DollarSign,
  Compass,
  Laptop,
  Heart,
  Trophy,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

/* ---------------- ICON TYPES (NO any) ---------------- */
type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

const ICON_MAP: Record<string, IconType> = {
  all: Compass,
  trending: Flame,
  hobbies: Palette,
  music: Music,
  money: DollarSign,
  finance: DollarSign,
  spirituality: Flame,
  tech: Laptop,
  technology: Laptop,
  health: Heart,
  sports: Trophy,
};

/* ---------------- INTERFACES ---------------- */
interface CommunityProp {
  id: string;
  slug?: string; // Optionalized in case backend drops it
  title: string;
  category: string;
  image: string;
  smallDescription: string; // Added smallDescriptionText for cleaner UI
  description: string;
  members: string;
  price: string;
}

interface ClientProps {
  initialCommunities: CommunityProp[];
  availableCategories: string[];
}

/* ---------------- IMAGE HANDLER ---------------- */
const getImageUrl = (value?: string): string => {
  if (!value) return "/placeholder.jpg";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;

  return `https://utfs.io/f/${value}`;
};

/* ---------------- INITIALS GENERATOR ---------------- */
const getInitials = (title: string): string => {
  if (!title) return "";
  const words = title.trim().split(/\s+/);
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

/* ---------------- DEFINED TYPES FOR PARSING ---------------- */
interface TipTapNode {
  type: string;
  text?: string;
  content?: TipTapNode[];
  [key: string]: unknown;
}

/* ---------------- RECURSIVE JSON TEXT EXTRACTOR ---------------- */
const extractTextFromJSON = (node: unknown): string => {
  if (!node || typeof node !== "object") return "";

  const target = node as TipTapNode;
  let text = "";

  // If this node contains a raw text property, collect it
  if (typeof target.text === "string") {
    text += target.text;
  }

  // If this node has nested content children, recursively parse them
  if (Array.isArray(target.content)) {
    target.content.forEach((child) => {
      text += extractTextFromJSON(child);
    });
  }

  return text;
};

/* ---------------- DESCRIPTION CLEANER ---------------- */
const formatDescription = (value: unknown): string => {
  if (!value) return "";

  if (typeof value === "string") {
    // Check if it looks like JSON before attempting to parse
    if (value.trim().startsWith("{") || value.trim().startsWith("[")) {
      try {
        const parsed: unknown = JSON.parse(value);
        return extractTextFromJSON(parsed) || value;
      } catch {
        return value;
      }
    }
    return value;
  }

  if (typeof value === "object" && value !== null) {
    return extractTextFromJSON(value);
  }

  return String(value);
};

/* ---------------- MAIN COMPONENT ---------------- */
export default function CommunitiesDiscoveryPage({
  initialCommunities,
  availableCategories,
}: ClientProps) {
  // 1. Changed to allow updating the state when a category button is clicked
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const categoriesList = [
    { id: "all", label: "All", icon: Compass },
    ...availableCategories.map((cat) => {
      const lowerCat = cat.toLowerCase();

      return {
        id: lowerCat,
        label: cat.charAt(0).toUpperCase() + cat.slice(1),
        icon: ICON_MAP[lowerCat] || Compass,
      };
    }),
  ];

  const filteredCommunities = initialCommunities.filter((community) => {
    // Standardize community categories to lowercase for consistent matching
    const matchesCategory =
      activeCategory === "all" ||
      community.category.toLowerCase() === activeCategory;

    const cleanDescription = formatDescription(community.description);

    const matchesSearch =
      community.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cleanDescription.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background text-white/40 font-sans antialiased pb-20">
      {/* HEADER */}
      <div className="max-w-6xl mx-auto px-12 pt-5 pb-10 text-center">
        <div className="mt-8 max-w-2xl mx-auto relative group">
          <div className="absolute inset-y-0 left-5 flex items-center text-gray-400">
            <Search className="w-5 h-5" />
          </div>

          <input
            type="text"
            placeholder="Search for anything"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 pl-14 pr-6 bg-emerald-900/20 border border-emerald-900/20 rounded-md outline-none text-white"
          />
        </div>
      </div>

      {/* CATEGORIES CHIPS BAR (Fixes the unused variable warning) */}
      <div className="max-w-7xl mx-auto px-12 mb-8 flex flex-wrap gap-2 justify-center">
        {categoriesList.map((category) => {
          const Icon = category.icon;
          const isActive = activeCategory === category.id;

          return (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${
                isActive
                  ? "bg-emerald-600 text-white"
                  : "bg-emerald-900/20 border border-emerald-900/30 text-white/60 hover:bg-emerald-900/40"
              }`}
            >
              <Icon className="w-4 h-4" />
              {category.label}
            </button>
          );
        })}
      </div>

      {/* GRID */}
      <div className="max-w-7xl mx-auto px-12">
        {filteredCommunities.length === 0 ? (
          <div className="text-center py-20">No communities found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCommunities.map((item) => {
              const imageUrl = getImageUrl(item.image);
              const initials = getInitials(item.title);

              // Fallbacks strategy if 'slug' missing entirely from database response
              const communitySlug =
                item.slug ||
                item.title
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/(^-|-$)+/g, "") ||
                item.id;

              return (
                <Link
                  key={item.id}
                  href={`/communities/${communitySlug}`}
                  className="bg-emerald-900/30 rounded-md overflow-hidden block transition duration-200 hover:opacity-90"
                >
                  {/* IMAGE */}
                  <div className="relative aspect-21/10 bg-gray-100">
                    <Image
                      src={imageUrl}
                      alt={item.title}
                      width={400}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* CONTENT */}
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      {/* REPLACED AVATAR WITH DESIGNED INITIALS CIRCLE */}
                      <div className="w-9 h-9 flex items-center justify-center rounded-full bg-emerald-900/10 border border-emerald-900 text-white text-xs font-bold select-none shrink-0">
                        {initials}
                      </div>

                      <h3 className="font-bold text-lg line-clamp-1 text-white/70">
                        {item.title}
                      </h3>
                    </div>

                    <p className="text-muted-foreground text-sm mb-4 line-clamp-4">
                      {formatDescription(item.smallDescription)}
                    </p>

                    <div className="flex justify-between text-sm text-white border-t pt-3">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {item.members} Members
                      </div>

                      <span
                        className={`px-2 py-1 rounded-md text-xs font-semibold ${
                          item.price === "Free"
                            ? "bg-amber-300/10 text-white"
                            : "bg-amber-300/10 text-white"
                        }`}
                      >
                        {item.price}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// "use client";

// import React, { useState } from "react";
// import {
//   Search,
//   Flame,
//   Palette,
//   Music,
//   DollarSign,
//   Compass,
//   Laptop,
//   Heart,
//   Trophy,
//   Users,
// } from "lucide-react";
// import Image from "next/image";
// import Link from "next/link";

// /* ---------------- ICON TYPES (NO any) ---------------- */
// type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

// const ICON_MAP: Record<string, IconType> = {
//   all: Compass,
//   trending: Flame,
//   hobbies: Palette,
//   music: Music,
//   money: DollarSign,
//   finance: DollarSign,
//   spirituality: Flame,
//   tech: Laptop,
//   technology: Laptop,
//   health: Heart,
//   sports: Trophy,
// };

// /* ---------------- INTERFACES ---------------- */
// interface CommunityProp {
//   id: string;
//   slug?: string; // Optionalized in case backend drops it
//   title: string;
//   category: string;
//   image: string;
//   smallDescription: string; // Added smallDescriptionText for cleaner UI
//   description: string;
//   members: string;
//   price: string;
// }

// interface ClientProps {
//   initialCommunities: CommunityProp[];
//   availableCategories: string[];
// }

// /* ---------------- IMAGE HANDLER ---------------- */
// const getImageUrl = (value?: string): string => {
//   if (!value) return "/placeholder.jpg";
//   if (value.startsWith("http://") || value.startsWith("https://")) return value;

//   return `https://utfs.io/f/${value}`;
// };

// /* ---------------- INITIALS GENERATOR ---------------- */
// const getInitials = (title: string): string => {
//   if (!title) return "";
//   const words = title.trim().split(/\s+/);
//   if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
//   return (words[0][0] + words[1][0]).toUpperCase();
// };

// /* ---------------- DEFINED TYPES FOR PARSING ---------------- */
// interface TipTapNode {
//   type: string;
//   text?: string;
//   content?: TipTapNode[];
//   [key: string]: unknown;
// }

// /* ---------------- RECURSIVE JSON TEXT EXTRACTOR ---------------- */
// const extractTextFromJSON = (node: unknown): string => {
//   if (!node || typeof node !== "object") return "";

//   const target = node as TipTapNode;
//   let text = "";

//   // If this node contains a raw text property, collect it
//   if (typeof target.text === "string") {
//     text += target.text;
//   }

//   // If this node has nested content children, recursively parse them
//   if (Array.isArray(target.content)) {
//     target.content.forEach((child) => {
//       text += extractTextFromJSON(child);
//     });
//   }

//   return text;
// };

// /* ---------------- DESCRIPTION CLEANER ---------------- */
// const formatDescription = (value: unknown): string => {
//   if (!value) return "";

//   if (typeof value === "string") {
//     // Check if it looks like JSON before attempting to parse
//     if (value.trim().startsWith("{") || value.trim().startsWith("[")) {
//       try {
//         const parsed: unknown = JSON.parse(value);
//         return extractTextFromJSON(parsed) || value;
//       } catch {
//         return value;
//       }
//     }
//     return value;
//   }

//   if (typeof value === "object" && value !== null) {
//     return extractTextFromJSON(value);
//   }

//   return String(value);
// };

// /* ---------------- MAIN COMPONENT ---------------- */
// export default function CommunitiesDiscoveryPage({
//   initialCommunities,
//   availableCategories,
// }: ClientProps) {
//   const [activeCategory] = useState("all");
//   const [searchQuery, setSearchQuery] = useState("");

//   const categoriesList = [
//     { id: "all", label: "All", icon: Compass },
//     ...availableCategories.map((cat) => {
//       const lowerCat = cat.toLowerCase();

//       return {
//         id: lowerCat,
//         label: cat.charAt(0).toUpperCase() + cat.slice(1),
//         icon: ICON_MAP[lowerCat] || Compass,
//       };
//     }),
//   ];

//   const filteredCommunities = initialCommunities.filter((community) => {
//     const matchesCategory =
//       activeCategory === "all" || community.category === activeCategory;

//     const cleanDescription = formatDescription(community.description);

//     const matchesSearch =
//       community.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       cleanDescription.toLowerCase().includes(searchQuery.toLowerCase());

//     return matchesCategory && matchesSearch;
//   });

//   return (
//     <div className="min-h-screen bg-background text-white/40 font-sans antialiased pb-20">
//       {/* HEADER */}
//       <div className="max-w-6xl mx-auto px-12 pt-5 pb-10 text-center">
//         <div className="mt-8 max-w-2xl mx-auto relative group">
//           <div className="absolute inset-y-0 left-5 flex items-center text-gray-400">
//             <Search className="w-5 h-5" />
//           </div>

//           <input
//             type="text"
//             placeholder="Search for anything"
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="w-full h-14 pl-14 pr-6 bg-emerald-900/20 border border-emerald-900/20 rounded-md outline-none"
//           />
//         </div>
//       </div>

//       {/* GRID */}
//       <div className="max-w-7xl mx-auto px-12">
//         {filteredCommunities.length === 0 ? (
//           <div className="text-center py-20">No communities found.</div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//             {filteredCommunities.map((item) => {
//               const imageUrl = getImageUrl(item.image);

//               const initials = getInitials(item.title);

//               // Fallbacks strategy if 'slug' missing entirely from database response
//               const communitySlug =
//                 item.slug ||
//                 item.title
//                   .toLowerCase()
//                   .replace(/[^a-z0-9]+/g, "-")
//                   .replace(/(^-|-$)+/g, "") ||
//                 item.id;

//               return (
//                 <Link
//                   key={item.id}
//                   href={`/communities/${communitySlug}`}
//                   className="bg-emerald-900/30 rounded-md overflow-hidden block transition duration-200 hover:opacity-90"
//                 >
//                   {/* IMAGE */}
//                   <div className="relative aspect-21/10 bg-gray-100">
//                     <Image
//                       src={imageUrl}
//                       alt={item.title}
//                       width={400}
//                       height={200}
//                       className="w-full h-full object-cover"
//                     />
//                   </div>

//                   {/* CONTENT */}
//                   <div className="p-5">
//                     <div className="flex items-center gap-3 mb-3">
//                       {/* REPLACED AVATAR WITH DESIGNED INITIALS CIRCLE */}
//                       <div className="w-9 h-9 flex items-center justify-center rounded-full bg-emerald-900/10 border border-emerald-900 text-white text-xs font-bold select-none shrink-0">
//                         {initials}
//                       </div>

//                       <h3 className="font-bold text-lg line-clamp-1 text-white/70">
//                         {item.title}
//                       </h3>
//                     </div>

//                     <p className="text-muted-foreground text-sm mb-4 line-clamp-4">
//                       {/* Change item.smallDescriptionText to item.smallDescription */}
//                       {formatDescription(item.smallDescription)}
//                     </p>

//                     <div className="flex justify-between text-sm text-white border-t pt-3">
//                       <div className="flex items-center gap-1">
//                         <Users className="w-4 h-4" />
//                         {item.members} Members
//                       </div>

//                       <span
//                         className={`px-2 py-1 rounded-md text-xs font-semibold ${
//                           item.price === "Free"
//                             ? "bg-amber-300/10 text-white"
//                             : "bg-amber-300/10 text-white"
//                         }`}
//                       >
//                         {item.price}
//                       </span>
//                     </div>
//                   </div>
//                 </Link>
//               );
//             })}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// "use client";

// import React, { useState } from "react";
// import {
//   Search,
//   Flame,
//   Palette,
//   Music,
//   DollarSign,
//   Compass,
//   Laptop,
//   Heart,
//   Trophy,
//   Users,
// } from "lucide-react";
// import Image from "next/image";
// import Link from "next/link"; // Imported Link for navigation

// /* ---------------- ICON TYPES (NO any) ---------------- */
// type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

// const ICON_MAP: Record<string, IconType> = {
//   all: Compass,
//   trending: Flame,
//   hobbies: Palette,
//   music: Music,
//   money: DollarSign,
//   finance: DollarSign,
//   spirituality: Flame,
//   tech: Laptop,
//   technology: Laptop,
//   health: Heart,
//   sports: Trophy,
// };

// /* ---------------- INTERFACES ---------------- */
// interface CommunityProp {
//   id: string;
//   slug: string; // Added slug to interface for navigation routing
//   title: string;
//   category: string;
//   image: string;
//   avatar: string;
//   description: string;
//   members: string;
//   price: string;
// }

// interface ClientProps {
//   initialCommunities: CommunityProp[];
//   availableCategories: string[];
// }

// /* ---------------- IMAGE HANDLER ---------------- */
// const getImageUrl = (value?: string): string => {
//   if (!value) return "/placeholder.jpg";
//   if (value.startsWith("http://") || value.startsWith("https://")) return value;

//   return `https://utfs.io/f/${value}`;
// };

// /* ---------------- INITIALS GENERATOR ---------------- */
// const getInitials = (title: string): string => {
//   if (!title) return "";
//   const words = title.trim().split(/\s+/);
//   if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
//   return (words[0][0] + words[1][0]).toUpperCase();
// };

// /* ---------------- DEFINED TYPES FOR PARSING ---------------- */
// interface TipTapNode {
//   type: string;
//   text?: string;
//   content?: TipTapNode[];
//   [key: string]: unknown;
// }

// /* ---------------- RECURSIVE JSON TEXT EXTRACTOR ---------------- */
// const extractTextFromJSON = (node: unknown): string => {
//   if (!node || typeof node !== "object") return "";

//   const target = node as TipTapNode;
//   let text = "";

//   // If this node contains a raw text property, collect it
//   if (typeof target.text === "string") {
//     text += target.text;
//   }

//   // If this node has nested content children, recursively parse them
//   if (Array.isArray(target.content)) {
//     target.content.forEach((child) => {
//       text += extractTextFromJSON(child);
//     });
//   }

//   return text;
// };

// /* ---------------- DESCRIPTION CLEANER ---------------- */
// const formatDescription = (value: unknown): string => {
//   if (!value) return "";

//   if (typeof value === "string") {
//     // Check if it looks like JSON before attempting to parse
//     if (value.trim().startsWith("{") || value.trim().startsWith("[")) {
//       try {
//         const parsed: unknown = JSON.parse(value);
//         return extractTextFromJSON(parsed) || value;
//       } catch {
//         return value;
//       }
//     }
//     return value;
//   }

//   if (typeof value === "object" && value !== null) {
//     return extractTextFromJSON(value);
//   }

//   return String(value);
// };

// /* ---------------- MAIN COMPONENT ---------------- */
// export default function CommunitiesDiscoveryPage({
//   initialCommunities,
//   availableCategories,
// }: ClientProps) {
//   const [activeCategory, setActiveCategory] = useState("all");
//   const [searchQuery, setSearchQuery] = useState("");

//   const categoriesList = [
//     { id: "all", label: "All", icon: Compass },
//     ...availableCategories.map((cat) => {
//       const lowerCat = cat.toLowerCase();

//       return {
//         id: lowerCat,
//         label: cat.charAt(0).toUpperCase() + cat.slice(1),
//         icon: ICON_MAP[lowerCat] || Compass,
//       };
//     }),
//   ];

//   const filteredCommunities = initialCommunities.filter((community) => {
//     const matchesCategory =
//       activeCategory === "all" || community.category === activeCategory;

//     const cleanDescription = formatDescription(community.description);

//     const matchesSearch =
//       community.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       cleanDescription.toLowerCase().includes(searchQuery.toLowerCase());

//     return matchesCategory && matchesSearch;
//   });

//   return (
//     <div className="min-h-screen bg-background text-white/40 font-sans antialiased pb-20">
//       {/* HEADER */}
//       <div className="max-w-6xl mx-auto px-12 pt-5 pb-10 text-center">
//         <div className="mt-8 max-w-2xl mx-auto relative group">
//           <div className="absolute inset-y-0 left-5 flex items-center text-gray-400">
//             <Search className="w-5 h-5" />
//           </div>

//           <input
//             type="text"
//             placeholder="Search for anything"
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="w-full h-14 pl-14 pr-6 bg-emerald-900/20 border border-emerald-900/20 rounded-md outline-none"
//           />
//         </div>
//       </div>

//       {/* GRID */}
//       <div className="max-w-7xl mx-auto px-12">
//         {filteredCommunities.length === 0 ? (
//           <div className="text-center py-20">No communities found.</div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//             {filteredCommunities.map((item) => {
//               const imageUrl = getImageUrl(item.image);
//               const description = formatDescription(item.description);
//               const initials = getInitials(item.title);

//               return (
//                 <Link
//                   key={item.id}
//                   href={`/communities/${item.slug}`}
//                   className="bg-emerald-900/30 rounded-md overflow-hidden block transition duration-200 hover:opacity-90"
//                 >
//                   {/* IMAGE */}
//                   <div className="relative aspect-21/10 bg-gray-100">
//                     <Image
//                       src={imageUrl}
//                       alt={item.title}
//                       width={400}
//                       height={200}
//                       className="w-full h-full object-cover"
//                     />
//                   </div>

//                   {/* CONTENT */}
//                   <div className="p-5">
//                     <div className="flex items-center gap-3 mb-3">
//                       <div className="w-9 h-9 flex items-center justify-center rounded-full bg-emerald-900/10 border border-emerald-900 text-white text-xs font-bold select-none shrink-0">
//                         {initials}
//                       </div>

//                       <h3 className="font-bold text-lg line-clamp-1 text-white/70">
//                         {item.title}
//                       </h3>
//                     </div>

//                     <p className="text-muted-foreground text-sm mb-4 line-clamp-4">
//                       {description}
//                     </p>

//                     <div className="flex justify-between text-sm text-white border-t pt-3">
//                       <div className="flex items-center gap-1">
//                         <Users className="w-4 h-4" />
//                         {item.members} Members
//                       </div>

//                       <span
//                         className={`px-2 py-1 rounded-md text-xs font-semibold ${
//                           item.price === "Free"
//                             ? "bg-amber-300/10 text-white"
//                             : "bg-amber-300/10 text-white"
//                         }`}
//                       >
//                         {item.price}
//                       </span>
//                     </div>
//                   </div>
//                 </Link>
//               );
//             })}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
