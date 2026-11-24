
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import LogoImg from "@/public/images/logo.png";
import Image from "next/image";

import {
  ChevronDown,
  BarChart3,
  CalendarDays,
  CreditCard,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Settings2,
  Video,
  WalletCards,
  GraduationCap,
  SlidersHorizontal,
  UserRound,
  TrendingUp,
  PiggyBank,
  PencilRuler,
  X,
  MessagesSquare,
  Megaphone,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "../ui/sidebar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

import { authClient } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { clearCommunityPresence } from "@/lib/clear-community-presence";

export interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface NavigationGroup {
  title: string;
  items: NavItem[];
  /** Controls visibility using the user's application role, not capability assignments. */
  access?: "learning" | "teaching";
}

const adminNavigation: NavigationGroup = {
  title: "Administration",
  items: [
    {
      title: "Dashboard",
      url: "/admin",
      icon: LayoutDashboard,
    },
    {
      title: "Tutoring requests",
      url: "/admin/tutoring-requests",
      icon: GraduationCap,
    },
    {
      title: "Tutoring payments",
      url: "/admin/tutoring-payments",
      icon: GraduationCap,
    },
    {
      title: "Tutoring sessions",
      url: "/admin/tutoring-sessions",
      icon: GraduationCap,
    },
    {
      title: "Whiteboard Studio",
      url: "/admin/whiteboard",
      icon: PencilRuler,
    },
    {
      title: "Communication Center",
      url: "/admin/communications",
      icon: MessagesSquare,
    },
    {
      title: "Announcements",
      url: "/admin/announcements",
      icon: Megaphone,
    },
    {
      title: "Educators",
      url: "/admin/educators",
      icon: GraduationCap,
    },
    {
      title: "My Profile",
      url: "/admin/profile",
      icon: BarChart3,
    },
    {
      title: "Availability",
      url: "/admin/availability",
      icon: BarChart3,
    },
    {
      title: "Services",
      url: "/admin/services",
      icon: BarChart3,
    },
    {
      title: "Bookings",
      url: "/admin/bookings",
      icon: CalendarDays,
    },
    {
      title: "Payouts",
      url: "/admin/payouts",
      icon: WalletCards,
    },
    {
      title: "Reports",
      url: "/admin/reports",
      icon: BarChart3,
    },
    {
      title: "Investments",
      url: "/admin/investments",
      icon: PiggyBank,
    },
    {
      title: "Settings",
      url: "/admin/settings",
      icon: Settings2,
    },
  ],
};

const userNavigation: NavigationGroup[] = [
  {
    title: "Learning",
    access: "learning",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "My Sessions",
        url: "/dashboard/sessions",
        icon: CalendarDays,
      },
      {
        title: "Progress",
        url: "/dashboard/progress",
        icon: TrendingUp,
      },
    ],
  },
  {
    title: "Teaching",
    access: "teaching",
    items: [
      {
        title: "Teaching Workspace",
        url: "/educator",
        icon: GraduationCap,
      },
      {
        title: "Availability",
        url: "/educator?tab=availability",
        icon: CalendarDays,
      },
      {
        title: "Tutoring Services",
        url: "/educator?tab=services",
        icon: SlidersHorizontal,
      },
      {
        title: "Teaching Profile",
        url: "/educator?tab=profile",
        icon: UserRound,
      },
      {
        title: "Teaching Sessions",
        url: "/educator/sessions",
        icon: Video,
      },
      {
        title: "Earnings",
        url: "/earnings",
        icon: WalletCards,
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        title: "Settings",
        url: "/dashboard/settings",
        icon: Settings2,
      },
    ],
  },
];

function NavIcon({
  icon: Icon,
  active,
}: {
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <Icon
      className={`size-4.25 shrink-0 ${
        active ? "text-white" : "text-white/75"
      }`}
    />
  );
}

type AppSidebarProps = React.ComponentProps<typeof Sidebar>;

export function AppSidebar({ ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const { isMobile, setOpenMobile } = useSidebar();

  const { data: session } = authClient.useSession();
  const user = session?.user;

  const userName = user?.name || "Justdy User";
  const userImage = user?.image || "";
  const userEmail = user?.email || "";

  const normalizedRole = String(
    (user as { role?: unknown } | null | undefined)?.role ?? "",
  )
    .trim()
    .toUpperCase();

  const isAdmin = normalizedRole === "ADMIN";
  const isLearner = normalizedRole === "LEARNER";
  const isTutor = normalizedRole === "TUTOR";

  const mobileRoleLabel = isAdmin
    ? "Admin"
    : isTutor
      ? "Tutor"
      : "Learner";

  const visibleUserNavigation = React.useMemo<NavigationGroup[]>(
    () =>
      userNavigation.filter((group) => {
        if (group.access === "learning") {
          return isLearner || isTutor;
        }

        if (group.access === "teaching") {
          return isTutor;
        }

        return true;
      }),
    [isLearner, isTutor],
  );

  const visibleNavigation: NavigationGroup[] = isAdmin
    ? [
        adminNavigation,
        ...userNavigation.filter((group) => group.title === "Creator"),
      ]
    : visibleUserNavigation;

  const userInitials =
    userName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "JU";

  const isActive = (url: string) => {
    const [targetPath, targetQuery] = url.split("?", 2);

    if (targetPath === "/dashboard") {
      return pathname === "/dashboard";
    }

    if (targetPath === "/admin") {
      return pathname === "/admin";
    }

    if (targetPath === "/educator") {
      const requestedTab = targetQuery
        ? new URLSearchParams(targetQuery).get("tab")
        : null;

      const currentTab = searchParams.get("tab");

      if (pathname !== "/educator") {
        return false;
      }

      return (requestedTab ?? null) === (currentTab ?? null);
    }

    if (targetPath === "/projects") {
      return pathname === "/projects" || pathname?.startsWith("/projects/");
    }

    if (targetPath === "/dashboard/library") {
      return (
        pathname === "/dashboard/library" ||
        pathname?.startsWith("/dashboard/library/")
      );
    }

    if (targetPath === "/settings") {
      return pathname === "/settings" || pathname?.startsWith("/settings/");
    }

    return pathname === targetPath || pathname?.startsWith(`${targetPath}/`);
  };

  const renderNavigation = (groups: NavigationGroup[]) =>
    groups.map((group) => (
      <SidebarGroup key={group.title} className="p-0">
        <SidebarGroupContent>
          <SidebarMenu className="gap-1.5 md:gap-0.5">
            {group.items.map((item) => {
              const active = isActive(item.url);

              return (
                <SidebarMenuItem key={`${item.title}-${item.url}`}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    data-active={active ? "true" : "false"}
                    className={`h-12 px-3.5 text-[15px] font-medium transition-colors md:h-11 md:px-3 ${
                      active
                        ? "!bg-[#be8c5a] !text-white shadow-sm hover:!bg-[#be8c5a] hover:!text-white"
                        : "!bg-transparent !text-white/85 hover:!bg-white/10 hover:!text-white"
                    } rounded-lg`}
                  >
                    <Link
                      href={item.url}
                      aria-current={active ? "page" : undefined}
                      onClick={() => {
                        if (isMobile) {
                          setOpenMobile(false);
                        }
                      }}
                      className="flex h-full w-full items-center gap-3"
                    >
                      <NavIcon icon={item.icon} active={active} />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    ));

  async function handleSignOut() {
    try {
      await clearCommunityPresence();
      await authClient.signOut();

      router.replace("/auth");
      router.refresh();
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  }

  return (
    <Sidebar
      collapsible="offcanvas"
      className="
        isolate relative h-dvh max-h-dvh overflow-hidden
        border-r border-white/15
        bg-[#20242b] text-white
        [--sidebar-width:264px]
        shadow-[8px_0_32px_-24px_rgba(0,0,0,0.4)]
      "
      {...props}
    >
      {/* =========================================================
          CHALKBOARD BACKGROUND — DESKTOP AND MOBILE
      ========================================================== */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(
              rgba(13, 18, 25, 0.38),
              rgba(13, 18, 25, 0.48)
            ),
            url('/images/justdy-chalkboard-background.webp')
          `,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* =========================================================
          SIDEBAR HEADER
      ========================================================== */}

      <SidebarHeader className="relative z-10 shrink-0 border-b border-white/15 !bg-transparent p-0 md:px-3.5 md:py-3">
        {isMobile ? (
          /* Mobile profile header */
          <div className="relative flex min-h-[116px] items-center gap-3 border-b border-white/15 bg-transparent px-5 py-5 text-white">
            <Avatar className="size-12 shrink-0 border-2 border-white/30">
              <AvatarImage
                src={userImage || undefined}
                alt={userName}
                className="object-cover"
              />

              <AvatarFallback className="bg-[#173B2F] text-sm font-bold text-white">
                {userInitials}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1 pr-8">
              <p className="text-xs text-white/65">
                Welcome back,
              </p>

              <p className="truncate text-base font-semibold text-white">
                {userName}
              </p>

              <p className="mt-0.5 text-[11px] font-medium text-white/65">
                {mobileRoleLabel}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setOpenMobile(false)}
              aria-label="Close navigation menu"
              className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E6A52C]"
            >
              <X className="size-5" />
            </button>
          </div>
        ) : (
          /* Desktop header */
          <div className="flex h-8 min-w-0 items-center justify-between gap-2 overflow-hidden">
            <Link
              href="/"
              className="group inline-flex flex-row items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10 hover:text-white"
            >
              <Image
                src={LogoImg}
                alt="Justdy logo"
                width={34}
                height={34}
                priority
                className="h-8 w-8 shrink-0 object-contain transition-transform duration-200 group-hover:scale-105"
              />

              <span className="text-[20px] font-bold tracking-[-0.04em] text-white">
                Justdy
              </span>
            </Link>

            <SidebarTrigger
              className="
                size-8 shrink-0 rounded-lg
                !border !border-white/20
                !bg-white/10 !text-white
                shadow-sm backdrop-blur-sm
                transition-all duration-200
                hover:!border-white/35
                hover:!bg-white/20
                hover:!text-white
                focus-visible:ring-2
                focus-visible:ring-[#E6A52C]/60
                [&_svg]:text-white
              "
              aria-label="Toggle sidebar"
              title="Toggle sidebar"
            />
          </div>
        )}
      </SidebarHeader>

      {/* =========================================================
          SIDEBAR NAVIGATION
      ========================================================== */}

      <SidebarContent
        className="
          relative z-10 min-h-0 flex-1
          overscroll-contain
          !bg-transparent
          px-3 py-4
          md:px-2.5 md:py-4
        "
      >
        {renderNavigation(visibleNavigation)}
      </SidebarContent>

      {/* =========================================================
          SIDEBAR FOOTER
      ========================================================== */}

      <SidebarFooter
        className="
          relative z-10 shrink-0
          border-t border-white/15
          !bg-black/35
          p-3
          pb-[max(0.75rem,env(safe-area-inset-bottom))]
          backdrop-blur-md
          md:!bg-black/20 md:p-2.5
        "
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              id="account-menu-trigger"
              type="button"
              className="flex min-h-12 w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-white outline-none transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#E6A52C]/50 md:min-h-0 md:rounded-lg md:px-2"
            >
              <Avatar className="size-8 shrink-0 border border-white/25">
                <AvatarImage
                  src={userImage || undefined}
                  alt={userName}
                  className="object-cover"
                />

                <AvatarFallback className="bg-[#173B2F] text-[11px] font-semibold text-white">
                  {userInitials}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-white">
                  {userName}
                </p>

                <p className="truncate text-[10px] text-white/65">
                  {userEmail || "Personal workspace"}
                </p>
              </div>

              <ChevronDown className="size-4 shrink-0 text-white/70" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="start"
            side="top"
            sideOffset={8}
            className="w-62 rounded-lg border-border bg-popover p-1.5 text-popover-foreground shadow-xl"
          >
            <div className="flex items-center gap-3 px-2.5 py-2.5">
              <Avatar className="size-9 border border-border">
                <AvatarImage
                  src={userImage || undefined}
                  alt={userName}
                  className="object-cover"
                />

                <AvatarFallback className="bg-muted text-xs font-semibold text-foreground">
                  {userInitials}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {userName}
                </p>

                <p className="truncate text-[11px] text-muted-foreground">
                  {userEmail || "Personal workspace"}
                </p>
              </div>
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild className="gap-2 rounded-lg">
              <Link href="/dashboard/settings">
                <Settings2 className="size-4" />
                Settings
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild className="gap-2 rounded-lg">
              <Link href="/dashboard/settings#appearance">
                <SlidersHorizontal className="size-4" />
                Appearance
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild className="gap-2 rounded-lg">
              <Link href="/credits">
                <CreditCard className="size-4" />
                Credits
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild className="gap-2 rounded-lg">
              <Link href="/dashboard/settings#profile">
                <UserRound className="size-4" />
                Profile
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild className="gap-2 rounded-lg">
              <Link href="/dashboard/settings#help">
                <HelpCircle className="size-4" />
                Help & support
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => void handleSignOut()}
              className="gap-2 rounded-lg text-muted-foreground focus:bg-destructive/10 focus:text-destructive"
            >
              <LogOut className="size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
