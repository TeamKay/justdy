
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
  Mail,
  MessagesSquare,
  MessageSquareText,
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
        active ? "text-white" : "text-[#52645A]"
      }`}
    />
  );
}

type AppSidebarProps = React.ComponentProps<typeof Sidebar>;

export function AppSidebar({ ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

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
          <SidebarMenu className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(item.url);

              return (
                <SidebarMenuItem key={`${item.title}-${item.url}`}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    data-active={active ? "true" : "false"}
                    className={`h-10 rounded-lg px-3 text-[15px] font-medium transition-colors ${
                      active
                        ? "!bg-[#173B2F] !text-white shadow-sm hover:!bg-[#245640] hover:!text-white"
                        : "!bg-transparent !text-[#101813] hover:!bg-[#fafaf9] hover:!text-[#173B2F]"
                    }`}
                  >
                    <Link
                      href={item.url}
                      aria-current={active ? "page" : undefined}
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

      router.push("/login");
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
        border-r border-[#E8C49C]/80
        bg-[#dce1d9] text-[#173B2F]
        [--sidebar-width:264px]
        shadow-[8px_0_32px_-24px_rgba(23,59,47,0.18)]
      "
      {...props}
    >
      {/* MathHero matching dotted grid background */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-70"
        aria-hidden="true"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(244,171,82,0.72) 1.15px, transparent 1.3px)",
          backgroundSize: "25px 25px",
        }}
      />

      {/* Sidebar Header */}
      <SidebarHeader className="relative z-10 shrink-0 border-b border-[#E8C49C]/60 bg-transparent px-3.5 py-3">
        <div className="flex h-8 min-w-0 items-center justify-between gap-2 overflow-hidden">
          <div>
            <Link
              href="/"
              className="group inline-flex flex-row items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-[#173B2F]/90 transition hover:bg-[#173B2F]/6 hover:text-[#0B2D22]"
            >
              <Image
                src={LogoImg}
                alt="Justdy logo"
                width={34}
                height={34}
                priority
                className="h-8 w-8 shrink-0 object-contain transition-transform duration-200 group-hover:scale-105"
              />

              <span className="text-[20px] font-bold tracking-[-0.04em] text-[#173B2F] transition-colors duration-200">
                Justdy
              </span>
            </Link>
          </div>

          <SidebarTrigger
            className="size-8 shrink-0 rounded-lg text-[#52645A] transition-colors hover:bg-[#F4AB52]/15 hover:text-[#173B2F] focus-visible:ring-2 focus-visible:ring-[#B97832]/40"
            aria-label="Close sidebar"
            title="Close sidebar"
          />
        </div>
      </SidebarHeader>

      {/* Sidebar Navigation */}
      <SidebarContent className="relative z-10 min-h-0 flex-1 bg-transparent px-2.5 py-4">
        {renderNavigation(visibleNavigation)}
      </SidebarContent>

      {/* Sidebar Footer */}
      <SidebarFooter className="relative z-10 shrink-0 border-t border-[#E8C49C]/60 bg-white/25 p-2.5 backdrop-blur-sm">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              id="account-menu-trigger"
              type="button"
              className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left outline-none transition hover:bg-[#F4AB52]/15 focus-visible:ring-2 focus-visible:ring-[#B97832]/40"
              aria-label="Open account menu"
            >
              <Avatar className="size-8 shrink-0 border border-[#B97832]/25">
                <AvatarImage
                  src={userImage}
                  alt={userName}
                  className="object-cover"
                />

                <AvatarFallback className="bg-[#173B2F] text-[11px] font-semibold text-white">
                  {userInitials}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-[#173B2F]">
                  {userName}
                </p>

                <p className="truncate text-[10px] text-[#52645A]">
                  {userEmail || "Personal workspace"}
                </p>
              </div>

              <ChevronDown className="size-4 shrink-0 text-[#52645A]" />
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
                  src={userImage}
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
