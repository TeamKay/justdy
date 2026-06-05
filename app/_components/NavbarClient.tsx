"use client";

import * as React from "react";
import Link from "next/link";

import {
  Menu,
  X,
  BookOpen,
  Video,
  LayoutDashboard,
  LogInIcon,
  Shield,
  GraduationCap,
  User,
} from "lucide-react";
import clsx from "clsx";
import { ThemeToggle } from "@/app/_components/themeToggle";
import { authClient } from "@/lib/auth-client";
import { UserDropdown } from "./UserDropdown";
import { buttonVariants } from "./ui/button";
import { cn } from "@/lib/utils";
import MyLogo from "./Logo";
import { useEffect, useState } from "react";

const productItems = [
  {
    title: "Communities",
    href: "/communities",
    icon: <Video className="h-5 w-5 text-red-500" />,
  },
  {
    title: "Learn more",
    href: "/learnmore",
    icon: <BookOpen className="h-5 w-5 text-blue-500" />,
  },
];

const ROLE_NAV_CONFIG: Record<
  string,
  { label: string; href: string; icon?: React.ReactNode }
> = {
  admin: {
    label: "Admin Dashboard",
    href: "/admin",
    icon: <Shield className="h-4 w-4" />,
  },
  educator: {
    label: "Educator Dashboard",
    href: "/educator",
    icon: <GraduationCap className="h-4 w-4" />,
  },
  learner: {
    label: "Learner Dashboard",
    href: "/learner",
    icon: <User className="h-4 w-4" />,
  },
  unassigned: {
    label: "Complete Profile",
    href: "/onboarding",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
};

interface UserProps {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role?: string;
}

export function NavbarClient({}: { user: UserProps | null }) {
  const { data: session, isPending } = authClient.useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const userRole = session?.user?.role?.toLowerCase() ?? "unassigned";
  const navConfig = ROLE_NAV_CONFIG[userRole] ?? ROLE_NAV_CONFIG["unassigned"];

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/70 backdrop-blur-md supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex min-h-16 items-center px-4 md:px-6 lg:px-8 relative">
        <MyLogo />

        {/* Center Navigation */}
        <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center justify-center gap-1">
          {productItems.map((item) => {
            return (
              <Link
                key={item.title}
                href={item.href}
                className={clsx(
                  "px-4 py-2 rounded-md text-sm font-semibold transition-all duration-300 ease-in-out relative flex flex-col items-center",
                  "active:scale-95",
                  "hover:bg-emerald-600/30 hover:backdrop-blur-sm hover:border-accent/50 border border-transparent",
                  "text-muted-foreground",
                )}
              >
                {item.title}
              </Link>
            );
          })}
        </nav>

        {/* Right Side */}
        <div className="ml-auto flex items-center space-x-4">
          <div className="flex items-center justify-center h-9 w-9 border border-border rounded-md hover:bg-accent transition-colors">
            <ThemeToggle />
          </div>

          {!isPending &&
            mounted &&
            (session ? (
              <div className="flex items-center gap-3">
                <Link
                  href={navConfig.href}
                  className={clsx(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "hidden sm:flex h-9 items-center gap-2 border-primary/20 hover:bg-primary/5 active:scale-95 transition-all",
                  )}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="font-semibold">{navConfig.label}</span>
                </Link>

                <UserDropdown
                  email={session.user.email ?? ""}
                  image={session.user.image ?? ""}
                  name={session.user.name ?? "User"}
                  role={userRole}
                />
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Link
                  href="/login"
                  className={cn(
                    buttonVariants({ variant: "default", size: "sm" }),
                    "h-9 bg-[#857938] hover:bg-[#857938] text-white active:scale-95 transition-transform shadow-sm",
                  )}
                >
                  <LogInIcon className="size-4" />
                  Sign In
                </Link>
              </div>
            ))}

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-muted-foreground focus:outline-none active:scale-90 transition-transform"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-background p-6 space-y-6">
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-2">
              Products
            </h4>
            {productItems.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-lg font-medium transition-all active:scale-95 border border-transparent text-foreground active:bg-accent/40"
                onClick={() => setMobileOpen(false)}
              >
                <div className="flex items-center gap-3">
                  {item.icon} {item.title}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
