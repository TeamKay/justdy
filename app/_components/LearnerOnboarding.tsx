"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Calendar as CalendarIcon,
  CreditCard,
  Loader2,
  User,
  Lock,
  Mail,
  Clock,
  ArrowRight,
  CheckCircle2,
  Search,
  X,
  Sparkles,
} from "lucide-react";
import { getOnboardingEducators } from "../actions/educator";

// UI Imports
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

const steps = [
  "Topic & Focus",
  "Select Session",
  "Schedule",
  "Review",
  "Checkout",
];

// Flat list of topics for search & filter
const allTopics = [
  // Academic & Sciences
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Economics",
  "Statistics",
  // Tech & Software
  "Web Development",
  "Python Programming",
  "Data Analysis & AI",
  "Cybersecurity",
  "Cloud Computing",
  "Mobile App Development",
  // Business & Growth
  "Accounting & Finance",
  "Marketing Strategy",
  "Entrepreneurship",
  "Product Management",
  "Sales & Business Development",
  // Career & Leadership
  "Interview Preparation",
  "Resume & Portfolio Review",
  "Career Guidance",
  "Leadership Coaching",
  "Public Speaking",
] as const;

// Quick access badges below search bar
const popularQuickPicks = [
  "Mathematics",
  "Web Development",
  "Python Programming",
  "Data Analysis & AI",
] as const;

// Inclusive Current Stages
const stageOptions = [
  "K-12 Student",
  "College / University Student",
  "Working Professional",
  "Lifelong Learner",
] as const;

// Goal chips for Step 1
const purposeOptions = [
  "Understand a topic",
  "Complete an assignment",
  "Prepare for an exam",
  "Build a project",
] as const;

// Duration / Session format options (Time-based pricing)
const durationPricing = {
  "30": {
    name: "30 Minutes",
    price: 30,
    desc: "Quick Q&A, topic sanity check, or targeted feedback.",
  },
  "60": {
    name: "60 Minutes",
    price: 55,
    desc: "Standard deep dive, lesson execution, or project review.",
  },
  "90": {
    name: "90 Minutes",
    price: 80,
    desc: "Intensive session, multi-topic prep, or guided build.",
  },
};

const recurringPricing = {
  weekly: {
    name: "Weekly Plan",
    price: 200,
    desc: "4 sessions / month (Save $20) — Steady skill growth",
  },
  biweekly: {
    name: "Twice Weekly Plan",
    price: 380,
    desc: "8 sessions / month (Save $60) — Fast-track goals",
  },
};

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

  // Step 1: Option 2 Combobox + Quick Pick States
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [areaOfInterest, setAreaOfInterest] = useState("");
  const [currentStage, setCurrentStage] = useState("");
  const [sessionPurpose, setSessionPurpose] = useState("");

  // Step 2: Session Type & Duration
  const [sessionType, setSessionType] = useState<"one-time" | "coaching">(
    "one-time",
  );
  const [selectedDuration, setSelectedDuration] = useState<"30" | "60" | "90">(
    "60",
  );
  const [recurringFrequency, setRecurringFrequency] = useState<
    "weekly" | "biweekly"
  >("weekly");

  // Step 3: Schedule & Details
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [sessionDate, setSessionDate] = useState<Date | undefined>(undefined);
  const [month, setMonth] = useState<Date | undefined>(new Date());
  const [dateInputValue, setDateInputValue] = useState("");

  const [startHour, setStartHour] = useState("10");
  const [startMinute, setStartMinute] = useState("00");
  const [startPeriod, setStartPeriod] = useState("AM");

  const [goalsNotes, setGoalsNotes] = useState("");

  // Step 5: Checkout
  const [billingName, setBillingName] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Educator states
  const [educators, setEducators] = useState<EducatorDbItem[]>([]);

  useEffect(() => {
    async function loadEducators() {
      try {
        const data = await getOnboardingEducators();
        setEducators(data);
      } catch (error) {
        console.error("Error fetching educators:", error);
      }
    }
    loadEducators();
  }, []);

  // Filtered topics based on user search
  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) return allTopics;
    return allTopics.filter((t) =>
      t.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery]);

  const selectTopic = (topic: string) => {
    setAreaOfInterest(topic);
    setSearchQuery(topic);
    setIsDropdownOpen(false);
  };

  const clearTopicSelection = () => {
    setAreaOfInterest("");
    setSearchQuery("");
  };

  const next = () => setStep((prev) => prev + 1);
  const back = () => setStep((prev) => prev - 1);

  // Dynamic Price Calculation
  const calculatePrice = () => {
    if (sessionType === "one-time") {
      return durationPricing[selectedDuration].price;
    }
    return recurringPricing[recurringFrequency].price;
  };

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
          areaOfInterest,
          currentStage,
          sessionPurpose,
          sessionType,
          durationOrFrequency:
            sessionType === "one-time"
              ? `${selectedDuration} Minutes`
              : recurringFrequency,
          amount: calculatePrice(),
          sessionDate: dateInputValue,
          startTime: `${startHour}:${startMinute} ${startPeriod}`,
          goalsNotes,
          educatorId: matchedEducator?.id || null,
        }),
      });

      const data = await response.json();
      if (data.url) window.location.assign(data.url);
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="grow h-full flex flex-col items-center justify-center bg-background px-4 py-10 text-slate-100 relative">
      {/* HEADER / WELCOME TEXT */}
      <div className="text-center mb-8 max-w-2xl select-none pt-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Book a Personalized Learning Session
        </h1>
      </div>

      {/* STEPPER BAR */}
      <div className="w-full max-w-3xl mb-8 overflow-x-auto no-scrollbar">
        <div className="flex items-center min-w-150 w-full select-none">
          {steps.map((item, index) => {
            const isActiveOrPassed = index <= step;
            return (
              <div
                key={item}
                className="relative flex-1 h-10 flex items-center justify-center transition-all duration-300"
                style={{
                  clipPath:
                    "polygon(0% 0%, calc(100% - 10px) 0%, 100% 50%, calc(100% - 10px) 100%, 0% 100%, 10px 50%)",
                  marginLeft: index === 0 ? "0px" : "-8px",
                  zIndex: steps.length - index,
                }}
              >
                <div
                  className={`absolute inset-0 transition-colors duration-300 ${
                    isActiveOrPassed ? "bg-indigo-600" : "bg-slate-800"
                  }`}
                />
                <span
                  className={`relative z-10 text-[10px] sm:text-xs font-semibold tracking-wider uppercase pl-2 ${
                    isActiveOrPassed ? "text-white" : "text-slate-400"
                  }`}
                >
                  {item}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* CONTENT BOX */}
      <div className="max-w-xl w-full bg-white rounded-xl shadow-2xl p-6 sm:p-8 text-slate-900 border border-slate-200">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.18 }}
        >
          {/* STEP 1: CHOOSE YOUR TOPIC & FOCUS (OPTION 2: SEARCH + QUICK PICKS) */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  What would you like help with?
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Search or pick a topic below, then set your goal and stage.
                </p>
              </div>

              {/* Search Combobox Input */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Area of Interest
                </label>

                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search topics (e.g. Python, Interview Prep, Finance)..."
                    value={searchQuery}
                    onFocus={() => setIsDropdownOpen(true)}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setAreaOfInterest(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    className="w-full pl-9 pr-9 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-none shadow-xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={clearTopicSelection}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}

                  {/* Dropdown Menu */}
                  {isDropdownOpen && filteredTopics.length > 0 && (
                    <div className="absolute z-30 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-xl py-1">
                      {filteredTopics.map((topic) => (
                        <button
                          key={topic}
                          type="button"
                          onClick={() => selectTopic(topic)}
                          className={`w-full text-left px-3.5 py-2 text-xs transition-colors flex items-center justify-between ${
                            areaOfInterest === topic
                              ? "bg-indigo-50 font-semibold text-indigo-900"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span>{topic}</span>
                          {areaOfInterest === topic && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Popular Quick Pick Badges */}
                <div className="pt-1">
                  <span className="text-[11px] font-medium text-slate-400 block mb-1.5 items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" /> Popular
                    right now:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {popularQuickPicks.map((quick) => {
                      const isSelected = areaOfInterest === quick;
                      return (
                        <button
                          key={quick}
                          type="button"
                          onClick={() => selectTopic(quick)}
                          className={`px-2.5 py-1 text-[11px] rounded-md border transition-all ${
                            isSelected
                              ? "bg-slate-900 text-white border-slate-900 font-medium shadow-xs"
                              : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          {quick}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Session Purpose Chips */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  What would you like to accomplish?
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {purposeOptions.map((purpose) => (
                    <button
                      key={purpose}
                      type="button"
                      onClick={() => setSessionPurpose(purpose)}
                      className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                        sessionPurpose === purpose
                          ? "bg-slate-900 text-white border-slate-900 font-medium"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {purpose}
                    </button>
                  ))}
                </div>
              </div>

              {/* Current Stage */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Current Stage (Optional)
                </label>
                <select
                  value={currentStage}
                  onChange={(e) => setCurrentStage(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                >
                  <option value="">Select your stage...</option>
                  {stageOptions.map((stg) => (
                    <option key={stg} value={stg}>
                      {stg}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={next}
                disabled={!areaOfInterest.trim() || !sessionPurpose}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-lg font-semibold text-xs sm:text-sm disabled:opacity-40 transition-all shadow-sm flex items-center justify-center gap-2"
              >
                Continue to Session Selection <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: SELECT YOUR SESSION */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Choose Your Session Format
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Select flexible single sessions or structured recurring
                  mentorship.
                </p>
              </div>

              {/* Toggle Switch */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl select-none">
                <button
                  type="button"
                  onClick={() => setSessionType("one-time")}
                  className={`py-2.5 text-xs font-semibold rounded-lg transition-all ${
                    sessionType === "one-time"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  One-Time Session
                </button>
                <button
                  type="button"
                  onClick={() => setSessionType("coaching")}
                  className={`py-2.5 text-xs font-semibold rounded-lg transition-all ${
                    sessionType === "coaching"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Ongoing Coaching
                </button>
              </div>

              {/* One-Time Duration Cards */}
              {sessionType === "one-time" && (
                <div className="space-y-3">
                  {(
                    Object.keys(durationPricing) as Array<
                      keyof typeof durationPricing
                    >
                  ).map((dur) => {
                    const item = durationPricing[dur];
                    return (
                      <button
                        key={dur}
                        type="button"
                        onClick={() => setSelectedDuration(dur)}
                        className={`w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                          selectedDuration === dur
                            ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div>
                          <div className="font-bold text-sm text-slate-900">
                            {item.name}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {item.desc}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-black text-slate-900">
                            ${item.price}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Recurring Coaching Cards */}
              {sessionType === "coaching" && (
                <div className="space-y-3">
                  {(
                    Object.keys(recurringPricing) as Array<
                      keyof typeof recurringPricing
                    >
                  ).map((freq) => {
                    const item = recurringPricing[freq];
                    return (
                      <button
                        key={freq}
                        type="button"
                        onClick={() => setRecurringFrequency(freq)}
                        className={`w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                          recurringFrequency === freq
                            ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div>
                          <div className="font-bold text-sm text-slate-900">
                            {item.name}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {item.desc}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-black text-slate-900">
                            ${item.price}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            /month
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <button
                onClick={next}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-lg font-semibold text-xs sm:text-sm transition-all shadow-sm"
              >
                Continue to Schedule
              </button>

              <div className="text-left">
                <button
                  type="button"
                  onClick={back}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
                >
                  ← Go Back
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SCHEDULE & GOALS */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Schedule & Set Your Goals
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Pick your preferred booking window and let your expert know
                  what to expect.
                </p>
              </div>

              {/* Date Selection */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Preferred Date
                </label>
                <Popover open={openDatePicker} onOpenChange={setOpenDatePicker}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-left text-xs sm:text-sm text-slate-900 shadow-xs hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    >
                      <span
                        className={
                          dateInputValue ? "font-medium" : "text-slate-400"
                        }
                      >
                        {dateInputValue || "Choose session date..."}
                      </span>
                      <CalendarIcon className="h-4 w-4 text-slate-400" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 bg-white border border-slate-200 rounded-lg shadow-xl"
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
                      className="p-3"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time Picker */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" /> Preferred
                  Start Time
                </label>
                <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border border-slate-300 shadow-xs focus-within:ring-2 focus-within:ring-indigo-600 max-w-xs">
                  <select
                    value={startHour}
                    onChange={(e) => setStartHour(e.target.value)}
                    className="bg-transparent text-xs sm:text-sm font-semibold focus:outline-none cursor-pointer text-slate-900"
                  >
                    {Array.from({ length: 12 }, (_, i) =>
                      String(i + 1).padStart(2, "0"),
                    ).map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                  <span className="text-slate-400 font-bold">:</span>
                  <select
                    value={startMinute}
                    onChange={(e) => setStartMinute(e.target.value)}
                    className="bg-transparent text-xs sm:text-sm font-semibold focus:outline-none cursor-pointer text-slate-900"
                  >
                    {["00", "15", "30", "45"].map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <div className="flex rounded-md border border-slate-200 p-0.5 bg-slate-100 ml-auto select-none">
                    <button
                      type="button"
                      onClick={() => setStartPeriod("AM")}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                        startPeriod === "AM"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-500"
                      }`}
                    >
                      AM
                    </button>
                    <button
                      type="button"
                      onClick={() => setStartPeriod("PM")}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                        startPeriod === "PM"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-500"
                      }`}
                    >
                      PM
                    </button>
                  </div>
                </div>
              </div>

              {/* Tell us about your goals */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Tell us about your goals
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe what you'd like to achieve during this session. Include any topics, assignments, projects, questions, or specific challenges you'd like to work on."
                  value={goalsNotes}
                  onChange={(e) => setGoalsNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-3 text-xs sm:text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-600 focus:outline-none resize-none shadow-xs"
                />
              </div>

              <button
                onClick={next}
                disabled={!dateInputValue || !goalsNotes.trim()}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-lg font-semibold text-xs sm:text-sm disabled:opacity-40 transition-all shadow-sm"
              >
                Review Booking Details
              </button>

              <div className="text-left">
                <button
                  type="button"
                  onClick={back}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
                >
                  ← Go Back
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW PAGE */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Review Details
              </h2>

              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50 space-y-3 text-xs sm:text-sm text-slate-700">
                <div className="flex justify-between border-b border-slate-200/80 pb-2">
                  <span className="text-slate-500">Area of Interest</span>
                  <span className="font-semibold text-slate-900">
                    {areaOfInterest}
                  </span>
                </div>
                {currentStage && (
                  <div className="flex justify-between border-b border-slate-200/80 pb-2">
                    <span className="text-slate-500">Current Stage</span>
                    <span className="font-semibold text-slate-900">
                      {currentStage}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-b border-slate-200/80 pb-2">
                  <span className="text-slate-500">Session Type</span>
                  <span className="font-semibold uppercase text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded tracking-wide">
                    {sessionType === "one-time"
                      ? `${durationPricing[selectedDuration].name} Session`
                      : recurringPricing[recurringFrequency].name}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200/80 pb-2">
                  <span className="text-slate-500">Primary Goal</span>
                  <span className="font-semibold text-slate-900">
                    {sessionPurpose}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200/80 pb-2">
                  <span className="text-slate-500">Date & Start Time</span>
                  <span className="font-semibold text-slate-900">
                    {dateInputValue} at {startHour}:{startMinute} {startPeriod}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
                  <span className="font-bold text-slate-900">
                    Total Investment
                  </span>
                  <span className="text-2xl font-extrabold text-slate-900">
                    ${calculatePrice().toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                onClick={next}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-lg font-semibold text-xs sm:text-sm transition-all shadow-sm"
              >
                Proceed to Checkout
              </button>

              <div className="text-left">
                <button
                  type="button"
                  onClick={back}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
                >
                  ← Go Back
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: CHECKOUT & PAYMENT */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Checkout & Confirm
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Enter contact information to receive your meeting invitation.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Jane Doe"
                      value={billingName}
                      onChange={(e) => setBillingName(e.target.value)}
                      className="w-full pl-9 border border-slate-300 rounded-lg p-2.5 text-xs sm:text-sm text-slate-900 bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      placeholder="jane@example.com"
                      value={billingEmail}
                      onChange={(e) => setBillingEmail(e.target.value)}
                      className="w-full pl-9 border border-slate-300 rounded-lg p-2.5 text-xs sm:text-sm text-slate-900 bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-medium text-slate-600">
                      Encrypted Checkout via Stripe
                    </span>
                  </div>
                  <span className="text-sm font-extrabold text-slate-900">
                    ${calculatePrice().toFixed(2)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleStripeCheckout}
                  disabled={
                    !billingName || !billingEmail || isProcessingPayment
                  }
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 rounded-lg font-semibold text-xs sm:text-sm disabled:opacity-40 transition-all shadow-sm flex items-center justify-center gap-2 mt-2"
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" /> Complete Payment
                    </>
                  )}
                </button>

                <div className="text-left">
                  <button
                    type="button"
                    onClick={back}
                    className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    ← Go Back
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// "use client";

// import { useState, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   Calendar as CalendarIcon,
//   CreditCard,
//   Loader2,
//   User,
//   Lock,
//   Mail,
//   Clock,
//   Sparkles,
//   ArrowRight,
//   CheckCircle2,
// } from "lucide-react";
// import { getActiveOnboardingSubjects } from "@/app/actions/admin-subjects";
// import { getOnboardingEducators } from "../actions/educator";

// // Custom UI Component Imports
// import { Calendar } from "@/components/ui/calendar";
// import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

// const steps = ["Target Level", "Program", "Schedule", "Review", "Payment"];

// const stepColors = Array(6).fill("bg-slate-900");

// // Expanded & inclusive learner categories
// const learnerLevels = [
//   "Foundational (Grades 1–5)",
//   "Intermediate (Grades 6–8)",
//   "Advanced & AP (Grades 9–12)",
//   "College & Higher Education",
//   "Professional & Adult Learner",
// ] as const;

// // Inclusive, non-grade-bound pricing tiers
// const pricing = {
//   "Foundational (Grades 1–5)": {
//     hourly: 35,
//     monthly: 230,
//     perks: "8 sessions/mo (Save $50)",
//   },
//   "Intermediate (Grades 6–8)": {
//     hourly: 35,
//     monthly: 230,
//     perks: "8 sessions/mo (Save $50)",
//   },
//   "Advanced & AP (Grades 9–12)": {
//     hourly: 40,
//     monthly: 260,
//     perks: "8 sessions/mo (Save $60)",
//   },
//   "College & Higher Education": {
//     hourly: 45,
//     monthly: 290,
//     perks: "8 sessions/mo (Save $70)",
//   },
//   "Professional & Adult Learner": {
//     hourly: 50,
//     monthly: 320,
//     perks: "8 sessions/mo (Save $80)",
//   },
// };

// interface SubjectDbItem {
//   id: string;
//   name: string;
//   description: string | null;
// }

// interface EducatorDbItem {
//   id: string;
//   name: string;
//   imageUrl: string | null;
//   specialty: string | null;
//   experience: number | null;
//   description: string | null;
// }

// function formatDate(date: Date | undefined) {
//   if (!date) return "";
//   return date.toLocaleDateString("en-US", {
//     day: "2-digit",
//     month: "long",
//     year: "numeric",
//   });
// }

// export default function LearnerOnboarding() {
//   const [step, setStep] = useState(0);
//   const [selectedSubject, setSelectedSubject] = useState("");
//   const [learnerLevel, setLearnerLevel] = useState("");
//   const [enrollmentType, setEnrollmentType] = useState<
//     "hourly" | "monthly" | ""
//   >("");

//   const [showLanguageAlert, setShowLanguageAlert] = useState(false);

//   // Scheduling states
//   const [openDatePicker, setOpenDatePicker] = useState(false);
//   const [sessionDate, setSessionDate] = useState<Date | undefined>(undefined);
//   const [month, setMonth] = useState<Date | undefined>(new Date());
//   const [dateInputValue, setDateInputValue] = useState("");

//   const [startHour, setStartHour] = useState("10");
//   const [startMinute, setStartMinute] = useState("30");
//   const [startPeriod, setStartPeriod] = useState("AM");

//   const [endHour, setEndHour] = useState("11");
//   const [endMinute, setEndMinute] = useState("30");
//   const [endPeriod, setEndPeriod] = useState("AM");

//   const [topic, setTopic] = useState("");
//   const [dbSubjects, setDbSubjects] = useState<SubjectDbItem[]>([]);
//   const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);

//   // Educator states
//   const [educators, setEducators] = useState<EducatorDbItem[]>([]);
//   const [isLoadingEducators, setIsLoadingEducators] = useState(true);

//   const [billingName, setBillingName] = useState("");
//   const [billingEmail, setBillingEmail] = useState("");
//   const [isProcessingPayment, setIsProcessingPayment] = useState(false);

//   const currentPricing = pricing[learnerLevel as keyof typeof pricing] ?? {
//     hourly: 35,
//     monthly: 230,
//     perks: "8 sessions/mo",
//   };

//   const getTimeInMinutes = (
//     hourStr: string,
//     minuteStr: string,
//     period: string,
//   ) => {
//     let hours = parseInt(hourStr, 10);
//     const minutes = parseInt(minuteStr, 10);
//     if (period === "PM" && hours !== 12) hours += 12;
//     if (period === "AM" && hours === 12) hours = 0;
//     return hours * 60 + minutes;
//   };

//   const calculatePrice = () => {
//     if (!learnerLevel) return 0;
//     if (enrollmentType === "monthly") return currentPricing.monthly;

//     const startMins = getTimeInMinutes(startHour, startMinute, startPeriod);
//     const endMins = getTimeInMinutes(endHour, endMinute, endPeriod);
//     const diffMins = endMins - startMins;
//     if (diffMins <= 0) return 0;
//     return parseFloat(((diffMins / 60) * currentPricing.hourly).toFixed(2));
//   };

//   const isDateTimeInPast = () => {
//     if (!sessionDate) return false;
//     const now = new Date();
//     const selectedDateTime = new Date(sessionDate);
//     let hours = parseInt(startHour, 10);
//     const minutes = parseInt(startMinute, 10);
//     if (startPeriod === "PM" && hours !== 12) hours += 12;
//     if (startPeriod === "AM" && hours === 12) hours = 0;
//     selectedDateTime.setHours(hours, minutes, 0, 0);
//     return selectedDateTime < now;
//   };

//   const isTimeRangeInvalid = () => {
//     const startMins = getTimeInMinutes(startHour, startMinute, startPeriod);
//     const endMins = getTimeInMinutes(endHour, endMinute, endPeriod);
//     return endMins <= startMins;
//   };

//   useEffect(() => {
//     async function loadSubjects() {
//       try {
//         const data = await getActiveOnboardingSubjects();
//         setDbSubjects(data);
//       } catch (err) {
//         console.error(err);
//       } finally {
//         setIsLoadingSubjects(false);
//       }
//     }

//     async function loadEducators() {
//       try {
//         const data = await getOnboardingEducators();
//         setEducators(data);
//       } catch (error) {
//         console.error("Error fetching educators:", error);
//       } finally {
//         setIsLoadingEducators(false);
//       }
//     }

//     loadSubjects();
//     loadEducators();
//   }, []);

//   const next = () => setStep((prev) => prev + 1);
//   const back = () => setStep((prev) => prev - 1);

//   const matchedEducator = educators[0] || null;

//   const handleStripeCheckout = async () => {
//     try {
//       setIsProcessingPayment(true);
//       const response = await fetch("/api/create-checkout-session", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           name: billingName,
//           email: billingEmail,
//           subject: selectedSubject,
//           enrollmentType,
//           amount: calculatePrice(),
//           sessionDate: dateInputValue,
//           startTime: `${startHour}:${startMinute} ${startPeriod}`,
//           endTime: `${endHour}:${endMinute} ${endPeriod}`,
//           learnerLevel,
//           topic,
//           educatorId: matchedEducator?.id || null,
//         }),
//       });

//       const data = await response.json();
//       if (data.url) window.location.assign(data.url);
//     } catch (error) {
//       console.error("Stripe checkout error:", error);
//     } finally {
//       setIsProcessingPayment(false);
//     }
//   };

//   return (
//     <div className="grow h-full flex flex-col items-center justify-center bg-background px-6 py-10 relative text-slate-100">
//       {/* LANGUAGE NOTIFICATION MODAL */}
//       <AnimatePresence>
//         {showLanguageAlert && (
//           <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
//             <motion.div
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//               onClick={() => setShowLanguageAlert(false)}
//               className="absolute inset-0 bg-black/70 backdrop-blur-xs"
//             />
//             <motion.div
//               initial={{ opacity: 0, scale: 0.95, y: 10 }}
//               animate={{ opacity: 1, scale: 1, y: 0 }}
//               exit={{ opacity: 0, scale: 0.95, y: 10 }}
//               transition={{ duration: 0.15, ease: "easeOut" }}
//               className="relative w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl z-10 text-center select-none"
//             >
//               <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 mb-4">
//                 <Sparkles className="h-6 w-6" />
//               </div>
//               <h3 className="text-lg font-bold text-white tracking-tight">
//                 Language Mentorship Coming Soon!
//               </h3>
//               <p className="mt-2 text-sm text-slate-400 leading-relaxed">
//                 Language tracks are currently in preparation. Select another
//                 subject or check back soon!
//               </p>
//               <div className="mt-6">
//                 <button
//                   type="button"
//                   onClick={() => setShowLanguageAlert(false)}
//                   className="w-full inline-flex justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all"
//                 >
//                   Got it, thanks
//                 </button>
//               </div>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>

//       <div className="text-center mb-6 select-none">
//         <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl pt-6">
//           Schedule Your Customized Learning Session
//         </h1>
//         <p className="text-xs font-medium tracking-wider text-slate-400 mt-2">
//           Step {step + 1} of {steps.length} — {steps[step]}
//         </p>
//       </div>

//       {/* STEPPER BAR */}
//       <div className="w-full max-w-4xl mb-8 overflow-x-auto no-scrollbar">
//         <div className="flex items-center min-w-175 w-full select-none">
//           {steps.map((item, index) => {
//             const isActiveOrPassed = index <= step;
//             return (
//               <div
//                 key={item}
//                 className="relative flex-1 h-11 flex items-center justify-center transition-opacity duration-300"
//                 style={{
//                   clipPath:
//                     "polygon(0% 0%, calc(100% - 12px) 0%, 100% 50%, calc(100% - 12px) 100%, 0% 100%, 12px 50%)",
//                   marginLeft: index === 0 ? "0px" : "-10px",
//                   zIndex: steps.length - index,
//                 }}
//               >
//                 <div
//                   className={`absolute inset-0 transition-colors duration-300 ${
//                     isActiveOrPassed ? "bg-indigo-600" : "bg-slate-800"
//                   }`}
//                 />
//                 <span
//                   className={`relative z-10 text-[11px] font-semibold tracking-wider uppercase pl-2 ${
//                     isActiveOrPassed ? "text-white" : "text-slate-400"
//                   }`}
//                 >
//                   {item}
//                 </span>
//               </div>
//             );
//           })}
//         </div>
//       </div>

//       {/* CONTENT BOX */}
//       <div className="max-w-xl w-full bg-white rounded-xl shadow-xl p-8 text-slate-900 border border-slate-200">
//         <motion.div
//           key={step}
//           initial={{ opacity: 0, x: 15 }}
//           animate={{ opacity: 1, x: 0 }}
//           transition={{ duration: 0.2 }}
//         >
//           {/* STEP 1: SUBJECT & LEARNER LEVEL */}
//           {step === 0 && (
//             <div className="space-y-5">
//               <div>
//                 <h2 className="text-xl font-bold text-slate-900 tracking-tight">
//                   Who is learning and what is the target focus?
//                 </h2>
//                 <p className="text-xs text-slate-500 mt-1">
//                   Tailored for students, test takers, college scholars, and
//                   working professionals.
//                 </p>
//               </div>

//               <div>
//                 <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
//                   Learner Level / Stage
//                 </label>
//                 <select
//                   value={learnerLevel}
//                   onChange={(e) => setLearnerLevel(e.target.value)}
//                   className="w-full border border-slate-300 rounded-lg p-3 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
//                 >
//                   <option value="">Select Level or Career Stage</option>
//                   {learnerLevels.map((lvl) => (
//                     <option key={lvl} value={lvl}>
//                       {lvl}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <div>
//                 <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
//                   Select Focus Subject
//                 </label>
//                 {isLoadingSubjects ? (
//                   <div className="flex justify-center py-6">
//                     <Loader2 className="animate-spin text-slate-400" />
//                   </div>
//                 ) : (
//                   <div className="grid gap-3">
//                     {dbSubjects.map((sub) => (
//                       <button
//                         key={sub.id}
//                         disabled={!learnerLevel}
//                         onClick={() => {
//                           if (sub.name.trim().toLowerCase() === "languages") {
//                             setShowLanguageAlert(true);
//                             return;
//                           }
//                           setSelectedSubject(sub.name);
//                           next();
//                         }}
//                         className="border border-slate-200 rounded-lg p-4 text-left hover:border-indigo-600 hover:bg-slate-50 disabled:opacity-40 transition-all flex items-center justify-between group"
//                       >
//                         <div>
//                           <span className="font-semibold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
//                             {sub.name}
//                           </span>
//                           {sub.description && (
//                             <span className="text-xs text-slate-500 mt-0.5 line-clamp-1 block">
//                               {sub.description.replace(/<[^>]*>/g, "").trim()}
//                             </span>
//                           )}
//                         </div>
//                         <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
//                       </button>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             </div>
//           )}

//           {/* STEP 2: PROGRAM SELECTION */}
//           {step === 1 && (
//             <div className="space-y-6">
//               <div>
//                 <h2 className="text-xl font-bold text-slate-900 tracking-tight">
//                   Choose Your Learning Format
//                 </h2>
//                 <p className="text-xs text-slate-500 mt-1">
//                   Select between continuous regular coaching or quick on-demand
//                   sessions.
//                 </p>
//               </div>

//               <div className="space-y-4">
//                 <button
//                   type="button"
//                   onClick={() => setEnrollmentType("monthly")}
//                   className={`relative w-full border rounded-xl p-5 text-left transition-all ${
//                     enrollmentType === "monthly"
//                       ? "border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/20"
//                       : "border-slate-200 hover:border-slate-300"
//                   }`}
//                 >
//                   <div className="flex justify-between items-start mb-2">
//                     <div>
//                       <span className="inline-block text-[10px] font-bold uppercase bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded mb-1">
//                         Best Value
//                       </span>
//                       <div className="font-bold text-base text-slate-900">
//                         Monthly Dedicated Plan
//                       </div>
//                     </div>
//                     <div className="text-right">
//                       <div className="text-2xl font-black text-slate-900">
//                         ${currentPricing.monthly}
//                         <span className="text-xs font-normal text-slate-500">
//                           /mo
//                         </span>
//                       </div>
//                       <div className="text-[11px] font-semibold text-emerald-600">
//                         {currentPricing.perks}
//                       </div>
//                     </div>
//                   </div>

//                   <ul className="space-y-1.5 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-200/60">
//                     <li className="flex items-center gap-1.5">
//                       <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
//                       8 continuous sessions per month (2x weekly)
//                     </li>
//                     <li className="flex items-center gap-1.5">
//                       <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
//                       Async support & session resource sharing
//                     </li>
//                     <li className="flex items-center gap-1.5">
//                       <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
//                       Priority educator slot reservations
//                     </li>
//                   </ul>
//                 </button>

//                 <button
//                   type="button"
//                   onClick={() => setEnrollmentType("hourly")}
//                   className={`relative w-full border rounded-xl p-5 text-left transition-all ${
//                     enrollmentType === "hourly"
//                       ? "border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/20"
//                       : "border-slate-200 hover:border-slate-300"
//                   }`}
//                 >
//                   <div className="flex justify-between items-start mb-2">
//                     <div className="font-bold text-base text-slate-900">
//                       Single Pay-As-You-Go Session
//                     </div>
//                     <div className="text-2xl font-black text-slate-900">
//                       ${currentPricing.hourly}
//                       <span className="text-xs font-normal text-slate-500">
//                         /hr
//                       </span>
//                     </div>
//                   </div>

//                   <ul className="space-y-1.5 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-200/60">
//                     <li className="flex items-center gap-1.5">
//                       <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
//                       Flexible scheduling with no recurring commitment
//                     </li>
//                     <li className="flex items-center gap-1.5">
//                       <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
//                       Ideal for project reviews, exam prep & specific topics
//                     </li>
//                   </ul>
//                 </button>

//                 <button
//                   onClick={next}
//                   disabled={!enrollmentType}
//                   className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-lg font-semibold text-sm disabled:opacity-40 transition-all shadow-sm mt-2"
//                 >
//                   Continue to Schedule
//                 </button>

//                 <div className="text-left">
//                   <button
//                     type="button"
//                     onClick={back}
//                     className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
//                   >
//                     ← Go Back
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* STEP 3: SCHEDULE DETAILS */}
//           {step === 2 && (
//             <div className="space-y-6">
//               <div>
//                 <h2 className="text-xl font-bold text-slate-900 tracking-tight">
//                   {enrollmentType === "monthly"
//                     ? "Select Recurring Slot"
//                     : "Select Date & Time"}
//                 </h2>
//                 <p className="text-xs text-slate-500 mt-1">
//                   Pick your preferred booking window below.
//                 </p>
//               </div>

//               <div className="space-y-4">
//                 <div className="flex flex-col space-y-1.5">
//                   <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
//                     Target Start Date
//                   </label>
//                   <Popover
//                     open={openDatePicker}
//                     onOpenChange={setOpenDatePicker}
//                   >
//                     <PopoverTrigger asChild>
//                       <button
//                         type="button"
//                         className="flex w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-left text-sm text-slate-900 shadow-xs hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-600"
//                       >
//                         <span
//                           className={
//                             dateInputValue ? "font-medium" : "text-slate-400"
//                           }
//                         >
//                           {dateInputValue || "Choose session date..."}
//                         </span>
//                         <CalendarIcon className="h-4 w-4 text-slate-400" />
//                       </button>
//                     </PopoverTrigger>
//                     <PopoverContent
//                       className="w-auto p-0 bg-white border border-slate-200 rounded-lg shadow-xl"
//                       align="start"
//                     >
//                       <Calendar
//                         mode="single"
//                         selected={sessionDate}
//                         month={month}
//                         onMonthChange={setMonth}
//                         disabled={(date) =>
//                           date < new Date(new Date().setHours(0, 0, 0, 0))
//                         }
//                         onSelect={(date) => {
//                           setSessionDate(date);
//                           setDateInputValue(formatDate(date));
//                           setOpenDatePicker(false);
//                         }}
//                         className="p-3"
//                       />
//                     </PopoverContent>
//                   </Popover>
//                 </div>

//                 {/* Time Pickers */}
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                   <div className="flex flex-col space-y-1.5">
//                     <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
//                       <Clock className="h-3.5 w-3.5 text-slate-400" /> Start
//                       Time
//                     </label>
//                     <div className="flex items-center space-x-1.5 bg-white px-3 py-2 rounded-lg border border-slate-300 shadow-xs focus-within:ring-2 focus-within:ring-indigo-600">
//                       <select
//                         value={startHour}
//                         onChange={(e) => setStartHour(e.target.value)}
//                         className="bg-transparent text-sm font-semibold focus:outline-none cursor-pointer w-7 text-slate-900"
//                       >
//                         {Array.from({ length: 12 }, (_, i) =>
//                           String(i + 1).padStart(2, "0"),
//                         ).map((h) => (
//                           <option key={h} value={h}>
//                             {h}
//                           </option>
//                         ))}
//                       </select>
//                       <span className="text-slate-400 font-bold">:</span>
//                       <select
//                         value={startMinute}
//                         onChange={(e) => setStartMinute(e.target.value)}
//                         className="bg-transparent text-sm font-semibold focus:outline-none cursor-pointer w-7 text-slate-900"
//                       >
//                         {Array.from({ length: 60 }, (_, i) =>
//                           String(i).padStart(2, "0"),
//                         ).map((m) => (
//                           <option key={m} value={m}>
//                             {m}
//                           </option>
//                         ))}
//                       </select>
//                       <div className="flex rounded-md border border-slate-200 p-0.5 bg-slate-100 ml-auto select-none">
//                         <button
//                           type="button"
//                           onClick={() => setStartPeriod("AM")}
//                           className={`px-2 py-0.5 text-[10px] font-bold rounded ${
//                             startPeriod === "AM"
//                               ? "bg-white text-slate-900 shadow-xs"
//                               : "text-slate-500"
//                           }`}
//                         >
//                           AM
//                         </button>
//                         <button
//                           type="button"
//                           onClick={() => setStartPeriod("PM")}
//                           className={`px-2 py-0.5 text-[10px] font-bold rounded ${
//                             startPeriod === "PM"
//                               ? "bg-white text-slate-900 shadow-xs"
//                               : "text-slate-500"
//                           }`}
//                         >
//                           PM
//                         </button>
//                       </div>
//                     </div>
//                   </div>

//                   <div className="flex flex-col space-y-1.5">
//                     <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
//                       <Clock className="h-3.5 w-3.5 text-slate-400" /> End Time
//                     </label>
//                     <div className="flex items-center space-x-1.5 bg-white px-3 py-2 rounded-lg border border-slate-300 shadow-xs focus-within:ring-2 focus-within:ring-indigo-600">
//                       <select
//                         value={endHour}
//                         onChange={(e) => setEndHour(e.target.value)}
//                         className="bg-transparent text-sm font-semibold focus:outline-none cursor-pointer w-7 text-slate-900"
//                       >
//                         {Array.from({ length: 12 }, (_, i) =>
//                           String(i + 1).padStart(2, "0"),
//                         ).map((h) => (
//                           <option key={h} value={h}>
//                             {h}
//                           </option>
//                         ))}
//                       </select>
//                       <span className="text-slate-400 font-bold">:</span>
//                       <select
//                         value={endMinute}
//                         onChange={(e) => setEndMinute(e.target.value)}
//                         className="bg-transparent text-sm font-semibold focus:outline-none cursor-pointer w-7 text-slate-900"
//                       >
//                         {Array.from({ length: 60 }, (_, i) =>
//                           String(i).padStart(2, "0"),
//                         ).map((m) => (
//                           <option key={m} value={m}>
//                             {m}
//                           </option>
//                         ))}
//                       </select>
//                       <div className="flex rounded-md border border-slate-200 p-0.5 bg-slate-100 ml-auto select-none">
//                         <button
//                           type="button"
//                           onClick={() => setEndPeriod("AM")}
//                           className={`px-2 py-0.5 text-[10px] font-bold rounded ${
//                             endPeriod === "AM"
//                               ? "bg-white text-slate-900 shadow-xs"
//                               : "text-slate-500"
//                           }`}
//                         >
//                           AM
//                         </button>
//                         <button
//                           type="button"
//                           onClick={() => setEndPeriod("PM")}
//                           className={`px-2 py-0.5 text-[10px] font-bold rounded ${
//                             endPeriod === "PM"
//                               ? "bg-white text-slate-900 shadow-xs"
//                               : "text-slate-500"
//                           }`}
//                         >
//                           PM
//                         </button>
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {isDateTimeInPast() && (
//                   <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
//                     ⚠️ Selected session time occurs in the past.
//                   </div>
//                 )}
//                 {isTimeRangeInvalid() && (
//                   <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
//                     ⚠️ Session end time must be after start time.
//                   </div>
//                 )}

//                 <div className="flex flex-col space-y-1.5">
//                   <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
//                     Learning Focus & Notes
//                   </label>
//                   <textarea
//                     rows={3}
//                     placeholder="Specific topics, chapters, career goals, or exam prep goals..."
//                     value={topic}
//                     onChange={(e) => setTopic(e.target.value)}
//                     className="w-full border border-slate-300 rounded-lg p-3 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-600 focus:outline-none resize-none shadow-xs"
//                   />
//                 </div>

//                 <button
//                   onClick={next}
//                   disabled={
//                     !dateInputValue ||
//                     isDateTimeInPast() ||
//                     isTimeRangeInvalid() ||
//                     !topic.trim()
//                   }
//                   className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-lg font-semibold text-sm disabled:opacity-40 transition-all shadow-sm mt-2"
//                 >
//                   Review Booking Details
//                 </button>

//                 <div className="text-left">
//                   <button
//                     type="button"
//                     onClick={back}
//                     className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
//                   >
//                     ← Go Back
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* STEP 4: REVIEW BOOKING DETAILS */}
//           {step === 3 && (
//             <div className="space-y-5">
//               <h2 className="text-xl font-bold text-slate-900 tracking-tight">
//                 Review Your Session
//               </h2>

//               <div className="border border-slate-200 rounded-xl p-5 bg-slate-50 space-y-3 text-sm text-slate-700">
//                 <div className="flex justify-between border-b border-slate-200/80 pb-2">
//                   <span className="text-slate-500">Learner Stage</span>
//                   <span className="font-semibold text-slate-900">
//                     {learnerLevel}
//                   </span>
//                 </div>
//                 <div className="flex justify-between border-b border-slate-200/80 pb-2">
//                   <span className="text-slate-500">Subject</span>
//                   <span className="font-semibold text-slate-900">
//                     {selectedSubject}
//                   </span>
//                 </div>
//                 <div className="flex justify-between border-b border-slate-200/80 pb-2">
//                   <span className="text-slate-500">Program Plan</span>
//                   <span className="font-semibold uppercase text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
//                     {enrollmentType === "monthly"
//                       ? "Monthly Plan"
//                       : "Hourly Session"}
//                   </span>
//                 </div>
//                 <div className="flex justify-between border-b border-slate-200/80 pb-2">
//                   <span className="text-slate-500">Date</span>
//                   <span className="font-semibold text-slate-900">
//                     {dateInputValue}
//                   </span>
//                 </div>
//                 <div className="flex justify-between border-b border-slate-200/80 pb-2">
//                   <span className="text-slate-500">Time Window</span>
//                   <span className="font-semibold text-slate-900">
//                     {startHour}:{startMinute} {startPeriod} – {endHour}:
//                     {endMinute} {endPeriod}
//                   </span>
//                 </div>

//                 <div className="flex justify-between items-center pt-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
//                   <span className="font-bold text-slate-900">Total Due</span>
//                   <span className="text-2xl font-extrabold text-slate-900">
//                     ${calculatePrice().toFixed(2)}
//                   </span>
//                 </div>
//               </div>

//               <button
//                 onClick={next}
//                 className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-lg font-semibold text-sm transition-all shadow-sm"
//               >
//                 Proceed to Checkout
//               </button>

//               <div className="text-left">
//                 <button
//                   type="button"
//                   onClick={back}
//                   className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
//                 >
//                   ← Go Back
//                 </button>
//               </div>
//             </div>
//           )}

//           {/* STEP 5: PAYMENT & CHECKOUT */}
//           {step === 4 && (
//             <div className="space-y-5">
//               <div>
//                 <h2 className="text-xl font-bold text-slate-900 tracking-tight">
//                   Checkout & Confirm
//                 </h2>
//                 <p className="text-xs text-slate-500 mt-1">
//                   Enter learner billing contact details to finalize checkout.
//                 </p>
//               </div>

//               <div className="space-y-3">
//                 <div>
//                   <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
//                     Full Name
//                   </label>
//                   <div className="relative">
//                     <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
//                     <input
//                       type="text"
//                       placeholder="Jane Doe"
//                       value={billingName}
//                       onChange={(e) => setBillingName(e.target.value)}
//                       className="w-full pl-9 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
//                     />
//                   </div>
//                 </div>

//                 <div>
//                   <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
//                     Email Address
//                   </label>
//                   <div className="relative">
//                     <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
//                     <input
//                       type="email"
//                       placeholder="jane@example.com"
//                       value={billingEmail}
//                       onChange={(e) => setBillingEmail(e.target.value)}
//                       className="w-full pl-9 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
//                     />
//                   </div>
//                 </div>

//                 <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
//                   <div className="flex items-center gap-2">
//                     <Lock className="w-4 h-4 text-emerald-600" />
//                     <span className="text-xs font-medium text-slate-600">
//                       Encrypted Checkout via Stripe
//                     </span>
//                   </div>
//                   <span className="text-sm font-extrabold text-slate-900">
//                     ${calculatePrice().toFixed(2)}
//                   </span>
//                 </div>

//                 <button
//                   type="button"
//                   onClick={handleStripeCheckout}
//                   disabled={
//                     !billingName || !billingEmail || isProcessingPayment
//                   }
//                   className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 rounded-lg font-semibold text-sm disabled:opacity-40 transition-all shadow-sm flex items-center justify-center gap-2 mt-2"
//                 >
//                   {isProcessingPayment ? (
//                     <>
//                       <Loader2 className="w-4 h-4 animate-spin" /> Processing...
//                     </>
//                   ) : (
//                     <>
//                       <CreditCard className="w-4 h-4" /> Complete Payment
//                     </>
//                   )}
//                 </button>

//                 <div className="text-left">
//                   <button
//                     type="button"
//                     onClick={back}
//                     className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
//                   >
//                     ← Go Back
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}
//         </motion.div>
//       </div>
//     </div>
//   );
// }
