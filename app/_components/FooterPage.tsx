import React from "react";
import { Twitter, Linkedin, Youtube } from "lucide-react"; // Using Lucide for the icons
import { ReactNode } from "react";
import MyLogo from "./Logo";
import Link from "next/link";

interface SocialIconProps {
  icon: ReactNode;
}

const Footer = () => {
  return (
    <footer className="bg-background text-gray-400 font-sans border-t border-white/10">
      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-12 gap-12 border-x border-white/10">
        {/* Brand Section */}
        <div className="md:col-span-6 space-y-6">
          <div className="flex items-center gap-2">
            <MyLogo />
          </div>
          <p className="max-w-sm text-sm leading-relaxed">
            Your go-to platform for mastering mathematics with interactive
            lessons, real-time feedback, and a supportive community. Join us to
            unlock your full potential in math and achieve your academic goals.
          </p>
          <div className="flex gap-3">
            <SocialIcon icon={<Twitter size={18} />} />
            <SocialIcon icon={<Linkedin size={18} />} />
            <SocialIcon icon={<Youtube size={18} />} />
          </div>
        </div>

        {/* Links Section */}
        <div className="md:col-span-3 space-y-4">
          <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
            Links
          </h3>
          <ul className="space-y-3 text-sm">
            <li>
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/live-session"
                className="hover:text-white transition-colors"
              >
                Live Session
              </Link>
            </li>
            <li>
              <Link
                href="/interactive-lessons"
                className="hover:text-white transition-colors"
              >
                Interactive Lessons
              </Link>
            </li>
            <li>
              <Link
                href="/ai-tutoring"
                className="hover:text-white transition-colors"
              >
                AI Tutoring
              </Link>
            </li>
            <li>
              <Link
                href="/educatorapplication"
                className="hover:text-white transition-colors"
              >
                Become Educator
              </Link>
            </li>
          </ul>
        </div>

        {/* Legal Section */}
        <div className="md:col-span-3 space-y-4">
          <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
            Legal
          </h3>
          <ul className="space-y-3 text-sm">
            <li>
              <a href="#" className="hover:text-white transition-colors">
                Terms of Service
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-white/10 py-8 text-center text-sm">
        <p>© 2026 Justdy LMS. All rights reserved.</p>
      </div>
    </footer>
  );
};

const SocialIcon = ({ icon }: SocialIconProps) => (
  <a
    href="#"
    className="p-2 border border-white/10 rounded-md hover:bg-white/5 transition-all text-gray-400 hover:text-white"
  >
    {icon}
  </a>
);

export default Footer;
