// "use client";

// import { useSession } from "@/lib/auth-client";
// import { SidebarTrigger } from "../ui/sidebar";
// import { Separator } from "../ui/separator";
// import { ThemeToggle } from "../themeToggle";

// export function SiteHeader() {
//   const { data: session } = useSession();
//   const name = session?.user?.name ?? "User";

//   return (
//     <header className="sticky top-0 z-50 flex h-(--header-height) w-full items-center border-b bg-background/95 backdrop-blur transition-all duration-300 ease-in-out">
//       <div className="flex w-full items-center justify-between px-4 md:px-6 lg:px-8">
//         <div className="flex items-center gap-3">
//           <SidebarTrigger className="-ml-1 h-9 w-9 transition-colors hover:bg-accent" />

//           <Separator orientation="vertical" className="h-4 bg-border" />

//           {/* Professional Welcome Message */}
//           <div className="flex flex-col">
//             <h1 className="text-sm font-semibold tracking-tight md:text-base">
//               Welcome back,{" "}
//               <span className="text-muted-foreground">{name}</span>
//             </h1>
//           </div>
//         </div>

//         <div className="flex items-center gap-2 sm:gap-4">
//           {/* Desktop Session Info */}
//           <div className="hidden flex-col items-end text-right sm:flex">
//             <span className="text-[10px] font-bold uppercase text-muted-foreground/60">
//               Status
//             </span>
//             <div className="flex items-center gap-1.5">
//               <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
//               <span className="text-xs font-medium">Online</span>
//             </div>
//           </div>

//           <ThemeToggle />
//         </div>
//       </div>
//     </header>
//   );
// }

// "use client"

// import { useSession } from "@/lib/auth-client"
// import { SidebarTrigger } from "../ui/sidebar"
// import { Separator } from "../ui/separator"
// import { ThemeToggle } from "../themeToggle"

// export function SiteHeader() {
//   const { data: session } = useSession()
//   const name = session?.user?.name ?? "User"

//   return (
//     <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
//       {/* Container changes:
//           - px-4: Mobile padding
//           - md:px-6: Tablet padding
//           - lg:px-8: Desktop padding
//           - max-w-[1400px]: Prevents the header items from drifting too far apart on huge screens
//       */}
//       <div className="mx-auto flex h-(--header-height) items-center gap-2 px-4 md:px-6 lg:px-8">

//         <div className="flex items-center gap-2">
//           <SidebarTrigger className="-ml-1" />
//           <Separator
//             orientation="vertical"
//             className="mx-2 data-[orientation=vertical]:h-4"
//           />
//           <h1 className="text-sm font-semibold md:text-base tracking-tight">
//             Welcome, <span className="text-muted-foreground">{name}</span>
//           </h1>
//         </div>

//         <div className="ml-auto flex items-center gap-4">
//           {/* You can add breadcrumbs or a search bar here later */}
//           <ThemeToggle />
//         </div>

//       </div>
//     </header>
//   )
// }

// "use client"

// import { useSession } from "@/lib/auth-client"
// import { SidebarTrigger } from "../ui/sidebar"
// import { Separator } from "../ui/separator"
// import { ThemeToggle } from "../themeToggle"

// export function SiteHeader() {
//   const { data: session } = useSession()
//   const name = session?.user?.name ?? "User"

//   return (
//     <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
//       <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
//         <SidebarTrigger className="-ml-1" />
//         <Separator
//           orientation="vertical"
//           className="mx-2 data-[orientation=vertical]:h-4"/>
//         <h1 className="text-base font-medium">Welcome, {name}</h1>
//         <div className="ml-auto flex items-center gap-2">
//           <ThemeToggle/>
//         </div>
//       </div>
//     </header>
//   )
// }
