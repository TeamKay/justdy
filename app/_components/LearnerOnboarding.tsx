"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar as CalendarIcon,
  CreditCard,
  Loader2,
  User,
  GraduationCap,
  Award,
  Lock,
  Mail,
  Clock,
  Sparkles,
} from "lucide-react";
import { getActiveOnboardingSubjects } from "@/app/actions/admin-subjects";
import { getOnboardingEducators } from "../actions/educator";

// Custom UI Component Imports
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import Image from "next/image";

const steps = ["Subject & Grade", "Program", "Schedule", "Review", "Payment"];

const stepColors = Array(6).fill("bg-[#4B4C4E]");

const gradeLevels = [
  "Grades 1–5 (Elementary Math)",
  "Grades 6–8 (Middle School Math)",
  "Grades 9–12 (High School Math & AP)",
  "College Math",
  "Adult Learner",
] as const;

const pricing = {
  "Grades 1–5 (Elementary Math)": {
    hourly: 35,
    monthly: 230,
    perks: "8 sessions/mo (Save $50)",
  },
  "Grades 6–8 (Middle School Math)": {
    hourly: 35,
    monthly: 230,
    perks: "8 sessions/mo (Save $50)",
  },
  "Grades 9–12 (High School Math & AP)": {
    hourly: 35,
    monthly: 230,
    perks: "8 sessions/mo (Save $50)",
  },
  "College Math": {
    hourly: 35,
    monthly: 230,
    perks: "8 sessions/mo (Save $50)",
  },
  "Adult Learner": {
    hourly: 35,
    monthly: 230,
    perks: "8 sessions/mo (Save $50)",
  },
};

interface SubjectDbItem {
  id: string;
  name: string;
  description: string | null;
}

interface EducatorDbItem {
  id: string;
  name: string;
  imageUrl: string | null;
  specialty: string | null;
  experience: number | null;
  description: string | null;
}

function formatDate(date: Date | undefined) {
  if (!date) return "";
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function LearnerOnboarding() {
  const [step, setStep] = useState(0);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [enrollmentType, setEnrollmentType] = useState<
    "hourly" | "monthly" | ""
  >("");

  const [showLanguageAlert, setShowLanguageAlert] = useState(false);

  // Scheduling states
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [sessionDate, setSessionDate] = useState<Date | undefined>(undefined);
  const [month, setMonth] = useState<Date | undefined>(new Date());
  const [dateInputValue, setDateInputValue] = useState("");

  const [startHour, setStartHour] = useState("10");
  const [startMinute, setStartMinute] = useState("30");
  const [startPeriod, setStartPeriod] = useState("AM");

  const [endHour, setEndHour] = useState("11");
  const [endMinute, setEndMinute] = useState("30");
  const [endPeriod, setEndPeriod] = useState("PM");

  const [topic, setTopic] = useState("");
  const [dbSubjects, setDbSubjects] = useState<SubjectDbItem[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);

  // Educator states
  const [educators, setEducators] = useState<EducatorDbItem[]>([]);
  const [isLoadingEducators, setIsLoadingEducators] = useState(true);

  const [billingName, setBillingName] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const currentPricing = pricing[gradeLevel as keyof typeof pricing] ?? {
    hourly: 0,
    monthly: 0,
  };

  const getTimeInMinutes = (
    hourStr: string,
    minuteStr: string,
    period: string,
  ) => {
    let hours = parseInt(hourStr, 10);
    const minutes = parseInt(minuteStr, 10);
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const calculatePrice = () => {
    if (!gradeLevel) return 0;
    if (enrollmentType === "monthly") return currentPricing.monthly;

    const startMins = getTimeInMinutes(startHour, startMinute, startPeriod);
    const endMins = getTimeInMinutes(endHour, endMinute, endPeriod);
    const diffMins = endMins - startMins;
    if (diffMins <= 0) return 0;
    return parseFloat(((diffMins / 60) * currentPricing.hourly).toFixed(2));
  };

  const isDateTimeInPast = () => {
    if (!sessionDate) return false;
    const now = new Date();
    const selectedDateTime = new Date(sessionDate);
    let hours = parseInt(startHour, 10);
    const minutes = parseInt(startMinute, 10);
    if (startPeriod === "PM" && hours !== 12) hours += 12;
    if (startPeriod === "AM" && hours === 12) hours = 0;
    selectedDateTime.setHours(hours, minutes, 0, 0);
    return selectedDateTime < now;
  };

  const isTimeRangeInvalid = () => {
    const startMins = getTimeInMinutes(startHour, startMinute, startPeriod);
    const endMins = getTimeInMinutes(endHour, endMinute, endPeriod);
    return endMins <= startMins;
  };

  useEffect(() => {
    async function loadSubjects() {
      try {
        const data = await getActiveOnboardingSubjects();
        setDbSubjects(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingSubjects(false);
      }
    }

    async function loadEducators() {
      try {
        const data = await getOnboardingEducators();
        setEducators(data);
      } catch (error) {
        console.error("Error fetching educators:", error);
      } finally {
        setIsLoadingEducators(false);
      }
    }

    loadSubjects();
    loadEducators();
  }, []);

  const next = () => setStep((prev) => prev + 1);
  const back = () => setStep((prev) => prev - 1);

  // Pick an educator assigned to their layout context or fallback gracefully
  const matchedEducator = educators[0] || null;

  const handleStripeCheckout = async () => {
    try {
      setIsProcessingPayment(true);
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: billingName,
          email: billingEmail,
          subject: selectedSubject,
          enrollmentType,
          amount: calculatePrice(),
          sessionDate: dateInputValue,
          startTime: `${startHour}:${startMinute} ${startPeriod}`,
          endTime: `${endHour}:${endMinute} ${endPeriod}`,
          gradeLevel,
          topic,
          educatorId: matchedEducator?.id || null,
        }),
      });

      const data = await response.json();
      if (data.url) window.location.assign(data.url);
    } catch (error) {
      console.error("Stripe checkout error:", error);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="grow h-full flex flex-col items-center justify-center bg-background px-6 py-10 relative">
      {/* SHADCN STYLE INTERSTITIAL MODAL */}
      <AnimatePresence>
        {showLanguageAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLanguageAlert(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Content Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="relative w-full max-w-sm rounded-xl border border-gray-100 bg-white p-6 shadow-2xl z-10 text-center select-none"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600 mb-4">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                Coming Soon!
              </h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                Languages sessions will be coming soon. We are currently
                polishing our curriculum to give you the best experience!
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setShowLanguageAlert(false)}
                  className="w-full inline-flex justify-center rounded-md bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all"
                >
                  Got it, thanks!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="text-center mb-6 select-none">
        <h1 className="text-2xl font-extrabold tracking-tight text-white/70 sm:text-3xl pt-10">
          Start Your Personalized Math Success Plan
        </h1>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mt-1">
          Step {step + 1} of {steps.length} — {steps[step]}
        </p>
      </div>

      {/* STEPPER BAR */}
      <div className="w-full max-w-4xl mb-10 overflow-x-auto no-scrollbar">
        <div className="flex items-center min-w-175 w-full select-none">
          {steps.map((item, index) => {
            const isActiveOrPassed = index <= step;
            const baseColor = stepColors[index];
            return (
              <div
                key={item}
                className="relative flex-1 h-12 flex items-center justify-center transition-opacity duration-300"
                style={{
                  clipPath:
                    "polygon(0% 0%, calc(100% - 12px) 0%, 100% 50%, calc(100% - 12px) 100%, 0% 100%, 12px 50%)",
                  marginLeft: index === 0 ? "0px" : "-10px",
                  zIndex: steps.length - index,
                }}
              >
                <div
                  className={`absolute inset-0 transition-colors duration-300 ${isActiveOrPassed ? baseColor : "bg-gray-200"}`}
                />
                <span
                  className={`relative z-10 text-[10px] font-bold tracking-wider uppercase pl-2 ${isActiveOrPassed ? "text-white" : "text-gray-400"}`}
                >
                  {item}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* CONTENT BOX */}
      <div className="max-w-xl w-full bg-white rounded-md shadow-lg p-8">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {/* STEP 1: SUBJECT & GRADE LEVEL */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-[#4B4C4E]">
                What & who are we teaching?
              </h2>
              <div>
                <label className="block text-sm font-medium mb-1 text-[#4B4C4E]">
                  Grade Level
                </label>
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="w-full border rounded-md p-3 text-sm text-[#4B4C4E] bg-white"
                >
                  <option value="">Select Grade Level</option>
                  {gradeLevels.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
              </div>

              <label className="block text-sm font-medium text-[#4B4C4E] mb-2">
                Select Subject
              </label>
              {isLoadingSubjects ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="grid gap-3">
                  {dbSubjects.map((sub) => (
                    <button
                      key={sub.id}
                      disabled={!gradeLevel}
                      onClick={() => {
                        if (sub.name.trim().toLowerCase() === "languages") {
                          setShowLanguageAlert(true);
                          return;
                        }
                        setSelectedSubject(sub.name);
                        next();
                      }}
                      className="border border-gray-200 rounded-md p-4 text-left hover:bg-gray-100 disabled:opacity-50 transition-colors"
                    >
                      <span className="font-semibold text-sm text-[#4B4C4E]">
                        {sub.name}
                      </span>
                      {sub.description && (
                        <span className="text-xs text-gray-500 mt-1 line-clamp-1 overflow-hidden block">
                          {sub.description.replace(/<[^>]*>/g, "").trim()}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: PROGRAM SELECTION */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold mb-2 text-[#4B4C4E]">
                Join Our Math Success Program
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Most learners make faster progress with a structured plan.
              </p>
              <div className="space-y-4">
                <button
                  onClick={() => setEnrollmentType("monthly")}
                  className={`relative w-full border rounded-md p-5 text-left ${enrollmentType === "monthly" ? "border-black bg-gray-50" : "border-gray-200"}`}
                >
                  <span className="absolute top-4 right-5 text-right">
                    <div className="text-2xl font-bold text-[#4B4C4E]">
                      ${currentPricing.monthly}
                      <span className="text-sm font-medium">/mo</span>
                    </div>

                    <div className="mt-1 text-xs font-medium text-green-600">
                      {currentPricing.perks}
                    </div>
                  </span>

                  <span className="absolute top-18 right-5 text-[10px] font-bold uppercase bg-green-100 text-green-700 px-2 py-1 rounded">
                    Most Popular
                  </span>
                  <div className="font-semibold text-lg pr-28 text-[#4B4C4E]">
                    Weekly Learning Plan
                  </div>
                  <ul className="space-y-1 text-xs text-gray-600 mt-3">
                    <li>✓ 8 sessions, twice a week each month</li>
                    <li>✓ Homework support between lessons</li>
                    <li>✓ Progress tracking & Priority scheduling</li>
                  </ul>
                </button>

                <button
                  onClick={() => setEnrollmentType("hourly")}
                  className={`relative w-full border rounded-md p-5 text-left ${enrollmentType === "hourly" ? "border-black bg-gray-50" : "border-gray-200"}`}
                >
                  <span className="absolute top-4 right-5 text-2xl font-bold text-[#4B4C4E]">
                    ${currentPricing.hourly}
                    <span className="text-sm font-medium">/hr</span>
                  </span>
                  <div className="font-semibold text-lg pr-24 text-[#4B4C4E]">
                    Hourly Session
                  </div>
                  <ul className="space-y-1 text-xs text-gray-600 mt-3">
                    <li>✓ Flexible scheduling</li>
                    <li>✓ Ideal for exam preparation</li>
                    <li>✓ No long-term commitment</li>
                  </ul>
                </button>

                <button
                  onClick={next}
                  disabled={!enrollmentType}
                  className="w-full bg-black text-white py-3 rounded-md disabled:opacity-50 mt-4"
                >
                  Continue
                </button>

                <div className="text-left mt-0">
                  <button
                    type="button"
                    onClick={back}
                    className="text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors hover:underline"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SCHEDULE DETAILS (REDESIGNED TIME PICKER) */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                  {enrollmentType === "monthly"
                    ? "Schedule Your Weekly Plan"
                    : "Schedule Your Session"}
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Pick your preferred date and continuous time slot below.
                </p>
              </div>

              <div className="space-y-4">
                {/* Modern Date Picker Field */}
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Select Date
                  </label>
                  <Popover
                    open={openDatePicker}
                    onOpenChange={setOpenDatePicker}
                  >
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3.5 py-2.5 text-left text-sm text-gray-900 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-black"
                      >
                        <span
                          className={
                            dateInputValue
                              ? "text-gray-900 font-medium"
                              : "text-gray-400"
                          }
                        >
                          {dateInputValue || "Choose a date..."}
                        </span>
                        <CalendarIcon className="h-4 w-4 text-gray-400" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 bg-background border border-background rounded-md shadow-lg"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={sessionDate}
                        month={month}
                        onMonthChange={setMonth}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        onSelect={(date) => {
                          setSessionDate(date);
                          setDateInputValue(formatDate(date));
                          setOpenDatePicker(false);
                        }}
                        className="bg-amber-100 rounded-md p-3"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Modern & Professional Shadcn-Style Time Pickers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Start Time Container */}
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-gray-400" /> Start Time
                    </label>
                    <div className="flex items-center space-x-1.5 bg-white px-3 py-2.5 rounded-md border border-gray-300 shadow-sm focus-within:ring-1 focus-within:ring-black focus-within:border-black transition-all">
                      <select
                        value={startHour}
                        onChange={(e) => setStartHour(e.target.value)}
                        className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer w-7 appearance-none text-center text-gray-900"
                      >
                        {Array.from({ length: 12 }, (_, i) =>
                          String(i + 1).padStart(2, "0"),
                        ).map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                      <span className="text-gray-400 font-medium select-none">
                        :
                      </span>
                      <select
                        value={startMinute}
                        onChange={(e) => setStartMinute(e.target.value)}
                        className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer w-7 appearance-none text-center text-gray-900"
                      >
                        {Array.from({ length: 60 }, (_, i) =>
                          String(i).padStart(2, "0"),
                        ).map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>

                      {/* AM / PM Segmented Controller */}
                      <div className="flex rounded-md border border-gray-200 p-0.5 bg-gray-50 ml-auto select-none">
                        <button
                          type="button"
                          onClick={() => setStartPeriod("AM")}
                          className={`px-2 py-1 text-[10px] font-bold rounded transition-all ${startPeriod === "AM" ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-gray-900"}`}
                        >
                          AM
                        </button>
                        <button
                          type="button"
                          onClick={() => setStartPeriod("PM")}
                          className={`px-2 py-1 text-[10px] font-bold rounded transition-all ${startPeriod === "PM" ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-gray-900"}`}
                        >
                          PM
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* End Time Container */}
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-gray-400" /> End Time
                    </label>
                    <div className="flex items-center space-x-1.5 bg-white px-3 py-2.5 rounded-md border border-gray-300 shadow-sm focus-within:ring-1 focus-within:ring-black focus-within:border-black transition-all">
                      <select
                        value={endHour}
                        onChange={(e) => setEndHour(e.target.value)}
                        className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer w-7 appearance-none text-center text-gray-900"
                      >
                        {Array.from({ length: 12 }, (_, i) =>
                          String(i + 1).padStart(2, "0"),
                        ).map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                      <span className="text-gray-400 font-medium select-none">
                        :
                      </span>
                      <select
                        value={endMinute}
                        onChange={(e) => setEndMinute(e.target.value)}
                        className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer w-7 appearance-none text-center text-gray-900"
                      >
                        {Array.from({ length: 60 }, (_, i) =>
                          String(i).padStart(2, "0"),
                        ).map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>

                      {/* AM / PM Segmented Controller */}
                      <div className="flex rounded-md border border-gray-200 p-0.5 bg-gray-50 ml-auto select-none">
                        <button
                          type="button"
                          onClick={() => setEndPeriod("AM")}
                          className={`px-2 py-1 text-[10px] font-bold rounded transition-all ${endPeriod === "AM" ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-gray-900"}`}
                        >
                          AM
                        </button>
                        <button
                          type="button"
                          onClick={() => setEndPeriod("PM")}
                          className={`px-2 py-1 text-[10px] font-bold rounded transition-all ${endPeriod === "PM" ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-gray-900"}`}
                        >
                          PM
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Validation Banners */}
                {isDateTimeInPast() && (
                  <div className="p-3 rounded-md bg-red-50 border border-red-100 text-xs font-medium text-red-600">
                    ⚠️ The selected time window has already passed.
                  </div>
                )}
                {isTimeRangeInvalid() && (
                  <div className="p-3 rounded-md bg-red-50 border border-red-100 text-xs font-medium text-red-600">
                    ⚠️ Invalid duration: End time must be set after the start
                    time.
                  </div>
                )}

                {/* Additional Details */}
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Additional Learning Details
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Tell us about specific concepts, exam deadlines, or homework goals to focus on..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full border border-gray-200 rounded-md p-3 text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black resize-none shadow-sm"
                  />
                </div>

                <button
                  onClick={next}
                  disabled={
                    !dateInputValue ||
                    isDateTimeInPast() ||
                    isTimeRangeInvalid() ||
                    !topic.trim()
                  }
                  className="w-full bg-black text-white py-3.5 rounded-md disabled:opacity-40 text-sm font-semibold hover:bg-black/90 tracking-wide shadow-sm transition-all mt-2"
                >
                  Review Booking Details
                </button>

                <div className="text-left mt-0">
                  <button
                    type="button"
                    onClick={back}
                    className="text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors hover:underline"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW BOOKING DETAILS WITH EDUCATOR SUMMARY */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-[#4B4C4E]">
                Review Your Selection
              </h2>

              <div className="border border-gray-200 rounded-md p-5 bg-gray-50 space-y-3 text-sm text-[#4B4C4E]">
                <div className="flex justify-between border-b pb-2 border-gray-200">
                  <span className="text-gray-500 font-medium">Grade Level</span>
                  <span className="font-bold text-right max-w-62.5 truncate">
                    {gradeLevel}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2 border-gray-200">
                  <span className="text-gray-500 font-medium">Subject</span>
                  <span className="font-bold">{selectedSubject}</span>
                </div>
                <div className="flex justify-between border-b pb-2 border-gray-200">
                  <span className="text-gray-500 font-medium">
                    Program Type
                  </span>
                  <span className="font-bold uppercase text-xs bg-gray-200 px-2 py-0.5 rounded tracking-wider">
                    {enrollmentType === "monthly"
                      ? "📅 Monthly Plan"
                      : "⏱️ Hourly Session"}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2 border-gray-200">
                  <span className="text-gray-500 font-medium">
                    Date Selected
                  </span>
                  <span className="font-bold">{dateInputValue}</span>
                </div>
                <div className="flex justify-between border-b pb-2 border-gray-200">
                  <span className="text-gray-500 font-medium">Time Window</span>
                  <span className="font-bold">
                    {startHour}:{startMinute} {startPeriod} - {endHour}:
                    {endMinute} {endPeriod}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 bg-white p-3 rounded-md border border-gray-200 shadow-sm">
                  <span className="font-bold text-gray-700">
                    Total Amount Due
                  </span>
                  <span className="text-2xl font-extrabold text-black">
                    ${calculatePrice().toFixed(2)}
                  </span>
                </div>

                {/* Dynamically calculated duration row for hourly track */}
                {enrollmentType === "hourly" && (
                  <div className="flex justify-between text-xs text-gray-500 px-3 pt-1 italic">
                    <span>Calculated Duration</span>
                    <span>
                      {(
                        (getTimeInMinutes(endHour, endMinute, endPeriod) -
                          getTimeInMinutes(
                            startHour,
                            startMinute,
                            startPeriod,
                          )) /
                        60
                      ).toFixed(2)}{" "}
                      hours
                    </span>
                  </div>
                )}
              </div>

              {/* Educator Information Sub-Card */}
              <div className="border border-gray-200 rounded-md p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Your Assigned Expert
                </h3>
                {isLoadingEducators ? (
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Loader2 size={14} className="animate-spin" /> Matching
                    perfect educator...
                  </div>
                ) : matchedEducator ? (
                  <div className="flex items-start gap-4">
                    {matchedEducator.imageUrl ? (
                      <Image
                        src={matchedEducator.imageUrl}
                        alt={matchedEducator.name}
                        className="w-14 h-14 rounded-full object-cover border border-gray-100 shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center border border-gray-100 text-gray-400 shrink-0">
                        <User size={24} />
                      </div>
                    )}
                    <div className="space-y-1 min-w-0">
                      <h4 className="font-bold text-sm text-[#4B4C4E]">
                        {matchedEducator.name}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                        {matchedEducator.specialty && (
                          <span className="flex items-center gap-1">
                            <GraduationCap size={14} />{" "}
                            {matchedEducator.specialty}
                          </span>
                        )}
                        {matchedEducator.experience && (
                          <span className="flex items-center gap-1">
                            <Award size={14} /> {matchedEducator.experience} yrs
                            exp
                          </span>
                        )}
                      </div>
                      {matchedEducator.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1 italic pt-1 border-t border-gray-50">
                          &quot;
                          {matchedEducator.description
                            .replace(/<[^>]*>/g, "")
                            .trim()}
                          &quot;
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">
                    An elite mathematics expert will be matched to your track
                    upon confirmation.
                  </p>
                )}
              </div>

              <button
                onClick={next}
                className="w-full bg-black text-white py-3 rounded-md text-sm font-medium hover:bg-black/90 transition-colors"
              >
                Proceed to Payment
              </button>

              <div className="text-left mt-0">
                <button
                  type="button"
                  onClick={back}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors hover:underline"
                >
                  Go Back
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: PAYMENT */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[#4B4C4E]">
                  Complete Payment
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Please provide your billing contact info. All checkout
                  sessions are encrypted.
                </p>
              </div>

              {/* Dynamic Compact Plan Summary Banner */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-150 flex items-center justify-between text-sm text-[#4B4C4E]">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                    Selected Plan
                  </span>
                  <span className="font-bold truncate max-w-60 block">
                    {selectedSubject} (
                    {enrollmentType === "monthly" ? "Monthly" : "Hourly"})
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                    Due Now
                  </span>
                  <span className="text-lg font-black text-black">
                    ${calculatePrice().toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Form Input Groups */}
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="billingName"
                    className="flex items-center text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5"
                  >
                    Full Name{" "}
                    <span className="text-red-500 ml-1 font-sans">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <User size={16} />
                    </div>
                    <input
                      id="billingName"
                      type="text"
                      required
                      placeholder="e.g. Jane Doe"
                      value={billingName}
                      onChange={(e) => setBillingName(e.target.value)}
                      className="w-full border border-gray-250 bg-white rounded-md pl-10 pr-4 py-3 text-sm text-[#4B4C4E] placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="billingEmail"
                    className="flex items-center text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5"
                  >
                    Email Address{" "}
                    <span className="text-red-500 ml-1 font-sans">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Mail size={16} />
                    </div>
                    <input
                      id="billingEmail"
                      type="email"
                      required
                      placeholder="e.g. learner@example.com"
                      value={billingEmail}
                      onChange={(e) => setBillingEmail(e.target.value)}
                      className="w-full border border-gray-250 bg-white rounded-md pl-10 pr-4 py-3 text-sm text-[#4B4C4E] placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Secure Transaction Notice */}
              <div className="bg-emerald-50/60 border border-emerald-100 rounded-lg p-3.5 flex items-start gap-3">
                <Lock size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-emerald-800">
                    Secure Checkout Guarantee
                  </p>
                  <p className="text-[11px] text-emerald-700/90 leading-normal">
                    We secure your data via Stripe. No raw financial credentials
                    or credit card numbers are collected on our local platform
                    servers.
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleStripeCheckout}
                disabled={
                  !billingName.trim() ||
                  !billingEmail.trim() ||
                  isProcessingPayment
                }
                className="w-full bg-black text-white py-3.5 rounded-md text-sm font-semibold hover:bg-black/90 disabled:opacity-40 disabled:hover:bg-black transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Initializing Checkout Gateway...
                  </>
                ) : (
                  <>
                    <CreditCard size={16} />
                    {enrollmentType === "monthly"
                      ? "Authorize Subscription & Checkout"
                      : "Confirm & Launch Secure Checkout"}
                  </>
                )}
              </button>

              <div className="text-left mt-0">
                <button
                  type="button"
                  onClick={back}
                  disabled={isProcessingPayment}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-800 disabled:opacity-40 transition-colors hover:underline"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
