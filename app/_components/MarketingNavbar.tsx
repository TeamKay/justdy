"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BookOpen,
  Brain,
  ChevronDown,
  Menu,
  Sparkles,
  Video,
  X,
} from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { UserDropdown } from "./UserDropdown";
import { ThemeToggle } from "./themeToggle";




const navigation = [
  {
    label: "AI Tools",
    items: [
      {
        label: "AI Workspace",
        description: "Create educational content with AI",
        href: "/dashboard",
        icon: Sparkles,
      },
      {
        label: "Worksheets",
        description: "Create worksheets with AI",
        href: "/create/worksheet",
        icon: BookOpen,
      },
      {
        label: "Lessons",
        description: "Build structured lessons",
        href: "/create/lesson",
        icon: Brain,
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
        label: "My sessions",
        description: "View your tutoring sessions",
        href: "/tutoring/sessions",
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
      const currentScrollY = window.scrollY;

      if (currentScrollY <= 24) {
        setIsFloating(false);
      } else {
        setIsFloating(true);
      }
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

  const userEmail =
    typeof user?.email === "string" ? user.email : "";

  const userImage =
    typeof user?.image === "string" ? user.image : "";

  const userRole =
    typeof (user as { role?: unknown } | null | undefined)?.role ===
    "string"
      ? ((user as { role?: string }).role ?? "")
      : "";


  const isAdmin = userRole.trim().toUpperCase() === "ADMIN";
  const dashboardHref = isAdmin ? "/admin" : "/dashboard";
  const dashboardLabel = isAdmin
    ? "Admin dashboard"
    : "Go to dashboard";

  const showAuthenticatedUI =
    !sessionPending && !!user;

  const showUnauthenticatedUI =
    !sessionPending && !user;

  return (
    <>
      {/* =========================================================
          HEADER
      ========================================================== */}
      <header
        className={`fixed top-0 z-100 transition-all duration-300 ease-out ${
         isFloating
          ? "left-1/2 mt-3 w-[calc(100%-1.5rem)] max-w-230 -translate-x-1/2 rounded-sm border border-border/50 bg-background/80 shadow-lg backdrop-blur-xl sm:w-[calc(100%-3rem)] lg:mt-4"
          : "inset-x-0 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl"
        }`}
      >
        <div
          className={`mx-auto flex h-16 items-center justify-between px-4 transition-all duration-300 sm:px-6 ${
            isFloating
              ? "max-w-230 lg:px-5"
              : "max-w-7xl lg:px-12"
          }`}
        >
          {/* =====================================================
              BRAND
          ====================================================== */}
          <Link
            href="/"
            className="flex items-center gap-2.5"
            onClick={closeMobileMenu}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-primary text-primary-foreground shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>

            <span className="text-lg font-semibold tracking-tight text-foreground">
              Justdy
            </span>
          </Link>

          {/* =====================================================
              DESKTOP NAVIGATION
          ====================================================== */}
          <nav
            className="hidden items-start justify-start gap-1.5 lg:flex"
            onMouseLeave={closeDropdown}
            onBlur={(event) => {
              const nextFocused =
                event.relatedTarget as Node | null;

              if (
                !nextFocused ||
                !event.currentTarget.contains(nextFocused)
              ) {
                closeDropdown();
              }
            }}
          >
            {/* Home */}
            <Link
              href="/"
              className="rounded-sm px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              Home
            </Link>

            {/* Dropdown menus */}
            {navigation.map((menu) => (
              <div
                key={menu.label}
                className="relative"
              >
                <button
                  type="button"
                  onMouseEnter={() =>
                    setOpenMenu(menu.label)
                  }
                  onFocus={() =>
                    setOpenMenu(menu.label)
                  }
                  onClick={() =>
                    setOpenMenu(
                      openMenu === menu.label
                        ? null
                        : menu.label,
                    )
                  }
                  className={`inline-flex items-center gap-1 rounded-sm px-3 py-2 text-sm font-medium transition ${
                    openMenu === menu.label
                      ? "bg-muted text-foreground"
                      : "text-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  aria-expanded={
                    openMenu === menu.label
                  }
                  aria-haspopup="true"
                >
                  {menu.label}

                  <ChevronDown className="h-3.5 w-3.5" />
                </button>

                {openMenu === menu.label && (
                  <div
                    className="absolute left-0 top-full w-80 pt-2"
                    onMouseEnter={() =>
                      setOpenMenu(menu.label)
                    }
                    onFocus={() =>
                      setOpenMenu(menu.label)
                    }
                  >
                    <div className="rounded-sm border border-border/80 bg-card p-2 shadow-foreground/10">
                      {menu.items.map((item) => {
                        const Icon = item.icon;

                        return (
                          <Link
                            key={item.label}
                            href={item.href}
                            onClick={closeDropdown}
                            className="flex gap-3 rounded-sm p-3 transition hover:bg-muted"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-primary/10 text-primary">
                              <Icon className="h-4 w-4" />
                            </div>

                            <div>
                              <div className="text-sm font-semibold text-foreground">
                                {item.label}
                              </div>

                              <div className="mt-0.5 text-xs leading-5 text-muted-foreground">
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
              className="rounded-sm px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted hover:text-foreground"
            >
              Resources
            </Link>
          </nav>

          {/* =====================================================
              DESKTOP ACTIONS
          ====================================================== */}
          <div className="hidden items-center gap-2 lg:flex">
            {/* =================================================
                THEME TOGGLE
            ================================================== */}
            <ThemeToggle />

            {sessionPending ? (
              /*
               * Keep authentication area visually stable
               * while Better Auth checks the current session.
               */
              <div
                className="h-10 w-39 animate-pulse rounded-xl bg-muted"
                aria-hidden="true"
              />
            ) : showAuthenticatedUI ? (
              <>
                {/* Authenticated user */}
                <Link
                  href={dashboardHref}
                  className="inline-flex h-10 items-center rounded-sm bg-emerald-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-950"
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
              /* =================================================
                 NEW: FULL AUTH PAGE
              ================================================== */
              <Link
                href="/auth?mode=signin"
                className="group ml-4 inline-flex h-8 rounded-sm items-center gap-2 bg-emerald-900 px-7 py-4.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-950"
              >
                Sign in
              </Link>
            ) : null}
          </div>

          {/* =====================================================
              MOBILE ACTIONS
          ====================================================== */}
          <div className="flex items-center gap-2 lg:hidden">
            {/* Theme toggle */}
            <ThemeToggle />

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
              aria-label={
                mobileOpen
                  ? "Close menu"
                  : "Open menu"
              }
              aria-expanded={mobileOpen}
              onClick={() =>
                setMobileOpen(!mobileOpen)
              }
              className="flex h-10 w-10 items-center justify-center rounded-sm border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
          <div className="border-t border-border/60 bg-background/98 backdrop-blur-xl lg:hidden">
            <div className="space-y-1 px-6 py-4 sm:px-8">
              {/* =================================================
                  APPEARANCE
              ================================================== */}
              <div className="mb-3 flex items-center justify-between rounded-sm border border-border/60 bg-muted/30 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Appearance
                  </p>

                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Choose your theme
                  </p>
                </div>

                <ThemeToggle />
              </div>

              {/* Home */}
              <Link
                href="/"
                onClick={closeMobileMenu}
                className="block rounded-sm px-3 py-3 text-sm font-medium text-foreground transition hover:bg-muted"
              >
                Home
              </Link>

              {/* AI Workspace */}
              <Link
                href="/dashboard"
                onClick={closeMobileMenu}
                className="block rounded-sm px-3 py-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                AI Workspace
              </Link>

              {/* Tutoring */}
              <Link
                href="/tutoring"
                onClick={closeMobileMenu}
                className="block rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                Tutoring
              </Link>

              {/* Resources */}
              <Link
                href="/products"
                onClick={closeMobileMenu}
                className="block rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                Resources
              </Link>

              {/* =================================================
                  MOBILE AUTH ACTION
              ================================================== */}
              <div className="mt-3 border-t border-border/60 pt-4">
                {sessionPending ? (
                  <div
                    className="h-11 w-full animate-pulse rounded-xl bg-muted"
                    aria-hidden="true"
                  />
                ) : showAuthenticatedUI ? (
                  <Link
                    href="/dashboard"
                    onClick={closeMobileMenu}
                    className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                  >
                    Open AI Workspace
                  </Link>
                ) : showUnauthenticatedUI ? (
                  <Link
                    href="/auth?mode=signin"
                    onClick={closeMobileMenu}
                    className="group inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/15 transition hover:-translate-y-0.5 hover:bg-primary/90"
                  >
                    Sign in

                    <span className="transition-transform group-hover:translate-x-0.5">
                      →
                    </span>
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
      <div
        aria-hidden="true"
        className="h-16"
      />
    </>
  );
}