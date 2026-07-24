import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Sparkles,
  GraduationCap,
  Bot,
  LineChart,
} from "lucide-react";
import Link from "next/link";

export function TutoringConsultingAISection() {
  const features = [
    {
      title: "Private 1-on-1 Tutoring",
      desc: "Work directly with elite educators focused on simplifying complex concepts and breaking down academic barriers.",
      icon: <GraduationCap className="h-5 w-5 text-primary" />,
    },
    {
      title: "Strategic Consulting",
      desc: "Receive personalized mentorship and custom blueprints designed to scale your performance and reach targeted career milestones.",
      icon: <LineChart className="h-5 w-5 text-primary" />,
    },
    {
      title: "Smart AI Tutoring",
      desc: "Unlock round-the-clock concept explanations, tailored problem-solving hints, and adaptive drills driven by next-gen intelligence.",
      icon: <Bot className="h-5 w-5 text-primary" />,
    },
    {
      title: "Adaptive Growth Tracks",
      desc: "Pinpoint performance gaps instantly with diagnostic tracking that shifts dynamically to address your exact needs.",
      icon: <Sparkles className="h-5 w-5 text-primary" />,
    },
  ];

  return (
    <section className="relative overflow-hidden py-24 bg-background">
      {/* Blueprint Grid Vector Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[32px_32px] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Radical Glow Background Accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-200 h-87.5 bg-primary/10 blur-[140px] rounded-md pointer-events-none" />

      <div className="container relative mx-auto max-w-7xl px-6 lg:px-12">
        {/* Top Header Block: Intentional Large Typography Centering */}
        <div className="max-w-6xl px-30 mb-10 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <span>Intelligent Learning Ecosystem</span>
          </div>

          <h2 className="text-4xl font-semibold text-white mb-4 tracking-tight">
            Empowering growth through human expertise and <br />
            <span className="text-3xl text-transparent bg-clip-text bg-linear-to-r from-primary to-primary/60">
              AI intelligence.
            </span>
          </h2>

          <p className="text-neutral-400 text-base max-w-2xl mx-auto">
            Get elite 1-on-1 guidance, professional strategic planning, and 24/7
            hyper-personalized AI tools structured into one cohesive roadmap.
          </p>
        </div>

        {/* Dynamic Asymmetric Split Grid */}
        <div className="grid items-start gap-12 lg:grid-cols-12">
          {/* LEFT: Multi-layered Stack Collage (Takes up 5 cols) */}
          <div className="relative lg:col-span-5 w-full max-w-md mx-auto lg:max-w-none">
            {/* Ambient Background Box Shadow Frame */}
            <div className="absolute -inset-4 rounded-md bg-neutral-900/10 border border-neutral-800/50 p-2 backdrop-blur-sm hidden sm:block" />

            {/* Main Primary Image */}
            <div className="relative z-10 overflow-hidden rounded-md border bg-card aspect-4/5 shadow-xl">
              <Image
                src="/images/pic1.png"
                alt="Interactive digital tutoring session with AI learning tools"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain drop-shadow-2xl scale-130"
              />
              {/* Subtle Linear Vignette overlay to anchor text values inside image box borders */}
              <div className="absolute inset-0 bg-linear-to-t from-background/90 via-transparent to-transparent" />

              {/* Floating Value Stats inside the image wrapper */}
              <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between gap-4 rounded-md border border-white/10 bg-black/40 p-4 backdrop-blur-md">
                <div>
                  <p className="text-2xl font-bold text-white">98%</p>
                  <p className="text-xs text-neutral-300">Goal Achievement</p>
                </div>
                <div className="h-8 w-px bg-white/20" />
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">24/7</p>
                  <p className="text-xs text-neutral-300">
                    Smart Support Available
                  </p>
                </div>
              </div>
            </div>

            {/* Accent Absolute geometry element mimicking grid axes */}
            <div className="absolute -bottom-6 -right-6 h-32 w-32 rounded-md border-b-2 border-r-2 border-primary/30 opacity-60 hidden lg:block" />
          </div>

          {/* RIGHT: Compact High-Density Content Grid (Takes up 7 cols) */}
          <div className="lg:col-span-7 lg:pl-6 flex flex-col justify-between h-full">
            {/* Feature Quadrants block */}
            <div className="grid gap-6 sm:grid-cols-2">
              {features.map((feat) => (
                <div
                  key={feat.title}
                  className="group relative rounded-md border bg-card/50 p-6 transition-all duration-300 hover:bg-card hover:shadow-md"
                >
                  <div className="mb-4 inline-flex items-center justify-center rounded-md bg-primary/10 p-2.5 transition-colors group-hover:bg-primary/20">
                    {feat.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Bottom Call to Action strip aligned precisely below grid cards */}
            <div className="mt-12 pt-8 border-t flex flex-wrap items-center gap-4 sm:gap-6">
              <Button
                size="lg"
                className="group px-6 bg-[#857938] text-white"
                asChild
              >
                <Link href="/get-started">
                  Get Started Today
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// import Image from "next/image";
// import { Button } from "@/components/ui/button";
// import {
//   ArrowRight,
//   Target,
//   GraduationCap,
//   LineChart,
//   CalendarCheck,
// } from "lucide-react";
// import Link from "next/link";

// export function TutoringConsultingSection() {
//   const features = [
//     {
//       title: "1-on-1 Private Tutoring",
//       desc: "Work closely with premier educators dedicated to breaking down tough concepts and accelerating your comprehension.",
//       icon: <GraduationCap className="h-5 w-5 text-primary" />,
//     },
//     {
//       title: "Strategic Consulting",
//       desc: "Receive customized, actionable strategy roadmaps designed around your long-term career or academic benchmarks.",
//       icon: <LineChart className="h-5 w-5 text-primary" />,
//     },
//     {
//       title: "Targeted Roadblocks",
//       desc: "Isolate precise weaknesses with fast, diagnostic reviews so you can pivot straight into building core mastery.",
//       icon: <Target className="h-5 w-5 text-primary" />,
//     },
//     {
//       title: "Flexible Scheduling",
//       desc: "Book tailored milestones on your own terms. Access consistent advice that effortlessly matches your unique weekly pace.",
//       icon: <CalendarCheck className="h-5 w-5 text-primary" />,
//     },
//   ];

//   return (
//     <section className="relative overflow-hidden py-24 bg-background">
//       {/* Blueprint Grid Vector Pattern overlay */}
//       <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[32px_32px] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

//       {/* Radical Glow Background Accent */}
//       <div className="absolute top-0 left-1/2 -translate-x-1/2 w-200 h-87.5 bg-primary/10 blur-[140px] rounded-md pointer-events-none" />

//       <div className="container relative mx-auto max-w-7xl px-6 lg:px-12">
//         {/* Top Header Block: Intentional Large Typography Centering */}
//         <div className="max-w-6xl px-30 mb-20 text-center">
//           <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
//             <span>Premium 1-on-1 Guidance</span>
//           </div>

//           <h2 className="text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl text-foreground">
//             Personalized strategies to smash your goals and{" "}
//             <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-primary/60">
//               scale heights.
//             </span>
//           </h2>

//           <p className="mt-6 text-xl text-muted-foreground leading-relaxed">
//             Skip the guesswork. Our high-touch private tutoring and custom
//             business consulting equip you with targeted feedback and absolute
//             execution clarity.
//           </p>
//         </div>

//         {/* Dynamic Asymmetric Split Grid */}
//         <div className="grid items-start gap-12 lg:grid-cols-12">
//           {/* LEFT: Multi-layered Stack Collage (Takes up 5 cols) */}
//           <div className="relative lg:col-span-5 w-full max-w-md mx-auto lg:max-w-none">
//             {/* Ambient Background Box Shadow Frame */}
//             <div className="absolute -inset-4 rounded-md bg-neutral-900/10 border border-neutral-800/50 p-2 backdrop-blur-sm hidden sm:block" />

//             {/* Main Primary Image */}
//             <div className="relative z-10 overflow-hidden rounded-md border bg-card aspect-4/5 shadow-xl">
//               <Image
//                 src="/images/pic1.png"
//                 alt="1-on-1 online private consulting session"
//                 fill
//                 priority
//                 sizes="(max-width: 1024px) 100vw, 50vw"
//                 className="object-contain drop-shadow-2xl scale-130"
//               />
//               {/* Subtle Linear Vignette overlay to anchor text values inside image box borders */}
//               <div className="absolute inset-0 bg-linear-to-t from-background/90 via-transparent to-transparent" />

//               {/* Floating Value Stats inside the image wrapper */}
//               <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between gap-4 rounded-md border border-white/10 bg-black/40 p-4 backdrop-blur-md">
//                 <div>
//                   <p className="text-2xl font-bold text-white">98%</p>
//                   <p className="text-xs text-neutral-300">Satisfaction Rate</p>
//                 </div>
//                 <div className="h-8 w-px bg-white/20" />
//                 <div className="text-right">
//                   <p className="text-2xl font-bold text-white">1,200+</p>
//                   <p className="text-xs text-neutral-300">Hours Coached</p>
//                 </div>
//               </div>
//             </div>

//             {/* Accent Absolute geometry element mimicking grid axes */}
//             <div className="absolute -bottom-6 -right-6 h-32 w-32 rounded-md border-b-2 border-r-2 border-primary/30 opacity-60 hidden lg:block" />
//           </div>

//           {/* RIGHT: Compact High-Density Content Grid (Takes up 7 cols) */}
//           <div className="lg:col-span-7 lg:pl-6 flex flex-col justify-between h-full">
//             {/* Feature Quadrants block */}
//             <div className="grid gap-6 sm:grid-cols-2">
//               {features.map((feat) => (
//                 <div
//                   key={feat.title}
//                   className="group relative rounded-md border bg-card/50 p-6 transition-all duration-300 hover:bg-card hover:shadow-md"
//                 >
//                   <div className="mb-4 inline-flex items-center justify-center rounded-md bg-primary/10 p-2.5 transition-colors group-hover:bg-primary/20">
//                     {feat.icon}
//                   </div>
//                   <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
//                     {feat.title}
//                   </h3>
//                   <p className="text-sm text-muted-foreground leading-relaxed">
//                     {feat.desc}
//                   </p>
//                 </div>
//               ))}
//             </div>

//             {/* Bottom Call to Action strip aligned precisely below grid cards */}
//             <div className="mt-12 pt-8 border-t flex flex-wrap items-center gap-4 sm:gap-6">
//               <Button size="lg" className="group px-6" asChild>
//                 <Link href="/consulting">
//                   Book Private Session
//                   <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
//                 </Link>
//               </Button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }
