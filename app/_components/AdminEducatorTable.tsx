"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import {
  MoreHorizontal,
  Ban,
  Eye,
  Loader2,
  Medal,
  FileText,
  X,
  Check,
  Mail,
  Calendar,
  Briefcase,
  User,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { BarLoader } from "react-spinners";

import { Badge } from "@/app/_components/ui/badge";
import { Button } from "@/app/_components/ui/button";
import { Separator } from "@/app/_components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/_components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "@/app/_components/ui/dialog";

import {
  updateEducatorStatus,
  updateEducatorActiveStatus,
} from "@/app/actions/admin";

export interface Educator {
  id: string;
  name: string;
  email: string;
  specialty: string;
  status: "Pending" | "Verified" | "Rejected" | "Suspend";
  experience: number | string;
  description?: string;
  credentialUrl?: string;
  createdAt: string | Date;
}

export function AdminEducatorTable({ data }: { data: Educator[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedEducator, setSelectedEducator] = useState<Educator | null>(
    null,
  );

  const handleAction = async (
    id: string,
    actionType: "Verified" | "Rejected" | "Suspend",
  ) => {
    setLoadingId(id);
    const formData = new FormData();
    formData.append("educatorId", id);

    try {
      if (actionType === "Suspend") {
        formData.append("suspend", "true");
        await updateEducatorActiveStatus(formData);
        toast.success("Educator suspended");
      } else {
        formData.append("status", actionType);
        await updateEducatorStatus(formData);
        toast.success(`Educator status updated to ${actionType}`);
      }
      setSelectedEducator(null);
    } catch (error) {
      toast.error("Operation failed" + error);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <>
      <tbody className="divide-y divide-border">
        {data.map((educator) => (
          <tr
            key={educator.id}
            className="hover:bg-muted/30 transition-colors group"
          >
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                  <User className="size-5" />
                </div>
                <div>
                  <div className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                    {educator.name}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Mail className="size-3" /> {educator.email}
                  </div>
                </div>
              </div>
            </td>
            <td className="px-6 py-4">
              <span className="text-sm font-medium text-slate-300 bg-slate-800/50 px-2 py-1 rounded border border-slate-700">
                {educator.specialty}
              </span>
            </td>
            <td className="px-6 py-4">
              <Badge
                variant="outline"
                className={
                  educator.status === "Verified"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                }
              >
                <div
                  className={`size-1.5 rounded-full mr-2 ${educator.status === "Verified" ? "bg-emerald-500" : "bg-amber-400 animate-pulse"}`}
                />
                {educator.status}
              </Badge>
            </td>
            <td className="px-6 py-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Briefcase className="size-3.5" /> {educator.experience} yrs
              </div>
            </td>
            <td className="px-6 py-4 text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-emerald-500/10"
                    disabled={loadingId === educator.id}
                  >
                    {loadingId === educator.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <MoreHorizontal className="size-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 p-2">
                  <DropdownMenuItem
                    onClick={() => setSelectedEducator(educator)}
                    className="cursor-pointer"
                  >
                    <Eye className="mr-2 size-4 text-blue-400" />
                    View Application
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </td>
          </tr>
        ))}
      </tbody>

      {/* MODERN REDESIGNED MODAL */}
      <Dialog
        open={!!selectedEducator}
        onOpenChange={(open) => !open && setSelectedEducator(null)}
      >
        <DialogContent className="max-w-4xl p-0 overflow-hidden border-emerald-900/30 bg-[#0B0F13]">
          {/* Header Section */}
          <div className="bg-linear-to-r from-emerald-900/20 to-transparent p-8 border-b border-white/5">
            <div className="flex items-start justify-between">
              <div className="flex gap-5">
                <div className="size-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-xl shadow-emerald-500/5">
                  <User className="size-8" />
                </div>
                <div className="space-y-1">
                  <DialogTitle className="text-2xl font-bold text-white tracking-tight">
                    {selectedEducator?.name}
                  </DialogTitle>
                  <div className="flex flex-wrap gap-3 text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Mail className="size-3.5" /> {selectedEducator?.email}
                    </span>
                  </div>
                  <Badge
                    className={
                      selectedEducator?.status === "Verified"
                        ? "bg-emerald-800/30 text-white rounded-md"
                        : "bg-amber-500 text-black rounded-md"
                    }
                  >
                    {selectedEducator?.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 h-full">
            {/* Sidebar Details */}
            <div className="p-6 border-r border-white/5 space-y-6 bg-black/20">
              <div>
                <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-3">
                  Educator Data
                </h4>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Specialty</p>
                    <p className="text-sm font-medium text-white flex items-center gap-2">
                      <Medal className="size-4 text-emerald-500" />{" "}
                      {selectedEducator?.specialty}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Work Experience
                    </p>
                    <p className="text-sm font-medium text-white flex items-center gap-2">
                      <Briefcase className="size-4 text-emerald-500" />{" "}
                      {selectedEducator?.experience} Years
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Applied On</p>
                    <p className="text-sm font-medium text-white flex items-center gap-2">
                      <Calendar className="size-4 text-emerald-500" />
                      {selectedEducator?.createdAt
                        ? format(
                            new Date(selectedEducator.createdAt),
                            "MMM dd, yyyy",
                          )
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="bg-white/5" />

              <div>
                <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-3">
                  Documents
                </h4>
                {selectedEducator?.credentialUrl ? (
                  <Link
                    href={selectedEducator.credentialUrl}
                    target="_blank"
                    className="group flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all"
                  >
                    <div className="flex flex-col items-center justify-center gap-3">
                      <FileText className="size-10 text-emerald-500" />
                      <span className="text-sm font-medium items-center justify-center text-slate-200 group-hover:text-white">
                        View File
                      </span>
                    </div>
                  </Link>
                ) : (
                  <p className="text-xs italic text-muted-foreground">
                    No documents attached
                  </p>
                )}
              </div>
            </div>

            {/* Main Content Area */}
            <div className="col-span-2 p-6 flex flex-col justify-between min-h-100">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-500">
                  <FileText className="size-5" />
                  <h3 className="font-semibold tracking-tight">
                    Service Description
                  </h3>
                </div>
                <div className="relative">
                  <div className="absolute -left-4 top-0 bottom-0 w-1 bg-emerald-500/20 rounded-full" />
                  <p className="text-slate-300 leading-relaxed text-sm whitespace-pre-line pl-2">
                    {selectedEducator?.description ||
                      "The educator did not provide a detailed description of their services."}
                  </p>
                </div>
              </div>

              {loadingId === selectedEducator?.id && (
                <div className="mt-4">
                  <BarLoader width={"100%"} color="#10b981" />
                  <p className="text-[10px] text-center text-emerald-500 mt-2 animate-pulse uppercase tracking-widest font-bold">
                    Processing Request...
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Contextual Footer Actions */}
          <DialogFooter className="p-4 bg-black/40 border-t border-white/5 flex sm:justify-between items-center w-full gap-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium hidden sm:block">
              {selectedEducator?.status === "Pending"
                ? "Review credentials before final decision"
                : "Manage active educator account"}
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              {selectedEducator?.status === "Pending" ? (
                <>
                  <Button
                    variant="outline"
                    className="flex-1 sm:flex-none border-white/10 bg-white/5 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50"
                    disabled={!!loadingId}
                    onClick={() =>
                      handleAction(selectedEducator.id, "Rejected")
                    }
                  >
                    <X className="mr-2 size-4" /> Reject
                  </Button>
                  <Button
                    className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20"
                    disabled={!!loadingId}
                    onClick={() =>
                      handleAction(selectedEducator.id, "Verified")
                    }
                  >
                    <Check className="mr-2 size-4" /> Approve
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="flex-1 sm:flex-none border-white/10 bg-white/5 hover:bg-amber-500/10 hover:text-amber-500 hover:border-amber-500/50"
                    disabled={!!loadingId}
                    onClick={() =>
                      selectedEducator &&
                      handleAction(selectedEducator.id, "Suspend")
                    }
                  >
                    <Ban className="mr-2 size-4" /> Suspend Account
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 sm:flex-none border-white/10"
                    onClick={() => setSelectedEducator(null)}
                  >
                    Close
                  </Button>
                </>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// "use client";

// import React, { useState } from "react";
// import { format } from "date-fns";
// import {
//   MoreHorizontal,
//   Ban,
//   CheckCircle,
//   Eye,
//   XCircle,
//   Loader2,
//   Medal,
//   ExternalLink,
//   FileText,
//   X,
//   Check,
//   Mail,
//   Calendar,
//   Briefcase,
//   ShieldCheck,
//   User,
// } from "lucide-react";
// import { toast } from "sonner";
// import Link from "next/link";
// import { BarLoader } from "react-spinners";

// import { Badge } from "@/app/_components/ui/badge";
// import { Button } from "@/app/_components/ui/button";
// import { Separator } from "@/app/_components/ui/separator";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
//   DropdownMenuSeparator,
// } from "@/app/_components/ui/dropdown-menu";
// import {
//   Dialog,
//   DialogContent,
//   DialogTitle,
//   DialogFooter,
// } from "@/app/_components/ui/dialog";

// import {
//   updateEducatorStatus,
//   updateEducatorActiveStatus,
// } from "@/app/actions/admin";

// export function EducatorTable({ data }: { data: any[] }) {
//   const [loadingId, setLoadingId] = useState<string | null>(null);
//   const [selectedEducator, setSelectedEducator] = useState<any | null>(null);

//   const handleAction = async (
//     id: string,
//     actionType: "Verified" | "Rejected" | "Suspend",
//   ) => {
//     setLoadingId(id);
//     const formData = new FormData();
//     formData.append("educatorId", id);

//     try {
//       if (actionType === "Suspend") {
//         formData.append("suspend", "true");
//         await updateEducatorActiveStatus(formData);
//         toast.success("Educator suspended");
//       } else {
//         formData.append("status", actionType);
//         await updateEducatorStatus(formData);
//         toast.success(`Educator status updated to ${actionType}`);
//       }
//       setSelectedEducator(null);
//     } catch (error) {
//       toast.error("Operation failed");
//     } finally {
//       setLoadingId(null);
//     }
//   };

//   return (
//     <>
//       <tbody className="divide-y divide-border">
//         {data.map((educator) => (
//           <tr
//             key={educator.id}
//             className="hover:bg-muted/30 transition-colors group"
//           >
//             <td className="px-6 py-4">
//               <div className="flex items-center gap-3">
//                 <div className="size-9 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
//                   <User className="size-5" />
//                 </div>
//                 <div>
//                   <div className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
//                     {educator.name}
//                   </div>
//                   <div className="text-xs text-muted-foreground flex items-center gap-1">
//                     <Mail className="size-3" /> {educator.email}
//                   </div>
//                 </div>
//               </div>
//             </td>
//             <td className="px-6 py-4">
//               <span className="text-sm font-medium text-slate-300 bg-slate-800/50 px-2 py-1 rounded border border-slate-700">
//                 {educator.specialty}
//               </span>
//             </td>
//             <td className="px-6 py-4">
//               <Badge
//                 variant="outline"
//                 className={
//                   educator.status === "Verified"
//                     ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
//                     : "bg-amber-500/10 text-amber-400 border-amber-500/20"
//                 }
//               >
//                 <div
//                   className={`size-1.5 rounded-full mr-2 ${educator.status === "Verified" ? "bg-emerald-900" : "bg-red-100 animate-pulse"}`}
//                 />
//                 {educator.status}
//               </Badge>
//             </td>
//             <td className="px-6 py-4 text-sm text-muted-foreground">
//               <div className="flex items-center gap-1">
//                 <Briefcase className="size-3.5" /> {educator.experience} yrs
//               </div>
//             </td>
//             <td className="px-6 py-4 text-right">
//               <DropdownMenu>
//                 <DropdownMenuTrigger asChild>
//                   <Button
//                     variant="ghost"
//                     size="icon"
//                     className="hover:bg-emerald-500/10"
//                     disabled={loadingId === educator.id}
//                   >
//                     {loadingId === educator.id ? (
//                       <Loader2 className="size-4 animate-spin" />
//                     ) : (
//                       <MoreHorizontal className="size-4" />
//                     )}
//                   </Button>
//                 </DropdownMenuTrigger>
//                 <DropdownMenuContent align="end" className="w-52 p-2">
//                   <DropdownMenuItem
//                     onClick={() => setSelectedEducator(educator)}
//                     className="cursor-pointer"
//                   >
//                     <Eye className="mr-2 size-4 text-blue-400" />
//                     View Application
//                   </DropdownMenuItem>
//                   <DropdownMenuSeparator />
//                   {educator.status === "Pending" ? (
//                     <>
//                       <DropdownMenuItem
//                         onClick={() => handleAction(educator.id, "Verified")}
//                         className="text-emerald-400 cursor-pointer focus:bg-emerald-500/10"
//                       >
//                         <CheckCircle className="mr-2 size-4" /> Approve Educator
//                       </DropdownMenuItem>
//                       <DropdownMenuItem
//                         onClick={() => handleAction(educator.id, "Rejected")}
//                         className="text-red-400 cursor-pointer focus:bg-red-500/10"
//                       >
//                         <XCircle className="mr-2 size-4" /> Reject Application
//                       </DropdownMenuItem>
//                     </>
//                   ) : (
//                     <DropdownMenuItem
//                       onClick={() => handleAction(educator.id, "Suspend")}
//                       className="text-amber-500 cursor-pointer focus:bg-amber-500/10"
//                     >
//                       <Ban className="mr-2 size-4" /> Suspend Account
//                     </DropdownMenuItem>
//                   )}
//                 </DropdownMenuContent>
//               </DropdownMenu>
//             </td>
//           </tr>
//         ))}
//       </tbody>

//       {/* MODERN REDESIGNED MODAL */}
//       <Dialog
//         open={!!selectedEducator}
//         onOpenChange={(open) => !open && setSelectedEducator(null)}
//       >
//         <DialogContent className="max-w-4xl p-0 overflow-hidden border-emerald-900/30 bg-[#0B0F13]">
//           {/* Header Section with Profile Summary */}
//           <div className="bg-gradient-to-r from-emerald-900/20 to-transparent p-8 border-b border-white/5">
//             <div className="flex items-start justify-between">
//               <div className="flex gap-5">
//                 <div className="size-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-xl shadow-emerald-500/5">
//                   <User className="size-8" />
//                 </div>
//                 <div className="space-y-1">
//                   <DialogTitle className="text-2xl font-bold text-white tracking-tight">
//                     {selectedEducator?.name}
//                   </DialogTitle>
//                   <div className="flex flex-wrap gap-3 text-sm">
//                     <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
//                       <ShieldCheck className="size-3.5" /> Verified Educator
//                     </span>
//                     <span className="flex items-center gap-1.5 text-muted-foreground">
//                       <Mail className="size-3.5" /> {selectedEducator?.email}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//               <Badge
//                 className={
//                   selectedEducator?.status === "VERIFIED"
//                     ? "bg-emerald-500 text-white"
//                     : "bg-amber-500 text-black"
//                 }
//               >
//                 {selectedEducator?.status}
//               </Badge>
//             </div>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-0 h-full">
//             {/* Sidebar Details */}
//             <div className="p-6 border-r border-white/5 space-y-6 bg-black/20">
//               <div>
//                 <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-3">
//                   Professional Data
//                 </h4>
//                 <div className="space-y-4">
//                   <div className="space-y-1">
//                     <p className="text-xs text-muted-foreground">Specialty</p>
//                     <p className="text-sm font-medium text-white flex items-center gap-2">
//                       <Medal className="size-4 text-emerald-500" />{" "}
//                       {selectedEducator?.specialty}
//                     </p>
//                   </div>
//                   <div className="space-y-1">
//                     <p className="text-xs text-muted-foreground">
//                       Work Experience
//                     </p>
//                     <p className="text-sm font-medium text-white flex items-center gap-2">
//                       <Briefcase className="size-4 text-emerald-500" />{" "}
//                       {selectedEducator?.experience} Years
//                     </p>
//                   </div>
//                   <div className="space-y-1">
//                     <p className="text-xs text-muted-foreground">Applied On</p>
//                     <p className="text-sm font-medium text-white flex items-center gap-2">
//                       <Calendar className="size-4 text-emerald-500" />
//                       {selectedEducator?.createdAt
//                         ? format(
//                             new Date(selectedEducator.createdAt),
//                             "MMM dd, yyyy",
//                           )
//                         : "N/A"}
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               <Separator className="bg-white/5" />

//               <div>
//                 <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-3">
//                   Documents
//                 </h4>
//                 {selectedEducator?.credentialUrl ? (
//                   <Link
//                     href={selectedEducator.credentialUrl}
//                     target="_blank"
//                     className="group flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all"
//                   >
//                     <div className="flex items-center gap-3">
//                       <FileText className="size-5 text-emerald-500" />
//                       <span className="text-sm font-medium text-slate-200 group-hover:text-white">
//                         Credentials.pdf
//                       </span>
//                     </div>
//                     <ExternalLink className="size-4 text-muted-foreground group-hover:text-emerald-500" />
//                   </Link>
//                 ) : (
//                   <p className="text-xs italic text-muted-foreground">
//                     No documents attached
//                   </p>
//                 )}
//               </div>
//             </div>

//             {/* Main Content Area */}
//             <div className="col-span-2 p-6 flex flex-col justify-between min-h-[400px]">
//               <div className="space-y-4">
//                 <div className="flex items-center gap-2 text-emerald-500">
//                   <FileText className="size-5" />
//                   <h3 className="font-semibold tracking-tight">
//                     Service Description
//                   </h3>
//                 </div>
//                 <div className="relative">
//                   <div className="absolute -left-4 top-0 bottom-0 w-1 bg-emerald-500/20 rounded-full" />
//                   <p className="text-slate-300 leading-relaxed text-sm whitespace-pre-line pl-2">
//                     {selectedEducator?.description ||
//                       "The educator did not provide a detailed description of their services."}
//                   </p>
//                 </div>
//               </div>

//               {loadingId === selectedEducator?.id && (
//                 <div className="mt-4">
//                   <BarLoader width={"100%"} color="#10b981" />
//                   <p className="text-[10px] text-center text-emerald-500 mt-2 animate-pulse uppercase tracking-widest font-bold">
//                     Processing Request...
//                   </p>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Fixed Footer with contextual buttons */}
//           <DialogFooter className="p-4 bg-black/40 border-t border-white/5 flex sm:justify-between items-center w-full gap-3">
//             <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium hidden sm:block">
//               Verify identity before approval
//             </div>
//             <div className="flex gap-3 w-full sm:w-auto">
//               {selectedEducator?.status === "PENDING" ? (
//                 <>
//                   <Button
//                     variant="outline"
//                     className="flex-1 sm:flex-none border-white/10 bg-white/5 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50"
//                     disabled={!!loadingId}
//                     onClick={() =>
//                       handleAction(selectedEducator.id, "Rejected")
//                     }
//                   >
//                     <X className="mr-2 size-4" /> Reject
//                   </Button>
//                   <Button
//                     className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20"
//                     disabled={!!loadingId}
//                     onClick={() =>
//                       handleAction(selectedEducator.id, "Verified")
//                     }
//                   >
//                     <Check className="mr-2 size-4" /> Approve Educator
//                   </Button>
//                 </>
//               ) : (
//                 <Button
//                   variant="outline"
//                   className="w-full sm:w-auto border-white/10"
//                   onClick={() => setSelectedEducator(null)}
//                 >
//                   Close Profile
//                 </Button>
//               )}
//             </div>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </>
//   );
// }
