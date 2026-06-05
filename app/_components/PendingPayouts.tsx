"use client";

import { useState } from "react";
import {
  AlertCircle,
  Check,
  Loader2,
  Mail,
  Stethoscope,
  User,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { BarLoader } from "react-spinners";

// Shadcn UI Imports
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

// Actions & Hooks
import useFetch from "@/hooks/use-fetch";
import { approvePayout } from "../actions/admin";

// --- TypeScript Interfaces ---

interface Payout {
  id: string;
  educator: {
    name: string;
    email: string;
    specialty: string | null;
    credits: number;
  };
  credits: number;
  platformFee: number;
  netAmount: number;
  paypalEmail: string;
  createdAt: string | Date;
}

interface PendingPayoutItem {
  id: string;
  educator: { name: string; email: string; specialty: string };
  amount: number;
  platformFee: number;
  netAmount: number;
  paypalEmail: string;
  createdAt: Date;
  // credits: number; <--- ❌ DELETE THIS LINE
}

interface PendingPayoutsProps {
  payouts: PendingPayoutItem[];
}

export function PendingPayouts({ payouts = [] }: PendingPayoutsProps) {
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);

  const { loading, fn: submitApproval } = useFetch(approvePayout);

  const handleViewDetails = (payout: Payout) => setSelectedPayout(payout);
  const handleApprovePayout = (payout: Payout) => {
    setSelectedPayout(payout);
    setShowApproveDialog(true);
  };

  const confirmApproval = async () => {
    if (!selectedPayout || loading) return;

    const formData = new FormData();
    formData.append("payoutId", selectedPayout.id);

    const result = (await submitApproval(formData)) as { success?: boolean };

    if (result?.success) {
      setShowApproveDialog(false);
      setSelectedPayout(null);
      toast.success("Payout approved successfully!");
    }
  };

  const closeDialogs = () => {
    setSelectedPayout(null);
    setShowApproveDialog(false);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-md shadow-2xl">
        <CardHeader className="border-b border-zinc-800/50 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-semibold tracking-tight text-white">
                Pending Payouts
              </CardTitle>
              <CardDescription className="text-zinc-400 mt-1">
                Awaiting administrative review and verification.
              </CardDescription>
            </div>
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1">
              {payouts.length} Requests
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {payouts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <ShieldCheck className="h-12 w-12 text-zinc-700 mb-4" />
              <p className="text-zinc-500 font-medium">
                No pending payout requests.
              </p>
              <p className="text-sm text-zinc-600">
                All educators are currently squared away.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {payouts.map((payout) => (
                <div
                  key={payout.id}
                  className="group relative bg-zinc-950/40 border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-900/40 transition-all duration-300 rounded-xl p-5"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20 transition-colors">
                        <User className="h-6 w-6 text-zinc-400 group-hover:text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-white group-hover:text-emerald-50">
                          Dr. {payout.educator.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="secondary"
                            className="bg-zinc-800 text-zinc-300 text-[10px] uppercase tracking-wider"
                          >
                            {payout.educator.specialty}
                          </Badge>
                          <span className="text-zinc-500 text-xs flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(
                              new Date(payout.createdAt),
                              "MMM d, h:mm a",
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-8 px-4 py-2 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
                      <div className="text-center">
                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
                          Amount
                        </p>
                        <p className="text-emerald-400 font-semibold">
                          ${payout.netAmount.toFixed(2)}
                        </p>
                      </div>
                      <div className="h-8 w-px bg-zinc-800" />
                      <div className="text-center">
                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
                          Credits
                        </p>
                        <p className="text-white font-semibold"></p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(payout)}
                        className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                      >
                        Details
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApprovePayout(payout)}
                        className="bg-white text-black hover:bg-emerald-500 hover:text-white transition-all font-medium px-5"
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modernized Detail Dialog */}
      <Dialog
        open={!!selectedPayout && !showApproveDialog}
        onOpenChange={closeDialogs}
      >
        <DialogContent className="max-w-xl bg-zinc-950 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Review Request
            </DialogTitle>
            <DialogDescription className="text-zinc-500">
              Verification of funds and educator standing.
            </DialogDescription>
          </DialogHeader>

          {selectedPayout && (
            <div className="space-y-6 pt-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Stethoscope className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    Dr. {selectedPayout.educator.name}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {selectedPayout.educator.email}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/30">
                  <p className="text-[10px] uppercase text-zinc-500 font-bold mb-1">
                    Status
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-sm font-medium">Pending Review</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/30">
                  <p className="text-[10px] uppercase text-zinc-500 font-bold mb-1">
                    Wallet Balance
                  </p>
                  <span
                    className={`text-sm font-medium ${selectedPayout.educator.credits < selectedPayout.credits ? "text-red-400" : "text-emerald-400"}`}
                  >
                    {selectedPayout.educator.credits} Credits Available
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-800 overflow-hidden">
                <div className="p-4 bg-zinc-900/50 border-b border-zinc-800 flex justify-between items-center">
                  <span className="text-sm font-medium">Payment Breakdown</span>
                  <Badge
                    variant="outline"
                    className="border-zinc-700 text-zinc-400 text-[10px] uppercase tracking-tighter"
                  >
                    PayPal Payout
                  </Badge>
                </div>
                <div className="p-4 space-y-3 bg-zinc-950">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">
                      Gross ({selectedPayout.credits} cr)
                    </span>
                    <span className="text-zinc-300">
                      $
                      {(
                        selectedPayout.netAmount + selectedPayout.platformFee
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Platform Fee</span>
                    <span className="text-red-400/80">
                      -${selectedPayout.platformFee.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-px bg-zinc-800 my-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-white font-medium">
                      Net Disbursement
                    </span>
                    <span className="text-lg font-bold text-emerald-400">
                      ${selectedPayout.netAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {selectedPayout.educator.credits < selectedPayout.credits && (
                <Alert
                  variant="destructive"
                  className="bg-red-500/10 border-red-500/20 text-red-400"
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Insufficient Balance: The educator has since used credits
                    and no longer meets the request threshold.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button
              variant="ghost"
              onClick={closeDialogs}
              className="text-zinc-500"
            >
              Close
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-500"
              onClick={() => handleApprovePayout(selectedPayout!)}
              disabled={
                selectedPayout !== null &&
                selectedPayout.educator.credits < selectedPayout.credits
              }
            >
              Begin Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={showApproveDialog}
        onOpenChange={(open) => !loading && setShowApproveDialog(open)}
      >
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Finalize Approval</DialogTitle>
            <DialogDescription>
              This will execute the disbursement process.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
              <p className="text-xs text-emerald-500/80 mb-1">
                Destination Account
              </p>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-emerald-500" />
                <span className="font-mono text-sm text-zinc-300">
                  {selectedPayout?.paypalEmail}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
              <ul className="text-xs text-zinc-500 space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-emerald-500" /> Credits will be
                  permanently debited.
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-emerald-500" /> Payout will be
                  logged as &apos;Processed&apos;.
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-emerald-500" /> Notification
                  sent to educator.
                </li>
              </ul>
            </div>
          </div>

          {loading && <BarLoader width={"100%"} color="#10b981" />}

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowApproveDialog(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmApproval}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Confirm & Release Funds
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// "use client";

// import useFetch from "@/hooks/use-fetch";
// import { toast } from "sonner";
// import { BarLoader } from "react-spinners";
// import { useEffect, useState } from "react";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "./ui/card";
// import {
//   AlertCircle,
//   Check,
//   DollarSign,
//   Loader2,
//   Mail,
//   Stethoscope,
//   User,
// } from "lucide-react";
// import { format } from "date-fns";
// import { Badge } from "./ui/badge";
// import { Button } from "./ui/button";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "./ui/dialog";
// import { Alert, AlertDescription } from "./ui/alert";
// import { approvePayout } from "../actions/admin";

// export function PendingPayouts({ payouts }) {
//   const [selectedPayout, setSelectedPayout] = useState(null);
//   const [showApproveDialog, setShowApproveDialog] = useState(false);

//   // Custom hook for approve payout server action
//   const { loading, data, fn: submitApproval } = useFetch(approvePayout);

//   // Handle view details
//   const handleViewDetails = (payout) => {
//     setSelectedPayout(payout);
//   };

//   // Handle approve payout
//   const handleApprovePayout = (payout) => {
//     setSelectedPayout(payout);
//     setShowApproveDialog(true);
//   };

//   // Confirm approval
//   const confirmApproval = async () => {
//     if (!selectedPayout || loading) return;

//     const formData = new FormData();
//     formData.append("payoutId", selectedPayout.id);

//     const result = await submitApproval(formData);

//     if (result?.success) {
//       // Update state HERE, not in useEffect
//       setShowApproveDialog(false);
//       setSelectedPayout(null);
//       toast.success("Payout approved successfully!");
//     }
//   };

//   const closeDialogs = () => {
//     setSelectedPayout(null);
//     setShowApproveDialog(false);
//   };

//   return (
//     <div>
//       <Card className="bg-muted/20 border-emerald-900/20">
//         <CardHeader>
//           <CardTitle className="text-xl font-bold text-white">
//             Pending Payouts
//           </CardTitle>
//           <CardDescription>
//             Review and approve educator payout requests
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           {payouts.length === 0 ? (
//             <div className="text-center py-8 text-muted-foreground">
//               No pending payout requests at this time.
//             </div>
//           ) : (
//             <div className="space-y-4">
//               {payouts.map((payout) => (
//                 <Card
//                   key={payout.id}
//                   className="bg-background border-emerald-900/20 hover:border-emerald-700/30 transition-all"
//                 >
//                   <CardContent className="p-4">
//                     <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
//                       <div className="flex items-start gap-3">
//                         <div className="bg-muted/20 rounded-full p-2 mt-1">
//                           <User className="h-5 w-5 text-emerald-400" />
//                         </div>
//                         <div className="flex-1">
//                           <h3 className="font-medium text-white">
//                             Dr. {payout.educator.name}
//                           </h3>
//                           <p className="text-sm text-muted-foreground">
//                             {payout.educator.specialty}
//                           </p>
//                           <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
//                             <div className="flex items-center">
//                               <DollarSign className="h-4 w-4 mr-1 text-emerald-400" />
//                               <span>
//                                 {payout.credits} credits • $
//                                 {payout.netAmount.toFixed(2)}
//                               </span>
//                             </div>
//                             <div className="flex items-center">
//                               <Mail className="h-4 w-4 mr-1 text-emerald-400" />
//                               <span className="text-xs">
//                                 {payout.paypalEmail}
//                               </span>
//                             </div>
//                           </div>
//                           <p className="text-xs text-muted-foreground mt-1">
//                             Requested{" "}
//                             {format(
//                               new Date(payout.createdAt),
//                               "MMM d, yyyy 'at' h:mm a",
//                             )}
//                           </p>
//                         </div>
//                       </div>
//                       <div className="flex flex-col sm:flex-row gap-2 self-end lg:self-center">
//                         <Badge
//                           variant="outline"
//                           className="bg-amber-900/20 border-amber-900/30 text-amber-400 w-fit"
//                         >
//                           Pending
//                         </Badge>
//                         <div className="flex gap-2">
//                           <Button
//                             variant="outline"
//                             size="sm"
//                             onClick={() => handleViewDetails(payout)}
//                             className="border-emerald-900/30 hover:bg-muted/80"
//                           >
//                             View Details
//                           </Button>
//                           <Button
//                             size="sm"
//                             onClick={() => handleApprovePayout(payout)}
//                             className="bg-emerald-600 hover:bg-emerald-700"
//                           >
//                             <Check className="h-4 w-4 mr-1" />
//                             Approve
//                           </Button>
//                         </div>
//                       </div>
//                     </div>
//                   </CardContent>
//                 </Card>
//               ))}
//             </div>
//           )}
//         </CardContent>
//       </Card>

//       {/* Payout Details Dialog */}
//       {selectedPayout && !showApproveDialog && (
//         <Dialog open={!!selectedPayout} onOpenChange={closeDialogs}>
//           <DialogContent className="max-w-2xl">
//             <DialogHeader>
//               <DialogTitle className="text-xl font-bold text-white">
//                 Payout Request Details
//               </DialogTitle>
//               <DialogDescription>
//                 Review the payout request information
//               </DialogDescription>
//             </DialogHeader>

//             <div className="space-y-6 py-4">
//               {/* Doctor Information */}
//               <div className="space-y-4">
//                 <div className="flex items-center gap-2">
//                   <Stethoscope className="h-5 w-5 text-emerald-400" />
//                   <h3 className="text-white font-medium">
//                     Educator Information
//                   </h3>
//                 </div>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div>
//                     <p className="text-sm font-medium text-muted-foreground">
//                       Name
//                     </p>
//                     <p className="text-white">
//                       Dr. {selectedPayout.educator.name}
//                     </p>
//                   </div>
//                   <div>
//                     <p className="text-sm font-medium text-muted-foreground">
//                       Email
//                     </p>
//                     <p className="text-white">
//                       {selectedPayout.educator.email}
//                     </p>
//                   </div>
//                   <div>
//                     <p className="text-sm font-medium text-muted-foreground">
//                       Specialty
//                     </p>
//                     <p className="text-white">
//                       {selectedPayout.educator.specialty}
//                     </p>
//                   </div>
//                   <div>
//                     <p className="text-sm font-medium text-muted-foreground">
//                       Current Credits
//                     </p>
//                     <p className="text-white">
//                       {selectedPayout.educator.credits}
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               {/* Payout Information */}
//               <div className="space-y-4">
//                 <div className="flex items-center gap-2">
//                   <DollarSign className="h-5 w-5 text-emerald-400" />
//                   <h3 className="text-white font-medium">Payout Details</h3>
//                 </div>
//                 <div className="bg-muted/20 p-4 rounded-lg border border-emerald-900/20 space-y-3">
//                   <div className="flex justify-between">
//                     <span className="text-muted-foreground">
//                       Credits to pay out:
//                     </span>
//                     <span className="text-white font-medium">
//                       {selectedPayout.credits}
//                     </span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-muted-foreground">
//                       Gross amount (10 USD/credit):
//                     </span>
//                     <span className="text-white">
//                       ${selectedPayout.amount.toFixed(2)}
//                     </span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-muted-foreground">
//                       Platform fee (2 USD/credit):
//                     </span>
//                     <span className="text-white">
//                       -${selectedPayout.platformFee.toFixed(2)}
//                     </span>
//                   </div>
//                   <div className="border-t border-emerald-900/20 pt-3 flex justify-between font-medium">
//                     <span className="text-white">Net payout:</span>
//                     <span className="text-emerald-400">
//                       ${selectedPayout.netAmount.toFixed(2)}
//                     </span>
//                   </div>
//                   <div className="border-t border-emerald-900/20 pt-3">
//                     <p className="text-sm font-medium text-muted-foreground">
//                       PayPal Email
//                     </p>
//                     <p className="text-white">{selectedPayout.paypalEmail}</p>
//                   </div>
//                 </div>
//               </div>

//               {/* Warning if insufficient credits */}
//               {selectedPayout.educator.credits < selectedPayout.credits && (
//                 <Alert variant="destructive">
//                   <AlertCircle className="h-4 w-4" />
//                   <AlertDescription>
//                     Warning: Educator currently has only{" "}
//                     {selectedPayout.educator.credits} credits but this payout
//                     requires {selectedPayout.credits} credits. The payout cannot
//                     be processed.
//                   </AlertDescription>
//                 </Alert>
//               )}
//             </div>

//             <DialogFooter>
//               <Button
//                 variant="outline"
//                 onClick={closeDialogs}
//                 className="border-emerald-900/30"
//               >
//                 Close
//               </Button>
//               <Button
//                 onClick={() => handleApprovePayout(selectedPayout)}
//                 disabled={
//                   selectedPayout.educator.credits < selectedPayout.credits
//                 }
//                 className="bg-emerald-600 hover:bg-emerald-700"
//               >
//                 <Check className="h-4 w-4 mr-1" />
//                 Approve Payout
//               </Button>
//             </DialogFooter>
//           </DialogContent>
//         </Dialog>
//       )}

//       {/* Approval Confirmation Dialog */}
//       {showApproveDialog && selectedPayout && (
//         <Dialog
//           open={showApproveDialog}
//           onOpenChange={() => setShowApproveDialog(false)}
//         >
//           <DialogContent>
//             <DialogHeader>
//               <DialogTitle className="text-xl font-bold text-white">
//                 Confirm Payout Approval
//               </DialogTitle>
//               <DialogDescription>
//                 Are you sure you want to approve this payout?
//               </DialogDescription>
//             </DialogHeader>

//             <div className="space-y-4 py-4">
//               <Alert>
//                 <AlertCircle className="h-4 w-4" />
//                 <AlertDescription>
//                   This action will:
//                   <ul className="mt-2 space-y-1 list-disc pl-4">
//                     <li>
//                       Deduct {selectedPayout.credits} credits from Dr.{" "}
//                       {selectedPayout.educator.name}'s account
//                     </li>
//                     <li>Mark the payout as PROCESSED</li>
//                     <li>This action cannot be undone</li>
//                   </ul>
//                 </AlertDescription>
//               </Alert>

//               <div className="bg-muted/20 p-4 rounded-lg border border-emerald-900/20">
//                 <div className="flex justify-between mb-2">
//                   <span className="text-muted-foreground">Educator:</span>
//                   <span className="text-white">
//                     Dr. {selectedPayout.educator.name}
//                   </span>
//                 </div>
//                 <div className="flex justify-between mb-2">
//                   <span className="text-muted-foreground">Amount to pay:</span>
//                   <span className="text-emerald-400 font-medium">
//                     ${selectedPayout.netAmount.toFixed(2)}
//                   </span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-muted-foreground">PayPal:</span>
//                   <span className="text-white text-sm">
//                     {selectedPayout.paypalEmail}
//                   </span>
//                 </div>
//               </div>
//             </div>

//             {loading && <BarLoader width={"100%"} color="#36d7b7" />}

//             <DialogFooter>
//               <Button
//                 variant="outline"
//                 onClick={() => setShowApproveDialog(false)}
//                 disabled={loading}
//                 className="border-emerald-900/30"
//               >
//                 Cancel
//               </Button>
//               <Button
//                 onClick={confirmApproval}
//                 disabled={loading}
//                 className="bg-emerald-600 hover:bg-emerald-700"
//               >
//                 {loading ? (
//                   <>
//                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                     Processing...
//                   </>
//                 ) : (
//                   <>
//                     <Check className="mr-2 h-4 w-4" />
//                     Confirm Approval
//                   </>
//                 )}
//               </Button>
//             </DialogFooter>
//           </DialogContent>
//         </Dialog>
//       )}
//     </div>
//   );
// }
