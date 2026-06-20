import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCommunityBySlug } from "@/app/actions/admin-communities";
import Image from "next/image";
import CommunityJoinClient from "@/app/_components/JoinCommunityModal";
import YouTubeStyleVideoPlayer from "@/app/_components/CommunityVideoPlayer";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function formatStatValue(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  }

  return num.toString();
}

export default async function CommunitySlugPage({ params }: PageProps) {
  const { slug } = await params;

  const community = await getCommunityBySlug(slug);

  if (!community) {
    notFound();
  }

  // DESCRIPTION IS NOW HTML
  const renderedHtml = community.description || "";

  // SMALL DESCRIPTION IS NOW NORMAL STRING
  const smallDescriptionText = community.smallDescription || "";

  const realMembers = community.memberCount || 0;

  const simulatedOnline = Math.max(1, Math.round(realMembers * 0.005));

  const simulatedAdmins = Math.max(
    1,
    Math.min(16, Math.round(realMembers * 0.00005)),
  );

  const stats = [
    {
      label: "Members",
      value: formatStatValue(realMembers),
    },
    {
      label: "Online",
      value: formatStatValue(simulatedOnline),
    },
    {
      label: "Admins",
      value: simulatedAdmins.toString(),
    },
  ];

  const imageSrc = community.fileKey
    ? `https://utfs.io/f/${community.fileKey}`
    : null;

  return (
    <div className="min-h-screen text-neutral-900 font-sans antialiased flex justify-center p-0 md:p-0">
      <div className="w-full bg-background rounded-md shadow-md overflow-hidden flex flex-col relative">
        <div className="w-full">
          {/* HERO */}

          <div className="w-full min-h-90 p-2 pt-8 pb-8 md:p-12 lg:p-16 bg-emerald-900/50 flex items-center">
            <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 flex flex-col lg:flex-row items-center justify-between gap-12">
              <div className="flex-1 text-left">
                <Link
                  href="/communities"
                  className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 text-xs font-semibold uppercase tracking-wider text-white/80 bg-white/10 hover:bg-white/20 border border-white/20 rounded-md backdrop-blur-xs transition"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
                    />
                  </svg>
                  Back
                </Link>

                <h1 className="max-w-3xl text-4xl md:text-5xl font-black tracking-tight text-white/70 leading-tight">
                  {community.name}
                </h1>

                <p className="max-w-3xl text-white/60 text-sm md:text-base leading-relaxed mt-2">
                  {smallDescriptionText || "No short description available."}
                </p>
              </div>

              <div className="flex-1 flex justify-center lg:justify-end">
                <div className="w-full max-w-xl aspect-video rounded-md overflow-hidden border border-neutral-800 bg-neutral-900 shadow-xl">
                  {community.videoKey ? (
                    <YouTubeStyleVideoPlayer
                      src={`https://utfs.io/f/${community.videoKey}`}
                    />
                  ) : imageSrc ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={imageSrc}
                        alt={community.name}
                        fill
                        priority
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-500">
                      No media available
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ABOUT SECTION */}

          <section className="max-w-7xl mx-auto bg-background p-8 pt-10 md:px-40 lg:px-12 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start z-10">
            <div className="lg:col-span-8 space-y-4">
              <h3 className="text-xl font-bold text-white">About Community</h3>

              {/* UPDATE THIS SECTION IN CommunitySlugPage */}
              {renderedHtml ? (
                <div
                  className="
                  prose prose-neutral dark:prose-invert max-w-none 
                  text-muted-foreground
                  
                  /* Target paragraph blocks accurately */
                  [&_p]:mb-4 
                  [&_p]:leading-7
                  
                  /* Ensure text colors match layout expectations */
                  prose-headings:text-neutral-800 
                  prose-headings:font-bold
                  prose-headings:mt-6
                  prose-headings:mb-3

                  prose-ul:list-disc
                  prose-ul:pl-5
                  prose-li:my-1

                  prose-ol:list-decimal
                  prose-ol:pl-5

                  prose-blockquote:border-l-4
                  prose-blockquote:pl-4
                "
                  dangerouslySetInnerHTML={{
                    __html: renderedHtml,
                  }}
                />
              ) : (
                <p className="text-neutral-500 text-sm leading-relaxed">
                  No custom overview data provided.
                </p>
              )}
            </div>

            {/* RIGHT PANEL */}

            <div className="lg:col-span-4 h-fit bg-emerald-900/50 rounded-md shadow-sm flex flex-col relative z-10 overflow-hidden">
              <div>
                <div className="w-full h-54 md:h-47 flex items-center justify-center relative overflow-hidden group">
                  {imageSrc ? (
                    <Image
                      src={imageSrc}
                      alt={community.name}
                      fill
                      className="object-contain"
                      priority
                    />
                  ) : (
                    <div className="text-neutral-400">No Image</div>
                  )}
                </div>

                <div className="p-3">
                  <h2 className="text-2xl font-bold tracking-tight text-white/80">
                    {community.name}
                  </h2>

                  <span className="text-muted-foreground text-xs">
                    justdy.com/{community.slug}
                  </span>

                  <p className="text-[14px] text-white/60 leading-relaxed mt-4">
                    {smallDescriptionText || "No short description available."}
                  </p>
                </div>

                <div className="p-3 pt-0">
                  <div className="grid grid-cols-3 text-center border-t border-b border-muted-foreground pt-4 pb-5 mb-5 divide-x divide-muted-foreground">
                    {stats.map((stat) => (
                      <div key={stat.label} className="px-2">
                        <div className="text-[17px] font-bold text-muted-foreground">
                          {stat.value}
                        </div>

                        <div className="text-[12px] text-muted-foreground">
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  <CommunityJoinClient
                    slug={community.slug}
                    price={community.price}
                    name={community.name}
                    description={smallDescriptionText}
                    stats={stats}
                  />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// import React from "react";
// import { notFound } from "next/navigation";
// import Link from "next/link"; // Imported Link component for navigation
// import { getCommunityBySlug } from "@/app/actions/admin-communities";
// import Image from "next/image";
// import CommunityJoinClient from "@/app/_components/JoinCommunityModal";

// // Import Tiptap server-side renderers
// import { generateHTML } from "@tiptap/html";
// import StarterKit from "@tiptap/starter-kit";
// import YouTubeStyleVideoPlayer from "@/app/_components/CommunityVideoPlayer";

// interface PageProps {
//   params: Promise<{ slug: string }>;
// }

// interface TiptapNode {
//   type?: string;
//   text?: string;
//   content?: TiptapNode[];
//   [key: string]: unknown;
// }

// function extractTextFromTiptap(node: TiptapNode | null | undefined): string {
//   if (!node) return "";
//   if (node.type === "text") return node.text || "";
//   if (node.content && Array.isArray(node.content)) {
//     return node.content.map(extractTextFromTiptap).join("");
//   }
//   return "";
// }

// function formatStatValue(num: number): string {
//   if (num >= 1000) {
//     return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
//   }
//   return num.toString();
// }

// export default async function CommunitySlugPage({ params }: PageProps) {
//   const { slug } = await params;
//   const community = await getCommunityBySlug(slug);

//   if (!community) {
//     notFound();
//   }

//   let renderedHtml = "";
//   if (community.description) {
//     try {
//       const jsonContent =
//         typeof community.description === "string"
//           ? JSON.parse(community.description)
//           : community.description;
//       renderedHtml = generateHTML(jsonContent, [StarterKit]);
//     } catch (e) {
//       console.error("Failed to parse community description JSON:", e);
//       renderedHtml = `<p>${community.description}</p>`;
//     }
//   }

//   const realMembers = community.memberCount || 0;
//   const simulatedOnline = Math.max(1, Math.round(realMembers * 0.005));
//   const simulatedAdmins = Math.max(
//     1,
//     Math.min(16, Math.round(realMembers * 0.00005)),
//   );

//   const stats = [
//     { label: "Members", value: formatStatValue(realMembers) },
//     { label: "Online", value: formatStatValue(simulatedOnline) },
//     { label: "Admins", value: simulatedAdmins.toString() },
//   ];

//   const imageSrc = community.fileKey
//     ? `https://utfs.io/f/${community.fileKey}`
//     : null;

//   let smallDescriptionText = "";
//   if (community.smallDescription) {
//     try {
//       const jsonContent =
//         typeof community.smallDescription === "string"
//           ? JSON.parse(community.smallDescription)
//           : community.smallDescription;
//       smallDescriptionText = extractTextFromTiptap(jsonContent);
//     } catch {
//       smallDescriptionText = community.smallDescription;
//     }
//   }

//   return (
//     <div className="min-h-screen text-neutral-900 font-sans antialiased flex justify-center p-0 md:p-0">
//       {/* Framed Browser Container Mockup matching the attachment */}
//       <div className="w-full bg-background rounded-md shadow-md overflow-hidden flex flex-col relative">
//         <div className="w-full">
//           {/* SECTION 1: FULL WIDTH UPPER HERO TEXT PANEL */}
//           <div className="w-full min-h-90 p-2 pt-8 pb-8  md:p-12 lg:p-16 bg-emerald-900/50 flex items-center">
//             <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 flex flex-col lg:flex-row items-center justify-between gap-12">
//               {/* LEFT SIDE */}
//               <div className="flex-1 text-left">
//                 <Link
//                   href="/communities"
//                   className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 text-xs font-semibold uppercase tracking-wider text-white/80 bg-white/10 hover:bg-white/20 border border-white/20 rounded-md backdrop-blur-xs transition"
//                 >
//                   <svg
//                     xmlns="http://www.w3.org/2000/svg"
//                     fill="none"
//                     viewBox="0 0 24 24"
//                     strokeWidth={2.5}
//                     stroke="currentColor"
//                     className="w-4 h-4"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
//                     />
//                   </svg>
//                   Back
//                 </Link>

//                 <h1 className="max-w-3xl text-4xl md:text-5xl font-black tracking-tight text-white/70 leading-tight">
//                   {community.name || "Lorem ipsum dolor sit amet elit"}
//                 </h1>

//                 <p className="max-w-3xl text-white/60 text-sm md:text-base leading-relaxed mt-2">
//                   {smallDescriptionText ||
//                     "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam ex tellus, imperdiet ac mi sed, condimentum lacinia nisi."}
//                 </p>
//               </div>

//               {/* RIGHT SIDE - VIDEO OR COMMUNITY IMAGE */}
//               <div className="flex-1 flex justify-center lg:justify-end">
//                 <div className="w-full max-w-xl aspect-video rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900 shadow-xl">
//                   {community.videoKey ? (
//                     <YouTubeStyleVideoPlayer
//                       src={`https://utfs.io/f/${community.videoKey}`}
//                     />
//                   ) : imageSrc ? (
//                     <div className="relative w-full h-full">
//                       <Image
//                         src={imageSrc}
//                         alt={community.name}
//                         fill
//                         priority
//                         className="object-contain"
//                       />
//                     </div>
//                   ) : (
//                     <div className="w-full h-full flex items-center justify-center text-neutral-500">
//                       No media available
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* SECTION 3: BOTTOM PLATFORM OVERVIEW MODULES */}
//           <section className="max-w-7xl mx-auto bg-background p-8 pt-10 md:px-40 lg:px-12 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start z-10">
//             <div className="lg:col-span-8 space-y-4">
//               <h3 className="text-xl font-bold text-white">About Community</h3>
//               {renderedHtml ? (
//                 <div
//                   className="
//       prose prose-neutral max-w-none text-muted-foreground

//       prose-headings:text-neutral-900
//       prose-headings:font-bold
//       prose-headings:mt-6
//       prose-headings:mb-3

//       prose-p:my-4
//       prose-p:leading-7

//       prose-ul:list-disc
//       prose-ul:pl-5
//       prose-li:my-1

//       prose-ol:list-decimal
//       prose-ol:pl-5

//       prose-blockquote:border-l-4
//       prose-blockquote:pl-4
//     "
//                   dangerouslySetInnerHTML={{ __html: renderedHtml }}
//                 />
//               ) : (
//                 <p className="text-neutral-500 text-sm leading-relaxed">
//                   No custom overview data provided.
//                 </p>
//               )}
//             </div>

//             {/* Quick Stats Actions Panel */}
//             <div className="lg:col-span-4 h-fit bg-emerald-900/50 rounded-md shadow-sm flex flex-col relative z-10  overflow-hidden">
//               <div>
//                 {/* FULL WIDTH IMAGE WRAPPER */}
//                 <div className="w-full h-54 md:h-47 flex items-center justify-center relative overflow-hidden group">
//                   {imageSrc ? (
//                     <Image
//                       src={imageSrc}
//                       alt={community.name}
//                       fill
//                       className="object-contain"
//                       priority
//                     />
//                   ) : (
//                     <div className="flex flex-col items-center text-neutral-400">
//                       <svg
//                         className="w-16 h-16 stroke-[1.2]"
//                         fill="none"
//                         stroke="currentColor"
//                         viewBox="0 0 24 24"
//                       >
//                         <path
//                           strokeLinecap="round"
//                           strokeLinejoin="round"
//                           d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008H6V6z"
//                         />
//                       </svg>
//                     </div>
//                   )}
//                 </div>

//                 <div className="p-3">
//                   <h2 className="text-2xl font-bold tracking-tight text-white/80 mb-0.5">
//                     {community.name}
//                   </h2>
//                   <Link
//                     href="#"
//                     className="text-neutral-400 text-[13px] hover:underline block mb-4"
//                   >
//                     <span className="text-muted-foreground text-xs">
//                       justdy.com/{community.slug}
//                     </span>
//                   </Link>

//                   <div className="space-y-1 mb-6">
//                     <p className="text-[14px] text-white/60 leading-relaxed line-clamp-4">
//                       {smallDescriptionText ||
//                         "No short description available."}
//                     </p>
//                   </div>
//                 </div>

//                 <div className="p-3 pt-0">
//                   <div className="grid grid-cols-3 text-center border-t border-b border-muted-foreground pt-4 pb-5 mb-5 divide-x divide-muted-foreground">
//                     {stats.map((stat) => (
//                       <div
//                         key={stat.label}
//                         className="first:pl-0 px-2 last:pr-0"
//                       >
//                         <div className="text-[17px] font-bold text-muted-foreground leading-tight">
//                           {stat.value}
//                         </div>
//                         <div className="text-[12px] font-medium text-muted-foreground mt-0.5">
//                           {stat.label}
//                         </div>
//                       </div>
//                     ))}
//                   </div>

//                   <CommunityJoinClient
//                     slug={community.slug}
//                     price={community.price}
//                     name={community.name}
//                     description="Learn to get paid for AI solutions, regardless of your background."
//                     stats={stats}
//                   />
//                 </div>
//               </div>
//             </div>
//           </section>
//         </div>
//       </div>
//     </div>
//   );
// }

// import React from "react";
// import { notFound } from "next/navigation";
// import Link from "next/link";
// import { getCommunityBySlug } from "@/app/actions/admin-communities";
// import Image from "next/image";
// import CommunityJoinClient from "@/app/_components/JoinCommunityModal";

// // Import Tiptap server-side renderers
// import { generateHTML } from "@tiptap/html";
// import StarterKit from "@tiptap/starter-kit";
// import YouTubeStyleVideoPlayer from "@/app/_components/CommunityVideoPlayer";

// interface PageProps {
//   params: Promise<{ slug: string }>;
// }

// interface TiptapNode {
//   type?: string;
//   text?: string;
//   content?: TiptapNode[];
//   [key: string]: unknown; // Accounts for other optional properties like 'attrs', 'marks', etc.
// }

// function extractTextFromTiptap(node: TiptapNode | null | undefined): string {
//   if (!node) return "";

//   if (node.type === "text") {
//     return node.text || "";
//   }

//   if (node.content && Array.isArray(node.content)) {
//     return node.content.map(extractTextFromTiptap).join("");
//   }

//   return "";
// }

// function formatStatValue(num: number): string {
//   if (num >= 1000) {
//     return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
//   }
//   return num.toString();
// }

// export default async function CommunitySlugPage({ params }: PageProps) {
//   const { slug } = await params;
//   const community = await getCommunityBySlug(slug);

//   if (!community) {
//     notFound();
//   }

//   // Convert the Tiptap JSON string from the screenshot into real HTML markup
//   let renderedHtml = "";
//   if (community.description) {
//     try {
//       // Check if it's stored as a stringified JSON object
//       const jsonContent =
//         typeof community.description === "string"
//           ? JSON.parse(community.description)
//           : community.description;

//       // Compile the Tiptap nodes into standard HTML strings
//       renderedHtml = generateHTML(jsonContent, [StarterKit]);
//     } catch (e) {
//       console.error("Failed to parse community description JSON:", e);
//       // Fallback to raw text if it wasn't valid JSON
//       renderedHtml = `<p>${community.description}</p>`;
//     }
//   }

//   const realMembers = community.memberCount || 0;
//   const simulatedOnline = Math.max(1, Math.round(realMembers * 0.005));
//   const simulatedAdmins = Math.max(
//     1,
//     Math.min(16, Math.round(realMembers * 0.00005)),
//   );

//   const stats = [
//     { label: "Members", value: formatStatValue(realMembers) },
//     { label: "Online", value: formatStatValue(simulatedOnline) },
//     { label: "Admins", value: simulatedAdmins.toString() },
//   ];

//   const imageSrc = community.fileKey
//     ? `https://utfs.io/f/${community.fileKey}`
//     : null;

//   let smallDescriptionText = "";

//   if (community.smallDescription) {
//     try {
//       const jsonContent =
//         typeof community.smallDescription === "string"
//           ? JSON.parse(community.smallDescription)
//           : community.smallDescription;

//       smallDescriptionText = extractTextFromTiptap(jsonContent);
//     } catch {
//       smallDescriptionText = community.smallDescription;
//     }
//   }

//   return (
//     <div className="bg-background min-h-screen text-neutral-900 font-sans antialiased">
//       <main className="max-w-7xl mx-auto px-10 md:px-10 py-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
//         {/* Left Column: Framed Media & Info Panel */}
//         <div className="md:col-span-8">
//           <div className="bg-emerald-900/10 rounded-md p-6 shadow-sm flex flex-col space-y-6">
//             <div>
//               <div className="flex items-center gap-3 mb-4">
//                 <Link
//                   href="/communities"
//                   className="flex items-center justify-center p-2 rounded-md border bg-white/40 text-white hover:text-neutral-900 hover:bg-neutral-50 transition-colors shadow-xs"
//                   aria-label="Go back"
//                 >
//                   <svg
//                     xmlns="http://www.w3.org/2000/svg"
//                     fill="none"
//                     viewBox="0 0 24 24"
//                     strokeWidth={2.5}
//                     stroke="currentColor"
//                     className="size-5"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
//                     />
//                   </svg>
//                 </Link>
//                 <h1 className="text-2xl font-bold text-muted-foreground leading-none">
//                   {community.name}
//                 </h1>
//               </div>

//               {/* Video Player Block */}
//               <div className="aspect-video bg-yellow-400 rounded-lg relative overflow-hidden flex items-center justify-center group border border-neutral-800">
//                 {community.videoKey ? (
//                   <div className="relative w-full h-full">
//                     <YouTubeStyleVideoPlayer
//                       src={`https://utfs.io/f/${community.videoKey}`}
//                       poster={
//                         community.fileKey
//                           ? `https://utfs.io/f/${community.fileKey}`
//                           : "/path-to-fallback-thumbnail.jpg"
//                       }
//                     />

//                     {/* PLAY BUTTON OVERLAY */}
//                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:scale-105 transition">
//                       <div className="bg-blue-500 backdrop-blur-sm rounded-full p-5 shadow-lg">
//                         <svg
//                           xmlns="http://www.w3.org/2000/svg"
//                           viewBox="0 0 24 24"
//                           fill="white"
//                           className="w-10 h-10 ml-1"
//                         >
//                           <path d="M8 5v14l11-7z" />
//                         </svg>
//                       </div>
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="flex items-center justify-center h-full text-neutral-900">
//                     No video available
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Meta & Description blocks */}
//             <div className="space-y-4 pt-4">
//               <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[15px] font-medium text-muted-foreground">
//                 <div className="flex items-center gap-2">
//                   <svg
//                     xmlns="http://www.w3.org/2000/svg"
//                     fill="none"
//                     viewBox="0 0 24 24"
//                     strokeWidth={2}
//                     stroke="currentColor"
//                     className="size-5 text-neutral-500"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       d="M12.75 3.03v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.01.216 1.49l-.51.766a2.25 2.25 0 0 1-1.161.886l-.143.048a1.107 1.107 0 0 0-.57 1.664c.369.553.169 1.307-.427 1.605L9 13.125l.423 1.059a.956.956 0 0 1-.142 1.02l-.36.48a1.218 1.218 0 0 0 .142 1.594l.8.8a1.16 1.16 0 0 0 1.2.22l.5-.2a.553.553 0 0 1 .58.048l.585.438c.354.265.814.301 1.2.093l.357-.191a2.25 2.25 0 0 1 2.503.32l.332.332c.126.126.28.223.45.285A9 9 0 1 0 12.75 3.03ZM15 6.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm-4.5 1.875a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"
//                     />
//                   </svg>
//                   <span>Public</span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <svg
//                     xmlns="http://www.w3.org/2000/svg"
//                     fill="none"
//                     viewBox="0 0 24 24"
//                     strokeWidth={2}
//                     stroke="currentColor"
//                     className="size-5 text-muted-foreground"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-2.113-7.969c-.113-.013-.214-.016-.3-.014m-10.963 11.23a9.39 9.39 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-2.113-7.969c-.113-.013-.214-.016-.3-.014M12 18.75V16.5m0 0V14m0 2.5H9.75m2.25 0h2.25M12 11.25a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
//                     />
//                   </svg>
//                   <span>{formatStatValue(realMembers)} members</span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <svg
//                     xmlns="http://www.w3.org/2000/svg"
//                     fill="none"
//                     viewBox="0 0 24 24"
//                     strokeWidth={2}
//                     stroke="currentColor"
//                     className="size-5 text-neutral-500"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a2.25 2.25 0 0 0 3.182 0l4.318-4.318a2.25 2.25 0 0 0 0-3.182L11.16 3.659A2.25 2.25 0 0 0 9.568 3Z"
//                     />
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       d="M6 6h.008v.008H6V6Z"
//                     />
//                   </svg>
//                   <span>
//                     {community.price === 0
//                       ? "Free"
//                       : `$${community.price} /month`}
//                   </span>
//                 </div>
//                 <div className="flex items-center gap-1.5 sm:ml-auto text-neutral-600">
//                   <div className="w-5 h-5 rounded-md bg-sky-600 overflow-hidden text-muted-foreground flex items-center justify-center text-[10px]">
//                     N
//                   </div>
//                   <span>
//                     By{" "}
//                     <strong className="text-muted-foreground font-semibold">
//                       Kangah
//                     </strong>
//                   </span>
//                 </div>
//               </div>

//               {/* CLEAN RENDER OF HEADINGS, PARAGRAPHS & BULLETS */}
//               <div className="pt-2 text-white">
//                 {renderedHtml ? (
//                   <div
//                     className="prose prose-neutral max-w-none text-neutral-200
//                                prose-headings:text-white prose-headings:font-bold
//                                prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-2
//                                prose-strong:text-white
//                                prose-ul:list-disc prose-ul:pl-5 prose-ol:list-decimal prose-ol:pl-5
//                                prose-li:text-neutral-200 prose-p:leading-relaxed"
//                     dangerouslySetInnerHTML={{ __html: renderedHtml }}
//                   />
//                 ) : (
//                   <p className="text-white leading-relaxed text-[15px]">
//                     No description available.
//                   </p>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Right Column: Profile Panel */}
//         <div className="md:col-span-4 sticky top-8">
//           <div className="bg-emerald-900/10 rounded-md p-0 shadow-sm overflow-hidden flex flex-col">
//             <div className="h-50 bg-neutral-900 rounded-t-md overflow-hidden relative border-b border-neutral-800 shrink-0">
//               {imageSrc ? (
//                 <Image
//                   src={imageSrc}
//                   alt={community.name}
//                   fill
//                   className="w-full h-full object-cover"
//                 />
//               ) : (
//                 <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-radial from-neutral-800 to-neutral-950 text-neutral-400 relative">
//                   <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-size-[14px_24px]" />
//                   <svg
//                     xmlns="http://www.w3.org/2000/svg"
//                     fill="none"
//                     viewBox="0 0 24 24"
//                     strokeWidth={1.5}
//                     stroke="currentColor"
//                     className="size-10 mb-3 text-neutral-600 relative z-10"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 017.5 0z"
//                     />
//                   </svg>
//                   <div className="text-xs font-semibold tracking-wider text-white uppercase text-center max-w-37.5 truncate relative z-10">
//                     {community.name || "No Image Available"}
//                   </div>
//                 </div>
//               )}
//             </div>

//             <div className="p-3">
//               <h2 className="text-2xl font-bold tracking-tight text-white/80 mb-0.5">
//                 {community.name}
//               </h2>
//               <Link
//                 href="#"
//                 className="text-neutral-400 text-[13px] hover:underline block mb-4"
//               >
//                 <span className="text-muted-foreground text-xs">
//                   justdy.com/{community.slug}
//                 </span>
//               </Link>

//               <div className="space-y-1 mb-6">
//                 <p className="text-[14px] text-white/60 leading-relaxed line-clamp-4">
//                   {smallDescriptionText || "No short description available."}
//                 </p>
//               </div>
//             </div>

//             {/* Footer / CTA Actions Area */}
//             <div className="p-3 pt-0">
//               <div className="grid grid-cols-3 text-center border-t border-b border-muted-foreground pt-4 pb-5 mb-5 divide-x divide-muted-foreground">
//                 {stats.map((stat) => (
//                   <div key={stat.label} className="first:pl-0 px-2 last:pr-0">
//                     <div className="text-[17px] font-bold text-muted-foreground leading-tight">
//                       {stat.value}
//                     </div>
//                     <div className="text-[12px] font-medium text-muted-foreground mt-0.5">
//                       {stat.label}
//                     </div>
//                   </div>
//                 ))}
//               </div>

//               <CommunityJoinClient
//                 slug={community.slug}
//                 price={community.price}
//                 name={community.name}
//                 description="Learn to get paid for AI solutions, regardless of your background."
//                 stats={stats}
//               />
//             </div>
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// }
