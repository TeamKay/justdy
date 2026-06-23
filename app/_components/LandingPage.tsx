"use client";

import { motion } from "framer-motion";
import { Youtube, Disc, Github, Rocket, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative pt-20 mb-30 w-full bg-emerald-900/10 text-white flex flex-col justify-between overflow-hidden font-sans select-none">
      {/* =======================
          MODIFIED BACKGROUND LAYER 
      ======================= */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Base dark purple radial glow radiating from the right side */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_50%,rgba(147,51,234,0.25)_0%,rgba(76,29,149,0.15)_40%,transparent_80%)]" />

        {/* Accent magenta ambient glow highlights */}
        <div className="absolute bottom-[10%] right-[5%] w-140 h-140 rounded-full bg-fuchsia-500/10 blur-[140px]" />
        <div className="absolute bottom-[-20%] left-[10%] w-160 h-100 rounded-full bg-purple-900/20 blur-[120px]" />

        {/* High-fidelity procedural wave art overlay (replicates the thin neon lines in your reference) */}
        <div
          className="absolute inset-0 bg-no-repeat bg-right bg-cover opacity-60 mix-blend-screen"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1440' height='900' viewBox='0 0 1440 900'%3E%3Cg fill='none' stroke='%23d946ef' stroke-width='0.75' stroke-opacity='0.45'%3E%3Cpath d='M-100 700 C 300 700, 400 450, 800 650 C 1100 800, 1200 400, 1550 150'/%3E%3Cpath d='M-100 710 C 300 690, 410 460, 810 640 C 1110 780, 1210 390, 1550 160'/%3E%3Cpath d='M-100 720 C 300 680, 420 470, 820 630 C 1120 760, 1220 380, 1550 170'/%3E%3Cpath d='M-100 730 C 300 670, 430 480, 830 620 C 1130 740, 1230 370, 1550 180'/%3E%3Cpath d='M-100 740 C 300 660, 440 490, 840 610 C 1140 720, 1240 360, 1550 190'/%3E%3Cpath d='M-100 750 C 300 650, 450 500, 850 600 C 1150 700, 1250 350, 1550 200'/%3E%3C/g%3E%3Cg fill='none' stroke='%23a855f7' stroke-width='0.5' stroke-opacity='0.3'%3E%3Cpath d='M-100 650 C 250 720, 350 430, 850 580 C 1180 700, 1280 300, 1550 100'/%3E%3Cpath d='M-100 660 C 250 710, 360 440, 860 570 C 1190 680, 1290 290, 1550 110'/%3E%3Cpath d='M-100 670 C 250 700, 370 450, 870 560 C 1200 660, 1300 280, 1550 120'/%3E%3Cpath d='M-100 680 C 250 690, 380 460, 880 550 C 1210 640, 1310 270, 1550 130'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Vignette matching the bottom component backdrop styling */}
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-[#040108]" />
      </div>

      {/* =======================
          MAIN HERO CONTENT
      ======================= */}
      <div className="relative z-10 max-w-7xl w-full mx-auto px-8 pb-40 sm:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center my-auto pt-0 md:pt-24">
        {/* Left Column: Copy & Actions */}
        <div className="lg:col-span-6 flex flex-col justify-center text-left space-y-6 max-w-2xl mx-auto lg:mx-0 pb-15 md:pb-0">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-fit flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-[#160d24] border border-purple-500/20 shadow-sm"
          >
            <div className="flex items-center justify-center w-4 h-4 rounded-md bg-purple-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-pulse" />
            </div>
            <span className="text-xs font-medium text-purple-200 tracking-wide flex items-center gap-1.5">
              Learn with Smart AI
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
              Unlock Your <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-200 via-fuchsia-200 to-white">
                Math Potential
              </span>
            </h1>

            <p className="text-md sm:text-sm text-purple-200/70 max-w-xl font-normal leading-relaxed">
              Turn math anxiety into academic mastery. Our personalized online
              tutoring helps students bridge learning gaps, accelerate school
              grades, and build the lifelong confidence to tackle any complex
              problem with ease
            </p>
          </motion.div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link href="/onboarding">
              <button className="h-12 px-6 bg-[#857938] hover:bg-[#857938] text-white font-medium rounded-md shadow-lg shadow-purple-900/30 transition dynamic-blur flex items-center gap-2 group text-sm cursor-pointer">
                <Users className="w-3.5 h-3.5 fill-current" />
                Start Learning Now
              </button>
            </Link>

            <Link href="/ourapproach">
              <button className="h-12 px-6 bg-[#160d24] text-purple-200 hover:text-white border border-purple-500/20 hover:border-purple-500/40 font-medium rounded-md transition flex items-center gap-2 text-sm cursor-pointer">
                <Users className="w-3.5 h-3.5 fill-current" />
                Explore Our Approach
              </button>
            </Link>
          </div>
        </div>

        {/* Right Column: Hero Image */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, duration: 0.8 }}
          className="lg:col-span-6 flex flex-col justify-center w-full relative"
        >
          {/* Animated background glow behind image */}
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.35, 0.6, 0.35],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -right-20 top-10 w-96 h-96 rounded-full bg-purple-500/20 blur-[120px]"
          />

          <motion.div
            animate={{
              y: [0, -12, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute right-20 bottom-10 w-72 h-72 rounded-full bg-fuchsia-500/20 blur-[100px]"
          />

          {/* Image container - keeps landing page height */}
          <div className="relative w-full aspect-20/10 flex items-center justify-center scale-130">
            {/* Soft image frame glow */}
            <div className="absolute inset-10 rounded-full bg-purple-500/10 blur-3xl" />

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: 0.8,
                ease: "easeOut",
              }}
              className="relative w-full h-full z-10"
            >
              <Image
                src="/images/hero.png"
                alt="Student taking an online math class"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain drop-shadow-2xl scale-130"
              />
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* =======================
          BOTTOM FOOTER TRUST PROOFS
      ======================= */}
      <div className="relative z-10 border-y border-purple-500/10 bg-[#040108]/60 backdrop-blur-sm w-full py-6">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Youtube className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">55K</div>
              <div className="text-xs  text-purple-300/50">
                24/7 AI Smart Tutor
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Disc className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">20+</div>
              <div className="text-xs text-purple-300/50">
                Successful Sessions
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-300">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">2.1K</div>
              <div className="text-xs text-purple-300/50">Active Students</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">10+</div>
              <div className="text-xs text-purple-300/50">Expert Tutors</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// "use client";

// import { useState, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   ArrowRight,
//   Youtube,
//   Disc,
//   Github,
//   Rocket,
//   Users,
//   ChevronLeft,
//   ChevronRight,
// } from "lucide-react";
// import Link from "next/link";
// import Image from "next/image";

// // Image slides configurations for the carousel.
// // Swap the image links out with your internal static assets path as needed (e.g. "/images/slide-one.png")
// const carouselSlides = [
//   {
//     id: 1,
//     src: "https://images.unsplash.com/photo-1610116306796-6ebd3051c330?q=80&w=1200&auto=format&fit=crop",
//     alt: "Interactive digital classroom math session",
//   },
//   {
//     id: 2,
//     src: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop",
//     alt: "Student progress performance analytics metrics dashboard",
//   },
//   {
//     id: 3,
//     src: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop",
//     alt: "Smart AI gamified learning canvas interface",
//   },
// ];

// export default function Hero() {
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [direction, setDirection] = useState(0); // -1 for left movement, 1 for right movement

//   // Automated carousel state advance sequence (triggers transition cycle every 6 seconds)
//   useEffect(() => {
//     const timer = setInterval(() => {
//       handleNext();
//     }, 6000);
//     return () => clearInterval(timer);
//   }, [currentIndex]);

//   const handlePrev = () => {
//     setDirection(-1);
//     setCurrentIndex((prev) =>
//       prev === 0 ? carouselSlides.length - 1 : prev - 1,
//     );
//   };

//   const handleNext = () => {
//     setDirection(1);
//     setCurrentIndex((prev) =>
//       prev === carouselSlides.length - 1 ? 0 : prev + 1,
//     );
//   };

//   // Motion physics configuration variations for sleek transition effects
//   const slideVariants = {
//     enter: (dir: number) => ({
//       x: dir > 0 ? "100%" : "-100%",
//       opacity: 0,
//     }),
//     center: {
//       x: 0,
//       opacity: 1,
//     },
//     exit: (dir: number) => ({
//       x: dir < 0 ? "100%" : "-100%",
//       opacity: 0,
//     }),
//   };

//   return (
//     <section className="relative pt-20 mb-30 w-full bg-background text-white flex flex-col justify-between overflow-hidden font-sans select-none">
//       {/* =======================
//           BACKGROUND LAYER
//           (Sleek Diagonal Lines + Glowing Radials)
//       ======================= */}
//       <div className="absolute inset-0 pointer-events-none z-0">
//         {/* Subtle Ambient Glows */}
//         <div className="absolute top-[10%] left-[-10%] w-125 h-125 rounded-full bg-blue-500/10 blur-[120px]" />
//         <div className="absolute top-[30%] right-[-5%] w-150 h-150 rounded-full bg-cyan-500/10 blur-[150px]" />

//         {/* Premium Dark Diagonal Line Pattern */}
//         <div
//           className="absolute inset-0 opacity-[0.12]"
//           style={{
//             backgroundImage: `repeating-linear-gradient(
//               -45deg,
//               #ffffff,
//               #ffffff 1px,
//               transparent 1px,
//               transparent 10px
//             )`,
//           }}
//         />

//         {/* Smooth Vignette Overlay */}
//         <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-[#070709]" />
//       </div>

//       {/* =======================
//           MAIN HERO CONTENT
//       ======================= */}
//       <div className="relative z-10 max-w-7xl w-full mx-auto px-6 pb-40 sm:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center my-auto pt-24">
//         {/* Left Column: Copy & Actions */}
//         <div className="lg:col-span-6 flex flex-col justify-center text-left space-y-6 max-w-2xl mx-auto lg:mx-0">
//           {/* Top Tag Badges */}
//           <motion.div
//             initial={{ opacity: 0, y: -10 }}
//             animate={{ opacity: 1, y: 0 }}
//             className="w-fit flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-[#111217] border border-white/10 shadow-sm"
//           >
//             <div className="flex items-center justify-center w-4 h-4 rounded-md bg-cyan-500/20">
//               <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
//             </div>
//             <span className="text-xs font-medium text-gray-300 tracking-wide flex items-center gap-1.5">
//               Learn with Smart AI
//             </span>
//           </motion.div>

//           {/* Primary Text Headers */}
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             className="space-y-4"
//           >
//             <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#bcbec1] leading-[1.1]">
//               Unlock Your <br />
//               <span className="text-[#bcbec1]">Math Potential</span>
//             </h1>

//             <p className="text-lg sm:text-xl text-slate-400 max-w-xl font-normal leading-relaxed">
//               Expert Math Online Tutoring for All Levels, Ages 8-18. Boost
//               Grades, Confidence & Understanding.
//             </p>
//           </motion.div>

//           {/* Action Call to Buttons */}
//           <div className="flex flex-wrap items-center gap-4 pt-2">
//             <Link href="/signup">
//               <button className="h-12 px-6 bg-[#857938] hover:bg-[#0081e6] text-white font-medium rounded-md shadow-lg hover:shadow-cyan-500/10 transition dynamic-blur flex items-center gap-2 group text-sm cursor-pointer">
//                 Get Started
//                 <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
//               </button>
//             </Link>

//             <Link href="/communities">
//               <button className="h-12 px-6 bg-[#111217] text-gray-300 hover:text-white border border-white/10 hover:border-white/20 font-medium rounded-md transition flex items-center gap-2 text-sm cursor-pointer">
//                 <Users className="w-3.5 h-3.5 fill-current" />
//                 Explore Communities
//               </button>
//             </Link>
//           </div>
//         </div>

//         {/* Right Column: Visual Mockup Showcase Image Carousel */}
//         <motion.div
//           initial={{ opacity: 0, scale: 0.97 }}
//           animate={{ opacity: 1, scale: 1 }}
//           transition={{ delay: 0.1 }}
//           className="lg:col-span-6 flex flex-col justify-center w-full space-y-4"
//         >
//           {/* CAROUSEL GRAPHIC CONTAINER BOUNDARY */}
//           <div className="relative w-full aspect-16/10 rounded-xl overflow-hidden border border-white/10 bg-[#0e0f13]/80 backdrop-blur-md shadow-2xl flex items-center justify-center group">
//             {/* Linear Vignette Layer overlaying the active slide asset */}
//             <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent z-10 pointer-events-none" />

//             {/* SLIDING FRAME VIEWPORT ELEMENT */}
//             <div className="relative w-full h-full overflow-hidden">
//               <AnimatePresence initial={false} custom={direction} mode="wait">
//                 <motion.div
//                   key={currentIndex}
//                   custom={direction}
//                   variants={slideVariants}
//                   initial="enter"
//                   animate="center"
//                   exit="exit"
//                   transition={{
//                     x: { type: "spring", stiffness: 300, damping: 30 },
//                     opacity: { duration: 0.25 },
//                   }}
//                   className="absolute inset-0 w-full h-full"
//                 >
//                   <Image
//                     src={carouselSlides[currentIndex].src}
//                     alt={carouselSlides[currentIndex].alt}
//                     fill
//                     sizes="(max-width: 1024px) 100vw, 50vw"
//                     className="object-cover"
//                     priority
//                   />
//                 </motion.div>
//               </AnimatePresence>
//             </div>

//             {/* LEFT NAVIGATION TRIGGER TOGGLE */}
//             <button
//               onClick={handlePrev}
//               className="absolute left-4 z-20 p-2 rounded-md bg-[#111217]/80 border border-white/10 text-gray-300 shadow-md hover:text-white hover:bg-[#111217] transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer backdrop-blur-xs"
//               aria-label="Previous slide"
//             >
//               <ChevronLeft className="w-4 h-4" />
//             </button>

//             {/* RIGHT NAVIGATION TRIGGER TOGGLE */}
//             <button
//               onClick={handleNext}
//               className="absolute right-4 z-20 p-2 rounded-md bg-[#111217]/80 border border-white/10 text-gray-300 shadow-md hover:text-white hover:bg-[#111217] transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer backdrop-blur-xs"
//               aria-label="Next slide"
//             >
//               <ChevronRight className="w-4 h-4" />
//             </button>
//           </div>

//           {/* LOWER DOT TRACK SEGMENT INDICATORS */}
//           <div className="flex justify-center items-center gap-2 pt-0.5">
//             {carouselSlides.map((_, index) => (
//               <button
//                 key={index}
//                 onClick={() => {
//                   setDirection(index > currentIndex ? 1 : -1);
//                   setCurrentIndex(index);
//                 }}
//                 className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
//                   index === currentIndex
//                     ? "w-5 bg-cyan-500"
//                     : "w-1.5 bg-neutral-700 hover:bg-neutral-600"
//                 }`}
//                 aria-label={`Maps to position node index pointer slide ${index + 1}`}
//               />
//             ))}
//           </div>
//         </motion.div>
//       </div>

//       {/* =======================
//           BOTTOM FOOTER TRUST PROOFS
//       ======================= */}
//       <div className="relative z-10 border-y border-white/6 bg-[#070709]/60 backdrop-blur-sm w-full py-6">
//         <div className="max-w-7xl mx-auto px-6 sm:px-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
//           {/* Proof Stat 1 */}
//           <div className="flex items-center gap-3.5">
//             <div className="p-2.5 rounded-lg bg-red-500/10 text-red-500">
//               <Youtube className="w-5 h-5" />
//             </div>
//             <div>
//               <div className="text-sm font-bold text-white">55K</div>
//               <div className="text-xs text-gray-500">YouTube subscribers</div>
//             </div>
//           </div>

//           {/* Proof Stat 2 */}
//           <div className="flex items-center gap-3.5">
//             <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400">
//               <Disc className="w-5 h-5" />
//             </div>
//             <div>
//               <div className="text-sm font-bold text-white">850+</div>
//               <div className="text-xs text-gray-500">Discord members</div>
//             </div>
//           </div>

//           {/* Proof Stat 3 */}
//           <div className="flex items-center gap-3.5">
//             <div className="p-2.5 rounded-lg bg-gray-500/10 text-gray-300">
//               <Github className="w-5 h-5" />
//             </div>
//             <div>
//               <div className="text-sm font-bold text-white">2.1K</div>
//               <div className="text-xs text-gray-500">GitHub stars</div>
//             </div>
//           </div>

//           {/* Proof Stat 4 */}
//           <div className="flex items-center gap-3.5">
//             <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
//               <Rocket className="w-5 h-5" />
//             </div>
//             <div>
//               <div className="text-sm font-bold text-white">320+</div>
//               <div className="text-xs text-gray-500">Developers shipping</div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }

// "use client";

// import { motion } from "framer-motion";
// import { ArrowRight, Youtube, Disc, Github, Rocket, Users } from "lucide-react";
// import Link from "next/link";

// export default function Hero() {
//   return (
//     <section className="relative pt-20 mb-30 w-full bg-[#000000] text-white flex flex-col justify-between overflow-hidden font-sans select-none">
//       {/* =======================
//           BACKGROUND LAYER
//           (Sleek Diagonal Lines + Glowing Radials)
//       ======================= */}
//       <div className="absolute inset-0 pointer-events-none z-0">
//         {/* Subtle Ambient Glows */}
//         <div className="absolute top-[10%] left-[-10%] w-125 h-125 rounded-full bg-blue-500/10 blur-[120px]" />
//         <div className="absolute top-[30%] right-[-5%] w-150 h-150 rounded-full bg-cyan-500/10 blur-[150px]" />

//         {/* Premium Dark Diagonal Line Pattern */}
//         <div
//           className="absolute inset-0 opacity-[0.12]"
//           style={{
//             backgroundImage: `repeating-linear-gradient(
//               -45deg,
//               #ffffff,
//               #ffffff 1px,
//               transparent 1px,
//               transparent 10px
//             )`,
//           }}
//         />

//         {/* Smooth Vignette Overlay */}
//         <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-[#070709]" />
//       </div>

//       {/* =======================
//           MAIN HERO CONTENT
//       ======================= */}
//       <div className="relative z-10 max-w-7xl w-full mx-auto px-6 pb-40 sm:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center my-auto pt-24 ">
//         {/* Left Column: Copy & Actions */}
//         <div className="lg:col-span-6 flex flex-col justify-center text-left space-y-6 max-w-2xl mx-auto lg:mx-0">
//           {/* Top Tag Badges */}
//           <motion.div
//             initial={{ opacity: 0, y: -10 }}
//             animate={{ opacity: 1, y: 0 }}
//             className="w-fit flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-[#111217] border border-white/10 shadow-sm"
//           >
//             <div className="flex items-center justify-center w-4 h-4 rounded-md bg-cyan-500/20">
//               <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
//             </div>
//             <span className="text-xs font-medium text-gray-300 tracking-wide flex items-center gap-1.5">
//               Learn with Smart AI
//             </span>
//           </motion.div>

//           {/* Primary Text Headers */}
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             className="space-y-4"
//           >
//             <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#bcbec1] leading-[1.1]">
//               Unlock Your <br />
//               <span className="text-[#bcbec1]">Math Potential</span>
//             </h1>

//             <p className="text-lg sm:text-xl text-slate-600 max-w-xl">
//               Expert Math Online Tutoring for All Levels, Ages 8-18. Boost
//               Grades, Confidence & Understanding.
//             </p>
//           </motion.div>

//           {/* Action Call to Buttons */}
//           <div className="flex flex-wrap items-center gap-4 pt-2">
//             <Link href="/signup">
//               <button className="h-12 px-6 bg-[#857938] hover:bg-[#0081e6] text-white font-medium rounded-md shadow-lg hover:shadow-cyan-500/10 transition dynamic-blur flex items-center gap-2 group text-sm">
//                 Get Started
//                 <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
//               </button>
//             </Link>

//             <Link href="/communities">
//               <button className="h-12 px-6 bg-[#111217] text-gray-300 hover:text-white border border-white/10 hover:border-white/20 font-medium rounded-md transition flex items-center gap-2 text-sm">
//                 <Users className="w-3.5 h-3.5 fill-current" />
//                 Explore Communities
//               </button>
//             </Link>
//           </div>
//         </div>

//         {/* Right Column: Visual Mockup Showcase Container */}
//         <motion.div
//           initial={{ opacity: 0, scale: 0.97 }}
//           animate={{ opacity: 1, scale: 1 }}
//           transition={{ delay: 0.1 }}
//           className="lg:col-span-6 flex justify-center w-full"
//         >
//           {/* Replace this with your actual Dashboard illustration code or Image wrapper */}
//           <div className="relative w-full aspect-16/10 rounded-xl overflow-hidden border border-white/10 bg-[#0e0f13]/80 backdrop-blur-md shadow-2xl flex items-center justify-center group">
//             <div className="absolute inset-0 bg-linear-to-tr from-blue-500/5 via-transparent to-transparent opacity-60" />

//             {/* Interactive Inner Mockup placeholder */}
//             <div className="z-10 text-center space-y-2 px-4">
//               <div className="text-xs tracking-wider text-gray-500 uppercase font-mono">
//                 [ SyntaxKit Dashboard UI Mockup Space ]
//               </div>
//               <p className="text-xs text-gray-600 max-w-xs mx-auto">
//                 Insert your clean HTML/SVG dashboard layout grid code inside
//                 this container block.
//               </p>
//             </div>
//           </div>
//         </motion.div>
//       </div>

//       {/* =======================
//           BOTTOM FOOTER TRUST PROOFS
//       ======================= */}
//       <div className="relative z-10 border-y border-white/6 bg-[#070709]/60 backdrop-blur-sm w-full py-6">
//         <div className="max-w-7xl mx-auto px-6 sm:px-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
//           {/* Proof Stat 1 */}
//           <div className="flex items-center gap-3.5">
//             <div className="p-2.5 rounded-lg bg-red-500/10 text-red-500">
//               <Youtube className="w-5 h-5" />
//             </div>
//             <div>
//               <div className="text-sm font-bold text-white">55K</div>
//               <div className="text-xs text-gray-500">YouTube subscribers</div>
//             </div>
//           </div>

//           {/* Proof Stat 2 */}
//           <div className="flex items-center gap-3.5">
//             <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400">
//               <Disc className="w-5 h-5" />
//             </div>
//             <div>
//               <div className="text-sm font-bold text-white">850+</div>
//               <div className="text-xs text-gray-500">Discord members</div>
//             </div>
//           </div>

//           {/* Proof Stat 3 */}
//           <div className="flex items-center gap-3.5">
//             <div className="p-2.5 rounded-lg bg-gray-500/10 text-gray-300">
//               <Github className="w-5 h-5" />
//             </div>
//             <div>
//               <div className="text-sm font-bold text-white">2.1K</div>
//               <div className="text-xs text-gray-500">GitHub stars</div>
//             </div>
//           </div>

//           {/* Proof Stat 4 */}
//           <div className="flex items-center gap-3.5">
//             <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
//               <Rocket className="w-5 h-5" />
//             </div>
//             <div>
//               <div className="text-sm font-bold text-white">320+</div>
//               <div className="text-xs text-gray-500">Developers shipping</div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }

// "use client";

// import { motion } from "framer-motion";
// import { ArrowRight, Star } from "lucide-react";
// import Link from "next/link";

// export default function Hero() {
//   return (
//     <section className="relative min-h-screen w-full bg-background text-white flex flex-col justify-between items-center px-6 pt-32 pb-12 overflow-hidden font-sans select-none">
//       {/* PERFECT CIRCLE.SO RADIATING RINGS BACKGROUND */}
//       <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
//         {/* Central Radial Glow Layer */}
//         <div className="absolute w-150 h-150 bg-[radial-gradient(circle_at_center,rgba(30,58,138,0.4)_0%,transparent_70%)] blur-2xl" />
//         <div className="absolute w-200 h-200 bg-[radial-gradient(circle_at_center,rgba(88,28,135,0.2)_0%,transparent_70%)] blur-3xl" />

//         {/* Perfectly Centered Concentric Circles */}
//         <div className="absolute w-75 h-75 rounded-full border border-white/3" />
//         <div className="absolute w-125 h-125 rounded-full border border-white/4" />
//         <div className="absolute w-187.5 h-187.5 rounded-full border border-white/[0.035]" />
//         <div className="absolute w-262.5 h-262.5 rounded-full border border-white/2.5" />
//         <div className="absolute w-350 h-350 rounded-full border border-white/1.5" />
//         <div className="absolute w-450 h-450 rounded-full border border-white/[0.008]" />

//         {/* Orbiting Tech Nodes (Subtle Accent Highlights) */}
//         <div className="absolute w-125 h-125 animate-[spin_80s_linear_infinite]">
//           <span className="absolute top-0 left-1/2 w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]" />
//         </div>
//         <div className="absolute w-187.5 h-187.5 animate-[spin_120s_linear_infinite_reverse]">
//           <span className="absolute bottom-1/4 left-0 w-1 h-1 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.6)]" />
//         </div>
//       </div>

//       {/* HERO MAIN BODY */}
//       <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center text-center my-auto">
//         {/* Trust Review Pill Badge */}
//         <motion.div
//           initial={{ opacity: 0, y: -12 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.6 }}
//           className="inline-flex items-center gap-2 bg-[#121626]/90 border border-slate-800/80 rounded-md px-4 py-1.5 shadow-xl shadow-black/20 mb-8 backdrop-blur-sm"
//         >
//           {/* Mock Micro-Avatars Layout */}
//           <div className="flex -space-x-2">
//             <div className="w-5 h-5 rounded-full bg-linear-to-r from-red-500 to-orange-500 border border-[#070913] flex items-center justify-center text-[8px] font-bold">
//               G
//             </div>
//             <div className="w-5 h-5 rounded-full bg-linear-to-r from-blue-500 to-indigo-500 border border-[#070913] flex items-center justify-center text-[8px] font-bold">
//               A
//             </div>
//             <div className="w-5 h-5 rounded-full bg-linear-to-r from-emerald-500 to-teal-500 border border-[#070913] flex items-center justify-center text-[8px] font-bold">
//               P
//             </div>
//           </div>

//           {/* Star Rating icons */}
//           <div className="flex items-center gap-0.5 ml-1">
//             {[...Array(5)].map((_, i) => (
//               <Star
//                 key={i}
//                 className="w-3.5 h-3.5 text-amber-400 fill-amber-400"
//               />
//             ))}
//           </div>

//           <span className="text-xs font-medium text-slate-300 tracking-wide border-l border-slate-800 pl-2 ml-1">
//             70k+ reviews
//           </span>
//         </motion.div>

//         {/* Clean, Massive Heading Layer */}
//         <motion.h1
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.7, delay: 0.1 }}
//           className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[1.1] max-w-3xl"
//         >
//           Elevate Your Learning <br />
//           <span className="text-[#ebd07a] drop-shadow-sm">
//             Anytime, Anywhere
//           </span>
//         </motion.h1>

//         {/* Minimal Subtitle Paragraph */}
//         <motion.p
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.7, delay: 0.2 }}
//           className="mt-6 text-base sm:text-lg text-slate-400/90 max-w-2xl mx-auto leading-relaxed font-light"
//         >
//           Experience the recorded fast students growth with live tutoring,
//           AI-powered lessons, interactive practice, and structured learning
//           pathways built for modern education.
//         </motion.p>

//         <div className="flex flex-col sm:flex-row gap-4 mt-8">
//           <Link href="/signup" className="w-full sm:w-auto">
//             {/* Added px-4 sm:px-0 below */}
//             <button className="w-full sm:w-52 h-12 px-4 sm:px-0 bg-[#857938] text-white hover:bg-[#5a30b5] text-sm rounded-md shadow-lg transition-all flex items-center justify-center gap-2">
//               Get Started
//               <ArrowRight className="w-4 h-4" />
//             </button>
//           </Link>
//           <Link href="/communities" className="w-full sm:w-auto">
//             {/* Added px-4 sm:px-0 below */}
//             <button className="w-full sm:w-52 h-12 px-4 sm:px-0 border border-emerald-400/20 text-sm hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-md transition-all flex items-center justify-center">
//               Explore Communities
//             </button>
//           </Link>
//         </div>
//       </div>

//       {/* FOOTER: TRUSTED BY SATELLITE ROW */}
//       <motion.div
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         transition={{ duration: 1, delay: 0.5 }}
//         className="relative z-10 w-full max-w-6xl mx-auto mt-auto pt-8 border-t border-white/10 flex flex-col items-center gap-5"
//       ></motion.div>
//     </section>
//   );
// }
