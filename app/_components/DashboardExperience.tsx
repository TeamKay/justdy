"use client";

import React, { useState } from "react";
import {
  Play,
  Lock,
  Download,
  Video,
  CheckCircle2,
  BookOpen,
  FolderDown,
  Calendar,
  Search,
  Bell,
  Clock,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  FileCode2,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/app/_components/ui/button";

export default function DashboardExperience() {
  const [activeTab, setActiveTab] = useState<
    "courses" | "vault" | "mentorship"
  >("courses");

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 py-12 px-4 sm:px-6 lg:px-8">
      {/* Container Wrapper */}
      <div className="max-w-7xl mx-auto px-8 space-y-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-slate-400">
            Everything you need in one centralized
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Track course progress, schedule 1:1 mentor sessions, access free
            lessons.
          </p>
        </div>

        {/* Outer Frame with Glow & Glass effect */}
        <div className="relative rounded-2xl border border-border/60 bg-linear-to-b from-border/30 to-border/10 p-2 sm:p-3 shadow-2xl backdrop-blur-xl">
          {/* Main App Container */}
          <div className="rounded-xl border border-border/80 bg-background overflow-hidden shadow-inner flex flex-col md:flex-row min-h-145">
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border/60 bg-muted/20 p-4 flex flex-col justify-between shrink-0">
              <div className="space-y-6">
                {/* Brand / Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                      LP
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold tracking-tight leading-tight">
                        Justdy
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-mono text-muted-foreground">
                      Live
                    </span>
                  </div>
                </div>

                {/* Nav Links */}
                <div className="space-y-1">
                  <button
                    onClick={() => setActiveTab("courses")}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      activeTab === "courses"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <BookOpen className="size-4" />
                      <span>Dashboard</span>
                    </div>
                    {activeTab === "courses" && (
                      <ChevronRight className="size-3.5 opacity-80" />
                    )}
                  </button>

                  <button
                    onClick={() => setActiveTab("vault")}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      activeTab === "vault"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <FolderDown className="size-4" />
                      <span>My Courses</span>
                    </div>
                    {activeTab === "vault" && (
                      <ChevronRight className="size-3.5 opacity-80" />
                    )}
                  </button>

                  <button
                    onClick={() => setActiveTab("mentorship")}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      activeTab === "mentorship"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Calendar className="size-4" />
                      <span>My Sessions</span>
                    </div>
                    {activeTab === "mentorship" && (
                      <ChevronRight className="size-3.5 opacity-80" />
                    )}
                  </button>
                </div>
              </div>

              {/* Sidebar Footer Stats Widget */}
              <div className="mt-6 pt-4 border-t border-border/50 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground font-medium">
                    Monthly Goal
                  </span>
                  <span className="font-mono text-xs font-semibold text-primary">
                    85%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div className="bg-primary h-full rounded-full w-[85%]" />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  3 of 4 core milestones achieved
                </p>
              </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Top Navigation Bar */}
              <header className="h-14 border-b border-border/60 px-6 flex items-center justify-between bg-muted/10 gap-4">
                <div className="flex items-center gap-3 flex-1 max-w-sm">
                  <div className="relative w-full">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search lessons, assets, or notes..."
                      className="w-full bg-muted/40 border border-border/50 rounded-md pl-8 pr-3 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground/60 transition-all"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button className="relative p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                    <Bell className="size-4" />
                    <span className="absolute top-1 right-1 size-1.5 rounded-full bg-primary" />
                  </button>

                  <div className="h-4 w-px bg-border/60" />

                  <div className="flex items-center gap-2">
                    <div className="size-7 rounded-full bg-linear-to-tr from-primary to-primary/40 flex items-center justify-center text-xs font-bold text-primary-foreground">
                      JD
                    </div>
                    <span className="text-xs font-medium hidden sm:inline-block">
                      John Doe
                    </span>
                  </div>
                </div>
              </header>

              {/* Dynamic View Panel */}
              <main className="p-6 flex-1 bg-background/50 space-y-6">
                {/* --- TAB 1: COURSES VIEW --- */}
                {activeTab === "courses" && (
                  <div className="space-y-6 animate-in fade-in-50 duration-200">
                    {/* View Title */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-4">
                      <div>
                        <h3 className="text-lg font-semibold tracking-tight">
                          Active Curriculum
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Pick up right where you left off
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-xs font-mono bg-muted/50 border border-border/60 px-2.5 py-1 rounded-md text-muted-foreground self-start sm:self-auto">
                        <Clock className="size-3.5 text-primary" /> 12h 40m
                        remaining
                      </span>
                    </div>

                    {/* Active Hero Card */}
                    <div className="p-5 rounded-xl border border-border/60 bg-linear-to-br from-muted/30 via-background to-muted/10 space-y-4 shadow-sm relative overflow-hidden">
                      <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 size-48 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-semibold">
                            Module 04 • System Architecture
                          </span>
                          <h4 className="text-base font-bold text-foreground">
                            Advanced SaaS Architecture & Database Design
                          </h4>
                          <p className="text-xs text-muted-foreground max-w-xl">
                            Learn multi-tenancy models, isolated schema vs
                            shared database patterns, and high-concurrency
                            caching with Redis.
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs text-muted-foreground font-mono block">
                            Overall Progress
                          </span>
                          <span className="text-xl font-bold font-mono text-primary">
                            72%
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1.5">
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                          <div className="bg-primary h-full rounded-full w-[72%] transition-all duration-500" />
                        </div>
                        <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                          <span>18 of 25 Lessons Complete</span>
                          <span>Est. completion: 2 days</span>
                        </div>
                      </div>
                    </div>

                    {/* Lesson Queue */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
                        Up Next In This Module
                      </h4>

                      <div className="grid grid-cols-1 gap-2.5">
                        {/* Active / Playable Lesson */}
                        <div className="p-3.5 rounded-lg border border-primary/30 bg-primary/5 flex items-center justify-between text-xs transition-all hover:border-primary/50">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-sm">
                              <Play className="size-4 fill-current" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">
                                14. Multi-Tenant Schema Setup with Prisma
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                In Progress • Active Video Stream
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground font-mono text-[11px] hidden sm:inline">
                              18:40
                            </span>
                            <Button size="sm" className="h-7 text-xs px-3">
                              Resume
                            </Button>
                          </div>
                        </div>

                        {/* Locked Lesson 1 */}
                        <div className="p-3.5 rounded-lg border border-border/50 bg-muted/20 flex items-center justify-between text-xs opacity-75 hover:opacity-100 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-md bg-muted border border-border/60 flex items-center justify-center text-muted-foreground shrink-0">
                              <Lock className="size-3.5" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                15. Stripe Webhook Integration & Metered Billing
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                Unlocks after Lesson 14
                              </p>
                            </div>
                          </div>
                          <span className="text-muted-foreground font-mono text-[11px]">
                            24:10
                          </span>
                        </div>

                        {/* Locked Lesson 2 */}
                        <div className="p-3.5 rounded-lg border border-border/50 bg-muted/20 flex items-center justify-between text-xs opacity-75 hover:opacity-100 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-md bg-muted border border-border/60 flex items-center justify-center text-muted-foreground shrink-0">
                              <Lock className="size-3.5" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                16. Edge Caching & Global CDN Strategies
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                Unlocks after Lesson 15
                              </p>
                            </div>
                          </div>
                          <span className="text-muted-foreground font-mono text-[11px]">
                            15:20
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- TAB 2: DIGITAL VAULT VIEW --- */}
                {activeTab === "vault" && (
                  <div className="space-y-6 animate-in fade-in-50 duration-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-4">
                      <div>
                        <h3 className="text-lg font-semibold tracking-tight">
                          Digital Resource Vault
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Download boilerplate code, Figma systems, and
                          templates
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-xs font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-md self-start sm:self-auto">
                        <ShieldCheck className="size-3.5" /> All Downloads
                        Verified
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {[
                        {
                          name: "Next.js 15 Starter Kit",
                          desc: "Production-ready boilerplate with Auth.js, Prisma, and Tailwind CSS.",
                          type: "ZIP • 14.2 MB",
                          tag: "Code Boilerplate",
                          icon: FileCode2,
                        },
                        {
                          name: "SaaS Launch Notion OS",
                          desc: "Complete operating system for tracking sprint tasks, roadmap, & CRM.",
                          type: "NOTION • Live Link",
                          tag: "Productivity",
                          icon: LayoutGrid,
                        },
                        {
                          name: "Design System Tokens",
                          desc: "Full Figma UI kit with 200+ accessible components and auto-layout.",
                          type: "FIGMA • v2.4",
                          tag: "UI Kit",
                          icon: TrendingUp,
                        },
                      ].map((asset, i) => {
                        const AssetIcon = asset.icon;
                        return (
                          <div
                            key={i}
                            className="p-4 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-all flex flex-col justify-between space-y-4 group hover:border-primary/40 hover:shadow-sm"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-background border border-border text-muted-foreground">
                                  {asset.tag}
                                </span>
                                <div className="p-1.5 rounded-md bg-background border border-border/50 text-muted-foreground group-hover:text-primary transition-colors">
                                  <AssetIcon className="size-4" />
                                </div>
                              </div>
                              <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                                {asset.name}
                              </h4>
                              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                {asset.desc}
                              </p>
                            </div>

                            <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {asset.type}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs px-2.5 gap-1.5"
                              >
                                <Download className="size-3" />
                                <span>Get</span>
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* --- TAB 3: MENTORSHIP VIEW --- */}
                {activeTab === "mentorship" && (
                  <div className="space-y-6 animate-in fade-in-50 duration-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-4">
                      <div>
                        <h3 className="text-lg font-semibold tracking-tight">
                          1:1 Mentorship Calendar
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Connect directly with senior engineers for live
                          feedback
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs self-start sm:self-auto"
                      >
                        Book New Session
                      </Button>
                    </div>

                    {/* Upcoming Session Card */}
                    <div className="p-5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            <CheckCircle2 className="size-3" /> Confirmed
                            Booking
                          </span>
                          <h4 className="text-base font-bold text-foreground">
                            1:1 Architecture Review & Code Audit
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Scheduled for tomorrow, July 24 at 10:00 AM EST (45
                            mins)
                          </p>
                        </div>

                        <Button
                          size="sm"
                          className="h-9 text-xs shrink-0 gap-2 px-4 shadow-sm"
                        >
                          <Video className="size-3.5" />
                          <span>Join Video Room</span>
                        </Button>
                      </div>

                      <div className="p-3 rounded-lg bg-background/80 border border-border/50 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="size-6 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-[10px]">
                            SE
                          </div>
                          <span className="text-muted-foreground">
                            Assigned Mentor:{" "}
                            <strong className="text-foreground">
                              Alex Rivera (Staff Engineer)
                            </strong>
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground hidden sm:inline">
                          Passcode: 489-102
                        </span>
                      </div>
                    </div>

                    {/* Mentorship Perks Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div className="p-3.5 rounded-lg border border-border/60 bg-muted/20 space-y-1">
                        <p className="text-xs font-semibold">
                          Included Sessions
                        </p>
                        <p className="text-xs text-muted-foreground">
                          1 of 2 monthly sessions remaining in your plan.
                        </p>
                      </div>
                      <div className="p-3.5 rounded-lg border border-border/60 bg-muted/20 space-y-1">
                        <p className="text-xs font-semibold">
                          Async Code Reviews
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Submit PR links anytime for guaranteed 24h feedback.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
