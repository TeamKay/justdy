"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ComponentProps } from "react";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  Clock3,
  LayoutDashboard,
  Plus,
  Sparkles,
  UserRound,
  Users,
  Video,
} from "lucide-react";

import EducatorAvailabilityStudio from "@/app/_components/EducatorAvailablityStudio";
import EducatorProfileForm from "@/app/_components/EducatorProfileForm";
import EducatorServicesStudio from "@/app/_components/EducatorServicesStudio";

type AvailabilityProps = ComponentProps<
  typeof EducatorAvailabilityStudio
>;

type ProfileFormProps = ComponentProps<typeof EducatorProfileForm>;

type ServicesProps = ComponentProps<typeof EducatorServicesStudio>;

type AvailabilityItem =
  AvailabilityProps["initialAvailability"][number];

type ServiceItem = ServicesProps["initialServices"][number];

type ProfileFormValue = ProfileFormProps["initialProfile"];

type TabId =
  | "overview"
  | "availability"
  | "profile"
  | "services";

interface EducatorTutoringTabsProps {
  profile: {
    id: string;
    headline: string | null;
    specialty: string | null;
    experience: number | null;
    description: string | null;
    hourlyRate: number | null;
    currency: string | null;
    verificationStatus: string;
    subjects: unknown;
    gradeLevels: unknown;
  } | null;

  initialAvailability: AvailabilityItem[];

  services: ServiceItem[];
  imageUrl?: string | null;
  userName?: string | null;
  upcomingSessions: Array<{
    id: string;
    scheduledStart: string;
    scheduledEnd: string;
    status: string;
    topic: string | null;
    learner: {
      id: string;
      name: string | null;
      imageUrl: string | null;
    } | null;
    service: {
      id: string;
      title: string;
    } | null;
  }>;
  completedSessionCount: number;
  studentCount: number;
  latestPayout: {
    netAmount: number;
    status: string;
    createdAt: string;
  } | null;
}

const navigationItems: Array<{
  id: TabId;
  label: string;
  shortLabel: string;
  description: string;
  icon: typeof LayoutDashboard;
}> = [
  {
    id: "overview",
    label: "Home",
    shortLabel: "Home",
    description: "Your tutoring workspace",
    icon: LayoutDashboard,
  },
   {
    id: "profile",
    label: "Teaching Profile",
    shortLabel: "Profile",
    description: "How students see you",
    icon: UserRound,
  },
  {
    id: "availability",
    label: "Availability",
    shortLabel: "Availability",
    description: "When students can book you",
    icon: CalendarDays,
  },
 
  {
    id: "services",
    label: "Tutoring Services",
    shortLabel: "Services",
    description: "What students can book",
    icon: Sparkles,
  },
];

function getInitials(name: string | null | undefined) {
  const value = name?.trim();

  if (!value) {
    return "JT";
  }

  const initials = value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return initials || "JT";
}

function formatDate(value: string | Date) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatTime(value: string | Date) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatMoney(
  amount: number | null | undefined,
  currency: string | null | undefined,
) {
  if (amount === null || amount === undefined) {
    return "Set your rate";
  }

  const normalizedCurrency =
    currency === "GHS" ? "GHS" : "USD";

  return new Intl.NumberFormat(
    normalizedCurrency === "GHS" ? "en-GH" : "en-US",
    {
      style: "currency",
      currency: normalizedCurrency,
      maximumFractionDigits: 0,
    },
  ).format(amount / 100);
}

export default function EducatorTutoringTabs({
  profile,
  initialAvailability,
  services,
  imageUrl,
  userName,
  upcomingSessions,
  completedSessionCount,
  studentCount,
  latestPayout,
}: EducatorTutoringTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const requestedTab = searchParams.get("tab");
  const initialTab: TabId =
    requestedTab === "profile" ||
    requestedTab === "availability" ||
    requestedTab === "services"
      ? requestedTab
      : "overview";

  const [activeTab, setActiveTab] =
    useState<TabId>(initialTab);

  const [localImageUrl, setLocalImageUrl] = useState<
    string | null | undefined
  >(imageUrl);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const publishedServices = services.filter(
    (service) => service.status === "Published",
  );

  const draftServices = services.filter(
    (service) => service.status === "Draft",
  );

  const availableSlots = initialAvailability.filter(
    (slot) => slot.status === "Available",
  );

  const bookedSlots = initialAvailability.filter(
    (slot) => slot.status === "Booked",
  );

  const profileFormValue: ProfileFormValue = profile
    ? {
        id: profile.id,
        headline: profile.headline,
        specialty: profile.specialty,
        experience: profile.experience,
        description: profile.description,
        hourlyRate: profile.hourlyRate,
        currency: profile.currency ?? "",
        subjects: profile.subjects,
        gradeLevels: profile.gradeLevels,
        verificationStatus:
          profile.verificationStatus,
      }
    : null;

  const profileComplete = Boolean(
    profile &&
      profile.headline &&
      profile.specialty &&
      profile.description,
  );

  const activeNavigation = navigationItems.find(
    (item) => item.id === activeTab,
  );

  const displayName =
    userName?.trim() ||
    profile?.headline ||
    "Your tutoring profile";

  const initials = getInitials(userName);
  const handleImageSelection = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    setLocalImageUrl(previewUrl);
  };

  const goTo = (tab: TabId) => {
    setActiveTab(tab);

    const params = new URLSearchParams(searchParams.toString());

    if (tab === "overview") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }

    const query = params.toString();

    router.replace(
      query ? `${pathname}?${query}` : pathname,
      { scroll: false },
    );
  };

  return (
    <div className="bg-background text-slate-900">
      
      <section className="relative z-20">
        <div className="mx-auto max-w-310 px-5 sm:px-7 lg:px-9">
          <div className="flex h-12.5 items-stretch overflow-visible">
            {navigationItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <div
                  key={item.id}
                  className={`relative h-12.5 flex-1 ${
                    index > 0 ? "-ml-px" : ""
                  }`}
                  style={{
                    zIndex: isActive
                      ? 50
                      : navigationItems.length - index,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => goTo(item.id)}
                    className="absolute inset-0 w-full"
                    style={{
                      clipPath:
                        "polygon(0 0, calc(100% - 22px) 0, 100% 100%, 0 100%)",
                    }}
                  >
                    <span
                      className={`absolute inset-0 transition ${
                        isActive
                          ? "bg-emerald-700"
                          : "bg-card"
                      }`}
                    />

                    <span
                      className={`absolute inset-0 flex items-center justify-center gap-2 pr-5 ${
                        isActive
                          ? "text-white"
                          : "text-white"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 ${
                          isActive
                            ? "text-white"
                            : "text-white"
                        }`}
                        strokeWidth={1.8}
                      />

                      <span
                        className={`text-xs font-semibold sm:text-sm ${
                          isActive
                            ? "text-white"
                            : "text-white/30"
                        }`}
                      >
                        <span className="sm:hidden">
                          {item.shortLabel}
                        </span>

                        <span className="hidden sm:inline">
                          {item.label}
                        </span>
                      </span>
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================
          MAIN WORKSPACE
      ========================================================= */}
      <main className="relative z-10">
        <div className="mx-auto max-w-310 px-5 pb-10 sm:px-7 lg:px-9">
          <div className="min-h-170 bg-card shadow-[0_10px_35px_rgba(15,23,42,0.07)]">
            {/* Content header */}
            <div className="border-b border-emerald-950 px-6 py-5 sm:px-8 lg:px-10">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">
                    {activeNavigation?.label}
                  </h2>

                  <p className="mt-1 text-sm text-white">
                    {activeNavigation?.description}
                  </p>
                </div>

                {/* Context indicator */}
                <div className="flex items-center gap-2">
                  {activeTab === "overview" ? (
                    <span className="inline-flex items-center gap-2 rounded-none bg-emerald-900 px-3 py-2 text-xs font-semibold text-white">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Workspace active
                    </span>
                  ) : null}

                  {activeTab === "availability" ? (
                    <span className="inline-flex items-center gap-2 rounded-none bg-emerald-900 px-3 py-2 text-xs font-semibold text-white">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {availableSlots.length} available
                    </span>
                  ) : null}

                  {activeTab === "profile" ? (
                    <span className="inline-flex items-center gap-2 rounded-none bg-emerald-900 px-3 py-2 text-xs font-semibold text-white">
                      <Users className="h-3.5 w-3.5" />
                      Student-facing
                    </span>
                  ) : null}

                  {activeTab === "services" ? (
                    <span className="inline-flex items-center gap-2 rounded-none bg-emerald-900 px-3 py-2 text-xs font-semibold text-white">
                      <Sparkles className="h-3.5 w-3.5" />
                      {publishedServices.length} published
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {/* =====================================================
                TAB CONTENT
            ===================================================== */}
            <div className="p-5 sm:p-7 lg:p-10">
              {/* ===================================================
                  HOME
              =================================================== */}
              {activeTab === "overview" ? (
                <div className="space-y-8">
                  {/* Hero */}
                  <section className="relative overflow-hidden border border-emerald-950 bg-card">
                    <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
                      <div className="p-7 sm:p-9 lg:p-11">
                        <h3 className="mt-3 max-w-xl text-3xl font-semibold leading-tight tracking-[-0.035em] text-white sm:text-4xl">
                          Make it easy for students
                          to choose you.
                        </h3>

                        <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
                          Your profile, services, and availability
                          work together to create your student-facing
                          tutoring presence.
                        </p>

                        <div className="mt-7 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => goTo("profile")}
                            className="inline-flex h-10 items-center gap-2 bg-emerald-900 px-4 text-xs font-semibold text-white transition hover:bg-emerald-950"
                          >
                            Edit profile
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              goTo("availability")
                            }
                            className="inline-flex h-10 items-center gap-2 border border-emerald-900  px-4 text-xs font-semibold text-white transition hover:bg-emerald-950"
                          >
                            Manage availability
                          </button>
                        </div>
                      </div>

                      {/* Profile preview */}
                      <div className="border-t border-emerald-950 bg-card p-6 lg:border-l lg:border-t-0 lg:p-8">
                        <div className="mx-auto max-w-sm">
                          <div className="mb-3 flex items-center justify-between">
                            <span className="text-[10px] font-medium text-emerald-600">
                              Public profile
                            </span>
                          </div>

                          <div className="overflow-hidden bg-emerald-900 shadow-[0_10px_25px_rgba(15,23,42,0.06)]">
                            <div className="h-20 bg-emerald-500" />

                            <div className="relative px-5 pb-5">
                              <div className="-mt-10 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-white text-lg font-bold text-black shadow-sm">
                                {localImageUrl ? (
                                  <Image
                                    src={localImageUrl}
                                    alt={displayName}
                                    width={80}
                                    height={80}
                                    className="h-full w-full object-cover"
                                    unoptimized
                                  />
                                ) : (
                                  initials
                                )}
                              </div>

                              <h4 className="mt-3 text-lg font-semibold text-slate-950">
                                {userName ||
                                  "Your name"}
                              </h4>

                              <p className="mt-1 text-xs font-medium text-emerald-600">
                                {profile?.headline ||
                                  "Add your teaching headline"}
                              </p>

                              <p className="mt-3 line-clamp-3 text-xs leading-5 text-slate-500">
                                {profile?.description ||
                                  "Tell students about your teaching experience and how you can help them learn."}
                              </p>

                              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                                <span className="text-xs text-slate-400">
                                  From
                                </span>

                                <span className="text-sm font-semibold text-slate-900">
                                  {formatMoney(
                                    profile?.hourlyRate,
                                    profile?.currency,
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Stats */}
                  <section className="grid overflow-hidden border border-emerald-950 sm:grid-cols-2 lg:grid-cols-4">
                    <button
                      type="button"
                      onClick={() => goTo("profile")}
                      className="group p-5 text-left transition hover:bg-slate-50 lg:border-b-0 lg:border-r"
                    >
                      
                      <p className="mt-5 text-xs font-medium text-white">
                        Profile
                      </p>

                      <p className="mt-1 text-lg font-semibold text-muted-foreground">
                        {profileComplete
                          ? "Complete"
                          : "Needs setup"}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => goTo("availability")}
                      className="group p-5 text-left transition hover:bg-slate-50 lg:border-b-0 lg:border-r"
                    >
                      <p className="mt-1 text-[30px] font-semibold text-amber-400">
                        {availableSlots.length}
                      </p>

                      <p className="mt-0.5 text-[11px] text-slate-400">
                        available slots
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => goTo("services")}
                      className="group p-5 text-left transition hover:bg-slate-50 sm:border-r lg:border-b-0"
                    >

                      <p className="mt-1 text-[30px] font-semibold text-amber-400">
                        {publishedServices.length}
                      </p>

                      <p className="mt-0.5 text-[11px] text-white">
                         Services published
                      </p>
                    </button>

                    <div className="p-5">
                      

                      <p className="mt-5 text-xs font-medium text-slate-500">
                        Student visibility
                      </p>

                      <p className="mt-1 text-lg font-semibold text-white">
                        {profileComplete
                          ? "Ready"
                          : "Setup"}
                      </p>

                    </div>
                  </section>

                  {/* Teaching command center */}
                  <section className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.75fr)]">
                    <div className="rounded-2xl border border-border/70 bg-background p-5 shadow-sm sm:p-6">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-600">
                            Teaching schedule
                          </p>
                          <h3 className="mt-1 text-lg font-semibold text-foreground">
                            Upcoming sessions
                          </h3>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">
                            Your next tutoring sessions and the learners you are teaching.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => router.push("/tutoring/sessions")}
                          className="inline-flex h-9 items-center gap-2 text-xs font-semibold text-emerald-700 transition hover:text-emerald-800"
                        >
                          View sessions
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="mt-5 space-y-3">
                        {upcomingSessions.length > 0 ? (
                          upcomingSessions.slice(0, 4).map((session) => (
                            <button
                              key={session.id}
                              type="button"
                              onClick={() => router.push(`/tutoring/sessions/${session.id}`)}
                              className="flex w-full items-center gap-3 rounded-xl border border-border/70 bg-card p-3 text-left transition hover:border-emerald-300 hover:shadow-sm"
                            >
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-50 text-xs font-bold text-emerald-700">
                                {session.learner?.imageUrl ? (
                                  <Image
                                    src={session.learner.imageUrl}
                                    alt={session.learner.name ?? "Learner"}
                                    width={40}
                                    height={40}
                                    className="h-full w-full object-cover"
                                    unoptimized
                                  />
                                ) : (
                                  getInitials(session.learner?.name)
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-foreground">
                                  {session.service?.title ?? "Tutoring session"}
                                </p>
                                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                  {session.learner?.name ?? "Learner"}
                                  {session.topic ? ` · ${session.topic}` : ""}
                                </p>
                              </div>

                              <div className="shrink-0 text-right">
                                <p className="text-xs font-semibold text-foreground">
                                  {formatDate(session.scheduledStart)}
                                </p>
                                <p className="mt-0.5 flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
                                  <Clock3 className="h-3 w-3" />
                                  {formatTime(session.scheduledStart)}
                                </p>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="rounded-xl border border-dashed border-border p-5 text-center">
                            <CalendarDays className="mx-auto h-5 w-5 text-muted-foreground" />
                            <p className="mt-2 text-sm font-semibold text-foreground">
                              No upcoming sessions
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Once learners book you, your teaching schedule will appear here.
                            </p>
                            <button
                              type="button"
                              onClick={() => goTo("availability")}
                              className="mt-3 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                            >
                              Manage availability
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="rounded-2xl border border-border/70 bg-background p-5 shadow-sm sm:p-6">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-600">
                              Teaching activity
                            </p>
                            <h3 className="mt-1 text-lg font-semibold text-foreground">
                              Your numbers
                            </h3>
                          </div>
                          <Users className="h-5 w-5 text-emerald-600" />
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3">
                          <div className="rounded-xl bg-muted/60 p-4">
                            <p className="text-2xl font-semibold tracking-tight text-foreground">
                              {studentCount}
                            </p>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              Learners taught
                            </p>
                          </div>
                          <div className="rounded-xl bg-muted/60 p-4">
                            <p className="text-2xl font-semibold tracking-tight text-foreground">
                              {completedSessionCount}
                            </p>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              Completed sessions
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border/70 bg-background p-5 shadow-sm sm:p-6">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-600">
                              Earnings
                            </p>
                            <h3 className="mt-1 text-lg font-semibold text-foreground">
                              Latest payout
                            </h3>
                          </div>
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        </div>

                        {latestPayout ? (
                          <>
                            <p className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
                              {formatMoney(latestPayout.netAmount, profile?.currency)}
                            </p>
                            <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
                              <span>{formatDate(latestPayout.createdAt)}</span>
                              <span className="rounded-full bg-muted px-2.5 py-1 font-semibold text-foreground">
                                {latestPayout.status}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="mt-5 rounded-xl bg-muted/60 p-4">
                            <p className="text-sm font-semibold text-foreground">
                              No payouts yet
                            </p>
                            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                              Your payout activity will appear here after tutoring revenue is recorded.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Quick actions */}
                  <section>
                    <div className="mb-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-600">
                        Workspace
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-foreground">
                        Quick actions
                      </h3>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {[
                        {
                          label: "Teaching profile",
                          description: "Update how students see you.",
                          tab: "profile" as TabId,
                          icon: UserRound,
                        },
                        {
                          label: "Availability",
                          description: "Open times for new bookings.",
                          tab: "availability" as TabId,
                          icon: CalendarDays,
                        },
                        {
                          label: "Tutoring services",
                          description: "Manage what students can book.",
                          tab: "services" as TabId,
                          icon: Sparkles,
                        },
                      ].map((action) => {
                        const Icon = action.icon;
                        return (
                          <button
                            key={action.label}
                            type="button"
                            onClick={() => goTo(action.tab)}
                            className="group rounded-xl border border-border/70 bg-background p-4 text-left transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-sm"
                          >
                            <Icon className="h-4 w-4 text-emerald-600" />
                            <p className="mt-3 text-sm font-semibold text-foreground">
                              {action.label}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                              {action.description}
                            </p>
                          </button>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => router.push("/tutoring/sessions")}
                        className="group rounded-xl border border-border/70 bg-background p-4 text-left transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-sm"
                      >
                        <Video className="h-4 w-4 text-emerald-600" />
                        <p className="mt-3 text-sm font-semibold text-foreground">
                          Teaching sessions
                        </p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          Review upcoming and completed lessons.
                        </p>
                      </button>
                    </div>
                  </section>
                </div>
              ) : null}

              {/* ===================================================
                  PROFILE
              =================================================== */}
              {activeTab === "profile" ? (
                <div className="space-y-7">
                  {/* Profile hero */}
                  <section className="overflow-hidden">
                    <div className=" bg-card sm:h-0" />

                    <div className="px-0 pb-0 sm:px-0">
                      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                        <div className="flex items-end gap-4">
                          <div className="relative">
                            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-md bg-white text-xl font-bold text-emerald-700 shadow-md">
                              {localImageUrl ? (
                                <Image
                                  src={localImageUrl}
                                  alt={displayName}
                                  width={96}
                                  height={96}
                                  className="h-full w-full object-cover"
                                  unoptimized
                                />
                              ) : (
                                initials
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                fileInputRef.current?.click()
                              }
                              className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-md border border-white/20 bg-slate-900 text-white shadow-sm transition hover:bg-slate-700"
                              aria-label="Upload profile picture"
                            >
                              <Camera className="h-3.5 w-3.5" />
                            </button>

                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              className="hidden"
                              onChange={
                                handleImageSelection
                              }
                            />
                          </div>

                          <div className="pb-1">
                            <h3 className="mt-1 text-xl font-semibold tracking-tight text-white">
                              {userName ||
                                "Your name"}
                            </h3>

                            <p className="mt-1 text-xs text-muted-foreground">
                              {profile?.headline ||
                                "Add a headline that tells students what you teach."}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            fileInputRef.current?.click()
                          }
                          className="inline-flex h-9 w-fit items-center gap-2 bg-emerald-900 px-3 text-xs font-semibold text-white transition hover:bg-emerald-950"
                        >
                          <Camera className="h-3.5 w-3.5" />
                          Change photo
                        </button>
                      </div>

                      <div className="mt-8 flex flex-wrap items-center gap-2 pt-0">
                        {profile?.specialty ? (
                          <span className="rounded-md bg-slate-100 px-2.5 py-1.5 text-[11px] font-medium text-slate-600">
                            {profile.specialty}
                          </span>
                        ) : null}

                        {profile?.experience !==
                        null &&
                        profile?.experience !==
                          undefined ? (
                          <span className="rounded-md bg-slate-100 px-2.5 py-1.5 text-[11px] font-medium text-slate-600">
                            {profile.experience}{" "}
                            {profile.experience === 1
                              ? "year"
                              : "years"}{" "}
                            experience
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </section>

                  {/* Profile visibility */}
                  <section className="grid gap-5 lg:grid-cols-1">
                    <div className="border border-emerald-950 bg-card">
                      <div className="border-b border-emerald-950 px-6 py-4">
                        <h3 className="text-sm font-semibold text-white">
                          Profile information
                        </h3>

                        <p className="mt-1 text-xs text-muted-foreground">
                          This information helps students decide
                          whether you are the right tutor for them.
                        </p>
                      </div>

                      <div className="p-6">
                       <EducatorProfileForm
  initialProfile={profileFormValue}
  initialImageUrl={imageUrl ?? null}
/>
                      </div>
                    </div>

                  </section>
                </div>
              ) : null}

              {/* ===================================================
                  AVAILABILITY
              =================================================== */}
              {activeTab === "availability" ? (
                <div className="space-y-7">
                  {/* Availability overview */}
                  <section className="grid gap-4 sm:grid-cols-3">
                    <div className="border border-emerald-900 bg-card p-5">
                        <p className="mt-1 text-4xl font-semibold tracking-tight text-amber-500">
                        {availableSlots.length}
                      </p>
                      <p className="mt-2 text-xs font-medium text-white">
                        Available slots
                      </p>

                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Students can book these times
                      </p>
                    </div>

                    <div className="border border-emerald-900 bg-card p-5">
                       <p className="mt-1 text-4xl font-semibold tracking-tight text-amber-500">
                        {bookedSlots.length}
                      </p>
                      <p className="mt-2 text-xs font-medium text-white">
                        Scheduled slots
                      </p>

                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Already connected to bookings
                      </p>
                    </div>

                    <div className="border border-emerald-900 bg-card p-5">
                       <p className="mt-1 text-4xl font-semibold tracking-tight text-amber-500">
                        {publishedServices.length}
                      </p>

                      <p className="mt-2 text-xs font-medium text-white">
                        Bookable services
                      </p>

                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Services students can select
                      </p>
                    </div>
                  </section>

                  {/* Schedule header */}
                  <section className="border border-emerald-900 bg-card">
                    <div className="flex flex-col gap-4 border-b border-emerald-950 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="mt-1 text-lg font-semibold text-white">
                          Manage your availability
                        </h3>

                        <p className="mt-1 text-xs text-muted-foreground">
                          Add and manage the times when students
                          can book your tutoring services.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          window.scrollTo({
                            top: document.body.scrollHeight,
                            behavior: "smooth",
                          });
                        }}
                        className="inline-flex h-9 items-center gap-2 bg-emerald-900 px-3 text-xs font-semibold text-white transition hover:bg-emerald-950"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add availability
                      </button>
                    </div>

                    <div className="p-5 sm:p-6">
                      {profile ? (
                        <EducatorAvailabilityStudio
                          profile={{
                            id: profile.id,
                            headline: profile.headline,
                            specialty: profile.specialty,
                            verificationStatus: profile.verificationStatus,
                            subjects: profile.subjects,
                            gradeLevels: profile.gradeLevels,
                          }}
                          initialAvailability={initialAvailability}
                          publishedServices={services
                            .filter(
                              (service) => service.status ===
                                "Published"
                            )
                            .map((service) => ({
                              id: service.id,
                              title: service.title,
                              subject: service.subject,
                              durationMinutes: service.durationMinutes ??
                                0,
                              price: service.price,
                              currency: service.currency,
                              status: service.status,
                            }))} initialRecurringRules={[]}                        />
                      ) : (
                        <EmptyProfileState
                          title="Create your profile first"
                          description="Your teaching profile is needed before availability can be configured."
                          onClick={() =>
                            goTo("profile")
                          }
                        />
                      )}
                    </div>
                  </section>

                  {/* Upcoming slots */}
                  {initialAvailability.length > 0 ? (
                    <section>
                      <div className="mb-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-600">
                          Upcoming
                        </p>

                        <h3 className="mt-1 text-lg font-semibold text-slate-950">
                          Your upcoming availability
                        </h3>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {initialAvailability
                          .slice(0, 6)
                          .map((slot) => (
                            <div
                              key={slot.id}
                              className="border border-slate-200 bg-white p-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
                                  <CalendarDays className="h-4 w-4" />
                                </div>

                                <span
                                  className={`rounded-md px-2 py-1 text-[10px] font-semibold ${
                                    slot.status ===
                                    "Available"
                                      ? "bg-emerald-50 text-emerald-700"
                                      : slot.status ===
                                          "Booked"
                                        ? "bg-blue-50 text-blue-700"
                                        : "bg-slate-100 text-slate-500"
                                  }`}
                                >
                                  {slot.status}
                                </span>
                              </div>

                              <p className="mt-4 text-sm font-semibold text-slate-900">
                                {formatDate(
                                  slot.startTime,
                                )}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {formatTime(
                                  slot.startTime,
                                )}{" "}
                                –{" "}
                                {formatTime(
                                  slot.endTime,
                                )}
                              </p>
                            </div>
                          ))}
                      </div>
                    </section>
                  ) : null}
                </div>
              ) : null}

              {/* ===================================================
                  SERVICES
              =================================================== */}
              {activeTab === "services" ? (
                <div className="space-y-7">
                  {/* Services summary */}
                  <section className="grid gap-4 sm:grid-cols-3">
                    <div className="border border-slate-200 bg-white p-5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
                        <Sparkles className="h-4 w-4" />
                      </div>

                      <p className="mt-5 text-xs font-medium text-slate-500">
                        Published
                      </p>

                      <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                        {publishedServices.length}
                      </p>

                      <p className="mt-1 text-[11px] text-slate-400">
                        Visible to students
                      </p>
                    </div>

                    <div className="border border-slate-200 bg-white p-5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                        <Clock3 className="h-4 w-4" />
                      </div>

                      <p className="mt-5 text-xs font-medium text-slate-500">
                        Drafts
                      </p>

                      <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                        {draftServices.length}
                      </p>

                      <p className="mt-1 text-[11px] text-slate-400">
                        Still being configured
                      </p>
                    </div>

                    <div className="border border-slate-200 bg-white p-5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
                        <CalendarDays className="h-4 w-4" />
                      </div>

                      <p className="mt-5 text-xs font-medium text-slate-500">
                        Available slots
                      </p>

                      <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                        {availableSlots.length}
                      </p>

                      <p className="mt-1 text-[11px] text-slate-400">
                        Ready for booking
                      </p>
                    </div>
                  </section>

                  {/* Service manager */}
                  <section className="border border-slate-200 bg-white">
                    <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-600">
                          Service catalog
                        </p>

                        <h3 className="mt-1 text-lg font-semibold text-slate-950">
                          Tutoring services
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          Create the tutoring options students
                          can choose when booking you.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          window.scrollTo({
                            top: document.body.scrollHeight,
                            behavior: "smooth",
                          });
                        }}
                        className="inline-flex h-9 items-center gap-2 border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add service
                      </button>
                    </div>

                    <div className="p-5 sm:p-6">
                      {profile ? (
                        <EducatorServicesStudio
                          profile={{
                            id: profile.id,
                            verificationStatus:
                              profile.verificationStatus,
                            headline: profile.headline,
                            specialty: profile.specialty,
                            subjects: profile.subjects,
                            gradeLevels:
                              profile.gradeLevels,
                          }}
                          initialServices={services}
                        />
                      ) : (
                        <EmptyProfileState
                          title="Create your profile first"
                          description="Your teaching profile is needed before tutoring services can be configured."
                          onClick={() =>
                            goTo("profile")
                          }
                        />
                      )}
                    </div>
                  </section>

                  {/* Student-facing service preview */}
                  {publishedServices.length > 0 ? (
                    <section>
                      <div className="mb-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-600">
                          Student view
                        </p>

                        <h3 className="mt-1 text-lg font-semibold text-slate-950">
                          Published services
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          These are the services students can
                          select from your tutoring profile.
                        </p>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        {publishedServices.map(
                          (service) => (
                            <div
                              key={service.id}
                              className="border border-slate-200 bg-white p-5 transition hover:border-emerald-300 hover:shadow-sm"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <h4 className="text-sm font-semibold text-slate-950">
                                    {service.title}
                                  </h4>

                                  <p className="mt-1 text-xs text-slate-500">
                                    {service.subject ||
                                      "Tutoring"}
                                  </p>
                                </div>

                                <span className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                                  Published
                                </span>
                              </div>

                              {service.description ? (
                                <p className="mt-4 line-clamp-2 text-xs leading-5 text-slate-500">
                                  {service.description}
                                </p>
                              ) : null}

                              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                                <span className="text-xs text-slate-400">
                                  {service.durationMinutes
                                    ? `${service.durationMinutes} min`
                                    : "Flexible duration"}
                                </span>

                                <span className="text-sm font-semibold text-slate-900">
                                  {formatMoney(
                                    service.price,
                                    service.currency,
                                  )}
                                </span>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </section>
                  ) : (
                    <section className="border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
                        <Sparkles className="h-4 w-4" />
                      </div>

                      <h3 className="mt-4 text-sm font-semibold text-slate-900">
                        No published services yet
                      </h3>

                      <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">
                        Create a tutoring service above. Once
                        published, students will be able to see
                        and select it from your tutor profile.
                      </p>
                    </section>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </main>

   
    </div>
  );
}

function EmptyProfileState({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <div className=" bg-emerald-900 px-6 py-14 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-none bg-emerald-950 text-white">
        <UserRound className="h-5 w-5" />
      </div>

      <h3 className="mt-4 text-sm font-semibold text-white">
        {title}
      </h3>

      <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-muted-foreground">
        {description}
      </p>

      <button
        type="button"
        onClick={onClick}
        className="mt-5 inline-flex h-9 items-center gap-2 bg-emerald-950 px-4 text-xs font-semibold text-white transition hover:bg-emerald-600"
      >
        Set up profile
        <ArrowUpRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}