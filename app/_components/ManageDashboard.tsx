"use client";

import React, { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";

import {
  Users,
  GraduationCap,
  BookOpen,
  Video,
  ShieldCheck,
  Settings,
  PlusCircle,
  BarChart3,
  Eye,
  Activity,
  X,
  PhoneCall,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Sparkles,
  CheckCircle,
} from "lucide-react";

import { Button } from "@/app/_components/ui/button";
import { Badge } from "@/app/_components/ui/badge";
import { Skeleton } from "@/app/_components/ui/skeleton";

const emptySubscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export type ConsultationStats = {
  totalLeads: number;
  pendingCalls: number;
  completedCalls: number;
  conversionRate: number;
};

export type WebsiteAnalytics = {
  totalVisitors: number;
  visitorsToday: number;
  activeVisitors: number;
  totalPageViews: number;
  pageViewsToday: number;
  visitorsByDay: {
    date: string;
    visitors: number;
    pageViews: number;
  }[];
};

export type AdminStats = {
  totalLearners: number;
  totalEducators: number;
  totalCoursesApproved: number;
  totalLessonsApproved: number;
  consultations?: ConsultationStats;
  analytics?: WebsiteAnalytics;
};

type Props = {
  stats: AdminStats;
};

export default function ManageDashboard({
  stats = {
    totalLearners: 0,
    totalEducators: 0,
    totalCoursesApproved: 0,
    totalLessonsApproved: 0,
    consultations: {
      totalLeads: 0,
      pendingCalls: 0,
      completedCalls: 0,
      conversionRate: 0,
    },
  },
}: Props) {
  const { data: session, isPending } = useSession();

  const mounted = useSyncExternalStore(
    emptySubscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const analytics = stats.analytics || {
    totalVisitors: 0,
    visitorsToday: 0,
    activeVisitors: 0,
    totalPageViews: 0,
    pageViewsToday: 0,
    visitorsByDay: [],
  };

  const [isStatsOpen, setIsStatsOpen] = useState(false);

  if (!mounted || isPending) {
    return <DashboardSkeleton />;
  }

  if (!session) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-md border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className="mb-4 flex size-12 items-center justify-center rounded-md border border-red-100 bg-red-50 text-red-600">
          <ShieldCheck className="size-6" />
        </div>

        <h2 className="mb-1 text-base font-semibold text-slate-900">
          Authentication Required
        </h2>

        <p className="mb-6 max-w-sm text-sm leading-relaxed text-slate-500">
          Please log in with authorized credentials to access management
          controls.
        </p>

        <Button
          size="sm"
          asChild
          className="bg-red-600 text-white shadow-sm hover:bg-red-700"
        >
          <Link href="/login">Sign In</Link>
        </Button>
      </div>
    );
  }

  const isAdmin = session.user?.role?.toLowerCase() === "admin";

  const consultations = stats.consultations || {
    totalLeads: 0,
    pendingCalls: 0,
    completedCalls: 0,
    conversionRate: 0,
  };

  const pendingCount = consultations.pendingCalls;
  const needsAttention = isAdmin && pendingCount > 0;
  const firstName = session.user?.name?.split(" ")[0] || "there";

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-4 lg:px-4 py-5 space-y-4">
      <section className="flex flex-col gap-5 rounded-md border border-slate-200 bg-card p-5 shadow-sm sm:p-0 lg:flex-row lg:items-center lg:justify-between lg:p-7">
        <div className="flex min-w-0 items-center gap-4">
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                Welcome back, {firstName}
              </h1>
            </div>

            <p className="text-sm text-slate-500">
              {isAdmin
                ? "Here's what's happening across your platform today."
                : "Manage your courses, students, and teaching activities."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAdmin ? (
            <Button
              size="sm"
              variant="outline"
              asChild
              className="
                h-9
                border-slate-200
                bg-white
                px-3
                text-xs
                text-slate-700
                shadow-sm
                hover:bg-slate-50
              "
            >
              <Link href="/manage/settings">
                <Settings className="mr-1.5 size-3.5 text-slate-500" />
                Settings
              </Link>
            </Button>
          ) : (
            <Button
              size="sm"
              asChild
              className="
                h-9
                bg-red-600
                px-3
                text-xs
                text-white
                shadow-sm
                hover:bg-red-700
              "
            >
              <Link href="/manage/products/new">
                <PlusCircle className="mr-1.5 size-3.5" />
                New Product
              </Link>
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => setIsStatsOpen(true)}
            className="
              h-9
              gap-1.5
              bg-slate-900
              px-3
              text-xs
              text-white
              shadow-sm
              hover:bg-slate-800
            "
          >
            <BarChart3 className="size-3.5" />
            View Stats
          </Button>
        </div>
      </section>

      <section>
        {needsAttention ? (
          <div className="overflow-hidden rounded-md border border-amber-200 bg-amber-50">
            <div className="flex items-center justify-between gap-3 border-b border-amber-200 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                <AlertCircle className="size-4" />
                <span>Items Requiring Your Attention</span>
              </div>

              <Badge
                variant="outline"
                className="
                  border-amber-200
                  bg-white
                  text-xs
                  font-medium
                  text-amber-700
                "
              >
                {pendingCount} Pending
              </Badge>
            </div>

            <div className="p-4 sm:p-5">
              <div
                className="
                  flex
                  flex-col
                  gap-4
                  rounded-md
                  border
                  border-slate-200
                  bg-white
                  p-4
                  shadow-sm

                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                "
              >
                <div className="flex items-start gap-3">
                  <div
                    className="
                      flex
                      size-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-md
                      border
                      border-amber-100
                      bg-amber-50
                      text-amber-600
                    "
                  >
                    <PhoneCall className="size-4" />
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Consultation Leads Awaiting Callback
                    </h3>

                    <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-500">
                      You have {pendingCount} lead
                      {pendingCount === 1 ? "" : "s"} waiting for confirmation
                      or outreach.
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  asChild
                  className="
                    h-9
                    shrink-0
                    bg-red-600
                    px-3
                    text-xs
                    text-white
                    hover:bg-red-700
                  "
                >
                  <Link href="/manage/consultation-leads">
                    Review Leads
                    <ArrowRight className="ml-1.5 size-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-emerald-200 bg-amber-100 p-6 shadow-sm sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-md border border-emerald-100 bg-[#857938] text-white">
                  <CheckCircle className="size-5" />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    All Caught Up
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {isAdmin
                      ? "No pending consultation requests or critical tasks require your attention."
                      : "Your course activities and student updates are up to date."}
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsStatsOpen(true)}
                className="h-9 shrink-0 border-slate-200 bg-[#857938] px-3 text-xs text-slate-700 hover:bg-slate-50"
              >
                <Sparkles className="mr-1.5 size-3.5 text-red-500" />
                Explore Metrics
              </Button>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">
                Website Analytics
              </h2>

              {analytics.activeVisitors > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                  {analytics.activeVisitors} online now
                </span>
              )}
            </div>

            <p className="mt-1 text-xs text-slate-500">
              Counts everyone who opens your website, including anonymous
              visitors.
            </p>
          </div>

          <BarChart3 className="size-4 text-slate-400" />
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <ModalMetricCard
            title="Visitors Today"
            value={analytics.visitorsToday}
            icon={<Users className="size-4 text-blue-500" />}
          />

          <ModalMetricCard
            title="Online Now"
            value={analytics.activeVisitors}
            icon={<span className="size-2 rounded-full bg-emerald-500" />}
          />

          <ModalMetricCard
            title="Total Visitors"
            value={analytics.totalVisitors}
            icon={<Users className="size-4 text-slate-400" />}
          />

          <div>
            <ModalMetricCard
              title="Page Views"
              value={analytics.totalPageViews}
              icon={<BarChart3 className="size-4 text-slate-400" />}
            />
            <p className="mt-1 px-1 text-[10px] text-slate-400">
              {analytics.pageViewsToday.toLocaleString()} today
            </p>
          </div>
        </div>
      </section>

      {isStatsOpen && (
        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-slate-950/30
            p-4
            backdrop-blur-sm
          "
          onClick={() => setIsStatsOpen(false)}
        >
          <div
            className="
              flex
              max-h-[90vh]
              w-full
              max-w-3xl
              flex-col
              overflow-hidden
              rounded-2xl
              border
              border-slate-200
              bg-white
              shadow-2xl
            "
            onClick={(event) => event.stopPropagation()}
          >
            {/* Modal Header */}

            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div
                  className="
                    flex
                    size-9
                    items-center
                    justify-center
                    rounded-lg
                    bg-red-50
                    text-red-600
                  "
                >
                  <BarChart3 className="size-4" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Detailed Platform Statistics
                  </h3>

                  <p className="text-xs text-slate-500">
                    Overview of platform growth and activity.
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                onClick={() => setIsStatsOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* Modal Content */}

            <div className="space-y-6 overflow-y-auto p-5 sm:p-6">
              <div>
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Core Ecosystem Metrics
                </h4>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <ModalMetricCard
                    title="Learners"
                    value={stats.totalLearners}
                    icon={<Users className="size-4 text-slate-400" />}
                  />

                  <ModalMetricCard
                    title="Educators"
                    value={stats.totalEducators}
                    icon={<GraduationCap className="size-4 text-slate-400" />}
                  />

                  <ModalMetricCard
                    title="Courses"
                    value={stats.totalCoursesApproved}
                    icon={<BookOpen className="size-4 text-slate-400" />}
                  />

                  <ModalMetricCard
                    title="Lessons"
                    value={stats.totalLessonsApproved}
                    icon={<Video className="size-4 text-slate-400" />}
                  />
                </div>
              </div>

              {/* Website Traffic */}
              <div className="border-t border-slate-200 pt-6">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Website Traffic
                    </h4>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Anonymous visitor activity across your website.
                    </p>
                  </div>

                  {analytics.activeVisitors > 0 && (
                    <Badge
                      variant="outline"
                      className="border-emerald-200 bg-emerald-50 text-emerald-700"
                    >
                      <span className="mr-1.5 size-1.5 rounded-full bg-emerald-500" />
                      {analytics.activeVisitors} online
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <ModalMetricCard
                    title="Today"
                    value={analytics.visitorsToday}
                    icon={<Eye className="size-4 text-blue-500" />}
                  />

                  <ModalMetricCard
                    title="Online Now"
                    value={analytics.activeVisitors}
                    icon={<Activity className="size-4 text-emerald-500" />}
                  />

                  <ModalMetricCard
                    title="All Visitors"
                    value={analytics.totalVisitors}
                    icon={<Users className="size-4 text-slate-400" />}
                  />

                  <ModalMetricCard
                    title="Page Views"
                    value={analytics.totalPageViews}
                    icon={<BarChart3 className="size-4 text-slate-400" />}
                  />
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Last 7 Days
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Visitors / Page Views
                    </span>
                  </div>

                  {analytics.visitorsByDay.length > 0 ? (
                    <div className="space-y-2">
                      {analytics.visitorsByDay.map((day) => {
                        const maxVisitors = Math.max(
                          ...analytics.visitorsByDay.map(
                            (item) => item.visitors,
                          ),
                          1,
                        );
                        const visitorWidth = Math.max(
                          4,
                          (day.visitors / maxVisitors) * 100,
                        );

                        return (
                          <div
                            key={day.date}
                            className="grid grid-cols-[72px_1fr_52px] items-center gap-2"
                          >
                            <span className="text-[10px] font-medium text-slate-500">
                              {new Date(
                                `${day.date}T00:00:00`,
                              ).toLocaleDateString(undefined, {
                                weekday: "short",
                              })}
                            </span>

                            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                              <div
                                className="h-full rounded-full bg-slate-900 transition-all"
                                style={{ width: `${visitorWidth}%` }}
                              />
                            </div>

                            <span className="text-right text-[10px] font-semibold text-slate-600">
                              {day.visitors} / {day.pageViews}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="py-3 text-center text-xs text-slate-400">
                      Visitor activity will appear here once your site receives
                      traffic.
                    </p>
                  )}
                </div>
              </div>

              {isAdmin && (
                <div className="border-t border-slate-200 pt-6">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Consultation Funnel
                    </h4>

                    <Link
                      href="/manage/consultation-leads"
                      onClick={() => setIsStatsOpen(false)}
                      className="flex items-center text-xs font-medium text-red-600 hover:text-red-700"
                    >
                      Manage Leads
                      <ArrowRight className="ml-1 size-3" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <ModalMetricCard
                      title="Total Leads"
                      value={consultations.totalLeads}
                      icon={<Users className="size-4 text-slate-400" />}
                    />

                    <ModalMetricCard
                      title="Pending"
                      value={consultations.pendingCalls}
                      icon={<AlertCircle className="size-4 text-amber-500" />}
                    />

                    <ModalMetricCard
                      title="Completed"
                      value={consultations.completedCalls}
                      icon={
                        <CheckCircle2 className="size-4 text-emerald-500" />
                      }
                    />

                    <ModalMetricCard
                      title="Conversion"
                      value={`${consultations.conversionRate}%`}
                      icon={<TrendingUp className="size-4 text-slate-400" />}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}

            <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-5 py-3 sm:px-6">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsStatsOpen(false)}
                className="border-slate-200 bg-white text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ModalMetricCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="
        rounded-xl
        border
        border-slate-200
        bg-slate-50
        p-3.5
        transition-colors
        hover:bg-white
        hover:shadow-sm
      "
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
          {title}
        </span>

        {icon}
      </div>

      <div className="mt-1 text-xl font-bold tracking-tight text-slate-900">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
    </div>
  );
}

/* ==========================================================================
   DASHBOARD SKELETON
========================================================================== */

function DashboardSkeleton() {
  return (
    <div className="w-full space-y-8">
      {/* Header */}

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-14 rounded-xl" />

          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-64" />
          </div>
        </div>
      </div>

      {/* Metrics */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>

      {/* Main */}

      <Skeleton className="h-40 rounded-2xl" />

      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  );
}
