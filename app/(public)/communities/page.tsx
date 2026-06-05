import CommunitiesDiscoveryPage from "@/app/_components/CommunitiesDiscoveryPage";
import prisma from "@/lib/prisma";

export default async function DiscoverPage() {
  // Fetch all communities from the database
  const dbCommunities = await prisma.community.findMany({
    orderBy: {
      memberCount: "desc", // Sort popular ones first
    },
  });

  // Dynamically extract unique categories present in your DB communities
  const uniqueCategories = Array.from(
    new Set(dbCommunities.map((c) => c.category)),
  );

  // Map database data safely into clean serializable props for the client component
  const communities = dbCommunities.map((community) => ({
    id: community.id,
    title: community.name,
    category: community.category.toLowerCase(),
    image:
      community.fileKey ||
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80", // Fallback banner

    description: community.description,
    smallDescription: community.smallDescription,
    members:
      community.memberCount >= 1000
        ? `${(community.memberCount / 1000).toFixed(1)}k`
        : community.memberCount.toString(),
    price: community.price === 0 ? "Free" : `$${community.price}/month`,
  }));

  return (
    <CommunitiesDiscoveryPage
      initialCommunities={communities}
      availableCategories={uniqueCategories}
    />
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
//   SlidersHorizontal,
//   Users,
// } from "lucide-react";
// import Image from "next/image";

// // Mock data mapping perfectly to the layout structure in your image
// const CATEGORIES = [
//   { id: "all", label: "All", icon: Compass },
//   { id: "trending", label: "Trending", icon: Flame },
//   { id: "hobbies", label: "Hobbies", icon: Palette },
//   { id: "music", label: "Music", icon: Music },
//   { id: "money", label: "Money", icon: DollarSign },
//   { id: "spirituality", label: "Spirituality", icon: Flame }, // used fallback style icon
//   { id: "tech", label: "Tech", icon: Laptop },
//   { id: "health", label: "Health", icon: Heart },
//   { id: "sports", label: "Sports", icon: Trophy },
// ];

// const COMMUNITIES = [
//   {
//     id: 1,
//     title: "AI Money Lab",
//     creator: "AI Lab Team",
//     category: "money",
//     image:
//       "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80", // Replace with your custom banner graphics
//     avatar:
//       "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
//     description:
//       "Discover how to make more money with AI and save 1,000s of hours with AI Automation! NEW AI trainings released weekly.",
//     members: "77k",
//     price: "Free",
//   },
//   {
//     id: 2,
//     title: "AI Video Bootcamp",
//     creator: "Alex & Jordan",
//     category: "tech",
//     image:
//       "https://images.unsplash.com/photo-1626544827763-d516dce335e2?auto=format&fit=crop&w=600&q=80",
//     avatar:
//       "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
//     description:
//       "Master AI Video & AI Image Creation. Then use your skill to make AI Adverts, Social Media Content and Films to earn.",
//     members: "22.1k",
//     price: "$9/month",
//   },
//   {
//     id: 3,
//     title: "Lion Mode Club",
//     creator: "Lion Community",
//     category: "trending",
//     image:
//       "https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?auto=format&fit=crop&w=600&q=80",
//     avatar:
//       "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=150&q=80",
//     description:
//       "La comunidad #1 de indices sinteticos. Learn fundamental trading mechanics, discipline architectures, and community-backed execution.",
//     members: "2.6k",
//     price: "Free",
//   },
// ];

// export default function DiscoverCommunities() {
//   const [activeCategory, setActiveCategory] = useState("all");
//   const [searchQuery, setSearchQuery] = useState("");

//   // Filtering Logic
//   const filteredCommunities = COMMUNITIES.filter((community) => {
//     const matchesCategory =
//       activeCategory === "all" || community.category === activeCategory;
//     const matchesSearch =
//       community.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       community.description.toLowerCase().includes(searchQuery.toLowerCase());
//     return matchesCategory && matchesSearch;
//   });

//   return (
//     <div className="min-h-screen bg-[#f8f9fa] text-[#1a1a1a] font-sans antialiased pb-20">
//       {/* HEADER SECTION */}
//       <div className="max-w-7xl mx-auto px-6 pt-16 pb-10 text-center">
//         <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#111111] mb-3">
//           Discover communities
//         </h1>
//         <p className="text-gray-500 font-medium text-base">
//           or{" "}
//           <a href="#" className="text-blue-600 hover:underline transition-all">
//             create your own
//           </a>
//         </p>

//         {/* SEARCH BAR ELEMENT */}
//         <div className="mt-8 max-w-2xl mx-auto relative group">
//           <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-gray-600 transition-colors">
//             <Search className="w-5 h-5 stroke-[2.5]" />
//           </div>
//           <input
//             type="text"
//             placeholder="Search for anything"
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="w-full h-14 pl-14 pr-6 bg-white border border-gray-200 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] focus:shadow-[0_4px_12px_rgba(0,0,0,0.08)] focus:border-gray-300 outline-none transition-all text-base placeholder-gray-400 text-gray-800"
//           />
//         </div>

//         {/* CATEGORY SLIDER TAGS */}
//         <div className="mt-8 flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
//           {CATEGORIES.map((cat) => {
//             const IconComponent = cat.icon;
//             const isSelected = activeCategory === cat.id;
//             return (
//               <button
//                 key={cat.id}
//                 onClick={() => setActiveCategory(cat.id)}
//                 className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-150 ${
//                   isSelected
//                     ? "bg-gray-800 border-gray-800 text-white shadow-sm"
//                     : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
//                 }`}
//               >
//                 <IconComponent
//                   className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-gray-400"}`}
//                 />
//                 {cat.label}
//               </button>
//             );
//           })}

//           {/* Static Action Buttons aligned exactly like layout */}
//           <button className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border bg-white border-gray-200 text-gray-400 hover:border-gray-300 hover:bg-gray-50">
//             More...
//           </button>
//           <button className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 ml-1">
//             <SlidersHorizontal className="w-3.5 h-3.5 text-gray-500" />
//             Filter
//           </button>
//         </div>
//       </div>

//       {/* GRID SECTION */}
//       <div className="max-w-7xl mx-auto px-6 mt-4">
//         {filteredCommunities.length === 0 ? (
//           <div className="text-center py-20 bg-white border border-dashed border-gray-200 rounded-3xl max-w-xl mx-auto">
//             <p className="text-gray-400 text-base font-medium">
//               No communities found matching your filter specs.
//             </p>
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//             {filteredCommunities.map((item) => (
//               <div
//                 key={item.id}
//                 className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:translate-y-[-2px] transition-all duration-200 flex flex-col group cursor-pointer"
//               >
//                 {/* Banner Graphics Cover */}
//                 <div className="relative aspect-21/10 w-full bg-gray-100 overflow-hidden">
//                   <Image
//                     src={item.image}
//                     alt={item.title}
//                     width={50}
//                     height={50}
//                     className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
//                   />
//                 </div>

//                 {/* Card Main Body Specs */}
//                 <div className="p-5 flex-1 flex flex-col justify-between">
//                   <div>
//                     {/* Header: Identity profile row */}
//                     <div className="flex items-center gap-3 mb-4">
//                       <Image
//                         src={item.avatar}
//                         alt={item.creator}
//                         width={50}
//                         height={50}
//                         className="w-9 h-9 rounded-xl object-cover ring-2 ring-gray-50"
//                       />
//                       <h3 className="font-bold text-[17px] text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">
//                         {item.title}
//                       </h3>
//                     </div>

//                     {/* Excerpt Body text */}
//                     <p className="text-gray-500 text-[14px] leading-relaxed line-clamp-3 mb-6 font-normal">
//                       {item.description}
//                     </p>
//                   </div>

//                   {/* Metadata Base Bar */}
//                   <div className="flex items-center justify-between pt-4 border-t border-gray-50 text-[13px] text-gray-500 font-semibold">
//                     <div className="flex items-center gap-1">
//                       <Users className="w-4 h-4 text-gray-400" />
//                       <span>{item.members} Members</span>
//                     </div>
//                     <span
//                       className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${
//                         item.price === "Free"
//                           ? "bg-emerald-50 text-emerald-600"
//                           : "bg-blue-50 text-blue-600"
//                       }`}
//                     >
//                       {item.price}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
