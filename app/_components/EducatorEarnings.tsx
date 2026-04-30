"use client";

import { useState } from "react";
import {
  TrendingUp,
  Calendar,
  BarChart3,
  CreditCard,
  Loader2,
  Coins,
  ArrowUpRight,
  History,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import useFetch from "@/hooks/use-fetch";
import { requestPayout } from "../actions/payout";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

// 1. Define strict interfaces for your data
interface Payout {
  id: string;
  status: "Processing" | "Processed" | "Rejected";
  credits: number;
  netAmount: number;
  paypalEmail: string;
  createdAt: string | Date;
}

interface Earnings {
  thisMonthEarnings: number;
  completedAppointments: number;
  averageEarningsPerMonth: number;
  availableCredits: number;
  availablePayout: number;
}

interface EducatorEarningsProps {
  earnings: Earnings;
  payouts: Payout[];
}

// 2. Apply types to the component props
export function EducatorEarnings({
  earnings,
  payouts = [],
}: EducatorEarningsProps) {
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  const [paypalEmail, setPaypalEmail] = useState("");

  const {
    thisMonthEarnings = 0,
    completedAppointments = 0,
    averageEarningsPerMonth = 0,
    availableCredits = 0,
    availablePayout = 0,
  } = earnings;

  // 3. Type the custom hook return (if your hook supports generics)
  const { loading, fn: submitPayoutRequest } = useFetch(requestPayout);

  // 4. TS now knows 'payout' is not 'never'
  const pendingPayout = payouts.find(
    (payout) => payout.status === "Processing",
  );

  const platformFee = availableCredits * 2;

  // 5. Type the Event Handler
  const handlePayoutRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!paypalEmail) {
      toast.error("PayPal email is required");
      return;
    }

    const formData = new FormData();
    formData.append("paypalEmail", paypalEmail);

    // Cast the result to the expected shape
    const result = (await submitPayoutRequest(formData)) as {
      success?: boolean;
    };

    if (result?.success) {
      setShowPayoutDialog(false);
      setPaypalEmail("");
      toast.success("Payout request submitted successfully!");
    }
  };

  const stats = [
    {
      label: "Available Credits",
      value: availableCredits,
      sub: `$${availablePayout.toFixed(2)} ready`,
      icon: Coins,
      color: "text-emerald-400",
    },
    {
      label: "This Month",
      value: `$${thisMonthEarnings.toFixed(2)}`,
      sub: "Gross earnings",
      icon: TrendingUp,
      color: "text-blue-400",
    },
    {
      label: "Appointments",
      value: completedAppointments,
      sub: "Total completed",
      icon: Calendar,
      color: "text-purple-400",
    },
    {
      label: "Monthly Avg",
      value: `$${averageEarningsPerMonth.toFixed(2)}`,
      sub: "Performance",
      icon: BarChart3,
      color: "text-orange-400",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card
            key={i}
            className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm group"
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-zinc-400">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-zinc-500">{stat.sub}</p>
                </div>
                <div className="p-2 rounded-xl bg-zinc-800 transition-colors group-hover:bg-zinc-700">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Payout UI */}
        <Card className="lg:col-span-2 bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-emerald-400" />
                  Payout Management
                </CardTitle>
                <CardDescription>
                  Withdraw your earnings to PayPal.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800">
              {pendingPayout ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-sm text-zinc-400">Request Amount</p>
                      <p className="text-3xl font-bold text-white">
                        ${pendingPayout.netAmount.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-zinc-400">Method</p>
                      <p className="text-white text-sm font-medium">
                        {pendingPayout.paypalEmail}
                      </p>
                    </div>
                  </div>
                  <Alert className="bg-zinc-900 border-zinc-800">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <AlertDescription className="text-zinc-400 ml-2">
                      Request is processing. Your credits will be deducted once
                      approved.
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-zinc-400">Credits</p>
                      <p className="text-xl font-semibold">
                        {availableCredits}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-zinc-400">Fees</p>
                      <p className="text-xl font-semibold text-red-400">
                        -${platformFee.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-zinc-400">Net Total</p>
                      <p className="text-xl font-semibold text-emerald-400">
                        ${availablePayout.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowPayoutDialog(true)}
                    disabled={availableCredits === 0}
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-500"
                  >
                    Request Payout <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* History Sidebar */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-zinc-300">
              <History className="h-4 w-4" /> Recent History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {payouts.length > 0 ? (
                payouts.slice(0, 5).map((payout) => (
                  <div
                    key={payout.id}
                    className="flex flex-col gap-1 p-3 rounded-lg border border-zinc-800 bg-zinc-900/50"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-white">
                        {format(new Date(payout.createdAt), "MMM dd, yyyy")}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] uppercase"
                      >
                        {payout.status}
                      </Badge>
                    </div>
                    <span className="text-xs text-zinc-500">
                      ${payout.netAmount.toFixed(2)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-500 italic text-center py-4">
                  No history yet.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog remains same as previous but ensures type safety on inputs */}
      <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Confirm Payout</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePayoutRequest} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paypalEmail">PayPal Email</Label>
              <Input
                id="paypalEmail"
                type="email"
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
                className="bg-zinc-950 border-zinc-800"
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={loading}
                className="bg-emerald-600"
              >
                {loading ? "Processing..." : "Confirm Payout"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
