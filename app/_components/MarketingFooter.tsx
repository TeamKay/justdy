"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Github,
  Mail,
  MessageCircle,
  Sparkles,
  Youtube,
} from "lucide-react";

const footerGroups = [
  {
    title: "Platform",
    links: [
      { label: "AI Workspace", href: "/dashboard" },
      { label: "Projects", href: "/projects" },
      { label: "Library", href: "/library" },
      { label: "Resources", href: "/products" },
    ],
  },
  {
    title: "Create with AI",
    links: [
      { label: "Worksheets", href: "/create/worksheet" },
      { label: "Lessons", href: "/create/lesson" },
      { label: "Quizzes", href: "/create/quiz" },
      { label: "Video", href: "/create/video" },
    ],
  },
  {
    title: "Tutoring",
    links: [
      { label: "Find a tutor", href: "/tutoring" },
      { label: "Book a session", href: "/tutor" },
      { label: "My sessions", href: "/tutoring/sessions" },
      { label: "Free Lessons", href: "/videos" },
    ],
  },
];

export default function MarketingFooter() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

  const openSignin = () => {
    setAuthMode("signin");
    setAuthOpen(true);
  };

  const openSignup = () => {
    setAuthMode("signup");
    setAuthOpen(true);
  };

  return (
    <>
      <footer className="w-full bg-background text-foreground">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          {/* Top brand + social row */}
          <div className="flex flex-col gap-8 py-10 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/"
              className="inline-flex w-fit items-center gap-3"
              aria-label="Justdy home"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-sky-500 text-white shadow-sm">
                <Sparkles className="h-4 w-4" />
              </div>

              <span className="text-xl font-semibold tracking-tight text-foreground">
                Justdy
              </span>
            </Link>

            {/* Social links */}
            <div className="flex items-center gap-5 text-muted-foreground">
              <a
                href="#"
                aria-label="YouTube"
                className="transition-colors hover:text-foreground"
              >
                <Youtube className="h-6 w-6" />
              </a>

              <a
                href="#"
                aria-label="GitHub"
                className="transition-colors hover:text-foreground"
              >
                <Github className="h-6 w-6" />
              </a>

              <a
                href="#"
                aria-label="X"
                className="text-2xl leading-none font-light transition-colors hover:text-foreground"
              >
                𝕏
              </a>

              <a
                href="#"
                aria-label="Discord"
                className="transition-colors hover:text-foreground"
              >
                <MessageCircle className="h-6 w-6" />
              </a>
            </div>
          </div>

          {/* Main divider */}
          <div className="border-t border-border" />

          {/* Footer columns */}
          <div className="grid gap-12 py-5 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1.35fr] lg:gap-10">
            {/* Platform */}
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-base font-medium text-foreground">
                  {group.title}
                </h3>

                <ul className="mt-6 space-y-5">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Company */}
            <div>
              <h3 className="text-base font-medium text-foreground">
                Company
              </h3>

              <ul className="mt-0 space-y-5">
                <li>
                  <Link
                    href="/terms"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Terms
                  </Link>
                </li>

                <li>
                  <Link
                    href="/privacy"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Privacy
                  </Link>
                </li>

                <li>
                  <Link
                    href="/license"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    License
                  </Link>
                </li>

                <li>
                  <Link
                    href="/contact"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h3 className="text-base font-medium text-foreground">
                Newsletter
              </h3>

              <form
                className="mt-0 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row"
                onSubmit={(event) => event.preventDefault()}
              >
                <input
                  type="email"
                  required
                  placeholder="Your email"
                  aria-label="Email address"
                  className="h-12 min-w-0 flex-1 rounded-lg border border-border bg-muted/30 px-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />

                <button
                  type="submit"
                  className="h-12 shrink-0 rounded-lg bg-sky-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-sky-600"
                >
                  Submit
                </button>
              </form>

              <p className="mt-6 text-sm text-muted-foreground">
                Don&apos;t miss any update!
              </p>
            </div>
          </div>

          {/* Bottom divider */}
          <div className="border-t border-border" />

          {/* Copyright */}
          <div className="flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Justdy, All rights reserved
            </p>

            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={openSignin}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Sign in
              </button>

              <button
                type="button"
                onClick={openSignup}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Create account
              </button>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}