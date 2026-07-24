import React, { ReactNode } from "react";
import { Youtube, Linkedin, Facebook, Ticket } from "lucide-react";
import MyLogo from "./Logo";
import Link from "next/link";

interface SocialIconProps {
  icon: ReactNode;
  href: string;
  label: string;
}

const Footer = () => {
  return (
    <footer className="bg-background text-neutral-400 font-sans w-full">
      {/* TOP ROW: Full-width bottom border */}
      <div className="w-full border-b border-neutral-800/80">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MyLogo />
          </div>

          <div className="flex items-center gap-5 text-neutral-400">
            <SocialIcon
              href="https://www.youtube.com/@JustdyLab/videos"
              label="YouTube"
              icon={<Youtube size={20} />}
            />
            <SocialIcon
              href="https://www.facebook.com/justdymath"
              label="Facebook"
              icon={<Facebook size={20} />}
            />
            <SocialIcon
              href="https://www.youtube.com/@justdymath01"
              label="Tiktok"
              icon={<Ticket size={20} />}
            />

            <SocialIcon
              href="#"
              label="LinkedIn"
              icon={<Linkedin size={20} />}
            />
          </div>
        </div>
      </div>

      {/* MIDDLE SECTION: Content aligned inside max-w-7xl */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Column 1: Ecosystem */}
        <div className="space-y-4">
          <h4 className="text-base font-semibold text-white">Product</h4>
          <ul className="space-y-3 text-sm">
            <li>
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/videos"
                className="hover:text-white transition-colors"
              >
                Free Videos
              </Link>
            </li>
            <li>
              <Link
                href="/ai-tutoring"
                className="hover:text-white transition-colors"
              >
                AI Smart Tutor
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 2: Community */}
        <div className="space-y-4">
          <h4 className="text-base font-semibold text-white">Community</h4>
          <ul className="space-y-3 text-sm">
            <li>
              <Link
                href="/live-session"
                className="hover:text-white transition-colors"
              >
                Live Mentorship
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

        {/* Column 3: Company */}
        <div className="space-y-4">
          <h4 className="text-base font-semibold text-white">Company</h4>
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

        {/* Column 4: Newsletter */}
        <div className="space-y-4">
          <h4 className="text-base font-semibold text-white">Newsletter</h4>
          <form className="flex items-center gap-2">
            <input
              type="email"
              placeholder="Your email"
              className="w-full text-sm bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-700 transition-colors"
            />
            <button
              type="submit"
              className="bg-white text-black font-medium text-sm px-4 py-2 rounded-lg hover:bg-neutral-200 transition-colors shrink-0"
            >
              Submit
            </button>
          </form>
          <p className="text-sm text-neutral-400">
            Don&apos;t miss any update!
          </p>
        </div>
      </div>

      {/* BOTTOM BAR: Full-width top border */}
      <div className="w-full border-t border-neutral-800/80">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 text-sm text-neutral-400">
          <p>© {new Date().getFullYear()} Justdy LMS, All rights reserved</p>
        </div>
      </div>
    </footer>
  );
};

const SocialIcon = ({ icon, href, label }: SocialIconProps) => (
  <Link
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={label}
    className="hover:text-white transition-colors"
  >
    {icon}
  </Link>
);

export default Footer;

// import React, { ReactNode } from "react";
// import { Linkedin, Youtube, ArrowRight, Facebook } from "lucide-react";
// import MyLogo from "./Logo";
// import Link from "next/link";

// interface SocialIconProps {
//   icon: ReactNode;
// }

// interface SocialIconProps {
//   icon: ReactNode;
//   href: string;
//   label: string;
// }

// const Footer = () => {
//   return (
//     <footer className="bg-background text-neutral-400 font-sans border-t border-neutral-900">
//       <div className="max-w-7xl mx-auto px-12 pt-16 pb-8">
//         {/* UPPER ROW: Brand Spotlight + High Density Grid */}
//         <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-16 border-b border-neutral-900">
//           {/* Brand Mission Statement Column (Spans 5) */}
//           <div className="lg:col-span-5 space-y-6">
//             <div className="flex items-center gap-2">
//               <MyLogo />
//             </div>
//             <p className="max-w-md text-sm text-neutral-400 leading-relaxed font-light">
//               Master mathematics with interactive lessons, real-time feedback,
//               and a globally supportive community. Join us to unlock your
//               analytical intelligence.
//             </p>
//             {/* Minimalist Action Badges */}

//             <div className="flex items-center gap-2.5">
//               <SocialIcon
//                 href="https://www.youtube.com/@justdymath01"
//                 label="YouTube"
//                 icon={<Youtube size={16} />}
//               />

//               <SocialIcon
//                 href="https://www.facebook.com/justdymath"
//                 label="Facebook"
//                 icon={<Facebook size={16} />}
//               />

//               <SocialIcon
//                 href="#"
//                 label="TikTok"
//                 icon={<Linkedin size={16} />}
//               />
//             </div>
//           </div>

//           {/* Nav Links Right Column Container (Spans 7) */}
//           <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 lg:pl-12">
//             {/* Category 1: Learn */}
//             <div className="space-y-4">
//               <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-200">
//                 Ecosystem
//               </h4>
//               <ul className="space-y-2.5 text-sm">
//                 <li>
//                   <Link
//                     href="/"
//                     className="hover:text-amber-400 transition-colors"
//                   >
//                     Home
//                   </Link>
//                 </li>
//                 <li>
//                   <Link
//                     href="/interactive-lessons"
//                     className="hover:text-amber-400 transition-colors"
//                   >
//                     Lessons
//                   </Link>
//                 </li>
//                 <li>
//                   <Link
//                     href="/ai-tutoring"
//                     className="hover:text-amber-400 transition-colors"
//                   >
//                     AI Smart Tutor
//                   </Link>
//                 </li>
//               </ul>
//             </div>

//             {/* Category 2: Live Experience */}
//             <div className="space-y-4">
//               <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-200">
//                 Community
//               </h4>
//               <ul className="space-y-2.5 text-sm">
//                 <li>
//                   <Link
//                     href="/live-session"
//                     className="hover:text-amber-400 transition-colors"
//                   >
//                     Live Mentorship
//                   </Link>
//                 </li>
//                 <li>
//                   <Link
//                     href="/educatorapplication"
//                     className="hover:text-amber-400 transition-colors"
//                   >
//                     Become Educator
//                   </Link>
//                 </li>
//               </ul>
//             </div>

//             {/* Category 3: Inline Newsletter Form Block */}
//             <div className="col-span-2 sm:col-span-1 space-y-4">
//               <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-200">
//                 Updates
//               </h4>
//               <p className="text-xs text-neutral-500 leading-relaxed">
//                 Get new lesson alerts and system upgrades directly.
//               </p>
//               <form className="relative flex items-center max-w-xs">
//                 <input
//                   type="email"
//                   placeholder="Your email"
//                   className="w-full text-xs bg-neutral-900 border border-neutral-800 rounded-lg pl-3 pr-10 py-2.5 text-neutral-200 placeholder-neutral-600 focus:outline-hidden focus:border-neutral-700 transition-colors"
//                 />
//                 <button
//                   type="submit"
//                   className="absolute right-1.5 p-1.5 rounded-md bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
//                   aria-label="Subscribe"
//                 >
//                   <ArrowRight size={12} />
//                 </button>
//               </form>
//             </div>
//           </div>
//         </div>

//         {/* BOTTOM BAR: Utility Legal System & Copyright String split horizontally */}
//         <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-neutral-500">
//           {/* Copyright identifier */}
//           <div>
//             <p>
//               © {new Date().getFullYear()} Justdy LMS. All engineering rights
//               reserved.
//             </p>
//           </div>

//           {/* Dynamic Legal Anchor Links Lineup */}
//           <div className="flex items-center gap-6">
//             <a href="#" className="hover:text-neutral-300 transition-colors">
//               Terms of Service
//             </a>
//             <span className="inline-block w-1 h-1 rounded-full bg-neutral-800" />
//             <a href="#" className="hover:text-neutral-300 transition-colors">
//               Privacy Policy
//             </a>
//           </div>
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
//     className="p-2 border border-neutral-900 rounded-lg hover:border-neutral-800 bg-neutral-950/40 hover:bg-neutral-900 transition-all text-neutral-400 hover:text-white"
//   >
//     {icon}
//   </Link>
// );

// export default Footer;
