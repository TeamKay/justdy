"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  ChevronDown,
  BarChart3,
  CalendarDays,
  CreditCard,
  HelpCircle,
  History,
  LayoutDashboard,
  LogOut,
  Settings2,
  Video,
  WalletCards,
  GraduationCap,
  SlidersHorizontal,
  UserRound,
  TrendingUp,
  Headphones,
  Sparkles,
  LibraryBig,
  BookAIcon,
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
import MyLogo from "../Logo";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

export type NavCapability = "CAN_LEARN" | "CAN_TEACH";

export interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  capability?: NavCapability;
}

export interface NavigationGroup {
  title: string;
  items: NavItem[];
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
      title: "Live Help",
      url: "/admin/live-help",
      icon: Headphones,
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
      title: "Sessions",
      url: "/admin/sessions",
      icon: Video,
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
      title: "Settings",
      url: "/admin/settings",
      icon: Settings2,
    },
    {
  title: "Investments",
  url: "/admin/investments",
  icon: WalletCards,
},
  ],
};

const userNavigation: NavigationGroup[] = [
  {
    title: "Learning",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
        capability: "CAN_LEARN",
      },
      {
        title: "Create with AI",
        url: "/dashboard/create",
        icon: Sparkles,
        capability: "CAN_LEARN",
      },
      {
        title: "My Library",
        url: "/dashboard/library",
        icon: LibraryBig,
        capability: "CAN_LEARN",
      },
      {
        title: "My Sessions",
        url: "/dashboard/sessions",
        icon: CalendarDays,
        capability: "CAN_LEARN",
      },
      {
        title: "Homework Live",
        url: "/live-help",
        icon: BookAIcon,
        capability: "CAN_LEARN",
      },
      {
        title: "Progress",
        url: "/dashboard/progress",
        icon: TrendingUp,
        capability: "CAN_LEARN",
      },
      {
        title: "History",
        url: "/dashboard/history",
        icon: History,
        capability: "CAN_LEARN",
      },
      {
        title: "Credits",
        url: "/dashboard/credits",
        icon: CreditCard,
        capability: "CAN_LEARN",
      },
    ],
  },

  {
    title: "Teaching",
    items: [
      {
        title: "Teaching Workspace",
        url: "/educator",
        icon: GraduationCap,
        capability: "CAN_TEACH",
      },
      {
        title: "Availability",
        url: "/educator?tab=availability",
        icon: CalendarDays,
        capability: "CAN_TEACH",
      },
      {
        title: "Tutoring Services",
        url: "/educator?tab=services",
        icon: SlidersHorizontal,
        capability: "CAN_TEACH",
      },
      {
        title: "Teaching Profile",
        url: "/educator?tab=profile",
        icon: UserRound,
        capability: "CAN_TEACH",
      },
      {
        title: "Teaching Sessions",
        url: "/educator/sessions",
        icon: Video,
        capability: "CAN_TEACH",
      },
      {
        title: "Live Homework Help",
        url: "/live-help",
        icon: Headphones,
        capability: "CAN_TEACH",
      },
      {
        title: "Earnings",
        url: "/earnings",
        icon: WalletCards,
        capability: "CAN_TEACH",
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

interface Conversation {
  id: string;
  title: string;
  model: string | null;
  status: "ACTIVE";
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime();

  if (!Number.isFinite(timestamp)) {
    return "";
  }

  const diff = Math.max(0, Date.now() - timestamp);
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) {
    return "now";
  }

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days}d`;
  }

  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function getConversationTitle(title: string) {
  return title.trim() || "New conversation";
}

function NavIcon({
  icon: Icon,
  active,
}: {
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <Icon
      className={`size-[17px] shrink-0 ${
        active ? "text-white" : "text-white/75"
      }`}
    />
  );
}

function ChatHistorySection({
  projectId,
}: {
  projectId: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeConversationId = searchParams.get("conversationId");

  const [conversations, setConversations] = React.useState<
    Conversation[]
  >([]);

  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  const [actionConversationId, setActionConversationId] =
    React.useState<string | null>(null);

  const [deleteConversation, setDeleteConversation] =
    React.useState<Conversation | null>(null);

  const [pinnedIds, setPinnedIds] = React.useState<Set<string>>(
    () => new Set(),
  );

  const [pinsLoaded, setPinsLoaded] = React.useState(false);

  const deleteCancelRef = React.useRef<HTMLButtonElement>(null);

  const loadConversations = React.useCallback(async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams();

      if (projectId) {
        params.set("projectId", projectId);
      }

      const response = await fetch(
        `/api/ai/chat${
          params.toString() ? `?${params.toString()}` : ""
        }`,
        {
          cache: "no-store",
        },
      );

      const data = (await response.json()) as {
        conversations?: Conversation[];
      };

      if (response.ok) {
        setConversations(data.conversations ?? []);
      }
    } catch (error) {
      console.error("Failed to load chat history:", error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(
          "justdy:pinned-chats",
        );

        if (!stored) {
          return;
        }

        const parsed = JSON.parse(stored);

        if (!Array.isArray(parsed)) {
          return;
        }

        setPinnedIds(
          new Set(
            parsed.filter(
              (value): value is string =>
                typeof value === "string",
            ),
          ),
        );

        setPinsLoaded(true);
      } catch (error) {
        console.error("Failed to load pinned chats:", error);
      } finally {
        setPinsLoaded(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    if (!pinsLoaded) {
      return;
    }

    try {
      window.localStorage.setItem(
        "justdy:pinned-chats",
        JSON.stringify(Array.from(pinnedIds)),
      );
    } catch (error) {
      console.error("Failed to save pinned chats:", error);
    }
  }, [pinnedIds, pinsLoaded]);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadConversations();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadConversations]);

  React.useEffect(() => {
    if (!deleteConversation) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      deleteCancelRef.current?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !actionConversationId) {
        setDeleteConversation(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [deleteConversation, actionConversationId]);

  React.useEffect(() => {
    const refresh = () => void loadConversations();

    window.addEventListener("justdy:chat-updated", refresh);

    return () =>
      window.removeEventListener("justdy:chat-updated", refresh);
  }, [loadConversations]);

  const filteredConversations = React.useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return conversations;
    }

    return conversations.filter((conversation) =>
      getConversationTitle(conversation.title)
        .toLowerCase()
        .includes(query),
    );
  }, [conversations, search]);

  const orderedConversations = React.useMemo(() => {
    return [...filteredConversations].sort((a, b) => {
      const aPinned = pinnedIds.has(a.id);
      const bPinned = pinnedIds.has(b.id);

      if (aPinned !== bPinned) {
        return aPinned ? -1 : 1;
      }

      return (
        new Date(b.updatedAt).getTime() -
        new Date(a.updatedAt).getTime()
      );
    });
  }, [filteredConversations, pinnedIds]);

  const chatHref = projectId
    ? `/chat?projectId=${encodeURIComponent(projectId)}`
    : "/chat";

  const conversationHref = (conversationId: string) => {
    const params = new URLSearchParams();

    params.set("conversationId", conversationId);

    if (projectId) {
      params.set("projectId", projectId);
    }

    return `/chat?${params.toString()}`;
  };

  function requestDeleteConversation(
    conversation: Conversation,
  ) {
    if (actionConversationId) {
      return;
    }

    setDeleteConversation(conversation);
  }

  async function performConversationAction(
    conversation: Conversation,
  ): Promise<boolean> {
    if (actionConversationId) {
      return false;
    }

    setActionConversationId(conversation.id);

    try {
      const params = new URLSearchParams({
        conversationId: conversation.id,
        action: "delete",
      });

      if (projectId) {
        params.set("projectId", projectId);
      }

      const response = await fetch(
        `/api/ai/chat?${params.toString()}`,
        {
          method: "DELETE",
        },
      );

      const data = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.error ?? "Unable to delete conversation.",
        );
      }

      setConversations((current) =>
        current.filter((item) => item.id !== conversation.id),
      );

      setPinnedIds((current) => {
        if (!current.has(conversation.id)) {
          return current;
        }

        const next = new Set(current);
        next.delete(conversation.id);

        return next;
      });

      if (activeConversationId === conversation.id) {
        router.push(chatHref);
      }

      window.dispatchEvent(new Event("justdy:chat-updated"));

      return true;
    } catch (error) {
      console.error("Failed to delete conversation:", error);
      return false;
    } finally {
      setActionConversationId(null);
    }
  }

  /*
   * Chat history is intentionally kept available for the existing
   * dashboard/chat implementation. It does not affect sidebar styling.
   */

  void pathname;
  void search;
  void loading;
  void orderedConversations;
  void conversationHref;
  void requestDeleteConversation;
  void performConversationAction;
  void deleteCancelRef;
}

type AppSidebarProps = React.ComponentProps<typeof Sidebar>;

export function AppSidebar({ ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const { data: session } = authClient.useSession();
  const user = session?.user;

  const projectId = searchParams.get("projectId");
  const conversationId = searchParams.get("conversationId");

  const isChat = pathname === "/chat" || pathname === "/dashboard";

  const userName = user?.name || "Justdy User";
  const userImage = user?.image || "";
  const userEmail = user?.email || "";

  /*
   * Better Auth custom fields can be serialized differently across
   * versions/configurations. Normalize the role before comparing it.
   *
   * This role check is for navigation UI only. Protected server routes
   * must continue to authorize using the authenticated server session
   * and database-backed authorization.
   */
  const normalizedRole = String(
    (user as { role?: unknown } | null | undefined)?.role ?? "",
  )
    .trim()
    .toUpperCase();

  const isAdmin = normalizedRole === "ADMIN";

  const [capabilityKeys, setCapabilityKeys] =
    React.useState<string[]>([]);

  React.useEffect(() => {
    if (!user?.id || isAdmin) {
      return;
    }

    let cancelled = false;

    void fetch("/api/user/capabilities", {
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          capabilities?: string[];
        };

        if (!cancelled) {
          setCapabilityKeys(data.capabilities ?? []);
        }
      })
      .catch((error) => {
        console.error(
          "Failed to load account capabilities:",
          error,
        );
      });

    return () => {
      cancelled = true;
    };
  }, [isAdmin, user?.id]);

  const canLearn = capabilityKeys.includes("CAN_LEARN");
  const canTeach = capabilityKeys.includes("CAN_TEACH");

  const visibleUserNavigation = React.useMemo<NavigationGroup[]>(
    () =>
      userNavigation
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => {
            if (!item.capability) {
              return true;
            }

            return item.capability === "CAN_LEARN"
              ? canLearn
              : canTeach;
          }),
        }))
        .filter((group) => group.items.length > 0),
    [canLearn, canTeach],
  );

  const visibleNavigation: NavigationGroup[] = isAdmin
    ? [adminNavigation]
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

  // Dashboard should only be active on the exact dashboard route.
  if (targetPath === "/dashboard") {
    return pathname === "/dashboard";
  }

  // Admin Dashboard should only be active on the exact admin route.
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

    return (
      (requestedTab ?? null) === (currentTab ?? null)
    );
  }

  if (targetPath === "/projects") {
    return (
      pathname === "/projects" ||
      pathname?.startsWith("/projects/")
    );
  }

  if (targetPath === "/dashboard/library") {
    return (
      pathname === "/dashboard/library" ||
      pathname?.startsWith("/dashboard/library/")
    );
  }

  if (targetPath === "/settings") {
    return (
      pathname === "/settings" ||
      pathname?.startsWith("/settings/")
    );
  }

  return (
    pathname === targetPath ||
    pathname?.startsWith(`${targetPath}/`)
  );
};

const renderNavigation = (groups: NavigationGroup[]) =>
  groups.map((group) => (
    <SidebarGroup
      key={group.title}
      className="p-0"
    >
      <SidebarGroupContent>
        <SidebarMenu className="space-y-0.5">
          {group.items.map((item) => {
            const active = isActive(item.url);

            return (
              <SidebarMenuItem
                key={`${item.title}-${item.url}`}
              >
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  data-active={active ? "true" : "false"}
                  className={`h-10 rounded-xl px-3 text-[13px] font-medium transition-colors ${
                    active
                      ? "!bg-white/10 !text-white shadow-sm hover:!bg-white/10 hover:!text-white"
                      : "!bg-transparent !text-white/75 hover:!bg-white/10 hover:!text-white"
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
      className="border-r border-emerald-900/50 bg-[#181818] text-white [--sidebar-width:264px] shadow-[4px_0_24px_-24px_hsl(var(--foreground)/0.25)]"
      {...props}
    >
      {/* Sidebar Header */}
      <SidebarHeader className="shrink-0 border-b border-emerald-900/50 bg-[#181818] px-3.5 py-2.5">
        <div className="flex h-8 min-w-0 items-center gap-2 overflow-hidden">
          <div className="min-w-0 flex-1 origin-left scale-[0.78]">
            <MyLogo />
          </div>

          <SidebarTrigger
            className="size-8 shrink-0 rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/30"
            aria-label="Close sidebar"
            title="Close sidebar"
          />
        </div>
      </SidebarHeader>

      {/* Sidebar Navigation */}
      <SidebarContent className="min-h-0 bg-[#181818] px-2 py-2.5">
        {renderNavigation(visibleNavigation)}
      </SidebarContent>

      {/* Sidebar Footer */}
      <SidebarFooter className="border-t border-emerald-900/50 bg-[#181818] p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              id="account-menu-trigger"
              type="button"
              className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left outline-none transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/30"
              aria-label="Open account menu"
            >
              <Avatar className="size-8 shrink-0 border border-white/20">
                <AvatarImage
                  src={userImage}
                  alt={userName}
                  className="object-cover"
                />

                <AvatarFallback className="bg-white/10 text-[11px] font-semibold text-white">
                  {userInitials}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-white">
                  {userName}
                </p>

                <p className="truncate text-[10px] text-white/60">
                  {userEmail || "Personal workspace"}
                </p>
              </div>

              <ChevronDown className="size-4 shrink-0 text-white/60" />
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

            <DropdownMenuItem
              asChild
              className="gap-2 rounded-lg"
            >
              <Link href="/dashboard/settings">
                <Settings2 className="size-4" />
                Settings
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem
              asChild
              className="gap-2 rounded-lg"
            >
              <Link href="/dashboard/settings#appearance">
                <SlidersHorizontal className="size-4" />
                Appearance
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem
              asChild
              className="gap-2 rounded-lg"
            >
              <Link href="/credits">
                <CreditCard className="size-4" />
                Credits
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem
              asChild
              className="gap-2 rounded-lg"
            >
              <Link href="/dashboard/settings#profile">
                <UserRound className="size-4" />
                Profile
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem
              asChild
              className="gap-2 rounded-lg"
            >
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