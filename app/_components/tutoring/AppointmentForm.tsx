// "use client";

// import { useTransition } from "react";
// import { Button } from "@/app/_components/ui/button";
// import { Label } from "@/app/_components/ui/label";
// import { Textarea } from "@/app/_components/ui/textarea";
// import { bookAppointment } from "@/app/actions/appointments";
// import { format } from "date-fns";
// import { ArrowLeft, Calendar, Clock, Loader2 } from "lucide-react";
// import { toast } from "sonner";

// interface Slot {
//   startTime: string;
//   endTime: string;
//   availabilityId: string;
//   formatted: string;
// }

// interface AppointmentFormProps {
//   educatorId: string;
//   slot: Slot;
//   onBack: () => void;
//   onComplete: () => void;
// }

// export default function AppointmentForm({
//   educatorId,
//   slot,
//   onBack,
//   onComplete,
// }: AppointmentFormProps) {
//   const [isPending, startTransition] = useTransition();

//   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();

//     const formData = new FormData(e.currentTarget);
//     formData.append("educatorId", educatorId);
//     formData.append("startTime", slot.startTime);
//     formData.append("endTime", slot.endTime);
//     formData.append("availabilityId", slot.availabilityId);

//     startTransition(async () => {
//       try {
//         const res = await bookAppointment(formData);

//         if (res && res.success) {
//           toast.success("Appointment booked successfully!");
//           onComplete();
//           return;
//         }

//         // Standard error handling only
//         const errorMessage =
//           res && "message" in res
//             ? (res.message as string)
//             : "Failed to book appointment";
//         toast.error(errorMessage || "Failed to book appointment");
//       } catch (error) {
//         if (error instanceof Error) {
//           toast.error(error.message);
//         } else {
//           toast.error("An unexpected error occurred");
//         }
//       }
//     });
//   };

//   return (
//     <form className="space-y-6" onSubmit={handleSubmit}>
//       <div className="bg-muted/20 p-4 rounded-lg border border-emerald-900/20 space-y-3">
//         <div className="flex items-center">
//           <Calendar className="size-5 text-emerald-400 mr-2" />
//           <span className="text-white font-medium">
//             {format(new Date(slot.startTime), "EEEE, MMMM d, yyyy")}
//           </span>
//         </div>

//         <div className="flex items-center">
//           <Clock className="size-5 text-emerald-400 mr-2" />
//           <span className="text-white">{slot.formatted}</span>
//         </div>

//         <div className="space-y-4">
//           <Label htmlFor="description">
//             Describe the lesson or class support (optional)
//           </Label>
//           <Textarea
//             id="description"
//             name="description"
//             placeholder="Details about the lesson..."
//             className="bg-background border-emerald-900/20 h-32"
//             disabled={isPending}
//           />
//         </div>

//         <div className="flex justify-between pt-2">
//           <Button
//             type="button"
//             variant="outline"
//             onClick={onBack}
//             disabled={isPending}
//             className="border-emerald-900/30"
//           >
//             <ArrowLeft className="mr-2 size-4" />
//             Change Time
//           </Button>

//           <Button
//             type="submit"
//             disabled={isPending}
//             className="bg-emerald-600 hover:bg-emerald-700 min-w-35"
//           >
//             {isPending ? (
//               <>
//                 <Loader2 className="mr-2 size-4 animate-spin" />
//                 Booking...
//               </>
//             ) : (
//               "Preview Booking"
//             )}
//           </Button>
//         </div>
//       </div>
//     </form>
//   );
// }

// "use client";

// import { useState, useTransition } from "react";
// import { Button } from "@/app/_components/ui/button";
// import { Label } from "@/app/_components/ui/label";
// import { Textarea } from "@/app/_components/ui/textarea";
// import { bookAppointment } from "@/app/actions/appointments";
// import { format } from "date-fns";
// import { ArrowLeft, Calendar, Clock, Loader2, Crown } from "lucide-react";
// import { toast } from "sonner";
// import Link from "next/link";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
// } from "@/app/_components/ui/dialog";

// interface Slot {
//   startTime: string;
//   endTime: string;
//   availabilityId: string;
//   formatted: string;
// }

// interface AppointmentFormProps {
//   educatorId: string;
//   slot: Slot;
//   onBack: () => void;
//   onComplete: () => void;
// }

// export default function AppointmentForm({
//   educatorId,
//   slot,
//   onBack,
//   onComplete,
// }: AppointmentFormProps) {
//   const [isPending, startTransition] = useTransition();
//   const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
//   const [upgradeMessage, setUpgradeMessage] = useState("");
//   const [currentPlan, setCurrentPlan] = useState("");

//   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();

//     const formData = new FormData(e.currentTarget);
//     formData.append("educatorId", educatorId);
//     formData.append("startTime", slot.startTime);
//     formData.append("endTime", slot.endTime);
//     formData.append("availabilityId", slot.availabilityId);

//     startTransition(async () => {
//       try {
//         const res = await bookAppointment(formData);

//         if (res && res.success) {
//           toast.success("Appointment booked successfully!");
//           onComplete();
//           return;
//         }

//         if (
//           res &&
//           typeof res === "object" &&
//           "upgradeRequired" in res &&
//           res.upgradeRequired
//         ) {
//           const upgradeRes = res as { message?: string; plan?: string };

//           setUpgradeMessage(upgradeRes.message || "");
//           setCurrentPlan(upgradeRes.plan || "");
//           setUpgradeModalOpen(true);
//           return;
//         }

//         const errorMessage =
//           res && "message" in res
//             ? (res.message as string)
//             : "Failed to book appointment";
//         toast.error(errorMessage || "Failed to book appointment");
//       } catch (error) {
//         if (error instanceof Error) {
//           toast.error(error.message);
//         } else {
//           toast.error("An unexpected error occurred");
//         }
//       }
//     });
//   };

//   return (
//     <>
//       <form className="space-y-6" onSubmit={handleSubmit}>
//         <div className="bg-muted/20 p-4 rounded-lg border border-emerald-900/20 space-y-3">
//           <div className="flex items-center">
//             <Calendar className="size-5 text-emerald-400 mr-2" />
//             <span className="text-white font-medium">
//               {format(new Date(slot.startTime), "EEEE, MMMM d, yyyy")}
//             </span>
//           </div>

//           <div className="flex items-center">
//             <Clock className="size-5 text-emerald-400 mr-2" />
//             <span className="text-white">{slot.formatted}</span>
//           </div>

//           <div className="space-y-4">
//             <Label htmlFor="description">
//               Describe the lesson or class support (optional)
//             </Label>
//             <Textarea
//               id="description"
//               name="description"
//               placeholder="Details about the lesson..."
//               className="bg-background border-emerald-900/20 h-32"
//               disabled={isPending}
//             />
//           </div>

//           <div className="flex justify-between pt-2">
//             <Button
//               type="button"
//               variant="outline"
//               onClick={onBack}
//               disabled={isPending}
//               className="border-emerald-900/30"
//             >
//               <ArrowLeft className="mr-2 size-4" />
//               Change Time
//             </Button>

//             <Button
//               type="submit"
//               disabled={isPending}
//               className="bg-emerald-600 hover:bg-emerald-700 min-w-35"
//             >
//               {isPending ? (
//                 <>
//                   <Loader2 className="mr-2 size-4 animate-spin" />
//                   Booking...
//                 </>
//               ) : (
//                 "Confirm Booking"
//               )}
//             </Button>
//           </div>
//         </div>
//       </form>

//       {/* PREMIUM UPGRADE MODAL */}
//       <Dialog open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen}>
//         <DialogContent className="bg-[#111111] border border-emerald-500/20 text-white max-w-md rounded-2xl">
//           <DialogHeader>
//             <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
//               <Crown className="h-8 w-8 text-emerald-400" />
//             </div>
//             <DialogTitle className="text-center text-2xl font-bold">
//               Upgrade Required
//             </DialogTitle>
//             <DialogDescription className="text-center text-gray-400 pt-2">
//               {upgradeMessage}
//             </DialogDescription>
//           </DialogHeader>

//           <div className="mt-6 space-y-3">
//             {currentPlan === "Free" && (
//               <>
//                 <Link href="/student/myplan">
//                   <Button className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-base font-semibold">
//                     Upgrade to Standard
//                   </Button>
//                 </Link>

//                 <Link href="/student/myplan">
//                   <Button
//                     variant="outline"
//                     className="w-full border-emerald-500/20 text-white hover:bg-emerald-500/10 h-12"
//                   >
//                     View Premium Plan
//                   </Button>
//                 </Link>
//               </>
//             )}

//             {currentPlan === "Standard" && (
//               <Link href="/student/myplan">
//                 <Button className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-base font-semibold">
//                   Upgrade to Premium
//                 </Button>
//               </Link>
//             )}
//           </div>
//         </DialogContent>
//       </Dialog>
//     </>
//   );
// }

// "use client";

// import { useState, useTransition } from "react";
// import { Button } from "@/app/_components/ui/button";
// import { Label } from "@/app/_components/ui/label";
// import { Textarea } from "@/app/_components/ui/textarea";
// import { bookAppointment } from "@/app/actions/appointments";
// import { format } from "date-fns";
// import { ArrowLeft, Calendar, Clock, Loader2, Crown } from "lucide-react";

// import { toast } from "sonner";

// import Link from "next/link";

// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
// } from "@/app/_components/ui/dialog";

// interface Slot {
//   startTime: string;
//   endTime: string;
//   availabilityId: string;
//   formatted: string;
// }

// interface AppointmentFormProps {
//   educatorId: string;
//   slot: Slot;
//   onBack: () => void;
//   onComplete: () => void;
// }

// export default function AppointmentForm({
//   educatorId,
//   slot,
//   onBack,
//   onComplete,
// }: AppointmentFormProps) {
//   const [isPending, startTransition] = useTransition();
//   const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
//   const [upgradeMessage, setUpgradeMessage] = useState("");
//   const [currentPlan, setCurrentPlan] = useState("");

//   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();

//     const formData = new FormData(e.currentTarget);
//     formData.append("educatorId", educatorId);
//     formData.append("startTime", slot.startTime);
//     formData.append("endTime", slot.endTime);
//     formData.append("availabilityId", slot.availabilityId);

//     startTransition(async () => {
//       try {
//         const res = await bookAppointment(formData);

//         if (res && res.success) {
//           toast.success("Appointment booked successfully!");
//           onComplete();
//           return;
//         }

//         // ✅ FIX: Explicitly narrow the type using the 'in' operator so
//         // TypeScript knows 'upgradeRequired' is guaranteed to exist here.
//         if (
//           res &&
//           typeof res === "object" &&
//           "upgradeRequired" in res &&
//           res.upgradeRequired
//         ) {
//           // Type casting to any or a loose shape lets you extract the properties safely
//           const upgradeRes = res as { message?: string; plan?: string };

//           setUpgradeMessage(upgradeRes.message || "");
//           setCurrentPlan(upgradeRes.plan || "");
//           setUpgradeModalOpen(true);
//           return;
//         }

//         // Fallback for standard error objects
//         const errorMessage =
//           res && "message" in res
//             ? (res.message as string)
//             : "Failed to book appointment";
//         toast.error(errorMessage || "Failed to book appointment");
//       } catch (error) {
//         if (error instanceof Error) {
//           toast.error(error.message);
//         } else {
//           toast.error("An unexpected error occurred");
//         }
//       }
//     });
//   };

//   return (
//     <>
//       <form className="space-y-6" onSubmit={handleSubmit}>
//         <div className="bg-muted/20 p-4 rounded-lg border border-emerald-900/20 space-y-3">
//           <div className="flex items-center">
//             <Calendar className="size-5 text-emerald-400 mr-2" />
//             <span className="text-white font-medium">
//               {format(new Date(slot.startTime), "EEEE, MMMM d, yyyy")}
//             </span>
//           </div>

//           <div className="flex items-center">
//             <Clock className="size-5 text-emerald-400 mr-2" />
//             <span className="text-white">{slot.formatted}</span>
//           </div>

//           <div className="space-y-4">
//             <Label htmlFor="description">
//               Describe the lesson or class support (optional)
//             </Label>
//             <Textarea
//               id="description"
//               name="description"
//               placeholder="Details about the lesson..."
//               className="bg-background border-emerald-900/20 h-32"
//               disabled={isPending}
//             />
//           </div>

//           <div className="flex justify-between pt-2">
//             <Button
//               type="button"
//               variant="outline"
//               onClick={onBack}
//               disabled={isPending}
//               className="border-emerald-900/30"
//             >
//               <ArrowLeft className="mr-2 size-4" />
//               Change Time
//             </Button>

//             <Button
//               type="submit"
//               disabled={isPending}
//               className="bg-emerald-600 hover:bg-emerald-700 min-w-35"
//             >
//               {isPending ? (
//                 <>
//                   <Loader2 className="mr-2 size-4 animate-spin" />
//                   Booking...
//                 </>
//               ) : (
//                 "Confirm Booking"
//               )}
//             </Button>
//           </div>
//         </div>
//       </form>

//       {/* PREMIUM UPGRADE MODAL */}
//       <Dialog open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen}>
//         <DialogContent className="bg-[#111111] border border-emerald-500/20 text-white max-w-md rounded-2xl">
//           <DialogHeader>
//             <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
//               <Crown className="h-8 w-8 text-emerald-400" />
//             </div>
//             <DialogTitle className="text-center text-2xl font-bold">
//               Upgrade Required
//             </DialogTitle>
//             <DialogDescription className="text-center text-gray-400 pt-2">
//               {upgradeMessage}
//             </DialogDescription>
//           </DialogHeader>

//           <div className="mt-6 space-y-3">
//             {currentPlan === "Free" && (
//               <>
//                 <Link href="/student/myplan">
//                   <Button className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-base font-semibold">
//                     Upgrade to Standard
//                   </Button>
//                 </Link>

//                 <Link href="/student/myplan">
//                   <Button
//                     variant="outline"
//                     className="w-full border-emerald-500/20 text-white hover:bg-emerald-500/10 h-12"
//                   >
//                     View Premium Plan
//                   </Button>
//                 </Link>
//               </>
//             )}

//             {currentPlan === "Standard" && (
//               <Link href="/student/myplan">
//                 <Button className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-base font-semibold">
//                   Upgrade to Premium
//                 </Button>
//               </Link>
//             )}
//           </div>
//         </DialogContent>
//       </Dialog>
//     </>
//   );
// }
