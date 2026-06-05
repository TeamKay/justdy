"use client";

import { useSession } from "@/lib/auth-client";
import React from "react";
import { Mail, MapPin } from "lucide-react";
import Image from "next/image";

// ---------------- TYPES ----------------

type Appointment = {
  id: string;
  status: "Scheduled" | "Completed" | "Cancelled" | string;
  startTime: Date | string;
  educator?: {
    name?: string;
  };
};

type CourseWithProgress = {
  id: string;
  title: string;
  category: string;
  enrollmentProgress: {
    progress: number;
  }[];
};

type CommunityMembership = {
  id: string;
  communityId: string;
};

type UserProfileData = {
  description: string | null;
};

// Ensure your client properties do not break if optional data arrays are processed empty
type Props = {
  appointments?: Appointment[];
  courses?: CourseWithProgress[];
  communityMemberships?: CommunityMembership[];
  userProfile?: UserProfileData | null;
  plan?: string;
  // Removed old mock arrays that do not exist inside your Prisma schema definitions
};

// ---------------- DASHBOARD ----------------

export default function LearnerDashboard({
  courses = [],
  plan = "Free",
  appointments = [],
  communityMemberships = [],
  userProfile,
}: Props) {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-white/70">
        Loading...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-white/70">
        Access denied
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-gray-900 font-sans antialiased pb-6">
      <div className="max-w-6xl mx-auto px-0 md:px-0 mt-0 space-y-6">
        {/* ---------------- HERO BANNER SECTION ---------------- */}
        <div className="bg-emerald-900/40 rounded-md overflow-hidden border border-emerald-900/10 shadow-xs">
          {/* Cover Abstract Art Image */}
          <div className="h-44 w-full relative overflow-hidden bg-linear-to-r from-amber-900 via-orange-800 to-cyan-900">
            <div className="absolute inset-0 opacity-40 bg-[linear-gradient(45deg,rgba(0,0,0,0.15)_25%,transparent_25%,transparent_50%,rgba(0,0,0,0.15)_50%,rgba(0,0,0,0.15)_75%,transparent_75%,transparent)] bg-size-[40px_40px] transform skew-x-12 scale-150"></div>
          </div>

          {/* Profile Header Contents */}
          <div className="px-8 pb-6 relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-5 -mt-14 relative z-10">
              <div className="w-28 h-28 rounded-full border-4 border-emerald-900/10 bg-amber-100 overflow-hidden shadow-sm flex items-center justify-center">
                {session?.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt={session?.user?.name || "Profile"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl">😜</span>
                )}
              </div>
              <div className="mt-16">
                <h2 className="text-2xl font-bold text-white/70">
                  {session?.user?.name || "Learner Name"}
                </h2>
                <p className="text-sm text-gray-400 font-medium mt-0.5">
                  Learner &bull; {plan} Plan
                </p>
              </div>
            </div>

            {/* Metrics Counters */}
            <div className="flex items-center gap-12 mt-4 md:mt-3 pr-4">
              <div>
                <span className="text-2xl font-bold text-white/70">
                  {appointments?.length || 0}
                </span>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  Appointments
                </p>
              </div>
              <div>
                <span className="text-2xl font-bold text-white/70">
                  {communityMemberships?.length || 0}
                </span>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  Communities
                </p>
              </div>
              <div>
                <span className="text-2xl font-bold text-white/70">
                  {courses?.length || 0}
                </span>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  Courses
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ---------------- MAIN LAYOUT SPLIT GRID ---------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
          {/* LEFT SIDEBAR COLUMN: Bio and Meta Info */}
          <div className="space-y-3">
            {/* Contact Info Block */}
            <div className="bg-emerald-900/40 rounded-md p-6">
              <h3 className="text-base font-bold text-white/70 mb-5">Info</h3>
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-white/90 uppercase tracking-wider font-semibold">
                      Email
                    </p>
                    <p className="text-gray-400 font-medium mt-0.5 break-all">
                      {session?.user?.email}
                    </p>
                  </div>
                </div>

                {userProfile?.description && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-white/90 uppercase tracking-wider font-semibold">
                        About Me
                      </p>
                      <p className="text-gray-400 leading-normal mt-0.5">
                        {userProfile.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT MAIN CONTENT COLUMN: Statistics & Activities */}
          <div className="space-y-6">
            {/* Chart Area Card */}
            <div className="bg-emerald-900/40 rounded-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-bold text-white/70">
                  Statistics
                </h3>
                <select className="text-xs font-semibold text-gray-500 border border-gray-200 rounded-md bg-gray-50 px-2.5 py-1.5 focus:outline-hidden">
                  <option>This Month</option>
                  <option>This Week</option>
                </select>
              </div>

              {/* Rendered Activity Performance Chart Mockup */}
              <div className="relative pt-2 pb-4">
                <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-[10px] font-bold text-gray-300 w-8 pointer-events-none">
                  <span>50K</span>
                  <span>10K</span>
                  <span>1K</span>
                  <span>500</span>
                  <span>100</span>
                  <span>00</span>
                </div>

                <div className="ml-8 h-44 relative border-b border-gray-100">
                  {/* Grid Lines */}
                  <div className="absolute inset-x-0 top-0 border-t border-gray-50 h-0" />
                  <div className="absolute inset-x-0 top-1/5 border-t border-gray-50 h-0" />
                  <div className="absolute inset-x-0 top-2/5 border-t border-gray-50 h-0" />
                  <div className="absolute inset-x-0 top-3/5 border-t border-gray-50 h-0" />
                  <div className="absolute inset-x-0 top-4/5 border-t border-gray-50 h-0" />

                  {/* SVG Spline Curve Path matching attached design metrics */}
                  <svg
                    className="w-full h-full overflow-visible"
                    preserveAspectRatio="none"
                    viewBox="0 0 100 100"
                  >
                    <defs>
                      <linearGradient
                        id="chartGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#2563eb"
                          stopOpacity="0.15"
                        />
                        <stop
                          offset="100%"
                          stopColor="#2563eb"
                          stopOpacity="0.0"
                        />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0,20 C 5,22 8,45 12,50 C 16,55 20,40 24,38 C 28,36 32,54 36,58 C 40,62 45,58 50,54 C 55,50 60,38 65,38 C 70,38 72,50 76,46 C 80,42 84,32 88,34 C 92,36 96,44 100,52 L 100,100 L 0,100 Z"
                      fill="url(#chartGrad)"
                    />
                    <path
                      d="M 0,20 C 5,22 8,45 12,50 C 16,55 20,40 24,38 C 28,36 32,54 36,58 C 40,62 45,58 50,54 C 55,50 60,38 65,38 C 70,38 72,50 76,46 C 80,42 84,32 88,34 C 92,36 96,44 100,52"
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <div className="ml-8 mt-3 flex justify-between text-[10px] font-bold text-gray-400">
                  <span>November 01</span>
                  <span>November 10</span>
                  <span>November 20</span>
                  <span>November 30</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
