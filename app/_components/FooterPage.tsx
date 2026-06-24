import React, { ReactNode } from "react";
import { Twitter, Linkedin, Youtube, ArrowRight } from "lucide-react";
import MyLogo from "./Logo";
import Link from "next/link";

interface SocialIconProps {
  icon: ReactNode;
}

const Footer = () => {
  return (
    <footer className="bg-background text-neutral-400 font-sans border-t border-neutral-900">
      <div className="max-w-7xl mx-auto px-12 pt-16 pb-8">
        {/* UPPER ROW: Brand Spotlight + High Density Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-16 border-b border-neutral-900">
          {/* Brand Mission Statement Column (Spans 5) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center gap-2">
              <MyLogo />
            </div>
            <p className="max-w-md text-sm text-neutral-400 leading-relaxed font-light">
              Master mathematics with interactive lessons, real-time feedback,
              and a globally supportive community. Join us to unlock your
              analytical intelligence.
            </p>
            {/* Minimalist Action Badges */}
            <div className="flex items-center gap-2.5">
              <SocialIcon icon={<Twitter size={16} />} />
              <SocialIcon icon={<Linkedin size={16} />} />
              <SocialIcon icon={<Youtube size={16} />} />
            </div>
          </div>

          {/* Nav Links Right Column Container (Spans 7) */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 lg:pl-12">
            {/* Category 1: Learn */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-200">
                Ecosystem
              </h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link
                    href="/"
                    className="hover:text-amber-400 transition-colors"
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/interactive-lessons"
                    className="hover:text-amber-400 transition-colors"
                  >
                    Lessons
                  </Link>
                </li>
                <li>
                  <Link
                    href="/ai-tutoring"
                    className="hover:text-amber-400 transition-colors"
                  >
                    AI Smart Tutor
                  </Link>
                </li>
              </ul>
            </div>

            {/* Category 2: Live Experience */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-200">
                Community
              </h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link
                    href="/live-session"
                    className="hover:text-amber-400 transition-colors"
                  >
                    Live Mentorship
                  </Link>
                </li>
                <li>
                  <Link
                    href="/educatorapplication"
                    className="hover:text-amber-400 transition-colors"
                  >
                    Become Educator
                  </Link>
                </li>
              </ul>
            </div>

            {/* Category 3: Inline Newsletter Form Block */}
            <div className="col-span-2 sm:col-span-1 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-200">
                Updates
              </h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Get new lesson alerts and system upgrades directly.
              </p>
              <form className="relative flex items-center max-w-xs">
                <input
                  type="email"
                  placeholder="Your email"
                  className="w-full text-xs bg-neutral-900 border border-neutral-800 rounded-lg pl-3 pr-10 py-2.5 text-neutral-200 placeholder-neutral-600 focus:outline-hidden focus:border-neutral-700 transition-colors"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 p-1.5 rounded-md bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                  aria-label="Subscribe"
                >
                  <ArrowRight size={12} />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* BOTTOM BAR: Utility Legal System & Copyright String split horizontally */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-neutral-500">
          {/* Copyright identifier */}
          <div>
            <p>
              © {new Date().getFullYear()} Justdy LMS. All engineering rights
              reserved.
            </p>
          </div>

          {/* Dynamic Legal Anchor Links Lineup */}
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-neutral-300 transition-colors">
              Terms of Service
            </a>
            <span className="inline-block w-1 h-1 rounded-full bg-neutral-800" />
            <a href="#" className="hover:text-neutral-300 transition-colors">
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

const SocialIcon = ({ icon }: SocialIconProps) => (
  <a
    href="#"
    className="p-2 border border-neutral-900 rounded-lg hover:border-neutral-800 bg-neutral-950/40 hover:bg-neutral-900 transition-all text-neutral-400 hover:text-white"
  >
    {icon}
  </a>
);

export default Footer;
