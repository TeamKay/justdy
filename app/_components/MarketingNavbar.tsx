"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, Menu, Sparkles, Video, X } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { UserDropdown } from "./UserDropdown";
import LogoImg from "@/public/images/logo.png";
import Image from "next/image";

const navigation = [
  {
    label: "AI Studio",
    items: [
      {
        label: "Create with AI",
        description:
          "Create worksheets, workbooks, coloring pages, images, and videos",
        href: "/dashboard/create",
        icon: Sparkles,
      },
    ],
  },
  {
    label: "Tutoring",
    items: [
      {
        label: "Find a tutor",
        description: "Book a live tutoring session",
        href: "/tutoring",
        icon: Video,
      },
      {
        label: "Learning packages",
        description: "View our tutoring packages",
        href: "/tutoring",
        icon: Video,
      },
    ],
  },
];

export default function MarketingNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [isFloating, setIsFloating] = useState(false);

  const {
    data: session,
    isPending: sessionPending,
    refetch: refetchSession,
  } = authClient.useSession();

  /* -------------------------------------------------------------
     FLOATING NAVBAR ON SCROLL
  ------------------------------------------------------------- */
  useEffect(() => {
    const handleScroll = () => {
      setIsFloating(window.scrollY > 24);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  /* -------------------------------------------------------------
     REFRESH SESSION AFTER AUTH STATE CHANGES
  ------------------------------------------------------------- */
  useEffect(() => {
    const handleAuthStateChanged = () => {
      void refetchSession();
    };

    window.addEventListener(
      "justdy:auth-state-changed",
      handleAuthStateChanged,
    );

    return () => {
      window.removeEventListener(
        "justdy:auth-state-changed",
        handleAuthStateChanged,
      );
    };
  }, [refetchSession]);

  /* -------------------------------------------------------------
     CLOSE MENUS
  ------------------------------------------------------------- */
  const closeDropdown = () => {
    setOpenMenu(null);
  };

  const closeMobileMenu = () => {
    setMobileOpen(false);
    setOpenMenu(null);
  };

  /* -------------------------------------------------------------
     USER / SESSION
  ------------------------------------------------------------- */
  const user = session?.user;

  const userName =
    typeof user?.name === "string" && user.name.trim()
      ? user.name.trim()
      : "User";

  const userEmail = typeof user?.email === "string" ? user.email : "";

  const userImage = typeof user?.image === "string" ? user.image : "";

  const userRole =
    typeof (user as { role?: unknown } | null | undefined)?.role === "string"
      ? ((user as { role?: string }).role ?? "")
      : "";

  const isAdmin = userRole.trim().toUpperCase() === "ADMIN";

  const dashboardHref = isAdmin ? "/admin" : "/dashboard";

  const dashboardLabel = isAdmin ? "Admin dashboard" : "Go to dashboard";

  const showAuthenticatedUI = !sessionPending && !!user;

  const showUnauthenticatedUI = !sessionPending && !user;

  return (
    <>
      {/* =========================================================
          HEADER
          Uses the same background image, gradient, and grid
          treatment as the landing-page hero.
      ========================================================== */}
      <header
        className={`fixed top-0 z-1000 isolate transition-all duration-300 ease-out ${
          isFloating
            ? "left-1/2 mt-3 w-[calc(100%-1.5rem)] max-w-230 -translate-x-1/2 rounded-lg shadow-[0_18px_50px_rgba(0,0,0,.28)] sm:w-[calc(100%-3rem)] lg:mt-4"
            : "inset-x-0 w-full"
        }`}
      >
        {/* Landing-page photographic background */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 z-0 ${
            isFloating ? "rounded-xl" : ""
          }`}
          style={{
            backgroundColor: "#071d2b",
            backgroundImage: "url('/images/justdy-landing-background.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        {/* Navy, blue, and teal gradient overlay */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 z-1 ${
            isFloating ? "rounded-xl" : ""
          }`}
          style={{
            backgroundImage:
              "linear-gradient(110deg, rgba(3,24,37,.96) 0%, rgba(18,34,73,.89) 48%, rgba(3,45,48,.88) 100%)",
          }}
        />

        {/* Subtle grid texture matching the hero */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 z-[2] ${
            isFloating ? "rounded-xl" : ""
          }`}
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px)",
            backgroundSize: "54px 54px",
          }}
        />

        {/* Soft dotted texture */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 z-[3] ${
            isFloating ? "rounded-xl" : ""
          }`}
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,.10) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Navbar content */}
        <div
          className={`relative z-10 mx-auto flex h-15 items-center justify-between px-4 transition-all duration-300 sm:px-6 ${
            isFloating ? "max-w-230 lg:px-5" : "max-w-7xl lg:px-12"
          }`}
        >
          {/* =====================================================
              BRAND
          ====================================================== */}

          <Link
            href="/"
            className="group inline-flex flex-row items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
            onClick={closeMobileMenu}
          >
            <Image
              src={LogoImg}
              alt="Justdy logo"
              width={34}
              height={34}
              priority
              className="h-6 w-6 shrink-0 object-contain transition-transform duration-200 group-hover:scale-105"
            />

            <span className="text-[16px] font-bold tracking-[-0.04em] text-white transition-colors duration-200">
              Justdy
            </span>
          </Link>

          {/* =====================================================
              DESKTOP NAVIGATION
          ====================================================== */}
          <nav
            className="hidden items-center justify-center gap-1.5 lg:flex"
            onMouseLeave={closeDropdown}
            onBlur={(event) => {
              const nextFocused = event.relatedTarget as Node | null;

              if (!nextFocused || !event.currentTarget.contains(nextFocused)) {
                closeDropdown();
              }
            }}
          >
            {/* Home */}
            <Link
              href="/"
              className="rounded-lg px-3 py-2 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
            >
              Home
            </Link>

            {/* Dropdown menus */}
            {navigation.map((menu) => (
              <div key={menu.label} className="relative">
                <button
                  type="button"
                  onMouseEnter={() => setOpenMenu(menu.label)}
                  onFocus={() => setOpenMenu(menu.label)}
                  onClick={() =>
                    setOpenMenu(openMenu === menu.label ? null : menu.label)
                  }
                  className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium leading-5 transition ${
                    openMenu === menu.label
                      ? "bg-white/10 text-white"
                      : "text-white/85 hover:bg-white/10 hover:text-white"
                  }`}
                  aria-expanded={openMenu === menu.label}
                  aria-haspopup="true"
                >
                  {menu.label}

                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${
                      openMenu === menu.label ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {openMenu === menu.label && (
                  <div
                    className="absolute left-0 top-full z-1100 w-80 pt-3"
                    onMouseEnter={() => setOpenMenu(menu.label)}
                    onFocus={() => setOpenMenu(menu.label)}
                  >
                    <div className="relative z-1100 rounded-xl border border-white/10 bg-[#0b2635]/95 p-2 shadow-2xl shadow-black/30 backdrop-blur-xl">
                      {menu.items.map((item) => {
                        const Icon = item.icon;

                        return (
                          <Link
                            key={item.label}
                            href={item.href}
                            onClick={closeDropdown}
                            className="flex gap-3 rounded-lg p-3 transition hover:bg-white/10"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[.07] text-emerald-300">
                              <Icon className="h-4 w-4" />
                            </div>

                            <div>
                              <div className="text-sm font-semibold text-white">
                                {item.label}
                              </div>

                              <div className="mt-0.5 text-xs leading-5 text-white/65">
                                {item.description}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Resources */}
            <Link
              href="/products"
              className="rounded-lg px-3 py-2 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
            >
              Resources
            </Link>
          </nav>

          {/* =====================================================
              DESKTOP ACTIONS
          ====================================================== */}
          <div className="hidden items-center gap-2 lg:flex">
            {sessionPending ? (
              <div
                className="h-10 w-39 animate-pulse rounded-xl border border-white/10 bg-white/10"
                aria-hidden="true"
              />
            ) : showAuthenticatedUI ? (
              <>
                <Link
                  href={dashboardHref}
                  className="inline-flex h-8.5 items-center rounded-lg bg-white px-4 text-sm font-semibold text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-[#edf12b]"
                >
                  {dashboardLabel}
                </Link>

                <UserDropdown
                  email={userEmail}
                  image={userImage}
                  name={userName}
                  role={userRole}
                />
              </>
            ) : showUnauthenticatedUI ? (
              <Link
                href="/auth?mode=signin"
                className="ml-3 inline-flex h-8.5 items-center justify-center rounded-lg bg-white px-6 text-sm font-semibold text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-[#edf12b]"
              >
                Sign in
              </Link>
            ) : null}
          </div>

          {/* =====================================================
              MOBILE ACTIONS
          ====================================================== */}
          <div className="flex items-center gap-2 lg:hidden">
            {showAuthenticatedUI && (
              <UserDropdown
                email={userEmail}
                image={userImage}
                name={userName}
                role={userRole}
              />
            )}

            <button
              type="button"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/[.04] text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* =======================================================
            MOBILE NAVIGATION
        ======================================================== */}
        {mobileOpen && (
          <div className="relative border-t border-white/10 bg-[#071d2b]/95 backdrop-blur-xl lg:hidden">
            {/* Mobile menu grid texture */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />

            <div className="relative space-y-1 px-5 py-4 sm:px-8">
              {/* Appearance information */}
              <div className="mb-3 rounded-xl border border-white/10 bg-white/[.04] px-4 py-3">
                <p className="text-sm font-semibold text-white">
                  Welcome to Justdy
                </p>

                <p className="mt-1 text-xs leading-5 text-white/60">
                  Personalized learning, all in one place.
                </p>
              </div>

              {/* Home */}
              <Link
                href="/"
                onClick={closeMobileMenu}
                className="block rounded-lg px-3 py-3 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
              >
                Home
              </Link>

              {/* AI Studio */}
              <Link
                href="/dashboard/create"
                onClick={closeMobileMenu}
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
              >
                <Sparkles className="h-4 w-4 text-emerald-300" />
                AI Studio
              </Link>

              {/* Tutoring */}
              <Link
                href="/tutoring"
                onClick={closeMobileMenu}
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
              >
                <Video className="h-4 w-4 text-emerald-300" />
                Tutoring
              </Link>

              {/* My sessions */}
              <Link
                href="/tutoring/sessions"
                onClick={closeMobileMenu}
                className="block rounded-lg px-3 py-3 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
              >
                My sessions
              </Link>

              {/* Resources */}
              <Link
                href="/products"
                onClick={closeMobileMenu}
                className="block rounded-lg px-3 py-3 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
              >
                Resources
              </Link>

              {/* Mobile authentication action */}
              <div className="mt-3 border-t border-white/10 pt-4">
                {sessionPending ? (
                  <div
                    className="h-11 w-full animate-pulse rounded-xl border border-white/10 bg-white/10"
                    aria-hidden="true"
                  />
                ) : showAuthenticatedUI ? (
                  <Link
                    href={dashboardHref}
                    onClick={closeMobileMenu}
                    className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-white text-sm font-semibold text-slate-950 transition hover:bg-[#edf12b]"
                  >
                    {dashboardLabel}
                  </Link>
                ) : showUnauthenticatedUI ? (
                  <Link
                    href="/auth?mode=signin"
                    onClick={closeMobileMenu}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold text-slate-950 shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-[#edf12b]"
                  >
                    Sign in
                    <span aria-hidden="true">→</span>
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* =========================================================
          HEADER SPACER
      ========================================================== */}
      <div aria-hidden="true" className="h-16" />
    </>
  );
}
