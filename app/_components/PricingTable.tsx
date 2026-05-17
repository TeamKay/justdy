"use client";

import { motion } from "framer-motion";
import { Check, Zap, Star, Clock, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { useTransition, useState } from "react";
import { CreateSubscription } from "../actions/subscription";

// Reconfigured pricing structure into two primary tracks
export const PricingPlans = {
  flexPay: {
    cardTitle: "FlexPay",
    cardDescription:
      "Pay only for what you need. Zero commitments, total control.",
    popular: false,
    subtext: "Billed per booked session",
    tiers: [
      {
        id: "30m",
        label: "30 Min",
        price: "15",
        duration: "30-minute intense sprint",
        benefits: [
          "Targeted problem solving",
          "Interactive whiteboard access",
          "Post-session summary & notes",
          "Access to recording (7 days)",
          "No recurring commitment",
        ],
      },
      {
        id: "45m",
        label: "45 Min",
        price: "25",
        duration: "45-minute comprehensive review",
        benefits: [
          "Deep dive into complex topics",
          "Interactive whiteboard access",
          "Post-session summary & notes",
          "Access to recording (14 days)",
          "Priority booking windows",
        ],
      },
      {
        id: "60m",
        label: "60 Min",
        price: "35",
        duration: "Full 60-minute deep session",
        benefits: [
          "Comprehensive conceptual mastery",
          "Interactive whiteboard access",
          "Post-session summary & homework guide",
          "Lifetime recording access",
          "Direct follow-up Q&A channel",
        ],
      },
    ],
  },
  subscription: {
    cardTitle: "Monthly Premium",
    priceTitle: "200",
    duration: "Unlimited Access / Month",
    cardDescription:
      "Immersive continuous learning built for rapid breakthroughs.",
    benefits: [
      "8 full 60-minute sessions",
      "Personalized learning path",
      "Homework & project support",
      "Priority email support",
      "Dedicated personal learning mentor",
      "Advanced progress & performance analytics",
    ],
    popular: true,
    cta: "Unlock All Access",
    subtext: "Best value for consistent growth",
    savings: "Save Big",
  },
};

export function PricingTable() {
  const [isPending, startTransition] = useTransition();
  // State tracking the active inner tier selected for the FlexPay option
  const [activeFlexIndex, setActiveFlexIndex] = useState(0);

  const currentFlexTier = PricingPlans.flexPay.tiers[activeFlexIndex];

  return (
    <div className="min-h-screen bg-background text-white relative overflow-hidden font-sans max-w-7xl mx-auto px-6 lg:px-12 py-20">
      {/* Dynamic Aesthetic Ambient Glow Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute w-125 h-125 bg-blue-500/10 blur-[150px] rounded-full -top-48 -left-24" />
        <div className="absolute w-125 h-125 bg-amber-500/5 blur-[150px] rounded-full -bottom-48 -right-24" />
      </div>

      <div className="max-w-4xl mx-auto text-center mb-16">
        {/* Animated Badge Decorator */}
        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 mb-6 text-xs font-semibold tracking-wider text-amber-400 uppercase bg-amber-500/10 border border-amber-500/20 rounded-full">
          <Sparkles className="w-3.5 h-3.5" /> Pricing Options Crafted For You
        </span>

        {/* Main Header Title */}
        <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight leading-none">
          Invest in your{" "}
          <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 via-indigo-400 to-amber-300">
            breakthrough.
          </span>
        </h2>

        {/* Step-by-Step Flow Map */}
        <div className="space-y-4 mt-8">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-sm text-neutral-400 font-medium">
            <span className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-neutral-800 text-white text-[10px]">
                1
              </span>
              Pick your pathway
            </span>
            <div className="hidden md:block w-8 h-px bg-neutral-800" />
            <span className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-neutral-800 text-white text-[10px]">
                2
              </span>
              Complete Checkout
            </span>
            <div className="hidden md:block w-8 h-px bg-neutral-800" />
            <span className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-neutral-800 text-white text-[10px]">
                3
              </span>
              Instantly start learning
            </span>
          </div>
        </div>
      </div>

      {/* Structured 2-Column Responsive Matrix Grid */}
      <div className="grid gap-8 max-w-7xl mx-auto md:grid-cols-2 items-start">
        {/* CARD 1: FLEXPAY OPTION */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="h-full"
        >
          <Card className="relative h-full flex flex-col border-neutral-800 bg-neutral-900/40 backdrop-blur-md hover:border-neutral-700/70 transition-all duration-300 shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <Zap className="w-5 h-5 text-blue-400" />
                </div>
                <CardTitle className="text-2xl font-bold text-neutral-100">
                  {PricingPlans.flexPay.cardTitle}
                </CardTitle>
              </div>
              <CardDescription className="text-neutral-400 text-sm leading-relaxed">
                {PricingPlans.flexPay.cardDescription}
              </CardDescription>
            </CardHeader>

            <CardContent className="grow pt-2 flex flex-col">
              {/* Custom High-Fidelity Segmented Toggle Switch */}
              <div className="p-1 bg-neutral-950/80 rounded-xl border border-neutral-800 flex gap-1 mb-6">
                {PricingPlans.flexPay.tiers.map((tier, idx) => (
                  <button
                    key={tier.id}
                    onClick={() => setActiveFlexIndex(idx)}
                    className={`relative flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      activeFlexIndex === idx
                        ? "bg-blue-500 text-white shadow-md shadow-blue-500/20"
                        : "text-neutral-400 hover:text-white hover:bg-neutral-900/50"
                    }`}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>

              {/* Price Display with motion fade-in */}
              <motion.div
                key={currentFlexTier.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-1"
              >
                <div className="flex items-baseline gap-1.5">
                  <span className="text-5xl font-black tracking-tight text-white">
                    ${currentFlexTier.price}
                  </span>
                  <span className="text-neutral-500 font-medium text-sm">
                    / session
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 bg-blue-500/10 w-fit px-2.5 py-1 rounded-md mt-3 border border-blue-500/20">
                  <Clock className="w-3.5 h-3.5" />
                  {currentFlexTier.duration}
                </div>

                {/* Features Checklist */}
                <div className="mt-8 space-y-3.5">
                  {currentFlexTier.benefits.map((benefit, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 text-sm text-neutral-300"
                    >
                      <Check className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pb-8 pt-6 mt-auto">
              <Button
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    await CreateSubscription(
                      `${PricingPlans.flexPay.cardTitle} - ${currentFlexTier.label}`,
                    );
                  });
                }}
                className="w-full py-6 text-base font-bold bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 rounded-xl transition-all active:scale-[0.98]"
              >
                {isPending
                  ? "Processing..."
                  : `Book ${currentFlexTier.label} Session`}
              </Button>
              <p className="text-[10px] text-center text-neutral-500 font-bold uppercase tracking-widest">
                {PricingPlans.flexPay.subtext}
              </p>
            </CardFooter>
          </Card>
        </motion.div>

        {/* CARD 2: MONTHLY SUBSCRIPTION */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="h-full"
        >
          <Card className="relative h-full flex flex-col border-amber-500/30 bg-neutral-900/60 backdrop-blur-md shadow-[0_0_50px_-12px_rgba(245,158,11,0.15)] rounded-2xl">
            {/* Elegant Accent Popular Banner Badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
              <span className="bg-linear-to-r from-amber-500 to-amber-600 text-neutral-950 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg shadow-amber-500/20">
                Most Popular Option
              </span>
            </div>

            <CardHeader className="pb-4 pt-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Star className="w-5 h-5 text-amber-400" />
                </div>
                <CardTitle className="text-2xl font-bold text-neutral-100">
                  {PricingPlans.subscription.cardTitle}
                </CardTitle>
              </div>
              <CardDescription className="text-neutral-400 text-sm leading-relaxed">
                {PricingPlans.subscription.cardDescription}
              </CardDescription>
            </CardHeader>

            <CardContent className="grow pt-2">
              <div className="space-y-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-5xl font-black tracking-tight text-white">
                    ${PricingPlans.subscription.priceTitle}
                  </span>
                  <span className="text-neutral-500 font-medium text-sm">
                    / month
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-500/10 w-fit px-2.5 py-1 rounded-md mt-3 border border-amber-500/20">
                  <Clock className="w-3.5 h-3.5" />
                  {PricingPlans.subscription.duration}
                </div>
              </div>

              {/* Subscription Benefits Checklist */}
              <div className="mt-18.5 space-y-3.5">
                {PricingPlans.subscription.benefits.map((benefit, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 text-sm text-neutral-300"
                  >
                    <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pb-8 pt-6 mt-auto">
              <Button
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    await CreateSubscription(
                      PricingPlans.subscription.cardTitle,
                    );
                  });
                }}
                className="w-full py-6 text-base font-bold bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 rounded-xl transition-all shadow-lg shadow-amber-500/10 active:scale-[0.98]"
              >
                {isPending ? "Processing..." : PricingPlans.subscription.cta}
              </Button>
              <p className="text-[10px] text-center text-amber-500/80 font-bold uppercase tracking-widest">
                {PricingPlans.subscription.subtext}
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

// "use client";

// import { motion } from "framer-motion";
// import { Check, Zap, Star, ShieldCheck, Clock, Tag } from "lucide-react";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "./ui/card";
// import { Button } from "./ui/button";
// import { useTransition } from "react";
// import { CreateSubscription } from "../actions/subscription";

// export const PricingPlan = [
//   {
//     id: 0,
//     cardTitle: "Pay Per Session",
//     priceTitle: "25",
//     duration: "2-hour session",
//     cardDescription: "Best for one-off support or specific topics",
//     benefits: [
//       "Full 120-minute live session",
//       "Interactive whiteboard access",
//       "Post-session summary & notes",
//       "No recurring commitment",
//       "Access to recording (7 days)",
//     ],
//     popular: false,
//     cta: "Book a Session",
//     subtext: "Standard Retail Rate",
//     savings: null,
//   },
//   {
//     id: 1,
//     cardTitle: "Standard",
//     priceTitle: "149",
//     duration: "8 Sessions per month",
//     cardDescription: "Consistent learning for serious progress",
//     benefits: [
//       "8 full 2-hour sessions",
//       "Choose preferred tutors",
//       "Personalized learning path",
//       "Homework & project support",
//       "Lifetime recording access",
//       "Priority email support",
//     ],
//     popular: true,
//     cta: "Save $51 Monthly",
//     subtext: "Only ~$18.60 per session",
//     savings: "25% OFF",
//   },
//   {
//     id: 2,
//     cardTitle: "Premium",
//     priceTitle: "249",
//     duration: "Unlimited Sessions",
//     cardDescription: "Total immersion for rapid mastery",
//     benefits: [
//       "Unlimited 2-hour sessions",
//       "Dedicated personal mentor",
//       "Custom exam prep strategy",
//       "24/7 priority booking",
//       "Direct tutor messaging",
//       "Advanced performance analytics",
//     ],
//     popular: false,
//     cta: "Get Unlimited Access",
//     subtext: "Best value for daily use",
//     savings: "Best Value",
//   },
// ];

// export function PricingTable() {
//   const [isPending, startTransition] = useTransition();

//   return (
//     <div className="min-h-screen bg-background text-white relative overflow-hidden font-sans max-w-7xl mx-auto px-6 lg:px-12 py-20">
//       <div className="absolute inset-0 -z-10">
//         <div className="absolute w-150 h-150 bg-indigo-500/5 blur-[120px] rounded-md -top-48 -left-24" />
//         <div className="absolute w-150 h-150 bg-emerald-500/5 blur-[120px] rounded-md -bottom-48 -right-24" />
//       </div>

//       <div className="max-w-4xl mx-auto text-center mb-20">
//         {/* Badge Decorator */}
//         <span className="inline-block px-4 mt-10 mb-0 text-xs font-bold tracking-widest text-primary uppercase bg-primary/10 rounded-full">
//           Fuel Your Learning
//         </span>

//         {/* Main Catchy Title */}
//         <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight leading-tight">
//           Invest in your{" "}
//           <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-emerald-400">
//             breakthrough.
//           </span>
//         </h2>

//         {/* Clear, Step-by-Step Subtitle */}
//         <div className="space-y-4">
//           <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-sm text-neutral-500 font-medium">
//             <span className="flex items-center gap-2">
//               <span className="flex items-center justify-center w-6 h-6 rounded-full bg-neutral-800 text-white text-[10px]">
//                 1
//               </span>
//               Choose your plan
//             </span>
//             <div className="hidden md:block w-8 h-px bg-neutral-800" />
//             <span className="flex items-center gap-2">
//               <span className="flex items-center justify-center w-6 h-6 rounded-full bg-neutral-800 text-white text-[10px]">
//                 2
//               </span>
//               Make Payment
//             </span>
//             <div className="hidden md:block w-8 h-px bg-neutral-800" />
//             <span className="flex items-center gap-2">
//               <span className="flex items-center justify-center w-6 h-6 rounded-full bg-neutral-800 text-white text-[10px]">
//                 3
//               </span>
//               Book your session
//             </span>
//           </div>
//         </div>
//       </div>

//       <div className="grid gap-8 max-w-7xl mx-auto md:grid-cols-3">
//         {PricingPlan.map((item) => (
//           <motion.div
//             key={item.id}
//             initial={{ opacity: 0, y: 20 }}
//             whileInView={{ opacity: 1, y: 0 }}
//             viewport={{ once: true }}
//             whileHover={{ scale: 1.05, zIndex: 50 }}
//             transition={{ type: "spring", stiffness: 300, damping: 20 }}
//             className="h-full"
//           >
//             <Card
//               className={`relative h-full flex flex-col border-slate-800 bg-background backdrop-blur-md transition-shadow duration-500 ${
//                 item.popular
//                   ? "border-emerald-500/40 ring-1 ring-emerald-500/20 shadow-[0_0_40px_-10px_rgba(16,185,129,0.2)]"
//                   : "hover:border-slate-700 hover:shadow-2xl hover:shadow-indigo-500/10"
//               }`}
//             >
//               {/* Savings/Discount Badge */}
//               {item.savings && (
//                 <div className="absolute top-4 right-4">
//                   <div className="flex items-center gap-1 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
//                     <Tag className="w-3 h-3" />
//                     {item.savings}
//                   </div>
//                 </div>
//               )}

//               {item.popular && (
//                 <div className="absolute -top-4 left-1/2 -translate-x-1/2">
//                   <span className="bg-[#857938] text-black text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-md shadow-[0_0_20px_rgba(16,185,129,0.4)]">
//                     Most Popular
//                   </span>
//                 </div>
//               )}

//               <CardHeader className="pb-4">
//                 <div className="flex items-center gap-3 mb-2">
//                   <div
//                     className={`p-2 rounded-lg ${item.id === 0 ? "bg-amber-500/10" : item.id === 1 ? "bg-emerald-500/10" : "bg-indigo-500/10"}`}
//                   >
//                     {item.id === 0 && (
//                       <Zap className="w-5 h-5 text-amber-400" />
//                     )}
//                     {item.id === 1 && (
//                       <Star className="w-5 h-5 text-emerald-400" />
//                     )}
//                     {item.id === 2 && (
//                       <ShieldCheck className="w-5 h-5 text-indigo-400" />
//                     )}
//                   </div>
//                   <CardTitle className="text-xl font-bold text-slate-100">
//                     {item.cardTitle}
//                   </CardTitle>
//                 </div>
//                 <CardDescription className="text-slate-400 leading-relaxed pr-12">
//                   {item.cardDescription}
//                 </CardDescription>
//               </CardHeader>

//               <CardContent className="grow pt-2">
//                 <div className="space-y-1">
//                   <div className="flex items-baseline gap-2">
//                     <span className="text-5xl font-bold text-white">
//                       ${item.priceTitle}
//                     </span>
//                     <span className="text-slate-500 font-medium">
//                       {item.id === 0 ? "/session" : "/mo"}
//                     </span>
//                   </div>

//                   <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-300 bg-indigo-500/10 w-fit px-2.5 py-1 rounded-md mt-2 border border-indigo-500/20">
//                     <Clock className="w-3 h-3" />
//                     {item.duration}
//                   </div>
//                 </div>

//                 <div className="mt-8 space-y-3.5">
//                   {item.benefits.map((benefit, i) => (
//                     <div
//                       key={i}
//                       className="flex items-start gap-3 text-sm text-slate-300"
//                     >
//                       <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
//                       <span>{benefit}</span>
//                     </div>
//                   ))}
//                 </div>
//               </CardContent>

//               <CardFooter className="flex flex-col gap-3 pb-8 mt-auto">
//                 <Button
//                   disabled={isPending}
//                   onClick={() => {
//                     startTransition(async () => {
//                       await CreateSubscription(item.cardTitle);
//                     });
//                   }}
//                   className={`w-full py-6 text-base font-bold transition-all active:scale-95 ${
//                     item.popular
//                       ? "bg-[#857938] hover:bg-emerald-400 text-white shadow-lg"
//                       : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
//                   }`}
//                 >
//                   {isPending ? "Processing..." : item.cta}
//                 </Button>
//                 <p className="text-[11px] text-center text-slate-500 font-medium uppercase tracking-widest">
//                   {item.subtext}
//                 </p>
//               </CardFooter>
//             </Card>
//           </motion.div>
//         ))}
//       </div>
//     </div>
//   );
// }
