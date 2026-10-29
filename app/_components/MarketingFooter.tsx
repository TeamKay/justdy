"use client";

import Link from "next/link";
import { useState } from "react";
import { Github, MessageCircle, Sparkles, Youtube } from "lucide-react";

const footerGroups = [
  {
    title: "Platform",
    links: [
      { label: "Home", href: "/" },
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
      { label: "Become a tutor", href: "/tutoring/apply" },
    ],
  },
];

const companyLinks = [
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
  { label: "License", href: "/license" },
  { label: "Contact", href: "/contact" },
];

const linkClass =
  "text-[15px] leading-6 text-neutral-400 transition-colors duration-200 hover:text-sky-400";

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
    <footer className="w-full  bg-background">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-8">
        {/* Brand and social links */}
        <div className="flex flex-col gap-7 pt-20 sm:flex-row sm:items-center sm:justify-between sm:py-8">
          <Link
            href="/"
            aria-label="Justdy home"
            className="group inline-flex w-fit items-center gap-3"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500 text-[#091d33] transition-colors group-hover:bg-sky-400">
              <Sparkles className="h-5 w-5" />
            </span>

            <span className="text-[22px] font-semibold tracking-tight text-[#091d33]">
              Justdy
            </span>
          </Link>

          <div className="flex items-center gap-6 text-neutral-400">
            <a
              href="#"
              aria-label="YouTube"
              className="transition-colors hover:text-white"
            >
              <Youtube className="h-6 w-6" />
            </a>

            <a
              href="#"
              aria-label="GitHub"
              className="transition-colors hover:text-white"
            >
              <Github className="h-6 w-6" />
            </a>

            <a
              href="#"
              aria-label="X"
              className="text-[27px] leading-none font-light transition-colors hover:text-white"
            >
              𝕏
            </a>

            <a
              href="#"
              aria-label="Discord"
              className="transition-colors hover:text-white"
            >
              <MessageCircle className="h-6 w-6" />
            </a>
          </div>
        </div>

        <div className="border-t border-neutral-800" />

        {/* Five-column navigation layout */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 py-10 sm:grid-cols-3 lg:grid-cols-[1fr_1fr_1fr_0.8fr_1.45fr] lg:gap-x-10 lg:py-14">
          {footerGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-base font-bold text-emerald-950">
                {group.title}
              </h3>

              <ul className="mt-6 space-y-4">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={
                        link.label === "Become a tutor"
                          ? "text-[15px] font-medium text-sky-400 transition-colors hover:text-sky-300"
                          : linkClass
                      }
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
            <h3 className="text-base font-medium text-emerald-950">Company</h3>

            <ul className="mt-6 space-y-4">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <h3 className="text-base font-medium text-emerald-950">
              Newsletter
            </h3>

            <form
              className="mt-5 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row"
              onSubmit={(event) => event.preventDefault()}
            >
              <input
                type="email"
                required
                placeholder="Your email"
                aria-label="Email address"
                className="h-11 min-w-0 flex-1 rounded-xl border border-neutral-700 bg-[#1d1d1d] px-4 text-sm text-white outline-none transition placeholder:text-neutral-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />

              <button
                type="submit"
                className="h-11 shrink-0 rounded-xl bg-sky-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-sky-500"
              >
                Submit
              </button>
            </form>

            <p className="mt-6 text-sm leading-6 text-neutral-400">
              Don&apos;t miss any update!
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-neutral-800" />

        <div className="flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-neutral-400">
            © {new Date().getFullYear()} Justdy, All rights reserved
          </p>

          <div className="flex flex-wrap items-center gap-6">
            <button
              type="button"
              onClick={openSignin}
              className="text-sm text-neutral-400 transition-colors hover:text-white"
            >
              Sign in
            </button>

            <button
              type="button"
              onClick={openSignup}
              className="text-sm text-neutral-400 transition-colors hover:text-white"
            >
              Create account
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
