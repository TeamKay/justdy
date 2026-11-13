
"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import LogoImg from "@/public/images/logo.png";
import Image from "next/image";
import {
  Bell,
  Search,
  Menu,
  X,
  LayoutDashboard,
  UserRound,
  Settings,
  Wallet,
  LogOut,
  ArrowUpRight,
  PenBox,
  Users,
  Clapperboard,
} from "lucide-react";

import { authClient } from "@/lib/auth-client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/_components/ui/dropdown-menu";
import { clearCommunityPresence } from "@/lib/clear-community-presence";
import SocialPostComposer, { SocialPostComposerTrigger } from "@/app/_components/social/posts/SocialPostComposer";

type SocialNavigationProps = {
  username?: string;
  displayName?: string;
  imageUrl?: string | null;
};

export default function SocialNavigation({
  username,
  displayName,
  imageUrl,
}: SocialNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.get("q") ?? "";
  function handleCommunitySearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = String(formData.get("q") ?? "").trim();
    router.push(query ? `/home?q=${encodeURIComponent(query)}` : "/home");
  }
  // Keep the menu state associated with the route where it was opened.
  // When the route changes, mobileMenuOpen becomes false during render,
  // without needing a state update inside an effect.
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const [mobileMenuState, setMobileMenuState] = useState({
    routeKey,
    isOpen: false,
  });

  const mobileMenuOpen =
    mobileMenuState.routeKey === routeKey && mobileMenuState.isOpen;

  const setMobileMenuOpen = (
    nextOpen: boolean | ((currentOpen: boolean) => boolean),
  ) => {
    setMobileMenuState((currentState) => {
      const currentOpen =
        currentState.routeKey === routeKey && currentState.isOpen;

      return {
        routeKey,
        isOpen:
          typeof nextOpen === "function"
            ? nextOpen(currentOpen)
            : nextOpen,
      };
    });
  };

  useEffect(() => {
    if (pathname !== "/" && pathname !== "/home") return;

    const view = searchParams.get("view");

   document.title =
      view === "members"
        ? "Members | Justdy"
        : view === "videos"
          ? "Learning Videos | Justdy"
          : view === "community-videos"
            ? "Community Videos | Justdy"
            : "Community | Justdy";
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    }

    const desktopQuery = window.matchMedia("(min-width: 1024px)");

    function handleViewportChange(event: MediaQueryListEvent) {
      if (event.matches) {
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    desktopQuery.addEventListener("change", handleViewportChange);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      desktopQuery.removeEventListener("change", handleViewportChange);
    };
  }, [mobileMenuOpen]);

  const isNavigationActive = (href: string) => {
    const [targetPath, targetQuery] = href.split("?");
    const targetView = new URLSearchParams(targetQuery ?? "").get("view");

    if (targetPath === "/home") {
      const onCommunityHome = pathname === "/" || pathname === "/home";
      return onCommunityHome && searchParams.get("view") === targetView;
    }

    return pathname === targetPath || pathname.startsWith(`${targetPath}/`);
  };

  const { data: session, isPending } = authClient.useSession();

  const user = session?.user;

  const resolvedName =
    user?.name?.trim() || displayName?.trim() || "Justdy Member";

  const resolvedEmail = user?.email ?? "";

  const resolvedUsername = username?.trim() || "";

  const initials =
    resolvedName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "J";

  const normalizedRole = String(
    (user as { role?: unknown } | null | undefined)?.role ?? "",
  )
    .trim()
    .toUpperCase();

  const isAdmin = normalizedRole === "ADMIN";

  const dashboardHref = isAdmin ? "/admin" : "/dashboard";

  const settingsHref = isAdmin
    ? "/admin/settings"
    : "/dashboard/settings";

  const profileHref = resolvedUsername
    ? `/profile/${encodeURIComponent(resolvedUsername)}`
    : null;

 async function handleSignOut() {
  try {
    await clearCommunityPresence();
    await authClient.signOut();

    router.push("/");
    router.refresh();
  } catch (error) {
    console.error("Unable to sign out:", error);
  }
}

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[#E7ECE5] bg-white">
      <div className="mx-auto flex h-19 w-full max-w-6xl items-center gap-4 px-4 sm:gap-5 sm:px-6 lg:px-8">
        {/* Justdy logo */}
         <Link
             href="/"
             className="group inline-flex flex-row items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-[#302044]/90 transition hover:bg-[#147D72]/10 hover:text-[#147D72]"
      
           >
             <Image
               src={LogoImg}
               alt="Justdy logo"
               width={34}
               height={34}
               priority
               className="h-8 w-8 shrink-0 object-contain transition-transform duration-200 group-hover:scale-105"
             />

             <span className="text-[20px] font-bold tracking-[-0.04em] text-[#302044] transition-colors duration-200">
               Justdy
             </span>
           </Link>

        {/* Community feed search */}
        <form
          key={currentSearch}
          role="search"
          onSubmit={handleCommunitySearch}
          className="relative hidden w-28 shrink sm:block sm:w-40 lg:w-150 2xl:w-64"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9AA79D]" />
          <input
            type="search"
            name="q"
            defaultValue={currentSearch}
            placeholder="Search community"
            aria-label="Search community posts"
            className="h-10 w-full rounded-lg border border-[#E7ECE5] bg-[#F7F9F6] pl-9 pr-10 text-xs text-[#52665A] outline-none transition placeholder:text-[#A3AEA5] focus:border-[#9AAA91] focus:bg-white focus:ring-2 focus:ring-[#52745D]/15"
          />
          <button
            type="submit"
            aria-label="Search community"
            title="Search community"
            className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#64746A] transition hover:bg-[#EAF1EB] hover:text-[#173B2F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52745D]/40"
          >
            <Search className="h-4 w-4" />
          </button>
        </form>

        {/* Primary community navigation: four equally sized actions */}
        <nav
          aria-label="Community navigation"
          className="hidden min-w-0 flex-1 items-center justify-end lg:flex"
        >
          <div className="grid w-50 grid-cols-4 gap-0">
            <Link
              href="/home?view=members"
              aria-label="Members"
              title="Members"
              aria-current={isNavigationActive("/home?view=members") ? "page" : undefined}
              className={`flex h-10 w-10 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52745D]/40 ${
                isNavigationActive("/home?view=members")
                  ? "border-[#D5E3D6] bg-[#E3EEE5] text-[#173B2F]"
                  : "border-[#E7ECE5] bg-white text-[#64746A] hover:bg-[#F1F5F0] hover:text-[#173B2F]"
              }`}
            >
              <Users className="h-[18px] w-[18px]" />
            </Link>

            <Link
              href="/home?view=community-videos"
              aria-label="Reels"
              title="Reels"
              aria-current={isNavigationActive("/home?view=community-videos") ? "page" : undefined}
              className={`flex h-10 w-10 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52745D]/40 ${
                isNavigationActive("/home?view=community-videos")
                  ? "border-[#D5E3D6] bg-[#E3EEE5] text-[#173B2F]"
                  : "border-[#E7ECE5] bg-white text-[#64746A] hover:bg-[#F1F5F0] hover:text-[#173B2F]"
              }`}
            >
              <Clapperboard className="h-[18px] w-[18px]" />
            </Link>

            <button
              type="button"
              disabled
              aria-label="Notifications coming soon"
              title="Notifications coming soon"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E7ECE5] bg-white text-[#64746A] opacity-70"
            >
              <Bell className="h-[18px] w-[18px]" />
            </button>

            <SocialPostComposerTrigger
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E7ECE5] bg-[#312c65] text-white transition hover:border-[#D5E3D6] hover:bg-[#423d75] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52745D]/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <PenBox className="h-[18px] w-[18px]" />
              <span className="sr-only">Create a post</span>
            </SocialPostComposerTrigger>
          </div>
        </nav>

        {/* Vertical separator between community actions and account controls */}
        <div
          aria-hidden="true"
          className="hidden h-10 w-px shrink-0 bg-[#E7ECE5] lg:block"
        />

        {/* User controls */}
        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          {/* Compact community actions shown directly in the mobile header */}
          <div className="flex items-center gap-1.5 lg:hidden">
            <Link
              href="/home?view=members"
              aria-label="Members"
              title="Members"
              aria-current={isNavigationActive("/home?view=members") ? "page" : undefined}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52745D]/40 ${
                isNavigationActive("/home?view=members")
                  ? "border-[#D5E3D6] bg-[#E3EEE5] text-[#173B2F]"
                  : "border-[#E7ECE5] bg-white text-[#64746A] hover:bg-[#F1F5F0] hover:text-[#173B2F]"
              }`}
            >
              <Users className="h-4 w-4" />
            </Link>
            <Link
              href="/home?view=community-videos"
              aria-label="Reels"
              title="Reels"
              aria-current={isNavigationActive("/home?view=community-videos") ? "page" : undefined}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52745D]/40 ${
                isNavigationActive("/home?view=community-videos")
                  ? "border-[#D5E3D6] bg-[#E3EEE5] text-[#173B2F]"
                  : "border-[#E7ECE5] bg-white text-[#64746A] hover:bg-[#F1F5F0] hover:text-[#173B2F]"
              }`}
            >
              <Clapperboard className="h-4 w-4" />
            </Link>
            <button
              type="button"
              disabled
              aria-label="Notifications coming soon"
              title="Notifications coming soon"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E7ECE5] bg-white text-[#64746A] opacity-70"
            >
              <Bell className="h-4 w-4" />
            </button>
            {user && !isPending ? (
              <SocialPostComposerTrigger
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E7ECE5] bg-[#312c65] text-white transition hover:border-[#D5E3D6] hover:bg-[#423d75] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52745D]/40"
              >
                <PenBox className="h-4 w-4" />
                <span className="sr-only">Create a post</span>
              </SocialPostComposerTrigger>
            ) : null}
          </div>

          {/* Mobile community menu */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label={mobileMenuOpen ? "Close community menu" : "Open community menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-community-navigation"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E7ECE5] bg-white text-[#315B43] transition hover:bg-[#F1F5F0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52745D]/40 lg:hidden"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>

          <div className="hidden items-center gap-2 sm:gap-3 lg:flex">
          {isPending ? (
            <div
              aria-label="Loading account"
              className="h-10 w-10 animate-pulse rounded-xl bg-[#F0F4EF]"
            />
          ) : user ? (
            <>
              
             

              {/* Profile dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Open account menu"
                    className="group flex h-11 items-center gap-1.5 rounded-lg p-0.5 outline-none transition hover:bg-[#F4F7F3] focus-visible:ring-2 focus-visible:ring-[#52745D]/40"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E3EEE5] ring-1 ring-[#E5EAE3]">
                      {imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imageUrl}
                          alt={resolvedName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-bold text-[#315B43]">
                          {initials.charAt(0)}
                        </span>
                      )}
                    </span>

                   
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  side="bottom"
                  sideOffset={10}
                  className="w-64 rounded-lg border border-[#E5EAE3] bg-white p-2 text-[#173B2F] shadow-xl"
                >
                  {/* Account identity */}
                  <div className="flex items-center gap-3 rounded-lg bg-[#F7F9F6] p-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#E3EEE5]">
                      {imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imageUrl}
                          alt={resolvedName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-bold text-[#315B43]">
                          {initials}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[#173B2F]">
                        {resolvedName}
                      </p>

                      <p className="truncate text-[11px] text-[#87938A]">
                        {resolvedEmail || "Justdy account"}
                      </p>
                    </div>
                  </div>

                  <DropdownMenuSeparator className="my-2 bg-[#EEF1EC]" />

                  {/* View profile */}
                  {profileHref && (
                    <DropdownMenuItem asChild className="gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium focus:bg-[#F1F5F0] focus:text-[#173B2F]">
                      <Link href={profileHref}>
                        <UserRound className="h-4 w-4 text-[#789080]" />
                        View profile
                      </Link>
                    </DropdownMenuItem>
                  )}

                  {/* Dashboard */}
                  <DropdownMenuItem asChild className="gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium focus:bg-[#F1F5F0] focus:text-[#173B2F]">
                    <Link href={dashboardHref}>
                      <LayoutDashboard className="h-4 w-4 text-[#789080]" />
                      My dashboard
                      <ArrowUpRight className="ml-auto h-3.5 w-3.5 text-[#A1ADA3]" />
                    </Link>
                  </DropdownMenuItem>

                  {/* Account settings */}
                  <DropdownMenuItem asChild className="gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium focus:bg-[#F1F5F0] focus:text-[#173B2F]">
                    <Link href={settingsHref}>
                      <Settings className="h-4 w-4 text-[#789080]" />
                      Account settings
                    </Link>
                  </DropdownMenuItem>

                  {/* Credits */}
                  <DropdownMenuItem asChild className="gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium focus:bg-[#F1F5F0] focus:text-[#173B2F]">
                    <Link href="/credits">
                      <Wallet className="h-4 w-4 text-[#789080]" />
                      Credits and payments
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="my-2 bg-[#EEF1EC]" />

                  {/* Sign out */}
                  <DropdownMenuItem
                    onClick={() => void handleSignOut()}
                    className="gap-3 rounded-lg px-3 py-2.5 text-[13px] font-semibold text-red-600 focus:bg-red-50 focus:text-red-700"
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            /* Signed-out user */
           <button
              type="button"
              onClick={() =>
                window.dispatchEvent(new Event("justdy:open-public-signin"))
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#312c65] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#4d488f] sm:px-5"
            >
              Join Now
              <PenBox className="h-4 w-4" />
            </button>
          )}
          </div>
        </div>
      </div>

      {/* Persistent composer listener for the header Create Post action */}
      {user && !isPending ? (
        <SocialPostComposer
          displayName={resolvedName}
          imageUrl={imageUrl ?? null}
          showInlineTrigger={false}
        />
      ) : null}

      {/* Expandable mobile community navigation */}
      {mobileMenuOpen && (
        <nav
          id="mobile-community-navigation"
          aria-label="Mobile community navigation"
          className="absolute inset-x-0 top-full border-b border-[#E7ECE5] bg-white px-4 py-3 shadow-lg lg:hidden sm:px-6"
        >
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-3">
            <div className="my-1 border-t border-[#E7ECE5]" />

            {isPending ? (
              <div className="h-12 animate-pulse rounded-lg bg-[#F0F4EF]" aria-label="Loading account" />
            ) : user ? (
              <>
                <div className="flex items-center gap-3 rounded-lg bg-[#F7F9F6] p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#E3EEE5]">
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imageUrl} alt={resolvedName} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-[#315B43]">{initials}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#173B2F]">{resolvedName}</p>
                    <p className="truncate text-xs text-[#87938A]">{resolvedEmail || "Justdy account"}</p>
                  </div>
                </div>

                <Link href={dashboardHref} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-[#344F40] hover:bg-[#EAF1EB]">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>

                {profileHref && (
                  <Link href={profileHref} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-[#344F40] hover:bg-[#EAF1EB]">
                    <UserRound className="h-4 w-4" />
                    View profile
                  </Link>
                )}

                <Link href={settingsHref} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-[#344F40] hover:bg-[#EAF1EB]">
                  <Settings className="h-4 w-4" />
                  Account settings
                </Link>

                <Link href="/credits" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-[#344F40] hover:bg-[#EAF1EB]">
                  <Wallet className="h-4 w-4" />
                  Credits and payments
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    void handleSignOut();
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  window.dispatchEvent(new Event("justdy:open-public-signin"));
                }}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold text-[#173B2F] hover:bg-[#EAF1EB]"
              >
                <ArrowUpRight className="h-4 w-4" />
                Join Now
              </button>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
