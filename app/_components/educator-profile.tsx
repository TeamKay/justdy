"use client";

import { useState, useTransition } from "react";
import { Button } from "@/app/_components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { Calendar } from "@/app/_components/ui/calendar";
import { Badge } from "@/app/_components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Medal, User, Loader2 } from "lucide-react";
import { format, isSameDay, isBefore, startOfDay } from "date-fns";
import { useRouter } from "next/navigation";
import { Separator } from "./ui/separator";
import { bookAppointment } from "../actions/appointments";

/* ---------------- TYPES ---------------- */

type BookingStep = "time" | "details" | "review" | "payment" | "success";

type TimeSlot = {
  startTime: string;
  endTime: string;
  formatted: string;
  availabilityId: string;
};

type DayWithSlots = {
  date: string;
  slots: TimeSlot[];
};

type Educator = {
  id: string;
  name: string;
  imageUrl?: string | null;
  specialty: string | null;
  experience: number | string | null;
  description: string | null;
};

interface Props {
  educator: Educator;
  availableDays: DayWithSlots[];
}

/* ---------------- HELPERS ---------------- */

const generateTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    for (const min of ["00", "15", "30", "45"]) {
      const hh = hour.toString().padStart(2, "0");
      const ampm = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      options.push({
        value: `${hh}:${min}`,
        label: `${displayHour}:${min} ${ampm}`,
        hour,
        minute: parseInt(min, 10),
      });
    }
  }
  return options;
};

const formatTimeLabel = (timeStr: string) => {
  const [hourStr, minStr] = timeStr.split(":");
  const hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minStr} ${ampm}`;
};

/* ---------------- STEP INDICATOR (NUMBERS) ---------------- */

function StepIndicator({ step }: { step: BookingStep }) {
  const steps: BookingStep[] = ["time", "details", "review", "payment"];

  return (
    <div className="flex items-center gap-2 text-xs text-gray-400">
      {steps.map((s, i) => {
        const active = step === s;
        const done = steps.indexOf(step) > i;

        return (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-6 h-6 flex items-center justify-center rounded-full text-xs border ${
                active
                  ? "bg-emerald-500 text-black"
                  : done
                    ? "bg-emerald-900 text-emerald-300"
                    : "bg-black text-gray-400"
              }`}
            >
              {i + 1}
            </div>

            {i !== steps.length - 1 && <div className="w-6 h-px bg-white/10" />}
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- MAIN ---------------- */

export default function EducatorProfile({
  educator,
  availableDays = [],
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState<BookingStep>("time");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [startTime, setStartTime] = useState<string>("09:00");
  const [endTime, setEndTime] = useState<string>("09:45");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [sessionDetails, setSessionDetails] = useState({
    description: "",
  });

  const timeOptions = generateTimeOptions();

  // Identify context states (Past or Present)
  const now = new Date();
  const isToday = selectedDate ? isSameDay(selectedDate, now) : false;
  const isPastDate = selectedDate
    ? isBefore(startOfDay(selectedDate), startOfDay(now))
    : false;

  // Helper utility to flag if an individual slot option is already chronologically dead
  const isTimeInPast = (optHour: number, optMinute: number) => {
    if (!isToday) return false;
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    if (optHour < currentHour) return true;
    if (optHour === currentHour && optMinute <= currentMinute) return true;
    return false;
  };

  // Compute dynamic visibility bounds
  let selectedSlot: TimeSlot | null = null;

  const [startHH, startMM] = startTime.split(":").map(Number);
  const [endHH, endMM] = endTime.split(":").map(Number);
  const isSelectedStartInPast = isTimeInPast(startHH, startMM);
  const isSelectedEndInPast = isTimeInPast(endHH, endMM);

  // Blocks going forward if selection is broken, in a past day, or an expired time window today
  if (
    selectedDate &&
    !isPastDate &&
    !isSelectedStartInPast &&
    !isSelectedEndInPast
  ) {
    const baseDateStr = format(selectedDate, "yyyy-MM-dd");
    const directDayMatch = availableDays.find((d) =>
      isSameDay(new Date(d.date), selectedDate),
    );
    const finalAvailabilityId =
      directDayMatch?.slots[0]?.availabilityId ?? "custom-generated-slot-id";

    selectedSlot = {
      startTime: `${baseDateStr}T${startTime}:00.000Z`,
      endTime: `${baseDateStr}T${endTime}:00.000Z`,
      formatted: `${format(selectedDate, "eee, MMM d")} (${formatTimeLabel(startTime)} - ${formatTimeLabel(endTime)})`,
      availabilityId: finalAvailabilityId,
    };
  }

  const goNext = () => {
    const order: BookingStep[] = [
      "time",
      "details",
      "review",
      "payment",
      "success",
    ];
    setStep(order[Math.min(order.indexOf(step) + 1, order.length - 1)]);
  };

  const [paymentType, setPaymentType] = useState<"hourly" | "monthly">(
    "hourly",
  );
  const calculateDurationInMinutes = () => {
    if (!startTime || !endTime) return 0;
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    const totalStartMinutes = startH * 60 + startM;
    const totalEndMinutes = endH * 60 + endM;
    return Math.max(0, totalEndMinutes - totalStartMinutes);
  };
  const calculatedDuration = calculateDurationInMinutes();

  const goBack = () => {
    setErrorMessage(null);
    const order: BookingStep[] = [
      "time",
      "details",
      "review",
      "payment",
      "success",
    ];
    setStep(order[Math.max(order.indexOf(step) - 1, 0)]);
  };

  // 🚀 HANDLE SUBMISSION TO THE SERVER ACTION
  // 🚀 HANDLE SUBMISSION TO THE SERVER ACTION
  const handlePaymentAndBooking = () => {
    if (!selectedSlot) return;
    setErrorMessage(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append("educatorId", educator.id);
      formData.append("availabilityId", selectedSlot!.availabilityId);
      formData.append("learnerDescription", sessionDetails.description);
      formData.append("startTime", selectedSlot!.startTime);
      formData.append("endTime", selectedSlot!.endTime);
      formData.append("paymentType", paymentType); // Passes 'hourly' or 'monthly'

      const response = await bookAppointment(formData);

      if (response.success && response.checkoutUrl) {
        // 🔥 CRITICAL FIX: Manually redirect the browser window to Stripe's hosted URL
        window.location.href = response.checkoutUrl;
      } else {
        // Fallback for errors or missing configurations
        setErrorMessage(
          response.message || "Failed to initialize secure checkout session.",
        );
      }
    });
  };

  const hasAvailableSlots = availableDays.some((d) => d.slots?.length);

  return (
    <div className="max-w-7xl mx-auto px-4 space-y-6">
      {/* BACK */}
      <Button variant="ghost" asChild>
        <Link href="/educators">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT PROFILE */}
        <div className="md:col-span-1">
          <div className="md:sticky md:top-24">
            <Card className="border-emerald-900/20 bg-emerald-900/20 relative">
              <div className="absolute top-4 right-4 z-10">
                {hasAvailableSlots ? (
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1 animate-pulse">
                    ● Available Now
                  </Badge>
                ) : (
                  <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 px-3 py-1">
                    Offline
                  </Badge>
                )}
              </div>

              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="relative w-60 h-60 rounded-full overflow-hidden mb-4 bg-emerald-900/20">
                    {educator.imageUrl ? (
                      <Image
                        src={educator.imageUrl}
                        alt={educator.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="h-16 w-16 text-emerald-400" />
                      </div>
                    )}
                  </div>

                  <div className="text-center space-y-2 mb-6">
                    <h1 className="text-2xl font-bold text-white">
                      {educator.name}
                    </h1>
                    <p className="text-emerald-400 font-medium tracking-wide uppercase text-xs">
                      {educator.specialty} Specialist
                    </p>
                  </div>

                  <div className="flex items-center justify-center mb-2">
                    <Medal className="size-4 text-emerald-400 mr-2" />
                    <span className="text-muted-foreground">
                      {educator.experience} years experience
                    </span>
                  </div>
                  <Separator className="bg-emerald-900/20 my-4" />

                  <p className="text-muted-foreground whitespace-pre-line">
                    {educator.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* RIGHT WIZARD */}
        <div className="lg:col-span-2 space-y-4">
          <StepIndicator step={step} />

          {/* STEP 1 - TIME */}
          {step === "time" && (
            <Card className="bg-[#121212] border-white/10">
              <CardHeader>
                <CardTitle>Select Date & Time</CardTitle>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto bg-neutral-900/40 p-6 rounded-2xl border border-white/10">
                  {/* CALENDAR CONTAINER */}
                  <div className="md:col-span-2 flex justify-center p-2">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(d) => d && setSelectedDate(d)}
                      className="w-full max-w-full scale-105 transform origin-top transition-transform"
                    />
                  </div>

                  {/* CUSTOM TIME PICKER DROP-DOWNS */}
                  <div className="flex flex-col justify-between space-y-6 bg-neutral-950/50 p-4 rounded-xl border border-white/5">
                    <div className="space-y-4">
                      <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
                        Customize Session
                      </span>

                      {/* Start Input */}
                      <div className="space-y-1.5">
                        <label className="text-xs text-neutral-400 font-medium">
                          Start Time
                        </label>
                        <select
                          disabled={isPastDate}
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="w-full bg-neutral-900 text-white rounded-lg border border-white/10 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {timeOptions.map((opt) => {
                            const disabledOption = isTimeInPast(
                              opt.hour,
                              opt.minute,
                            );
                            return (
                              <option
                                key={`start-${opt.value}`}
                                value={opt.value}
                                disabled={disabledOption}
                                className={
                                  disabledOption
                                    ? "text-neutral-600 line-through"
                                    : ""
                                }
                              >
                                {opt.label} {disabledOption ? "(Past)" : ""}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {/* End Input */}
                      <div className="space-y-1.5">
                        <label className="text-xs text-neutral-400 font-medium">
                          End Time
                        </label>
                        <select
                          disabled={isPastDate}
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="w-full bg-neutral-900 text-white rounded-lg border border-white/10 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {timeOptions.map((opt) => {
                            const disabledOption = isTimeInPast(
                              opt.hour,
                              opt.minute,
                            );
                            return (
                              <option
                                key={`end-${opt.value}`}
                                value={opt.value}
                                disabled={disabledOption}
                                className={
                                  disabledOption
                                    ? "text-neutral-600 line-through"
                                    : ""
                                }
                              >
                                {opt.label} {disabledOption ? "(Past)" : ""}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>

                    <div className="text-xs text-neutral-500 italic text-center px-1">
                      {isPastDate ? (
                        <span className="text-red-400/80 not-italic font-medium">
                          Cannot select times in the past.
                        </span>
                      ) : isSelectedStartInPast || isSelectedEndInPast ? (
                        <span className="text-amber-400/90 not-italic font-medium">
                          Please select an upcoming time slot.
                        </span>
                      ) : (
                        "Selected window will update automatically."
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button
                    disabled={
                      !selectedSlot ||
                      isPastDate ||
                      isSelectedStartInPast ||
                      isSelectedEndInPast
                    }
                    onClick={goNext}
                    className="bg-emerald-600"
                  >
                    Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 2 */}
          {step === "details" && (
            <Card className="bg-[#121212] border-white/10">
              <CardHeader>
                <CardTitle>Session Details</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <textarea
                  className="w-full p-3 bg-black border border-white/10 text-white rounded h-28"
                  placeholder="Give detailed description here: Grade level, Topic, Learning Gap..."
                  value={sessionDetails.description}
                  onChange={(e) =>
                    setSessionDetails({
                      description: e.target.value,
                    })
                  }
                />

                <div className="flex justify-between">
                  <Button variant="outline" onClick={goBack}>
                    Back
                  </Button>

                  <Button onClick={goNext} className="bg-emerald-600">
                    Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 3 */}
          {step === "review" && (
            <Card className="bg-[#121212] border-white/10">
              <CardHeader>
                <CardTitle>Review</CardTitle>
              </CardHeader>

              <CardContent className="space-y-2 text-gray-300">
                <p>
                  <b>Educator:</b>
                  <br />
                  <span className="text-emerald-500">{educator.name}</span>
                </p>
                <p>
                  <b>Time:</b>
                  <br />
                  <span className="text-emerald-500">
                    {selectedSlot?.formatted}
                  </span>
                </p>
                <p>
                  <b>Description:</b>
                  <br />
                  <span className="text-emerald-500">
                    {sessionDetails.description}
                  </span>
                </p>

                <div className="flex justify-between mt-4">
                  <Button variant="outline" onClick={goBack}>
                    Back
                  </Button>

                  <Button onClick={goNext} className="bg-emerald-600">
                    Confirm
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 4 */}
          {/* STEP 4 - PAYMENT TYPE SELECTION */}
          {step === "payment" && (
            <Card className="bg-[#121212] border-white/10">
              <CardHeader>
                <CardTitle>Choose Your Billing Plan</CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Dynamically display transaction error messages if returned from server action */}
                {errorMessage && (
                  <div className="p-3 text-sm bg-red-950/40 border border-red-500/30 text-red-400 rounded-lg">
                    {errorMessage}
                  </div>
                )}

                {/* Option Container Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* OPTION A: ONE-ON-ONE HOURLY FLEXPAY */}
                  <div
                    onClick={() => setPaymentType("hourly")}
                    className={`cursor-pointer p-5 rounded-xl border transition-all flex flex-col justify-between ${
                      paymentType === "hourly"
                        ? "border-emerald-500 bg-emerald-950/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                        : "border-white/5 bg-neutral-900/40 hover:border-white/10"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-white font-semibold text-base">
                          Pay per session
                        </h3>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            paymentType === "hourly"
                              ? "border-emerald-500"
                              : "border-neutral-600"
                          }`}
                        >
                          {paymentType === "hourly" && (
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-neutral-400 leading-relaxed mb-4">
                        <p className="mb-2 font-medium text-neutral-300">
                          Included in this package:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-xs text-neutral-400 pl-1">
                          <li>Pay only for the minutes you schedule</li>
                          <li>No recurring monthly subscription fees</li>
                          <li>Ideal for quick reviews and flexible pacing</li>
                          <li>On-demand support for specific tasks</li>
                          <li>Zero long-term financial commitment</li>
                        </ul>
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-3 mt-2 flex items-baseline justify-between">
                      <span className="text-xs text-neutral-500">
                        Estimated Total:
                      </span>
                      <span className="text-lg font-bold text-white">
                        $
                        {calculatedDuration
                          ? ((calculatedDuration / 60) * 35).toFixed(2)
                          : "0.00"}
                        <span className="text-xs text-neutral-400 font-normal">
                          {" "}
                          / session
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* OPTION B: MONTHLY SUBSCRIPTION */}
                  <div
                    onClick={() => setPaymentType("monthly")}
                    className={`cursor-pointer p-5 rounded-xl border transition-all flex flex-col justify-between ${
                      paymentType === "monthly"
                        ? "border-emerald-500 bg-emerald-950/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                        : "border-white/5 bg-neutral-900/40 hover:border-white/10"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-semibold text-base">
                            Monthly Tier Pass
                          </h3>
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 uppercase text-[9px] px-1.5 py-0">
                            Best Value
                          </Badge>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            paymentType === "monthly"
                              ? "border-emerald-500"
                              : "border-neutral-600"
                          }`}
                        >
                          {paymentType === "monthly" && (
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-neutral-400 leading-relaxed mb-4">
                        <p className="mb-2 font-medium text-neutral-300">
                          Included in this package:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-xs text-neutral-400 pl-1">
                          <li>Unlocks unlimited live system access</li>
                          <li>Two (2) 60 minutes sessions per week </li>
                          <li>Predictable, fixed recurring monthly rate</li>
                          <li>Best value for consistent learning routines</li>
                          <li>Priority booking slots with educators</li>
                        </ul>
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-3 mt-2 flex items-baseline justify-between">
                      <span className="text-xs text-neutral-500">
                        Subscription Rate:
                      </span>
                      <span className="text-lg font-bold text-emerald-400">
                        $249.00
                        <span className="text-xs text-neutral-400 font-normal">
                          {" "}
                          / mo
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pricing summary breakdown box */}
                {/* Pricing summary breakdown box */}
                <div className="bg-neutral-950 p-4 rounded-xl border border-white/5 space-y-2">
                  <div className="flex justify-between text-xs text-neutral-400">
                    <span>Duration:</span>
                    <span className="text-white font-mono">
                      {paymentType === "hourly"
                        ? `${calculatedDuration} minutes`
                        : "60 mins (2 sessions weekly)"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-neutral-400">
                    <span>Selected Plan:</span>
                    <span className="text-emerald-400 capitalize font-medium">
                      {paymentType === "hourly"
                        ? "Pay-Per-Session Hourly"
                        : "Monthly Recurring Plan"}
                    </span>
                  </div>
                </div>

                {/* Form Action Controls */}
                <div className="flex items-center justify-between gap-4 pt-2">
                  <Button
                    variant="outline"
                    onClick={goBack}
                    disabled={isPending}
                  >
                    Back
                  </Button>

                  <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                    onClick={handlePaymentAndBooking}
                    disabled={isPending}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing Secure Checkout...
                      </>
                    ) : (
                      `Pay & Book Session`
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 5 */}
          {step === "success" && (
            <Card className="bg-[#121212] border-emerald-500/20">
              <CardContent className="text-center p-10">
                <h2 className="text-white text-xl font-bold">
                  Booking Confirmed 🎉
                </h2>

                <Button
                  className="mt-6 bg-emerald-600"
                  onClick={() => router.push("/learner")}
                >
                  Go to Dashboard
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
