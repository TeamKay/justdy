// "use client";

// import React, { useState, useEffect } from "react";
// import {
//   Users,
//   MessageSquare,
//   Trophy,
//   ThumbsUp,
//   Plus,
//   CheckCircle,
//   Clock,
//   Send,
// } from "lucide-react";
// import {
//   createPostAction,
//   likePostAction,
//   toggleJoinCommunity,
//   addCommentAction,
// } from "../actions/student-community";

// type Comment = {
//   id: string;
//   content: string;
//   authorName: string;
//   createdAt: string;
// };

// type Community = {
//   id: string;
//   name: string;
//   description: string;
//   memberCount: number;
//   category: string;
//   isJoined: boolean;
// };

// type Post = {
//   id: string;
//   title: string;
//   content: string;
//   authorName: string;
//   communityId: string;
//   communityName: string;
//   createdAt: string;
//   likes: number;
//   hasLiked: boolean;
//   resourcesCount: number;
//   comments: Comment[];
// };

// type GamificationBadge = {
//   id: string;
//   name: string;
//   description: string;
//   icon: string;
//   color: string;
// };

// type GamificationProfile = {
//   points: number;
//   streak: number;
//   rank: number;
//   tierName: string;
//   badges: GamificationBadge[];
// };

// type LeaderboardUser = {
//   position: number;
//   name: string;
//   points: number;
//   badgeIcon: string;
//   isUser?: boolean;
// };

// type Props = {
//   initialCommunities: Community[];
//   initialPosts: Post[];
//   gamification: GamificationProfile;
//   leaderboard: LeaderboardUser[];
//   userName: string;
// };

// export default function StudentCommunityClient({
//   initialCommunities,
//   initialPosts,
//   gamification,
//   leaderboard,
//   userName,
// }: Props) {
//   const [communities, setCommunities] =
//     useState<Community[]>(initialCommunities);
//   const [posts, setPosts] = useState<Post[]>(initialPosts);
//   const [activeTab, setActiveTab] = useState<"feed" | "explore">("feed");
//   const [selectedCategory, setSelectedCategory] = useState<string>("All");

//   // Input states
//   const [newPostTitle, setNewPostTitle] = useState("");
//   const [newPostContent, setNewPostContent] = useState("");
//   const [targetCommunityId, setTargetCommunityId] = useState("");
//   const [commentInputs, setCommentInputs] = useState<{
//     [postId: string]: string;
//   }>({});
//   const [expandedComments, setExpandedComments] = useState<{
//     [postId: string]: boolean;
//   }>({});

//   useEffect(() => {
//     setCommunities(initialCommunities);
//   }, [initialCommunities]);

//   useEffect(() => {
//     setPosts(initialPosts);
//   }, [initialPosts]);

//   // Handle initialization and automatic focus fallback for posting target
//   useEffect(() => {
//     if (communities.length > 0 && !targetCommunityId) {
//       const joined = communities.find((c) => c.isJoined);
//       setTargetCommunityId(joined ? joined.id : communities[0].id);
//     }
//   }, [communities, targetCommunityId]);

//   const handleToggleJoin = async (id: string) => {
//     // Optimistic Update: Instantly increment/decrement count and toggle join state
//     setCommunities((prev) =>
//       prev.map((comm) =>
//         comm.id === id
//           ? {
//               ...comm,
//               isJoined: !comm.isJoined,
//               memberCount: comm.isJoined
//                 ? comm.memberCount - 1
//                 : comm.memberCount + 1,
//             }
//           : comm,
//       ),
//     );

//     try {
//       // Fires server action mutation directly into Prisma Database
//       await toggleJoinCommunity(id);
//     } catch (err) {
//       console.error("Failed to update membership status:", err);
//       setCommunities(initialCommunities); // Safe fallback recovery state
//     }
//   };

//   const handleLikePost = async (id: string) => {
//     setPosts((prev) =>
//       prev.map((p) =>
//         p.id === id
//           ? {
//               ...p,
//               hasLiked: !p.hasLiked,
//               likes: p.hasLiked ? p.likes - 1 : p.likes + 1,
//             }
//           : p,
//       ),
//     );
//     try {
//       await likePostAction(id);
//     } catch {
//       setPosts(initialPosts);
//     }
//   };

//   const handleCreatePost = async (e: React.FormEvent) => {
//     e.preventDefault();
//     const activeComm = communities.find((c) => c.id === targetCommunityId);
//     if (!newPostTitle.trim() || !newPostContent.trim() || !activeComm) return;

//     const optimisticPost: Post = {
//       id: `temp-${Date.now()}`,
//       title: newPostTitle,
//       content: newPostContent,
//       authorName: userName,
//       communityId: activeComm.id,
//       communityName: activeComm.name,
//       createdAt: new Date().toISOString(),
//       likes: 0,
//       hasLiked: false,
//       resourcesCount: 0,
//       comments: [],
//     };

//     setPosts([optimisticPost, ...posts]);
//     setNewPostTitle("");
//     setNewPostContent("");

//     try {
//       await createPostAction({
//         title: optimisticPost.title,
//         content: optimisticPost.content,
//         communityId: optimisticPost.communityId,
//         resourcesCount: optimisticPost.resourcesCount,
//       });
//     } catch {
//       setPosts(initialPosts);
//     }
//   };

//   const handleAddComment = async (postId: string, e: React.FormEvent) => {
//     e.preventDefault();
//     const text = commentInputs[postId] || "";
//     if (!text.trim()) return;

//     const targetPost = posts.find((p) => p.id === postId);
//     if (!targetPost) return;

//     const optimisticComment: Comment = {
//       id: `comment-temp-${Date.now()}`,
//       content: text,
//       authorName: userName,
//       createdAt: new Date().toISOString(),
//     };

//     setPosts((prev) =>
//       prev.map((p) =>
//         p.id === postId
//           ? { ...p, comments: [...p.comments, optimisticComment] }
//           : p,
//       ),
//     );
//     setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
//     setExpandedComments((prev) => ({ ...prev, [postId]: true }));

//     try {
//       await addCommentAction(postId, text);
//     } catch {
//       setPosts(initialPosts);
//     }
//   };

//   const dynamicCategories = [
//     "All",
//     ...Array.from(new Set(communities.map((c) => c.category))),
//   ];

//   return (
//     <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased selection:bg-emerald-500/20">
//       {/* HEADER SECTION */}
//       <div className="border-b border-zinc-900 bg-zinc-950/60 backdrop-blur-xl sticky top-0 z-40">
//         <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
//           <div className="flex items-center gap-6">
//             <h1 className="text-lg font-bold text-white flex items-center gap-2">
//               <Users className="w-5 h-5 text-emerald-400" /> Campus Nexus
//             </h1>
//             <nav className="flex bg-zinc-900/50 p-1 rounded-lg border border-zinc-800/60">
//               <button
//                 onClick={() => setActiveTab("feed")}
//                 className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${activeTab === "feed" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"}`}
//               >
//                 Discussions Feed
//               </button>
//               <button
//                 onClick={() => setActiveTab("explore")}
//                 className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${activeTab === "explore" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"}`}
//               >
//                 Explore Hub
//               </button>
//             </nav>
//           </div>

//           <div className="flex items-center gap-1.5">
//             {dynamicCategories.map((cat) => (
//               <button
//                 key={cat}
//                 onClick={() => setSelectedCategory(cat)}
//                 className={`px-2.5 py-1 text-[11px] font-medium rounded-md border transition ${selectedCategory === cat ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-transparent border-transparent text-zinc-500 hover:text-zinc-300"}`}
//               >
//                 {cat}
//               </button>
//             ))}
//           </div>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-6 py-8 grid lg:grid-cols-12 gap-6">
//         {/* SIDEBAR */}
//         <div className="lg:col-span-3 space-y-6">
//           <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 space-y-4 shadow-xl">
//             <div className="flex justify-between text-xs">
//               <span className="text-zinc-500 uppercase font-bold">
//                 Profile Rank
//               </span>
//               <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-bold">
//                 #{gamification.rank} Global
//               </span>
//             </div>
//             <div className="text-3xl font-extrabold text-white">
//               {gamification.points}{" "}
//               <span className="text-xs font-mono text-zinc-500">EXP</span>
//             </div>
//             <div className="space-y-1">
//               <div className="flex justify-between text-[11px] text-zinc-400">
//                 <span>Tier: {gamification.tierName}</span>
//               </div>
//               <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
//                 <div
//                   className="h-full bg-linear-to-r from-emerald-500 to-teal-400"
//                   style={{ width: "72%" }}
//                 />
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* FEED / EXPLORE CONTAINER COMPONENT */}
//         <div className="lg:col-span-6 space-y-6">
//           {activeTab === "feed" ? (
//             <>
//               {/* POST WRITER BOX */}
//               <div className="rounded-xl border border-zinc-900 bg-zinc-950/20 p-5 shadow-xs">
//                 <form onSubmit={handleCreatePost} className="space-y-4">
//                   <div className="flex gap-3">
//                     <input
//                       type="text"
//                       placeholder="Title your post topic..."
//                       value={newPostTitle}
//                       onChange={(e) => setNewPostTitle(e.target.value)}
//                       className="flex-1 bg-zinc-900/60 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:outline-hidden focus:border-emerald-500/40"
//                       required
//                     />
//                     <select
//                       value={targetCommunityId}
//                       onChange={(e) => setTargetCommunityId(e.target.value)}
//                       className="bg-zinc-900/60 border border-zinc-800 rounded-lg px-2 text-xs text-zinc-300 focus:outline-hidden"
//                     >
//                       <optgroup
//                         label="Your Communities"
//                         className="bg-zinc-950 text-zinc-400"
//                       >
//                         {communities
//                           .filter((c) => c.isJoined)
//                           .map((c) => (
//                             <option
//                               key={c.id}
//                               value={c.id}
//                               className="text-white"
//                             >
//                               {c.name}
//                             </option>
//                           ))}
//                       </optgroup>
//                       <optgroup
//                         label="Other Communities"
//                         className="bg-zinc-950 text-zinc-500"
//                       >
//                         {communities
//                           .filter((c) => !c.isJoined)
//                           .map((c) => (
//                             <option
//                               key={c.id}
//                               value={c.id}
//                               className="text-zinc-400"
//                             >
//                               🌍 {c.name}
//                             </option>
//                           ))}
//                       </optgroup>
//                     </select>
//                   </div>
//                   <textarea
//                     placeholder="Share concept code or ask a core tracking module problem..."
//                     value={newPostContent}
//                     onChange={(e) => setNewPostContent(e.target.value)}
//                     rows={3}
//                     className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg p-3.5 text-sm text-white resize-none placeholder-zinc-500 focus:outline-hidden focus:border-emerald-500/40"
//                     required
//                   />
//                   <div className="flex justify-end pt-2 border-t border-zinc-900/60">
//                     <button
//                       type="submit"
//                       className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-lg flex items-center gap-1 transition"
//                     >
//                       <Plus className="w-3.5 h-3.5" /> Publish Update
//                     </button>
//                   </div>
//                 </form>
//               </div>

//               {/* DISCUSSION POST LISTING ROW */}
//               <div className="space-y-4">
//                 {posts
//                   .filter(
//                     (p) =>
//                       selectedCategory === "All" ||
//                       p.communityName === selectedCategory,
//                   )
//                   .map((post) => (
//                     <div
//                       key={post.id}
//                       className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 space-y-4"
//                     >
//                       <div className="flex justify-between items-center">
//                         <div className="flex items-center gap-2">
//                           <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-zinc-400 font-bold">
//                             {post.authorName ? post.authorName[0] : "?"}
//                           </div>
//                           <div>
//                             <span className="text-xs font-semibold text-zinc-200 block">
//                               {post.authorName}
//                             </span>
//                             <span className="text-[10px] text-zinc-500">
//                               Node Hub:{" "}
//                               <span className="text-zinc-400 font-bold">
//                                 {post.communityName}
//                               </span>
//                             </span>
//                           </div>
//                         </div>
//                         <span className="text-[10px] text-zinc-500 flex items-center gap-1">
//                           <Clock className="w-3 h-3" />
//                           {new Date(post.createdAt).toLocaleTimeString([], {
//                             hour: "2-digit",
//                             minute: "2-digit",
//                           })}
//                         </span>
//                       </div>

//                       <div>
//                         <h2 className="text-sm font-bold text-zinc-100 mb-1">
//                           {post.title}
//                         </h2>
//                         <p className="text-xs text-zinc-400 leading-relaxed">
//                           {post.content}
//                         </p>
//                       </div>

//                       <div className="flex items-center gap-4 pt-2 border-t border-zinc-900/60 text-[11px] font-semibold text-zinc-500">
//                         <button
//                           onClick={() => handleLikePost(post.id)}
//                           className={`flex items-center gap-1.5 transition ${post.hasLiked ? "text-emerald-400 font-bold" : "hover:text-zinc-300"}`}
//                         >
//                           <ThumbsUp className="w-3.5 h-3.5" />{" "}
//                           <span>{post.likes} Likes</span>
//                         </button>
//                         <button
//                           onClick={() =>
//                             setExpandedComments((prev) => ({
//                               ...prev,
//                               [post.id]: !prev[post.id],
//                             }))
//                           }
//                           className="flex items-center gap-1.5 hover:text-zinc-300 transition"
//                         >
//                           <MessageSquare className="w-3.5 h-3.5" />{" "}
//                           <span>{post.comments.length} Comments</span>
//                         </button>
//                       </div>

//                       {expandedComments[post.id] && (
//                         <div className="pt-3 border-t border-zinc-900/80 space-y-3 bg-zinc-900/10 p-3 rounded-lg">
//                           <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
//                             {post.comments.map((comment) => (
//                               <div
//                                 key={comment.id}
//                                 className="text-xs bg-zinc-950/40 border border-zinc-900/60 p-2.5 rounded-md"
//                               >
//                                 <div className="flex justify-between mb-1 font-mono text-[10px]">
//                                   <span className="font-bold text-emerald-400/90">
//                                     {comment.authorName}
//                                   </span>
//                                   <span className="text-zinc-600">
//                                     {new Date(
//                                       comment.createdAt,
//                                     ).toLocaleTimeString([], {
//                                       hour: "2-digit",
//                                       minute: "2-digit",
//                                     })}
//                                   </span>
//                                 </div>
//                                 <p className="text-zinc-300 leading-normal font-sans">
//                                   {comment.content}
//                                 </p>
//                               </div>
//                             ))}
//                             {post.comments.length === 0 && (
//                               <p className="text-[11px] text-zinc-600 italic">
//                                 No feedback entries pinned to node stack.
//                               </p>
//                             )}
//                           </div>

//                           <form
//                             onSubmit={(e) => handleAddComment(post.id, e)}
//                             className="flex gap-2 items-center pt-2"
//                           >
//                             <input
//                               type="text"
//                               placeholder="Type a response..."
//                               value={commentInputs[post.id] || ""}
//                               onChange={(e) =>
//                                 setCommentInputs({
//                                   ...commentInputs,
//                                   [post.id]: e.target.value,
//                                 })
//                               }
//                               className="flex-1 bg-zinc-950 text-xs border border-zinc-800 rounded-md px-3 py-1.5 text-white placeholder-zinc-600 focus:outline-hidden focus:border-zinc-700"
//                             />
//                             <button
//                               type="submit"
//                               className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 rounded-md transition-colors"
//                             >
//                               <Send className="w-3.5 h-3.5" />
//                             </button>
//                           </form>
//                         </div>
//                       )}
//                     </div>
//                   ))}
//               </div>
//             </>
//           ) : (
//             /* EXPLORE TAB GROUP TILES */
//             <div className="grid sm:grid-cols-2 gap-4">
//               {communities
//                 .filter(
//                   (c) =>
//                     selectedCategory === "All" ||
//                     c.category === selectedCategory,
//                 )
//                 .map((comm) => (
//                   <div
//                     key={comm.id}
//                     className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-4 flex flex-col justify-between h-40"
//                   >
//                     <div className="space-y-1.5">
//                       <div className="flex items-start justify-between gap-2">
//                         <h3 className="text-xs font-bold text-zinc-100">
//                           {comm.name}
//                         </h3>
//                         <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
//                           {comm.category}
//                         </span>
//                       </div>
//                       <p className="text-[11px] text-zinc-500 line-clamp-3 leading-normal">
//                         {comm.description}
//                       </p>
//                     </div>
//                     <div className="flex items-center justify-between pt-2 border-t border-zinc-900/60">
//                       <span className="text-[10px] font-mono text-zinc-500">
//                         {comm.memberCount} members
//                       </span>
//                       <button
//                         onClick={() => handleToggleJoin(comm.id)}
//                         className={`px-2.5 py-1 text-[11px] font-bold rounded-md border transition duration-150 ${
//                           comm.isJoined
//                             ? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800/60"
//                             : "bg-emerald-500 text-black hover:bg-emerald-400 border-transparent"
//                         }`}
//                       >
//                         {comm.isJoined ? (
//                           <span className="flex items-center gap-1">
//                             <CheckCircle className="w-3 h-3 text-emerald-400" />{" "}
//                             Member
//                           </span>
//                         ) : (
//                           "Join"
//                         )}
//                       </button>
//                     </div>
//                   </div>
//                 ))}
//             </div>
//           )}
//         </div>

//         {/* LEADERBOARD PANEL */}
//         <div className="lg:col-span-3">
//           <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 space-y-4 sticky top-24">
//             <h3 className="text-xs font-bold text-zinc-400 uppercase flex items-center gap-2 pb-1 border-b border-zinc-900">
//               <Trophy className="w-4 h-4 text-amber-400" /> Leaderboard
//             </h3>
//             <div className="space-y-3">
//               {leaderboard.map((user) => (
//                 <div
//                   key={user.position}
//                   className={`flex items-center justify-between p-2 rounded-lg ${user.isUser ? "bg-emerald-500/5 border border-emerald-500/20" : ""}`}
//                 >
//                   <div className="flex items-center gap-2.5 text-xs">
//                     <span className="font-mono font-bold text-zinc-500 w-4">
//                       {user.position}
//                     </span>
//                     <div>
//                       <p
//                         className={
//                           user.isUser
//                             ? "text-emerald-400 font-bold"
//                             : "text-zinc-200"
//                         }
//                       >
//                         {user.name}
//                       </p>
//                       <p className="text-[10px] text-zinc-600 font-mono">
//                         {user.points} EXP
//                       </p>
//                     </div>
//                   </div>
//                   <span>{user.badgeIcon}</span>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
