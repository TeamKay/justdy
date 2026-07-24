"use client";

import { useSession } from "@/lib/auth-client";
import React from "react";
import Image from "next/image";

// ---------------- TYPES ----------------
type AdminStats = {
  totalLearners: number;
  totalEducators: number;
  totalCoursesApproved: number;
  totalLessonsApproved: number;
};

type Props = {
  stats: AdminStats;
};

// ---------------- DASHBOARD ----------------

export default function AdminDashboard({
  stats = {
    totalLearners: 0,
    totalEducators: 0,
    totalCoursesApproved: 0,
    totalLessonsApproved: 0,
  },
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
    <div className="min-h-screen w-full text-gray-900 pb-10">
      <div className="max-w-7xl mx-auto px-0 md:p-1 space-y-6">
        {/* ---------------- HERO ---------------- */}
        <div className="rounded-md overflow-hidden border border-white/10 shadow-sm bg-linear-to-r from-emerald-950 via-slate-900 to-indigo-950">
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
                <p className="text-sm text-white/60">Platform Admin</p>
              </div>
            </div>

            {/* Live DB Stats */}
            <div className="flex gap-8 text-white">
              <Stat label="Total Learners" value={stats.totalLearners} />
              <Stat label="Total Educators" value={stats.totalEducators} />
              <Stat label="Total Courses" value={stats.totalCoursesApproved} />
              <Stat label="Total Lessons" value={stats.totalLessonsApproved} />
            </div>
          </div>
        </div>

        {/* ---------------- QUICK ACTIONS ---------------- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ActionButton label="Review Content" />
          <ActionButton label="Manage Users" />
          <ActionButton label="View Analytics" />
          <ActionButton label="Platform Settings" />
        </div>

        {/* ---------------- INSIGHT SECTION ---------------- */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card title="Database Overview Summary">
            <div className="text-sm text-white/70 space-y-2">
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span>Total Active Profiles:</span>
                <span className="text-white font-semibold">
                  {stats.totalLearners + stats.totalEducators}
                </span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span>Total Content Inventory:</span>
                <span className="text-white font-semibold">
                  {stats.totalCoursesApproved + stats.totalLessonsApproved}
                </span>
              </div>
            </div>
          </Card>

          <Card title="System Performance">
            <p className="text-sm text-white/70">
              Database state counts fetched cleanly using concurrent queries.
              Ensure indices are set up on user role column fields for fast
              performance at scale.
            </p>
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
    <button className="px-3 py-2 text-xs rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-white transition cursor-pointer">
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
