"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Calendar as CalendarIcon,
  Loader2,
  User,
  Mail,
  Clock,
  ArrowRight,
  CheckCircle2,
  Search,
  X,
  Sparkles,
  Phone,
} from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { createFreeConsultation } from "../actions/consultation";
import { getOnboardingEducators } from "../actions/manage-admin";

const steps = [
  "Grade Level",
  "Area of Interest",
  "Need Help",
  "Schedule",
  "Review",
  "Submit",
];

const allTopics = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Economics",
  "Statistics",
  "Web Development",
  "Python Programming",
  "Data Analysis & AI",
  "Cybersecurity",
  "Cloud Computing",
  "Mobile App Development",
  "Accounting & Finance",
  "Marketing Strategy",
  "Entrepreneurship",
  "Product Management",
  "Sales & Business Development",
  "Interview Preparation",
  "Resume & Portfolio Review",
  "Career Guidance",
  "Leadership Coaching",
  "Public Speaking",
] as const;

const popularQuickPicks = [
  "Mathematics",
  "Web Development",
  "Python Programming",
  "Data Analysis & AI",
] as const;

const stageOptions = [
  "Elementary School (K-5)",
  "Middle School (6-8)",
  "High School (9-12)",
  "College / University Student",
  "Working Professional",
  "Lifelong Learner",
] as const;

const purposeOptions = [
  "Understand a specific topic",
  "Complete an assignment or project",
  "Prepare for an upcoming exam",
  "Explore career or study guidance",
] as const;

interface EducatorDbItem {
  id: string;
  name: string;
  imageUrl: string | null;
  specialty: string | null;
  experience: number | null;
  description: string | null;
}

interface RawEducatorResponse {
  id: string;
  name: string;
  imageUrl: string | null;
  facilitatorProfile: {
    specialty: string | null;
    experience: number | null;
    description: string | null;
  } | null;
}

function formatDate(date: Date | undefined) {
  if (!date) return "";
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function FreeOnboarding() {
  const [step, setStep] = useState(0);

  // Form State
  const [currentStage, setCurrentStage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [areaOfInterest, setAreaOfInterest] = useState("");
  const [sessionPurpose, setSessionPurpose] = useState("");
  const [goalsNotes, setGoalsNotes] = useState("");

  // Schedule State
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [sessionDate, setSessionDate] = useState<Date | undefined>(undefined);
  const [month, setMonth] = useState<Date | undefined>(new Date());
  const [dateInputValue, setDateInputValue] = useState("");
  const [startHour, setStartHour] = useState("10");
  const [startMinute, setStartMinute] = useState("00");
  const [startPeriod, setStartPeriod] = useState("AM");

  // User Contact Details State
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [educators, setEducators] = useState<EducatorDbItem[]>([]);

  useEffect(() => {
    async function loadEducators() {
      try {
        const data: RawEducatorResponse[] = await getOnboardingEducators();
        const formattedEducators: EducatorDbItem[] = data.map((item) => ({
          id: item.id,
          name: item.name,
          imageUrl: item.imageUrl,
          specialty: item.facilitatorProfile?.specialty ?? null,
          experience: item.facilitatorProfile?.experience ?? null,
          description: item.facilitatorProfile?.description ?? null,
        }));
        setEducators(formattedEducators);
      } catch (error) {
        console.error("Error fetching educators:", error);
      }
    }
    loadEducators();
  }, []);

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

  const matchedEducator = educators[0] || null;

  const handleSubmitConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);

      const result = await createFreeConsultation({
        name: userName,
        email: userEmail,
        phoneNumber: userPhone,
        gradeLevel: currentStage,
        subject: areaOfInterest,
        topic: `Goal: ${sessionPurpose}. Notes: ${goalsNotes}`,
        sessionDate: sessionDate!.toISOString(),
        startHour,
        startMinute,
        startPeriod,
        educatorId: matchedEducator?.id,
      });

      if (result.success) {
        setIsSubmitted(true);
      } else {
        alert(result.error || "Failed to schedule consultation.");
      }
    } catch (error) {
      console.error("Submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="grow h-full flex flex-col items-center justify-center bg-background px-4 py-10 text-slate-100 relative">
        <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 text-center text-slate-900 border border-slate-200 space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Consultation Requested!
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Thank you,{" "}
            <span className="font-semibold text-slate-800">{userName}</span>.
            Your 15-minute free consultation for{" "}
            <span className="font-semibold text-slate-800">
              {areaOfInterest}
            </span>{" "}
            has been scheduled for{" "}
            <span className="font-semibold text-slate-800">
              {dateInputValue} at {startHour}:{startMinute} {startPeriod}
            </span>
            . A confirmation email has been sent to{" "}
            <span className="font-semibold text-slate-800">{userEmail}</span>.
          </p>
          <button
            onClick={() => (window.location.href = "/")}
            className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold text-xs sm:text-sm transition-all shadow-sm"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grow h-full flex flex-col items-center justify-center bg-background px-4 py-10 text-slate-800 relative">
      <div className="text-center mb-8 max-w-2xl select-none pt-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-blue-600">
          Book Your 15-Minute Free Consultation
        </h1>
      </div>

      <div className="w-full max-w-3xl mb-8 overflow-x-auto no-scrollbar">
        <div className="flex items-center min-w-125 w-full select-none">
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
                  className={`relative z-10 text-[9px] sm:text-[11px] font-semibold tracking-wider uppercase pl-2 ${
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

      <div className="max-w-xl w-full bg-white rounded-xl shadow-2xl p-6 sm:p-8 text-slate-900 border border-slate-200">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.18 }}
        >
          {/* STEP 0: GRADE LEVEL */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  What is your grade level or current stage?
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  This helps us tailor your consultation to your educational
                  background.
                </p>
              </div>

              <div className="space-y-2">
                {stageOptions.map((stg) => {
                  const isSelected = currentStage === stg;
                  return (
                    <button
                      key={stg}
                      type="button"
                      onClick={() => setCurrentStage(stg)}
                      className={`w-full text-left px-4 py-3 rounded-md border text-xs sm:text-sm font-medium transition-all flex items-center justify-between ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-600/20"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span>{stg}</span>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={next}
                disabled={!currentStage}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3.5 rounded-md font-semibold text-xs sm:text-sm disabled:opacity-40 transition-all shadow-sm flex items-center justify-center gap-2"
              >
                Continue to Area of Interest <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 1: AREA OF INTEREST */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  What area are you interested in?
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Search or choose a topic you&apos;d like to discuss.
                </p>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search topics (e.g. Python, Calculus)..."
                    value={searchQuery}
                    onFocus={() => setIsDropdownOpen(true)}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setAreaOfInterest(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    className="w-full pl-9 pr-9 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
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

                  {isDropdownOpen && filteredTopics.length > 0 && (
                    <div className="absolute z-30 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-md shadow-xl py-1">
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
                              ? "bg-blue-600 text-white border-blue-600 font-medium"
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

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={back}
                  className="w-1/3 border border-slate-300 text-slate-700 hover:bg-slate-50 py-3.5 rounded-md font-semibold text-xs sm:text-sm"
                >
                  ← Go Back
                </button>
                <button
                  onClick={next}
                  disabled={!areaOfInterest.trim()}
                  className="w-2/3 bg-blue-500 hover:bg-blue-600 text-white py-3.5 rounded-md font-semibold text-xs sm:text-sm disabled:opacity-40"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PURPOSE */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Why do you need help?
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Select your goal so your advisor can prepare.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {purposeOptions.map((purpose) => (
                    <button
                      key={purpose}
                      type="button"
                      onClick={() => setSessionPurpose(purpose)}
                      className={`px-3 py-1.5 text-xs rounded-md border transition-all ${
                        sessionPurpose === purpose
                          ? "bg-blue-600 text-white border-blue-600 font-medium"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {purpose}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col space-y-1.5 pt-2">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Additional Details (Optional)
                </label>
                <textarea
                  rows={4}
                  placeholder="Share specific questions or topics you want to cover..."
                  value={goalsNotes}
                  onChange={(e) => setGoalsNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded-md p-3 text-xs sm:text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-600 focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={back}
                  className="w-1/3 border border-slate-300 text-slate-700 hover:bg-slate-50 py-3.5 rounded-lg font-semibold text-xs sm:text-sm"
                >
                  ← Go Back
                </button>
                <button
                  onClick={next}
                  disabled={!sessionPurpose}
                  className="w-2/3 bg-blue-500 hover:bg-blue-600 text-white py-3.5 rounded-md font-semibold text-xs sm:text-sm disabled:opacity-40"
                >
                  Continue to Schedule
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SCHEDULE */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Schedule 15-Minute Consultation
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Choose a date and time for your 1-on-1 session.
                </p>
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Preferred Date
                </label>
                <Popover open={openDatePicker} onOpenChange={setOpenDatePicker}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-left text-xs sm:text-sm text-slate-900 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    >
                      <span
                        className={
                          dateInputValue ? "font-medium" : "text-slate-400"
                        }
                      >
                        {dateInputValue || "Choose consultation date..."}
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

              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" /> Preferred
                  Start Time
                </label>
                <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border border-slate-300 focus-within:ring-2 focus-within:ring-indigo-600 max-w-xs">
                  <select
                    value={startHour}
                    onChange={(e) => setStartHour(e.target.value)}
                    className="bg-transparent text-xs sm:text-sm font-semibold focus:outline-none text-slate-900"
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
                    className="bg-transparent text-xs sm:text-sm font-semibold focus:outline-none text-slate-900"
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
                      className={`px-2 py-0.5 text-[10px] font-bold rounded ${startPeriod === "AM" ? "bg-white text-slate-900" : "text-slate-500"}`}
                    >
                      AM
                    </button>
                    <button
                      type="button"
                      onClick={() => setStartPeriod("PM")}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded ${startPeriod === "PM" ? "bg-white text-slate-900" : "text-slate-500"}`}
                    >
                      PM
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={back}
                  className="w-1/3 border border-slate-300 text-slate-700 hover:bg-slate-50 py-3.5 rounded-lg font-semibold text-xs sm:text-sm"
                >
                  ← Go Back
                </button>
                <button
                  onClick={next}
                  disabled={!dateInputValue}
                  className="w-2/3 bg-blue-500 hover:bg-blue-600 text-white py-3.5 rounded-lg font-semibold text-xs sm:text-sm disabled:opacity-40"
                >
                  Review Details
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW */}
          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Review Your Consultation Details
              </h2>

              <div className="border border-slate-200 rounded-md p-5 bg-slate-50 space-y-3 text-xs sm:text-sm text-slate-700">
                <div className="flex justify-between border-b border-slate-200/80 pb-2">
                  <span className="text-slate-500">Stage</span>
                  <span className="font-semibold text-slate-900">
                    {currentStage}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200/80 pb-2">
                  <span className="text-slate-500">Subject</span>
                  <span className="font-semibold text-slate-900">
                    {areaOfInterest}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200/80 pb-2">
                  <span className="text-slate-500">Objective</span>
                  <span className="font-semibold text-slate-900">
                    {sessionPurpose}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Scheduled Time</span>
                  <span className="font-semibold text-slate-900">
                    {dateInputValue} at {startHour}:{startMinute} {startPeriod}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={back}
                  className="w-1/3 border border-slate-300 text-slate-700 hover:bg-slate-50 py-3.5 rounded-lg font-semibold text-xs sm:text-sm"
                >
                  ← Go Back
                </button>
                <button
                  onClick={next}
                  className="w-2/3 bg-blue-500 hover:bg-blue-600 text-white py-3.5 rounded-md font-semibold text-xs sm:text-sm"
                >
                  Enter Contact Details
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: CONTACT & SUBMIT */}
          {step === 5 && (
            <form onSubmit={handleSubmitConsultation} className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Enter Your Contact Info
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  We will send your consultation confirmation to this email
                  address.
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
                      required
                      placeholder="John Doe"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-md text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
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
                      required
                      placeholder="john@example.com"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-md text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Phone Number (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-md text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={back}
                  disabled={isSubmitting}
                  className="w-1/3 border border-slate-300 text-slate-700 hover:bg-slate-50 py-3.5 rounded-lg font-semibold text-xs sm:text-sm"
                >
                  ← Go Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !userName || !userEmail}
                  className="w-2/3 bg-blue-500 hover:bg-blue-600 text-white py-3.5 rounded-md font-semibold text-xs sm:text-sm disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Confirming...
                    </>
                  ) : (
                    "Confirm Consultation"
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
