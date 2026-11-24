
"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Github, MessageCircle, Youtube } from "lucide-react";
import LogoImg from "@/public/images/logo.png";
import Image from "next/image";
import { useRouter } from "next/navigation";

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
    title: "Tutoring",
    links: [
      { label: "Find a tutor", href: "/tutoring" },
      { label: "Book a session", href: "/tutor" },
      { label: "My sessions", href: "/tutoring/sessions" },
      { label: "Free Lessons", href: "/videos" },
      { label: "Become a tutor", href: "/tutor/register" },
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
  "text-sm leading-6 text-neutral-500 transition-colors duration-200 hover:text-sky-500 sm:text-[15px]";

export default function MarketingFooter() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterConsent, setNewsletterConsent] = useState(false);
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);
  const [newsletterMessage, setNewsletterMessage] = useState("");
  const [newsletterError, setNewsletterError] = useState(false);
  const router = useRouter();

  async function handleNewsletterSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setNewsletterMessage("");
    setNewsletterError(false);
    setNewsletterSubmitting(true);

    try {
      const response = await fetch("/api/marketing/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: newsletterEmail,
          marketingConsent: newsletterConsent,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to complete your subscription."
        );
      }

      setNewsletterMessage(result.message);
      setNewsletterEmail("");
      setNewsletterConsent(false);
    } catch (error) {
      setNewsletterError(true);
      setNewsletterMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setNewsletterSubmitting(false);
    }
  }

  const openSignin = () => {
    setAuthMode("signin");
    setAuthOpen(true);
  };

  const openSignup = () => {
    setAuthMode("signup");
    setAuthOpen(true);
  };

  return (
    <footer className="w-full overflow-hidden bg-[#ffffff]">
      <div className="mx-auto max-w-6xl px-5 sm:px-10 lg:px-8">

        {/* Brand and social links */}
        <div className="flex flex-row items-center justify-between gap-4 py-8 sm:py-8">
          {/* Logo and brand name — left */}
          <Link
            href="/"
            aria-label="Justdy home"
            className="group inline-flex shrink-0 items-center gap-2"
          >
            <Image
              src={LogoImg}
              alt="Justdy logo"
              width={40}
              height={40}
              priority
              className="h-8 w-8 shrink-0 object-contain transition-transform duration-200 group-hover:scale-105"
            />

            <span className="text-xl font-chalkduster font-semibold tracking-tight text-[#3f3830] sm:text-2xl">
              Justdy
            </span>
          </Link>

          {/* Social media icons — right */}
          <div className="flex shrink-0 items-center justify-center gap-4 text-[#3f3830] sm:gap-7">
            <a
              href="#"
              aria-label="YouTube"
              className="transition-colors hover:text-[#c09769]"
            >
              <Youtube className="h-5 w-5" />
            </a>

            <a
              href="#"
              aria-label="GitHub"
              className="transition-colors hover:text-[#c09769]"
            >
              <Github className="h-5 w-5" />
            </a>

            <a
              href="#"
              aria-label="X"
              className="text-2xl font-light leading-none transition-colors hover:text-[#c09769]"
            >
              𝕏
            </a>

            <a
              href="#"
              aria-label="Discord"
              className="transition-colors hover:text-[#c09769]"
            >
              <MessageCircle className="h-5 w-5" />
            </a>
          </div>
        </div>

        <div className="border-t border-neutral-200" />

        {/* Navigation and newsletter */}
        
<div className="grid grid-cols-3 gap-x-4 gap-y-10 py-10 sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-[1fr_1fr_0.8fr_1.45fr] lg:gap-x-10 lg:py-12">

  {/* Platform and Tutoring */}
  {footerGroups.map((group) => (
    <div key={group.title}>
      <h3 className="text-sm font-bold tracking-wide text-[#3f3830] sm:text-base">
        {group.title}
      </h3>

      <ul className="mt-5 space-y-3 sm:mt-6 sm:space-y-4">
        {group.links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={
                link.label === "Become a tutor"
                  ? "text-xs font-semibold leading-6 text-sky-500 transition-colors hover:text-sky-600 sm:text-[15px]"
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
  <div className="col-span-1">
    <h3 className="text-sm font-bold tracking-wide text-[#3f3830] sm:text-base">
      Company
    </h3>

    <ul className="mt-5 space-y-3 sm:mt-6 sm:grid-cols-1 sm:space-y-4">
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
  <div className="col-span-3 rounded-lg border border-neutral-200 bg-[#F8FAF7] p-5 sm:col-span-2 sm:p-6 lg:col-span-1 lg:border-0 lg:bg-transparent lg:p-0">
    <h3 className="text-base font-bold text-[#3f3830]">
      Stay connected
    </h3>

    <p className="mt-2 text-sm leading-6 text-neutral-500">
      Get helpful learning tips, news, and updates from Justdy.
    </p>

    <form
      className="mt-5 flex flex-col gap-3"
      onSubmit={handleNewsletterSubmit}
    >
      <input
        type="email"
        required
        maxLength={254}
        value={newsletterEmail}
        onChange={(event) => setNewsletterEmail(event.target.value)}
        placeholder="Your email address"
        aria-label="Email address"
        autoComplete="email"
        className="h-12 w-full min-w-0 rounded-lg border border-neutral-300 bg-white px-4 text-sm text-[#3f3830] outline-none transition placeholder:text-neutral-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
      />

      <label className="flex cursor-pointer items-start gap-2 text-xs leading-5 text-neutral-600">
        <input
          type="checkbox"
          required
          checked={newsletterConsent}
          onChange={(event) => setNewsletterConsent(event.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 accent-sky-600"
        />

        <span>
          I agree to receive educational updates, news, and
          promotional emails from Justdy. I can unsubscribe
          at any time.
        </span>
      </label>

      <button
        type="submit"
        disabled={newsletterSubmitting}
        className="h-12 w-full rounded-lg bg-[#8c9112] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#787a2c] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {newsletterSubmitting ? "Submitting..." : "Subscribe"}
      </button>

      {newsletterMessage && (
        <p
          role="status"
          aria-live="polite"
          className={`text-sm leading-5 ${
            newsletterError ? "text-red-600" : "text-green-700"
          }`}
        >
          {newsletterMessage}
        </p>
      )}
    </form>

    <p className="mt-4 text-xs text-neutral-500">
      Don&apos;t miss any update!
    </p>
  </div>
</div>


        {/* Copyright and account links */}
        <div className="border-t border-neutral-200" />

       <div className="flex flex-row items-center justify-between gap-3 py-8">
        <p className="text-xs leading-5 text-neutral-400 sm:text-sm">
          © {new Date().getFullYear()} Justdy. All rights reserved.
        </p>

       <div className="flex shrink-0 items-center gap-4 sm:gap-7">
        <button
          type="button"
         onClick={() => router.push("/auth")}
          className="text-xs font-medium text-neutral-500 transition-colors hover:text-sky-500 sm:text-sm"
        >
          Sign in
        </button>
      </div>
      </div>
      </div>
    </footer>
  );
}
