"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Facebook, Linkedin, Mail, Youtube } from "lucide-react";

interface SocialIconProps {
  icon: ReactNode;
  href: string;
  label: string;
}

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-slate-200 bg-white text-slate-600">
      {/* ============================================================
          MAIN FOOTER
      ============================================================ */}

      <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
        {/* ==========================================================
            BRAND / MISSION
        =========================================================== */}

        <div className="border-b border-slate-200 py-12 sm:py-14 lg:py-16">
          <div className="max-w-3xl">
            {/* Brand badge */}

            {/* Main statement */}
            <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-[2.7rem] lg:leading-[1.15]">
              Empowering learners to{" "}
              <span className="text-blue-600">learn, build, and succeed.</span>
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
              Justdy Learning brings together personalized tutoring, educational
              resources, technology, and practical learning experiences to help
              students and educators grow with confidence.
            </p>
          </div>
        </div>

        {/* ==========================================================
            FOOTER LINK COLUMNS
        =========================================================== */}

        <div className="grid grid-cols-1 gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12 lg:py-14">
          {/* ========================================================
              COLUMN 1 — LEARN
          ========================================================= */}

          <div>
            <h3 className="text-sm font-semibold text-slate-950">Learn</h3>

            <ul className="mt-5 space-y-3.5">
              <FooterLink href="/free-assessment">Tutoring</FooterLink>

              <FooterLink href="/videos">Free Learning Videos</FooterLink>

              <FooterLink href="/ai-tutoring">AI Smart Tutor</FooterLink>

              <FooterLink href="/products">Learning Resources</FooterLink>
            </ul>
          </div>

          {/* ========================================================
              COLUMN 2 — COMMUNITY
          ========================================================= */}

          <div>
            <h3 className="text-sm font-semibold text-slate-950">Community</h3>

            <ul className="mt-5 space-y-3.5">
              <FooterLink href="/live-session">Live Mentorship</FooterLink>

              <FooterLink href="/educatorapplication">
                Become an Educator
              </FooterLink>

              <FooterLink href="/videos">Educational Videos</FooterLink>

              <FooterLink href="/contact">Contact Us</FooterLink>
            </ul>
          </div>

          {/* ========================================================
              COLUMN 3 — COMPANY
          ========================================================= */}

          <div>
            <h3 className="text-sm font-semibold text-slate-950">Company</h3>

            <ul className="mt-5 space-y-3.5">
              <FooterLink href="/about">About Us</FooterLink>

              <FooterLink href="/contact">Contact</FooterLink>

              <FooterLink href="/terms">Terms of Service</FooterLink>

              <FooterLink href="/privacy">Privacy Policy</FooterLink>
            </ul>
          </div>

          {/* ========================================================
              COLUMN 4 — NEWSLETTER
          ========================================================= */}

          <div>
            <h3 className="text-sm font-semibold text-slate-950">
              Stay in the loop
            </h3>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Get learning tips, new resources, and important updates delivered
              to your inbox.
            </p>

            {/* Newsletter form */}
            <form className="mt-5">
              <div className="relative">
                <Mail
                  className="
                    absolute
                    left-3.5
                    top-1/2
                    h-4
                    w-4
                    -translate-y-1/2
                    text-slate-400
                  "
                />

                <input
                  type="email"
                  placeholder="Enter your email"
                  aria-label="Email address"
                  className="
                    h-11
                    w-full
                    rounded-lg
                    border
                    border-slate-200
                    bg-slate-50
                    pl-10
                    pr-24
                    text-sm
                    text-slate-900
                    outline-none
                    placeholder:text-slate-400
                    transition-all
                    focus:border-blue-400
                    focus:bg-white
                    focus:ring-4
                    focus:ring-blue-500/10
                  "
                />

                <button
                  type="submit"
                  className="
                    absolute
                    right-1.5
                    top-1/2
                    flex
                    h-8
                    -translate-y-1/2
                    items-center
                    gap-1.5
                    rounded-md
                    bg-blue-600
                    px-3
                    text-xs
                    font-semibold
                    text-white
                    shadow-sm
                    transition-all
                    hover:bg-blue-700
                    active:scale-[0.98]
                  "
                >
                  Subscribe
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>

            <p className="mt-3 text-[11px] leading-5 text-slate-400">
              No spam. Just useful learning content and occasional updates.
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================
          BOTTOM BAR
      ============================================================ */}

      <div className="border-t border-slate-200 bg-slate-50/70">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-5 py-6 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          {/* ========================================================
              BRAND / COPYRIGHT
          ========================================================= */}

          <div className="flex flex-col items-center gap-1 md:items-start">
            <p className="text-sm font-semibold text-slate-800">
              © {currentYear} Justdy Learning
            </p>

            <p className="text-xs text-slate-400">
              Learning made accessible, practical, and personal.
            </p>
          </div>

          {/* ========================================================
              SOCIAL MEDIA
          ========================================================= */}

          <div className="flex items-center gap-2">
            <SocialIcon
              href="https://www.youtube.com/@JustdyLab/videos"
              label="YouTube"
              icon={<Youtube className="h-4 w-4" />}
            />

            <SocialIcon
              href="https://www.facebook.com/justdymath"
              label="Facebook"
              icon={<Facebook className="h-4 w-4" />}
            />

            <SocialIcon
              href="https://www.youtube.com/@justdymath01"
              label="YouTube"
              icon={<Youtube className="h-4 w-4" />}
            />

            <SocialIcon
              href="#"
              label="LinkedIn"
              icon={<Linkedin className="h-4 w-4" />}
            />
          </div>

          {/* ========================================================
              LEGAL LINKS
          ========================================================= */}

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-500 md:justify-end">
            <Link
              href="/terms"
              className="transition-colors hover:text-blue-600"
            >
              Terms
            </Link>

            <Link
              href="/privacy"
              className="transition-colors hover:text-blue-600"
            >
              Privacy
            </Link>

            <Link
              href="/contact"
              className="transition-colors hover:text-blue-600"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

/* ================================================================
   FOOTER LINK COMPONENT
================================================================ */

interface FooterLinkProps {
  href: string;
  children: ReactNode;
}

const FooterLink = ({ href, children }: FooterLinkProps) => {
  return (
    <li>
      <Link
        href={href}
        className="
          group
          inline-flex
          items-center
          gap-1.5
          text-sm
          text-slate-500
          transition-colors
          hover:text-blue-600
        "
      >
        <span>{children}</span>

        <ArrowRight
          className="
            h-3
            w-3
            -translate-x-1
            opacity-0
            transition-all
            duration-200
            group-hover:translate-x-0
            group-hover:opacity-100
          "
        />
      </Link>
    </li>
  );
};

/* ================================================================
   SOCIAL ICON COMPONENT
================================================================ */

const SocialIcon = ({ icon, href, label }: SocialIconProps) => {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="
        flex
        h-9
        w-9
        items-center
        justify-center
        rounded-lg
        border
        border-slate-200
        bg-white
        text-slate-500
        shadow-sm
        transition-all
        duration-200
        hover:-translate-y-0.5
        hover:border-blue-200
        hover:bg-blue-50
        hover:text-blue-600
        hover:shadow-md
      "
    >
      {icon}
    </Link>
  );
};

export default Footer;

// import React, { ReactNode } from "react";
// import { Youtube, Linkedin, Facebook, Ticket } from "lucide-react";
// import Link from "next/link";

// interface SocialIconProps {
//   icon: ReactNode;
//   href: string;
//   label: string;
// }

// const Footer = () => {
//   return (
//     <footer className="bg-emerald-900/20 text-neutral-400 font-sans w-full">
//       {/* TOP ROW: Full-width bottom border */}

//       {/* MIDDLE SECTION: Content aligned inside max-w-7xl */}
//       <div className="max-w-8xl mx-auto px-6 md:px-30 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
//         {/* Column 1: Ecosystem */}
//         <div className="space-y-4">
//           <h4 className="text-base font-semibold text-blue-600">Services</h4>
//           <ul className="space-y-3 text-sm">
//             <li>
//               <Link
//                 href="/free-assessment"
//                 className="text-muted-foreground hover:text-blue-500 transition-colors"
//               >
//                 Tutoring
//               </Link>
//             </li>
//             <li>
//               <Link
//                 href="/videos"
//                 className="text-muted-foreground hover:text-blue-500 transition-colors"
//               >
//                 Free Videos
//               </Link>
//             </li>
//             <li>
//               <Link
//                 href="/ai-tutoring"
//                 className="text-muted-foreground hover:text-blue-500 transition-colors"
//               >
//                 AI Smart Tutor
//               </Link>
//             </li>
//           </ul>
//         </div>

//         {/* Column 2: Community */}
//         <div className="space-y-4">
//           <h4 className="text-base font-semibold text-blue-600">Community</h4>
//           <ul className="space-y-3 text-sm">
//             <li>
//               <Link
//                 href="/live-session"
//                 className="text-muted-foreground hover:text-blue-500 transition-colors"
//               >
//                 Live Mentorship
//               </Link>
//             </li>
//             <li>
//               <Link
//                 href="/educatorapplication"
//                 className="text-muted-foreground hover:text-blue-500 transition-colors"
//               >
//                 Become Educator
//               </Link>
//             </li>
//           </ul>
//         </div>

//         {/* Column 3: Company */}
//         <div className="space-y-4">
//           <h4 className="text-base font-semibold text-blue-600">Legal</h4>
//           <ul className="space-y-3 text-sm">
//             <li>
//               <a
//                 href="#"
//                 className="text-muted-foreground hover:text-blue-500 transition-colors"
//               >
//                 Terms of Service
//               </a>
//             </li>
//             <li>
//               <a
//                 href="#"
//                 className="text-muted-foreground hover:text-blue-500 transition-colors"
//               >
//                 Privacy Policy
//               </a>
//             </li>
//           </ul>
//         </div>

//         {/* Column 4: Newsletter */}
//         <div className="space-y-4">
//           <h4 className="text-base font-semibold text-blue-600">Newsletter</h4>
//           <form className="flex items-center gap-2">
//             <input
//               type="email"
//               placeholder="Your email"
//               className="w-full text-sm bg-neutral-100 border border-neutral-800 rounded-lg px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-700 transition-colors"
//             />
//             <button
//               type="submit"
//               className="bg-white text-black font-medium text-sm px-4 py-2 rounded-lg hover:bg-neutral-200 transition-colors shrink-0"
//             >
//               Submit
//             </button>
//           </form>
//           <p className="text-sm text-neutral-400">
//             Don&apos;t miss any update!
//           </p>
//         </div>
//       </div>

//       {/* BOTTOM BAR: Full-width top border */}
//       <div className="w-full border-t border-neutral-800/20">
//         <div className="max-w-8xl mx-auto px-6 md:px-30 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
//           {/* Social Media Icons */}
//           <div className="flex items-center gap-5 text-neutral-400">
//             <SocialIcon
//               href="https://www.youtube.com/@JustdyLab/videos"
//               label="YouTube"
//               icon={<Youtube size={20} />}
//             />

//             <SocialIcon
//               href="https://www.facebook.com/justdymath"
//               label="Facebook"
//               icon={<Facebook size={20} />}
//             />

//             <SocialIcon
//               href="https://www.youtube.com/@justdymath01"
//               label="Tiktok"
//               icon={<Ticket size={20} />}
//             />

//             <SocialIcon
//               href="#"
//               label="LinkedIn"
//               icon={<Linkedin size={20} />}
//             />
//           </div>

//           {/* Copyright */}
//           <p className="text-sm text-neutral-400 text-center sm:text-right">
//             © {new Date().getFullYear()} Justdy LMS, All rights reserved
//           </p>
//         </div>
//       </div>
//     </footer>
//   );
// };

// const SocialIcon = ({ icon, href, label }: SocialIconProps) => (
//   <Link
//     href={href}
//     target="_blank"
//     rel="noopener noreferrer"
//     aria-label={label}
//     className="hover:text-white transition-colors"
//   >
//     {icon}
//   </Link>
// );

// export default Footer;
