"use client";

import { motion } from "framer-motion";
import { Check, Zap, Star, ShieldCheck, Clock, Tag } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { useTransition } from "react";
import { CreateSubscription } from "../actions/subscription";

export const PricingPlan = [
  {
    id: 0,
    cardTitle: "Pay Per Session",
    priceTitle: "25",
    duration: "2-hour session",
    cardDescription: "Best for one-off support or specific topics",
    benefits: [
      "Full 120-minute live session",
      "Interactive whiteboard access",
      "Post-session summary & notes",
      "No recurring commitment",
      "Access to recording (7 days)",
    ],
    popular: false,
    cta: "Book a Session",
    subtext: "Standard Retail Rate",
    savings: null,
  },
  {
    id: 1,
    cardTitle: "Standard",
    priceTitle: "149",
    duration: "8 Sessions per month",
    cardDescription: "Consistent learning for serious progress",
    benefits: [
      "8 full 2-hour sessions",
      "Choose preferred tutors",
      "Personalized learning path",
      "Homework & project support",
      "Lifetime recording access",
      "Priority email support",
    ],
    popular: true,
    cta: "Save $51 Monthly",
    subtext: "Only ~$18.60 per session",
    savings: "25% OFF",
  },
  {
    id: 2,
    cardTitle: "Premium",
    priceTitle: "249",
    duration: "Unlimited Sessions",
    cardDescription: "Total immersion for rapid mastery",
    benefits: [
      "Unlimited 2-hour sessions",
      "Dedicated personal mentor",
      "Custom exam prep strategy",
      "24/7 priority booking",
      "Direct tutor messaging",
      "Advanced performance analytics",
    ],
    popular: false,
    cta: "Get Unlimited Access",
    subtext: "Best value for daily use",
    savings: "Best Value",
  },
];

export function PricingTable() {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="min-h-screen bg-background text-white relative overflow-hidden font-sans max-w-7xl mx-auto px-6 lg:px-12 py-20">
      <div className="absolute inset-0 -z-10">
        <div className="absolute w-150 h-150 bg-indigo-500/5 blur-[120px] rounded-md -top-48 -left-24" />
        <div className="absolute w-150 h-150 bg-emerald-500/5 blur-[120px] rounded-md -bottom-48 -right-24" />
      </div>

      <div className="max-w-4xl mx-auto text-center mb-20">
        {/* Badge Decorator */}
        <span className="inline-block px-4 mt-10 mb-0 text-xs font-bold tracking-widest text-primary uppercase bg-primary/10 rounded-full">
          Fuel Your Learning
        </span>

        {/* Main Catchy Title */}
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight leading-tight">
          Invest in your{" "}
          <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-emerald-400">
            breakthrough.
          </span>
        </h2>

        {/* Clear, Step-by-Step Subtitle */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-sm text-neutral-500 font-medium">
            <span className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-neutral-800 text-white text-[10px]">
                1
              </span>
              Choose your plan
            </span>
            <div className="hidden md:block w-8 h-px bg-neutral-800" />
            <span className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-neutral-800 text-white text-[10px]">
                2
              </span>
              Make Payment
            </span>
            <div className="hidden md:block w-8 h-px bg-neutral-800" />
            <span className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-neutral-800 text-white text-[10px]">
                3
              </span>
              Book your session
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-8 max-w-7xl mx-auto md:grid-cols-3">
        {PricingPlan.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05, zIndex: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="h-full"
          >
            <Card
              className={`relative h-full flex flex-col border-slate-800 bg-background backdrop-blur-md transition-shadow duration-500 ${
                item.popular
                  ? "border-emerald-500/40 ring-1 ring-emerald-500/20 shadow-[0_0_40px_-10px_rgba(16,185,129,0.2)]"
                  : "hover:border-slate-700 hover:shadow-2xl hover:shadow-indigo-500/10"
              }`}
            >
              {/* Savings/Discount Badge */}
              {item.savings && (
                <div className="absolute top-4 right-4">
                  <div className="flex items-center gap-1 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                    <Tag className="w-3 h-3" />
                    {item.savings}
                  </div>
                </div>
              )}

              {item.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-[#857938] text-black text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-md shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                    Most Popular
                  </span>
                </div>
              )}

              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`p-2 rounded-lg ${item.id === 0 ? "bg-amber-500/10" : item.id === 1 ? "bg-emerald-500/10" : "bg-indigo-500/10"}`}
                  >
                    {item.id === 0 && (
                      <Zap className="w-5 h-5 text-amber-400" />
                    )}
                    {item.id === 1 && (
                      <Star className="w-5 h-5 text-emerald-400" />
                    )}
                    {item.id === 2 && (
                      <ShieldCheck className="w-5 h-5 text-indigo-400" />
                    )}
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-100">
                    {item.cardTitle}
                  </CardTitle>
                </div>
                <CardDescription className="text-slate-400 leading-relaxed pr-12">
                  {item.cardDescription}
                </CardDescription>
              </CardHeader>

              <CardContent className="grow pt-2">
                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-white">
                      ${item.priceTitle}
                    </span>
                    <span className="text-slate-500 font-medium">
                      {item.id === 0 ? "/session" : "/mo"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-300 bg-indigo-500/10 w-fit px-2.5 py-1 rounded-md mt-2 border border-indigo-500/20">
                    <Clock className="w-3 h-3" />
                    {item.duration}
                  </div>
                </div>

                <div className="mt-8 space-y-3.5">
                  {item.benefits.map((benefit, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 text-sm text-slate-300"
                    >
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-3 pb-8 mt-auto">
                <Button
                  disabled={isPending}
                  onClick={() => {
                    startTransition(async () => {
                      await CreateSubscription(item.cardTitle);
                    });
                  }}
                  className={`w-full py-6 text-base font-bold transition-all active:scale-95 ${
                    item.popular
                      ? "bg-[#857938] hover:bg-emerald-400 text-white shadow-lg"
                      : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                  }`}
                >
                  {isPending ? "Processing..." : item.cta}
                </Button>
                <p className="text-[11px] text-center text-slate-500 font-medium uppercase tracking-widest">
                  {item.subtext}
                </p>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// "use client";

// import { motion } from "framer-motion";
// import { Check, Zap, Star, ShieldCheck, Clock } from "lucide-react";
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
//     cardDescription: "Perfect for a quick boost or specific help",
//     benefits: [
//       "Full 120-minute live session",
//       "Interactive whiteboard access",
//       "Post-session summary & notes",
//       "No recurring commitment",
//       "Access to recording (7 days)",
//     ],
//     popular: false,
//     cta: "Book a Session",
//     subtext: "Pay as you go",
//   },
//   {
//     id: 1,
//     cardTitle: "Standard",
//     priceTitle: "49.99",
//     duration: "Monthly",
//     cardDescription: "Consistent learning at a discounted rate",
//     benefits: [
//       "8 live sessions per month",
//       "Choose preferred tutors",
//       "Personalized learning path",
//       "Homework & project support",
//       "Lifetime recording access",
//       "Priority email support",
//     ],
//     popular: true,
//     cta: "Start Subscription",
//     subtext: "~$6.25 per session",
//   },
//   {
//     id: 2,
//     cardTitle: "Premium",
//     priceTitle: "149.99",
//     duration: "Monthly",
//     cardDescription: "The ultimate fast-track experience",
//     benefits: [
//       "Unlimited live sessions",
//       "Dedicated personal mentor",
//       "Custom exam prep strategy",
//       "24/7 priority booking",
//       "Direct tutor messaging",
//       "Advanced performance analytics",
//     ],
//     popular: false,
//     cta: "Go Premium",
//     subtext: "Best for daily learners",
//   },
// ];

// export function PricingTable() {
//   const [isPending, startTransition] = useTransition();

//   return (
//     <div className="min-h-screen bg-background text-white px-6 py-20 relative overflow-hidden font-sans">
//       {/* Background Ambience */}
//       <div className="absolute inset-0 -z-10">
//         <div className="absolute w-150 h-150 bg-indigo-500/5 blur-[120px] rounded-full -top-48 -left-24" />
//         <div className="absolute w-150 h-150 bg-emerald-500/5 blur-[120px] rounded-full -bottom-48 -right-24" />
//       </div>

//       <div className="text-center mb-16">
//         <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-linear-to-b from-white to-slate-500 bg-clip-text text-transparent">
//           Simple, Transparent Pricing
//         </h1>
//         <p className="text-slate-400 mt-4 text-lg">
//           Invest in your growth with plans that scale with you.
//         </p>
//       </div>

//       <div className="grid gap-8 max-w-7xl mx-auto md:grid-cols-3">
//         {PricingPlan.map((item) => (
//           <motion.div
//             key={item.id}
//             initial={{ opacity: 0, y: 20 }}
//             whileInView={{ opacity: 1, y: 0 }}
//             viewport={{ once: true }}
//             // --- ZOOM LOGIC START ---
//             whileHover={{
//               scale: 1.05,
//               zIndex: 50,
//             }}
//             transition={{
//               type: "spring",
//               stiffness: 300,
//               damping: 20,
//             }}
//             // --- ZOOM LOGIC END ---
//             className="h-full"
//           >
//             <Card
//               className={`relative h-full flex flex-col border-slate-800 bg-slate-900/40 backdrop-blur-md transition-shadow duration-500 ${
//                 item.popular
//                   ? "border-emerald-500/40 ring-1 ring-emerald-500/20 shadow-[0_0_40px_-10px_rgba(16,185,129,0.2)]"
//                   : "hover:border-slate-700 hover:shadow-2xl hover:shadow-indigo-500/10"
//               }`}
//             >
//               {item.popular && (
//                 <div className="absolute -top-4 left-1/2 -translate-x-1/2">
//                   <span className="bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)]">
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
//                 <CardDescription className="text-slate-400 leading-relaxed">
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
//                       ? "bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg"
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
