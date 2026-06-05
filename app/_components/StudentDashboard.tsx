// app/_components/StudentDashboard.tsx

"use client";

import { useSession } from "@/lib/auth-client";
import Link from "next/link";

import {
  Sparkles,
  Calendar,
  BookOpen,
  Flame,
  Bell,
  Video,
  ArrowRight,
  Clock,
  MessageSquare,
  Brain,
  PlayCircle,
  ChevronRight,
  Trophy,
  Target,
} from "lucide-react";

// ---------------- TYPES ----------------

type Appointment = {
  id: string;
  status: "Scheduled" | "Completed" | "Cancelled" | string;
  startTime: string;
  educator?: {
    name?: string;
  };
};

type Course = {
  id: string;
  title: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  category: string;
  duration: string;
  thumbnail: string;
};

type AIRecommendation = {
  id: string;
  type: string;
  topic: string;
  timeEstimate: string;
};

type CommunityNotification = {
  id: string;
  text: string;
  date: string;
};

type Analytics = {
  hoursSpentThisWeek: number;
  completionRate: number;
  monthlyActivityScore: number;
};

type LearningStreak = {
  currentStreak: number;
  longestStreak: number;
  daysThisWeek: boolean[];
};

type Props = {
  appointments: Appointment[];
  courses: Course[];
  aiRecommendations: AIRecommendation[];
  communityNotifications: CommunityNotification[];
  analytics: Analytics;
  learningStreak: LearningStreak;
  plan: "Free" | "Standard" | "Premium";
};

// ---------------- UI HELPERS ----------------

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl bg-zinc-900/50 backdrop-blur-xl ring-1 ring-white/5 ${className}`}
    >
      {children}
    </div>
  );
}

const planStyles = {
  Free: "bg-zinc-800 text-zinc-300",
  Standard: "bg-emerald-500/10 text-emerald-400",
  Premium: "bg-amber-500/10 text-amber-400",
};

// ---------------- DASHBOARD ----------------

export default function StudentDashboard({
  appointments,
  courses,
  aiRecommendations,
  communityNotifications,
  analytics,
  learningStreak,
  plan,
}: Props) {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-zinc-400">
        Access denied
      </div>
    );
  }

  const continueCourse = [...courses].sort(
    (a, b) => b.progress - a.progress,
  )[0];

  const upcomingSession = appointments.find((a) => a.status === "Scheduled");

  return (
    <div className="min-h-screen bg-black text-white">
      {/* BACKGROUND */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-150 h-150 bg-emerald-500/10 blur-[140px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-125 h-125 bg-indigo-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-8">
        {/* ---------------- TOP DASHBOARD GRID ---------------- */}
        <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.6fr] gap-6">
          {/* LEFT HERO */}
          <Card className="overflow-hidden relative p-8">
            <div className="absolute inset-0 bg-linear-to-br from-emerald-500/10 via-transparent to-transparent" />

            <div className="relative space-y-8">
              {/* CONTINUE LEARNING */}
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-sm text-zinc-300">
                  <PlayCircle className="w-4 h-4 text-emerald-400" />
                  Continue Learning
                </div>

                <div>
                  <h1 className="text-4xl font-bold tracking-tight max-w-2xl leading-tight">
                    {continueCourse?.title}
                  </h1>

                  <p className="text-zinc-400 mt-3 text-lg">
                    {continueCourse?.completedLessons} of{" "}
                    {continueCourse?.totalLessons} lessons completed
                  </p>
                </div>

                {/* PROGRESS */}
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">Course Progress</span>

                    <span className="font-medium">
                      {continueCourse?.progress}%
                    </span>
                  </div>

                  <div className="h-3 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-emerald-500 to-teal-400 rounded-full"
                      style={{
                        width: `${continueCourse?.progress || 0}%`,
                      }}
                    />
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <Link
                    href={`/student/courses/${continueCourse?.id}`}
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 transition px-6 py-3 text-black font-semibold"
                  >
                    Resume Course
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    href="/student/ai"
                    className="inline-flex items-center gap-2 rounded-2xl bg-white/5 hover:bg-white/10 transition px-6 py-3"
                  >
                    <Sparkles className="w-4 h-4" />
                    Ask AI Tutor
                  </Link>
                </div>
              </div>

              {/* QUICK STATS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-2xl bg-black/30 border border-white/5 p-4">
                  <p className="text-sm text-zinc-500">Learning Time</p>

                  <h3 className="text-2xl font-bold mt-2">
                    {analytics.hoursSpentThisWeek}h
                  </h3>
                </div>

                <div className="rounded-2xl bg-black/30 border border-white/5 p-4">
                  <p className="text-sm text-zinc-500">Completion</p>

                  <h3 className="text-2xl font-bold mt-2">
                    {analytics.completionRate}%
                  </h3>
                </div>

                <div className="rounded-2xl bg-black/30 border border-white/5 p-4">
                  <p className="text-sm text-zinc-500">Streak</p>

                  <h3 className="text-2xl font-bold mt-2 text-orange-400">
                    {learningStreak.currentStreak}
                  </h3>
                </div>

                <div className="rounded-2xl bg-black/30 border border-white/5 p-4">
                  <p className="text-sm text-zinc-500">Activity Score</p>

                  <h3 className="text-2xl font-bold mt-2">
                    {analytics.monthlyActivityScore}
                  </h3>
                </div>
              </div>
            </div>
          </Card>

          {/* RIGHT SIDE PANEL */}
          <div className="space-y-6">
            {/* PLAN */}
            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-zinc-500">Current Plan</p>

                  <h3 className="text-3xl font-bold mt-2">{plan}</h3>
                </div>

                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${planStyles[plan]}`}
                >
                  Active
                </div>
              </div>

              <Link
                href="/student/myplan"
                className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 transition py-3"
              >
                Manage Subscription
              </Link>
            </Card>

            {/* NEXT SESSION */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-5">
                <Calendar className="w-5 h-5 text-emerald-400" />

                <h3 className="font-semibold">Next Live Session</h3>
              </div>

              {upcomingSession ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-lg">
                      {upcomingSession.educator?.name || "Mentorship Session"}
                    </h4>

                    <p className="text-zinc-400 mt-1 flex items-center gap-2">
                      <Clock className="w-4 h-4" />

                      {new Date(upcomingSession.startTime).toLocaleString(
                        undefined,
                        {
                          dateStyle: "medium",
                          timeStyle: "short",
                        },
                      )}
                    </p>
                  </div>

                  <Link
                    href={`/student/appointments/room/${upcomingSession.id}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 transition py-3 text-black font-semibold"
                  >
                    <Video className="w-4 h-4" />
                    Join Session
                  </Link>
                </div>
              ) : (
                <div className="text-zinc-500">
                  No upcoming session scheduled.
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* ---------------- QUICK ACTIONS ---------------- */}
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
          {[
            {
              label: "AI Tutor",
              icon: Brain,
              href: "/student/ai",
            },
            {
              label: "Book Session",
              icon: Calendar,
              href: "/student/appointments",
            },
            {
              label: "My Courses",
              icon: BookOpen,
              href: "/student/enrolled",
            },
            {
              label: "Community",
              icon: MessageSquare,
              href: "/community",
            },
            {
              label: "Achievements",
              icon: Trophy,
              href: "/student/achievements",
            },
            {
              label: "Goals",
              icon: Target,
              href: "/student/goals",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <Link key={item.label} href={item.href} className="group">
                <Card className="p-5 hover:-translate-y-1 transition-all hover:ring-emerald-500/20">
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-emerald-400" />
                    </div>

                    <div>
                      <h3 className="font-medium group-hover:text-emerald-400 transition">
                        {item.label}
                      </h3>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* ---------------- CONTENT GRID ---------------- */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_0.4fr] gap-6">
          {/* MAIN CONTENT */}
          <div className="space-y-6">
            {/* COURSES */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Continue Your Courses</h2>

                  <p className="text-zinc-500 mt-1">
                    Pick up where you left off.
                  </p>
                </div>

                <Link
                  href="/student/enrolled"
                  className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300"
                >
                  View all
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="space-y-4">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="group flex flex-col md:flex-row gap-5 rounded-3xl bg-black/30 border border-white/5 overflow-hidden hover:border-emerald-500/20 transition"
                  >
                    {/* <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full md:w-[260px] h-[180px] object-cover"
                    /> */}

                    <div className="flex-1 p-5 flex flex-col justify-between">
                      <div>
                        <div className="inline-flex px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs">
                          {course.category}
                        </div>

                        <h3 className="text-xl font-semibold mt-4 group-hover:text-emerald-400 transition">
                          {course.title}
                        </h3>

                        <p className="text-zinc-400 mt-2">
                          {course.completedLessons}/{course.totalLessons}{" "}
                          lessons completed
                        </p>
                      </div>

                      <div className="space-y-4 mt-6">
                        <div>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-zinc-500">Progress</span>

                            <span>{course.progress}%</span>
                          </div>

                          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-linear-to-r from-emerald-500 to-teal-400"
                              style={{
                                width: `${course.progress}%`,
                              }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-zinc-500">
                            {course.duration}
                          </span>

                          <Link
                            href={`/student/courses/${course.id}`}
                            className="inline-flex items-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 transition px-4 py-2"
                          >
                            Resume
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* AI RECOMMENDATIONS */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-amber-400" />

                <h2 className="text-2xl font-bold">AI Learning Suggestions</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {aiRecommendations.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl bg-black/30 border border-white/5 p-5 hover:border-amber-500/20 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs">
                        {item.type}
                      </span>

                      <span className="text-sm text-zinc-500">
                        {item.timeEstimate}
                      </span>
                    </div>

                    <p className="mt-5 text-lg font-medium leading-relaxed">
                      {item.topic}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* SIDEBAR */}
          <div className="space-y-6">
            {/* COMMUNITY */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Bell className="w-5 h-5 text-blue-400" />

                <h3 className="text-xl font-bold">Community Activity</h3>
              </div>

              <div className="space-y-5">
                {communityNotifications.map((item) => (
                  <div
                    key={item.id}
                    className="border-b border-white/5 pb-5 last:border-none"
                  >
                    <p className="leading-relaxed">{item.text}</p>

                    <p className="text-sm text-zinc-500 mt-2">{item.date}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* STREAK */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-5">
                <Flame className="w-5 h-5 text-orange-400" />

                <h3 className="text-xl font-bold">Learning Streak</h3>
              </div>

              <div className="flex items-end gap-3">
                <span className="text-5xl font-bold text-orange-400">
                  {learningStreak.currentStreak}
                </span>

                <span className="text-zinc-500 pb-2">days</span>
              </div>

              <div className="grid grid-cols-7 gap-2 mt-6">
                {learningStreak.daysThisWeek.map((active, index) => (
                  <div
                    key={index}
                    className={`h-12 rounded-xl ${
                      active
                        ? "bg-orange-500/20 border border-orange-500/20"
                        : "bg-zinc-800"
                    }`}
                  />
                ))}
              </div>

              <p className="text-sm text-zinc-500 mt-5">
                Longest streak: {learningStreak.longestStreak} days
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// // app/_components/StudentDashboard.tsx
// "use client";

// import { useSession } from "@/lib/auth-client";
// import {
//   Calendar,
//   BookOpen,
//   ArrowRight,
//   Video,
//   CreditCard,
//   Sparkles,
//   Bell,
//   MessageSquare,
//   Flame,
//   BarChart3,
//   ExternalLink,
//   ChevronRight,
//   Clock,
// } from "lucide-react";
// import Link from "next/link";
// import { LucideIcon } from "lucide-react";

// // --- TYPES & DEFINITIONS ---
// type Appointment = {
//   id: string;
//   status: "Scheduled" | "Completed" | "Cancelled" | string;
//   startTime: string;
//   educator?: { name?: string };
// };

// type Course = {
//   id: string;
//   title: string;
//   progress: number;
//   totalLessons: number;
//   completedLessons: number;
// };

// type AIRecommendation = {
//   id: string;
//   type: string;
//   topic: string;
//   timeEstimate: string;
// };

// type CommunityNotification = {
//   id: string;
//   type: string;
//   text: string;
//   date: string;
// };

// type Discussion = {
//   id: string;
//   title: string;
//   replies: number;
//   category: string;
// };

// type LearningStreak = {
//   currentStreak: number;
//   longestStreak: number;
//   daysThisWeek: boolean[]; // Array representing Sunday-Saturday
// };

// type Analytics = {
//   hoursSpentThisWeek: number;
//   completionRate: number;
//   monthlyActivityScore: number;
// };

// type Props = {
//   appointments: Appointment[];
//   courses: Course[];
//   aiRecommendations: AIRecommendation[];
//   communityNotifications: CommunityNotification[];
//   recentDiscussions: Discussion[];
//   learningStreak: LearningStreak;
//   analytics: Analytics;
//   plan: "Free" | "Standard" | "Premium";
// };

// const planStyles = {
//   Free: "text-zinc-500 bg-zinc-500/10 border-zinc-500/20",
//   Standard: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
//   Premium: "text-amber-300 bg-amber-300/10 border-amber-300/20",
// };

// // --- SHARED REUSABLE COMPONENTS ---
// function GlassCard({
//   children,
//   className = "",
// }: {
//   children: React.ReactNode;
//   className?: string;
// }) {
//   return (
//     <div
//       className={`rounded-xl border border-zinc-800 bg-zinc-950/40 backdrop-blur-2xl shadow-xl hover:border-zinc-700/60 transition-all duration-300 ${className}`}
//     >
//       {children}
//     </div>
//   );
// }

// function SectionHeader({
//   icon: Icon,
//   title,
//   href,
// }: {
//   icon: LucideIcon;
//   title: string;
//   href?: string;
// }) {
//   return (
//     <div className="flex items-center justify-between p-5 border-b border-zinc-900">
//       <div className="flex items-center gap-2.5">
//         <Icon className="w-4 h-4 text-emerald-400" />
//         <h2 className="font-semibold text-sm text-zinc-100 tracking-wide">
//           {title}
//         </h2>
//       </div>
//       {href && (
//         <Link
//           href={href}
//           className="text-xs text-zinc-400 hover:text-emerald-400 flex items-center gap-1 transition"
//         >
//           View all <ChevronRight className="w-3 h-3" />
//         </Link>
//       )}
//     </div>
//   );
// }

// // --- MAIN DASHBOARD COMPONENT ---
// export default function StudentDashboard({
//   appointments,
//   courses,
//   aiRecommendations,
//   communityNotifications,
//   recentDiscussions,
//   learningStreak,
//   analytics,
//   plan,
// }: Props) {
//   const { data: session, isPending } = useSession();

//   if (isPending) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-black text-emerald-400 font-medium tracking-wide">
//         <div className="flex flex-col items-center gap-3">
//           <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
//           <span>Synchronizing environment...</span>
//         </div>
//       </div>
//     );
//   }

//   if (!session) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-black text-zinc-400">
//         Access denied. Please authenticate.
//       </div>
//     );
//   }

//   const scheduledSessions =
//     appointments?.filter((a) => a.status === "Scheduled") || [];
//   const hasUsedFreeSession =
//     appointments?.some((a) => a.status === "Completed") || false;
//   const daysOfWeekLabels = ["S", "M", "T", "W", "T", "F", "S"];

//   return (
//     <div className="min-h-screen bg-background text-zinc-100 antialiased font-sansSelection">
//       {/* GLOBAL BACKGROUND GLOW EFFECTS */}
//       <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
//         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-[160px]" />
//         <div className="absolute bottom-[20%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[140px]" />
//       </div>

//       <div className="relative z-10 max-w-7xl mx-auto px-6 py-10 space-y-8">
//         {/* TOP METADATA BAR */}
//         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
//           <div>
//             <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">
//               Welcome back
//             </p>
//             <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
//               {session.user.name || "Student Matrix"}
//             </h1>
//           </div>
//           <div className="flex items-center gap-3">
//             <div
//               className={`px-3 py-1.5 text-xs font-semibold rounded-md border ${planStyles[plan]}`}
//             >
//               {plan} Account
//             </div>
//             <span className="text-xs text-zinc-500">
//               ID: {session.user.id.slice(0, 8)}
//             </span>
//           </div>
//         </div>

//         {/* THREE COLUMN ARCHITECTURE */}
//         <div className="grid lg:grid-cols-12 gap-6">
//           {/* LEFT SIDEBAR: STREAKS & ANALYTICS (COL SPAN 3) */}
//           <div className="lg:col-span-3 space-y-6">
//             {/* 1. LEARNING STREAK */}
//             <GlassCard>
//               <div className="p-5 space-y-4">
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-2">
//                     <Flame className="w-5 h-5 text-orange-500 fill-orange-500/20" />
//                     <span className="text-xs text-zinc-400 font-medium tracking-wide uppercase">
//                       Learning Streak
//                     </span>
//                   </div>
//                   <span className="text-2xl font-bold tracking-tight text-orange-400">
//                     {learningStreak.currentStreak} Days
//                   </span>
//                 </div>

//                 <div className="grid grid-cols-7 gap-1 text-center">
//                   {learningStreak.daysThisWeek.map((active, index) => (
//                     <div key={index} className="space-y-1.5">
//                       <div
//                         className={`h-8 rounded-md flex items-center justify-center text-xs font-medium border transition-colors ${
//                           active
//                             ? "bg-orange-500/10 border-orange-500/30 text-orange-400 font-semibold"
//                             : "bg-zinc-900/40 border-zinc-800 text-zinc-600"
//                         }`}
//                       >
//                         {active ? "✓" : ""}
//                       </div>
//                       <span className="text-[10px] text-zinc-500 font-medium">
//                         {daysOfWeekLabels[index]}
//                       </span>
//                     </div>
//                   ))}
//                 </div>
//                 <p className="text-[11px] text-zinc-500 text-center">
//                   Longest record streak:{" "}
//                   <span className="text-zinc-300 font-medium">
//                     {learningStreak.longestStreak} days
//                   </span>
//                 </p>
//               </div>
//             </GlassCard>

//             {/* 2. PROGRESS ANALYTICS */}
//             <GlassCard>
//               <SectionHeader icon={BarChart3} title="Progress Analytics" />
//               <div className="p-5 space-y-4">
//                 <div className="space-y-1">
//                   <div className="flex justify-between text-xs">
//                     <span className="text-zinc-400">Weekly Engine Hours</span>
//                     <span className="font-semibold text-white">
//                       {analytics.hoursSpentThisWeek}h
//                     </span>
//                   </div>
//                   <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
//                     <div
//                       className="h-full bg-emerald-500 rounded-full"
//                       style={{
//                         width: `${(analytics.hoursSpentThisWeek / 20) * 100}%`,
//                       }}
//                     />
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-2 gap-3 pt-2">
//                   <div className="p-3 bg-zinc-900/30 border border-zinc-900 rounded-lg">
//                     <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
//                       Completion
//                     </p>
//                     <p className="text-lg font-bold text-zinc-200 mt-0.5">
//                       {analytics.completionRate}%
//                     </p>
//                   </div>
//                   <div className="p-3 bg-zinc-900/30 border border-zinc-900 rounded-lg">
//                     <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
//                       Activity Index
//                     </p>
//                     <p className="text-lg font-bold text-zinc-200 mt-0.5">
//                       {analytics.monthlyActivityScore}/100
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             </GlassCard>
//           </div>

//           {/* MAIN ZONE: COURSES & LIVE INTERACTION (COL SPAN 6) */}
//           <div className="lg:col-span-6 space-y-6">
//             {/* 3. ENROLLED COURSES */}
//             <GlassCard>
//               <SectionHeader
//                 icon={BookOpen}
//                 title="Enrolled Courses"
//                 href="/student/enrolled"
//               />
//               <div className="p-5 space-y-4">
//                 {courses.length > 0 ? (
//                   courses.map((course) => (
//                     <div
//                       key={course.id}
//                       className="p-4 rounded-lg bg-zinc-900/20 border border-zinc-900 hover:border-zinc-800 transition group"
//                     >
//                       <div className="flex items-start justify-between gap-4">
//                         <div className="space-y-1">
//                           <h3 className="font-medium text-sm text-zinc-200 group-hover:text-emerald-400 transition-colors">
//                             {course.title}
//                           </h3>
//                           <p className="text-xs text-zinc-500">
//                             {course.completedLessons} of {course.totalLessons}{" "}
//                             modules completed
//                           </p>
//                         </div>
//                         <span className="text-xs font-semibold text-zinc-300 bg-zinc-900 px-2 py-1 rounded">
//                           {course.progress}%
//                         </span>
//                       </div>
//                       <div className="mt-3 h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
//                         <div
//                           className="h-full bg-linear-to-r from-emerald-500 to-teal-400 rounded-full group-hover:from-emerald-400 group-hover:to-teal-300 transition-all"
//                           style={{ width: `${course.progress}%` }}
//                         />
//                       </div>
//                     </div>
//                   ))
//                 ) : (
//                   <div className="text-center py-8 border border-dashed border-zinc-900 rounded-lg">
//                     <p className="text-xs text-zinc-500">
//                       No core pipelines active.
//                     </p>
//                     <Link
//                       href="/courses"
//                       className="text-xs text-emerald-400 mt-2 inline-flex items-center gap-1 hover:underline"
//                     >
//                       Explore course catalog <ArrowRight className="w-3 h-3" />
//                     </Link>
//                   </div>
//                 )}
//               </div>
//             </GlassCard>

//             {/* 4. UPCOMING LIVE SESSIONS */}
//             <GlassCard>
//               <SectionHeader
//                 icon={Calendar}
//                 title="Upcoming Live Sessions"
//                 href="/student/appointments"
//               />
//               <div className="p-5 space-y-3">
//                 {scheduledSessions.length ? (
//                   scheduledSessions.slice(0, 3).map((app) => (
//                     <div
//                       key={app.id}
//                       className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-zinc-900/30 border border-zinc-900 hover:border-emerald-500/20 transition-all duration-200 gap-3"
//                     >
//                       <div className="flex items-start gap-3">
//                         <div className="p-2 bg-emerald-500/10 rounded-md border border-emerald-500/20 mt-0.5 hidden sm:block">
//                           <Video className="w-4 h-4 text-emerald-400" />
//                         </div>
//                         <div>
//                           <p className="text-sm font-medium text-zinc-200">
//                             {app.educator?.name || "Expert Live Session"}
//                           </p>
//                           <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1.5">
//                             <Clock className="w-3 h-3 text-zinc-600" />
//                             {new Date(app.startTime).toLocaleString(undefined, {
//                               dateStyle: "medium",
//                               timeStyle: "short",
//                             })}
//                           </p>
//                         </div>
//                       </div>

//                       <Link
//                         href={`/student/appointments/room/${app.id}`}
//                         className="sm:self-center px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs"
//                       >
//                         <Video className="w-3.5 h-3.5" /> Join Room
//                       </Link>
//                     </div>
//                   ))
//                 ) : (
//                   <div className="text-center py-10 border border-dashed border-zinc-900 rounded-lg">
//                     <p className="text-xs text-zinc-500">
//                       No scheduled sessions active.
//                     </p>
//                   </div>
//                 )}
//               </div>
//             </GlassCard>
//           </div>

//           {/* RIGHT SIDEBAR: AI RECS, COMMUNITY & ACCOUNT METRICS (COL SPAN 3) */}
//           <div className="lg:col-span-3 space-y-6">
//             {/* 5. CURRENT PLAN ACCOUNT WIDGET */}
//             <GlassCard className="relative overflow-hidden">
//               <div className="absolute inset-0 bg-linear-to-b from-emerald-500/2 to-transparent pointer-events-none" />
//               <div className="p-5 text-center space-y-4">
//                 <div className="mx-auto w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800">
//                   <CreditCard className="w-4 h-4 text-emerald-400" />
//                 </div>
//                 <div>
//                   <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
//                     Current Account Tier
//                   </p>
//                   <h3 className="text-xl font-bold mt-1 text-white tracking-tight">
//                     {plan}
//                   </h3>
//                 </div>

//                 {plan === "Free" ? (
//                   <div className="space-y-3">
//                     {!hasUsedFreeSession ? (
//                       <div className="rounded-lg border border-emerald-500/10 bg-emerald-500/2 p-3 text-left">
//                         <p className="text-xs font-medium text-emerald-400 flex items-center gap-1">
//                           <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
//                           1 Free Session Available
//                         </p>
//                         <p className="text-[11px] text-zinc-400 mt-1 leading-normal">
//                           Activate your initial onboarding live consultation
//                           session.
//                         </p>
//                         <Link
//                           href="/student/appointments"
//                           className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-emerald-500 text-black py-2 text-xs font-semibold hover:bg-emerald-400 transition"
//                         >
//                           Book Onboarding Session
//                         </Link>
//                       </div>
//                     ) : (
//                       <div className="rounded-lg border border-zinc-900 bg-zinc-900/20 p-3 text-left">
//                         <p className="text-xs font-medium text-zinc-400">
//                           Trial Credits Expired
//                         </p>
//                         <p className="text-[11px] text-zinc-500 mt-1 leading-normal">
//                           Unlock premium architecture modules and custom live
//                           tracks.
//                         </p>
//                         <Link
//                           href="/student/myplan"
//                           className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 py-2 text-xs font-semibold hover:bg-zinc-800 transition"
//                         >
//                           View Premium Tiers
//                         </Link>
//                       </div>
//                     )}
//                   </div>
//                 ) : (
//                   <Link
//                     href="/student/myplan"
//                     className="inline-flex w-full items-center justify-center bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 py-2 rounded-md text-xs font-medium transition"
//                   >
//                     Manage Billing Control{" "}
//                     <ExternalLink className="w-3 h-3 ml-1.5 text-zinc-500" />
//                   </Link>
//                 )}
//               </div>
//             </GlassCard>

//             {/* 6. AI TUTOR RECOMMENDATIONS */}
//             <GlassCard className="border-amber-500/10 bg-linear-to-b from-amber-500/1 to-transparent">
//               <div className="p-4 border-b border-zinc-900 flex items-center gap-2">
//                 <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400/10" />
//                 <h2 className="font-semibold text-xs text-zinc-200 tracking-wide uppercase">
//                   AI Mentor Insights
//                 </h2>
//               </div>
//               <div className="p-4 space-y-3">
//                 {aiRecommendations.map((rec) => (
//                   <div
//                     key={rec.id}
//                     className="p-3 bg-zinc-900/40 border border-zinc-900 rounded-lg space-y-1 hover:border-amber-500/20 transition group"
//                   >
//                     <div className="flex items-center justify-between text-[10px]">
//                       <span className="font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">
//                         {rec.type}
//                       </span>
//                       <span className="text-zinc-500">{rec.timeEstimate}</span>
//                     </div>
//                     <p className="text-xs text-zinc-300 group-hover:text-zinc-100 transition-colors leading-normal font-medium">
//                       {rec.topic}
//                     </p>
//                   </div>
//                 ))}
//               </div>
//             </GlassCard>

//             {/* 7. COMMUNITY NOTIFICATIONS */}
//             <GlassCard>
//               <div className="p-4 border-b border-zinc-900 flex items-center gap-2">
//                 <Bell className="w-4 h-4 text-blue-400" />
//                 <h2 className="font-semibold text-xs text-zinc-200 tracking-wide uppercase">
//                   Community Hub
//                 </h2>
//               </div>
//               <div className="p-4 space-y-3">
//                 {communityNotifications.map((notif) => (
//                   <div
//                     key={notif.id}
//                     className="flex items-start justify-between gap-3 text-xs"
//                   >
//                     <p className="text-zinc-400 leading-normal">{notif.text}</p>
//                     <span className="text-[10px] text-zinc-600 shrink-0 whitespace-nowrap">
//                       {notif.date}
//                     </span>
//                   </div>
//                 ))}
//               </div>
//             </GlassCard>

//             {/* 8. RECENT DISCUSSIONS */}
//             <GlassCard>
//               <div className="p-4 border-b border-zinc-900 flex items-center gap-2">
//                 <MessageSquare className="w-4 h-4 text-purple-400" />
//                 <h2 className="font-semibold text-xs text-zinc-200 tracking-wide uppercase">
//                   Active Debates
//                 </h2>
//               </div>
//               <div className="p-4 space-y-3">
//                 {recentDiscussions.map((disc) => (
//                   <div key={disc.id} className="space-y-1 group cursor-pointer">
//                     <p className="text-xs text-zinc-400 group-hover:text-emerald-400 transition-colors line-clamp-2 leading-normal">
//                       {disc.title}
//                     </p>
//                     <div className="flex items-center gap-2 text-[10px] text-zinc-600">
//                       <span className="text-zinc-500 font-medium">
//                         #{disc.category}
//                       </span>
//                       <span>•</span>
//                       <span>{disc.replies} interactions</span>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </GlassCard>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
