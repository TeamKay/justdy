"use client";

import { useSession } from "@/lib/auth-client";
import React from "react";
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

type Props = {
  appointments?: Appointment[];
  courses?: CourseWithProgress[];
  communityMemberships?: CommunityMembership[];
  plan?: string;
};

// ---------------- DASHBOARD ----------------

export default function LearnerDashboard({
  courses = [],
  plan = "Free",
  appointments = [],
  communityMemberships = [],
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

  const nextAppointment = appointments?.[0];

  const avgProgress =
    courses.length > 0
      ? Math.round(
          courses.reduce((acc, c) => {
            const p = c.enrollmentProgress?.[0]?.progress || 0;
            return acc + p;
          }, 0) / courses.length,
        )
      : 0;

  return (
    <div className="min-h-screen bg-background text-gray-900 pb-10">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        {/* ---------------- HERO ---------------- */}
        <div className="rounded-xl overflow-hidden border border-white/10 shadow-sm bg-linear-to-r from-emerald-950 via-slate-900 to-indigo-950">
          <div className="h-40 relative opacity-30 bg-[linear-gradient(45deg,#000_25%,transparent_25%,transparent_50%,#000_50%,#000_75%,transparent_75%,transparent)] bg-size-[40px_40px]" />

          <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 mt-0">
            {/* Profile */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full overflow-hidden border border-white/20 bg-slate-800 flex items-center justify-center">
                {session.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt="profile"
                    width={80}
                    height={80}
                  />
                ) : (
                  <span className="text-3xl">👤</span>
                )}
              </div>

              <div>
                <h2 className="text-xl font-bold text-white">
                  {session.user?.name}
                </h2>
                <p className="text-sm text-white/60">Learner • {plan} Plan</p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-8 text-white">
              <Stat label="Courses" value={courses.length} />
              <Stat label="Appointments" value={appointments.length} />
              <Stat label="Communities" value={communityMemberships.length} />
              <Stat label="Avg Progress" value={`${avgProgress}%`} />
            </div>
          </div>
        </div>

        {/* ---------------- QUICK ACTIONS ---------------- */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <ActionButton label="Continue Learning" />
          <ActionButton label="Book Appointment" />
          <ActionButton label="Browse Courses" />
          <ActionButton label="Join Community" />
          <ActionButton label="View Progress" />
        </div>

        {/* ---------------- INSIGHT SECTION ---------------- */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Next Appointment */}
          <Card title="Next Appointment">
            {nextAppointment ? (
              <div className="text-sm text-white/70">
                <p className="font-medium text-white">
                  {nextAppointment.educator?.name || "Educator"}
                </p>
                <p>{String(nextAppointment.startTime)}</p>
                <button className="mt-3 text-xs px-3 py-1 rounded bg-emerald-600 text-white">
                  Join / View
                </button>
              </div>
            ) : (
              <p className="text-white/50 text-sm">No upcoming sessions</p>
            )}
          </Card>

          {/* Learning Insight */}
          <Card title="Learning Insight">
            <p className="text-sm text-white/70">
              You are improving steadily. Keep consistency to unlock advanced
              modules.
            </p>
            <div className="mt-3 text-sm text-white/60">
              Weekly streak:{" "}
              <span className="text-white font-semibold">3 days 🔥</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ---------------- SMALL COMPONENTS ----------------

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-white/60">{label}</p>
    </div>
  );
}

function ActionButton({ label }: { label: string }) {
  return (
    <button className="px-3 py-2 text-xs rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-white transition">
      {label}
    </button>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-4 rounded-lg border border-white/10 bg-white/5">
      <h3 className="text-sm font-semibold text-white mb-2">{title}</h3>
      {children}
    </div>
  );
}
