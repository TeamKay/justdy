"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import { enrollInCreditsAction } from "../actions/enroll-in-credits";

const plans = [
  {
    id: "standard_monthly",
    name: "Standard",
    price: 29,
    credits: "50 credits",
    description: "Best for consistent learners",
    features: [
      "4-8 live sessions per month",
      "Choose your preferred tutors",
      "Personalized learning path",
      "Homework help & problem-solving support",
      "Session recordings for revision",
      "Priority scheduling",
      "Progress tracking & feedback",
      "Email/chat support",
    ],
    popular: true,
  },
  {
    id: "pro_monthly",
    name: "Pro",
    price: 99,
    credits: "200 credits",
    description: "For serious learners",
    features: [
      "Unlimited or high-frequency live sessions",
      "Dedicated personal tutor",
      "Custom study plan & goal setting",
      "Exam preparation & strategy coaching",
      "24/7 priority booking access",
      "Detailed performance analytics",
      "Direct tutor messaging (outside sessions)",
      "Fast-track learning & mastery support",
    ],
  },
];

interface CreditCardProps {
  currentUserPackageId: string | null | undefined;
  hasHadPaidPlan: boolean;
}

export default function CreditCardPage({}: CreditCardProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [openCheckout, setOpenCheckout] = useState(false);
  const [isPending, startTransition] = useTransition();

  const plan = plans.find((p) => p.id === selected);

  const handleCheckout = () => {
    if (!plan) return;

    startTransition(async () => {
      await enrollInCreditsAction(plan.id);
      setOpenCheckout(false);
    });
  };

  return (
    <div className="min-h-screen bg-background text-white px-6 py-5 relative overflow-hidden">
      {/* BACKGROUND GLOW */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute w-150 h-150 bg-indigo-600/30 blur-[140px] rounded-full -top-30 -left-30" />
        <div className="absolute w-150 h-150 bg-purple-600/20 blur-[140px] rounded-full -bottom-30 -right-30" />
      </div>

      {/* CARDS */}
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {plans.map((p) => {
          const active = selected === p.id;

          return (
            <motion.div
              key={p.id}
              onClick={() => setSelected(p.id)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className={`cursor-pointer rounded-3xl p-px transition
                ${
                  active
                    ? "bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500"
                    : "bg-white/10"
                }`}
            >
              <div className="bg-[#0a0a0f]/90 rounded-3xl p-6 backdrop-blur-xl">
                {p.popular && (
                  <div className="text-xs bg-indigo-500 px-3 py-1 rounded-full w-fit mb-3">
                    Most Popular
                  </div>
                )}

                <h2 className="text-2xl font-semibold">{p.name}</h2>
                <p className="text-slate-400 text-sm">{p.description}</p>

                <div className="mt-5 text-3xl font-bold">${p.price}</div>
                <div className="text-indigo-300 text-sm">{p.credits}</div>

                <ul className="mt-6 space-y-3">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-200">
                      <Check className="w-4 h-4 text-emerald-400 mt-1" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* FIXED CTA BAR (Stripe-style) */}
      <AnimatePresence>
        {plan && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 
            bg-white/10 backdrop-blur-xl border border-white/10 
            rounded-2xl px-6 py-4 flex items-center gap-6 shadow-xl"
          >
            <div>
              <div className="font-semibold">{plan.name}</div>
              <div className="text-xs text-slate-400">
                ${plan.price} • {plan.credits}
              </div>
            </div>

            <button
              onClick={() => setOpenCheckout(true)}
              className="bg-indigo-600 hover:bg-indigo-700 px-5 py-2 rounded-xl text-sm font-medium transition"
            >
              Continue
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CHECKOUT MODAL */}
      <AnimatePresence>
        {openCheckout && plan && (
          <>
            {/* BACKDROP */}
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpenCheckout(false)}
            />

            {/* MODAL */}
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
              className="fixed bottom-0 left-1/2 -translate-x-1/2 
              w-full max-w-lg bg-[#0a0a0f] border border-white/10 
              rounded-t-3xl p-6 shadow-2xl"
            >
              {/* HEADER */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Checkout</h3>
                <button onClick={() => setOpenCheckout(false)}>
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* SUMMARY */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex justify-between">
                  <span>{plan.name} Plan</span>
                  <span>${plan.price}</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {plan.credits}
                </div>
              </div>

              {/* FEATURES PREVIEW */}
              <div className="mt-4 space-y-2 text-sm text-slate-300">
                {plan.features.slice(0, 8).map((f, i) => (
                  <div key={i} className="flex gap-2">
                    <Check className="w-4 h-4 text-emerald-400 mt-0.5" />
                    {f}
                  </div>
                ))}
              </div>

              {/* PAY BUTTON */}
              <button
                onClick={handleCheckout}
                disabled={isPending}
                className="mt-6 w-full py-3 rounded-xl font-medium 
                bg-linear-to-r from-indigo-500 to-purple-600 
                hover:opacity-90 transition shadow-lg shadow-indigo-500/30"
              >
                {isPending ? "Processing..." : "Pay & Subscribe"}
              </button>

              <p className="text-xs text-slate-500 text-center mt-3">
                Secure payment powered by Stripe
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// "use client";

// import { useState, useTransition } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { Check } from "lucide-react";
// import { enrollInCreditsAction } from "../actions/enroll-in-credits";

// const plans = {
//   monthly: [
//     {
//       id: "standard_monthly",
//       name: "Standard",
//       price: 29,
//       credits: "50 credits",
//       description: "Best for consistent learners",
//       features: [
//         "4-8 live sessions",
//         "Choose tutors",
//         "Personalized learning",
//         "Session recordings",
//         "Priority scheduling",
//       ],
//     },
//     {
//       id: "pro_monthly",
//       name: "Pro",
//       price: 99,
//       credits: "200 credits",
//       description: "For serious learners",
//       features: [
//         "Unlimited sessions",
//         "Dedicated tutor",
//         "Custom study plan",
//         "Exam coaching",
//         "24/7 booking",
//       ],
//       popular: true,
//     },
//   ],
//   yearly: [
//     {
//       id: "standard_yearly",
//       name: "Standard",
//       price: 290,
//       credits: "50 credits / month",
//       description: "Save 20% yearly",
//       features: [
//         "4-8 live sessions",
//         "Choose tutors",
//         "Personalized learning",
//         "Session recordings",
//         "Priority scheduling",
//       ],
//     },
//     {
//       id: "pro_yearly",
//       name: "Pro",
//       price: 990,
//       credits: "200 credits / month",
//       description: "Best value",
//       features: [
//         "Unlimited sessions",
//         "Dedicated tutor",
//         "Custom study plan",
//         "Exam coaching",
//         "24/7 booking",
//       ],
//       popular: true,
//     },
//   ],
// };

// export default function PricingPremium() {
//   const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
//   const [selected, setSelected] = useState<string | null>(null);
//   const [isPending, startTransition] = useTransition();

//   const currentPlans = plans[billing];
//   const selectedPlan = currentPlans.find((p) => p.id === selected);

//   const handleSubscribe = () => {
//     if (!selected) return;
//     startTransition(async () => {
//       await enrollInCreditsAction(selected);
//     });
//   };

//   return (
//     <div className="relative min-h-screen bg-background text-white overflow-hidden px-6 py-0">
//       {/* BACKGROUND GLOW */}
//       <div className="absolute inset-0 -z-10">
//         <div className="absolute w-125 h-125 bg-indigo-600/30 blur-[120px] rounded-full -top-25 -left-25" />
//         <div className="absolute w-125 h-125 bg-purple-600/20 blur-[120px] rounded-full -bottom-25 -right-25" />
//       </div>

//       <div className="max-w-5xl mx-auto text-center mb-12">
//         {/* BILLING TOGGLE */}
//         <div className="mt-8 inline-flex bg-white/5 border border-white/10 rounded-full p-1">
//           {["monthly", "yearly"].map((type) => (
//             <button
//               key={type}
//               onClick={() => {
//                 setBilling(type as any);
//                 setSelected(null);
//               }}
//               className={`px-5 py-2 rounded-full text-sm capitalize transition ${
//                 billing === type
//                   ? "bg-white text-black font-medium"
//                   : "text-slate-400 hover:text-white"
//               }`}
//             >
//               {type}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* PLANS */}
//       <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
//         {currentPlans.map((plan) => {
//           const isSelected = selected === plan.id;

//           return (
//             <motion.div
//               key={plan.id}
//               layout
//               onClick={() => setSelected(plan.id)}
//               whileHover={{ scale: 1.04 }}
//               whileTap={{ scale: 0.98 }}
//               className={`relative cursor-pointer rounded-3xl p-px transition-all duration-500
//                 ${
//                   isSelected
//                     ? "bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500"
//                     : "bg-white/10"
//                 }`}
//             >
//               <div className="rounded-3xl bg-[#0a0a0f]/90 backdrop-blur-xl p-6 h-full">
//                 {/* POPULAR BADGE */}
//                 {plan.popular && (
//                   <div className="absolute top-4 right-4 text-xs bg-indigo-500 px-3 py-1 rounded-full">
//                     Most Popular
//                   </div>
//                 )}

//                 <h2 className="text-2xl font-semibold">{plan.name}</h2>
//                 <p className="text-slate-400 text-sm">{plan.description}</p>

//                 <div className="mt-5">
//                   <span className="text-4xl font-bold">${plan.price}</span>
//                   <span className="text-slate-400 text-sm">
//                     /{billing === "monthly" ? "mo" : "yr"}
//                   </span>
//                 </div>

//                 <div className="text-indigo-300 text-sm mt-2">
//                   {plan.credits}
//                 </div>

//                 {/* FEATURES (animated reveal) */}
//                 <AnimatePresence>
//                   {isSelected && (
//                     <motion.ul
//                       initial={{ opacity: 0, height: 0 }}
//                       animate={{ opacity: 1, height: "auto" }}
//                       exit={{ opacity: 0, height: 0 }}
//                       className="mt-6 space-y-3 overflow-hidden"
//                     >
//                       {plan.features.map((f, i) => (
//                         <motion.li
//                           key={i}
//                           initial={{ opacity: 0, x: -10 }}
//                           animate={{ opacity: 1, x: 0 }}
//                           transition={{ delay: i * 0.05 }}
//                           className="flex gap-2 text-sm text-slate-200"
//                         >
//                           <Check className="w-4 h-4 text-emerald-400 mt-1" />
//                           {f}
//                         </motion.li>
//                       ))}
//                     </motion.ul>
//                   )}
//                 </AnimatePresence>
//               </div>
//             </motion.div>
//           );
//         })}
//       </div>

//       {/* CTA */}
//       <AnimatePresence>
//         {selectedPlan && (
//           <motion.div
//             initial={{ opacity: 0, y: 30 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: 30 }}
//             className="max-w-md mx-auto mt-14 text-center"
//           >
//             <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
//               <h3 className="text-lg font-semibold">
//                 {selectedPlan.name} Plan
//               </h3>
//               <p className="text-slate-400 text-sm">
//                 ${selectedPlan.price} /{" "}
//                 {billing === "monthly" ? "month" : "year"}
//               </p>

//               <motion.button
//                 whileHover={{ scale: 1.05 }}
//                 whileTap={{ scale: 0.97 }}
//                 onClick={handleSubscribe}
//                 disabled={isPending}
//                 className="mt-6 w-full py-3 rounded-xl font-medium
//                 bg-linear-to-r from-indigo-500 to-purple-600
//                 hover:opacity-90 transition-all shadow-lg shadow-indigo-500/30"
//               >
//                 {isPending ? "Processing..." : "Subscribe Now"}
//               </motion.button>
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }

// "use client";

// import { useState, useTransition } from "react";
// import { motion } from "framer-motion";
// import { Check } from "lucide-react";
// import { enrollInCreditsAction } from "../actions/enroll-in-credits";

// const plans = [
//   {
//     id: "standard_monthly",
//     name: "Standard",
//     price: "$29",
//     description: "Best for consistent learners",
//     credits: "50 credits / month",
//     features: [
//       "4-8 live sessions per month",
//       "Choose your preferred tutors",
//       "Personalized learning path",
//       "Homework help & problem-solving support",
//       "Session recordings",
//       "Priority scheduling",
//       "Progress tracking",
//       "Email/chat support",
//     ],
//   },
//   {
//     id: "pro_monthly",
//     name: "Pro",
//     price: "$99",
//     description: "For serious learners",
//     credits: "200 credits / month",
//     features: [
//       "Unlimited/high-frequency sessions",
//       "Dedicated personal tutor",
//       "Custom study plan",
//       "Exam prep coaching",
//       "24/7 booking access",
//       "Performance analytics",
//       "Direct tutor messaging",
//       "Fast-track mastery",
//     ],
//   },
// ];

// export default function PricingPage() {
//   const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
//   const [isPending, startTransition] = useTransition();

//   const selected = plans.find((p) => p.id === selectedPlan);

//   const handleSubscribe = () => {
//     if (!selectedPlan) return;

//     startTransition(async () => {
//       await enrollInCreditsAction(selectedPlan);
//     });
//   };

//   return (
//     <div className="min-h-screen bg-background text-white px-6 py-16">
//       {/* PLAN SELECTOR */}
//       <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
//         {plans.map((plan) => {
//           const isSelected = selectedPlan === plan.id;

//           return (
//             <motion.div
//               key={plan.id}
//               onClick={() => setSelectedPlan(plan.id)}
//               whileHover={{ scale: 1.03 }}
//               className={`cursor-pointer rounded-2xl p-6 border transition-all duration-300
//                 ${
//                   isSelected
//                     ? "border-indigo-500 bg-white/10 shadow-2xl"
//                     : "border-white/10 bg-white/5 hover:bg-white/10"
//                 }`}
//             >
//               <h2 className="text-2xl font-semibold">{plan.name}</h2>
//               <p className="text-slate-400 text-sm">{plan.description}</p>

//               <div className="mt-4">
//                 <div className="text-3xl font-bold">{plan.price}</div>
//                 <div className="text-slate-400 text-sm">{plan.credits}</div>
//               </div>

//               {isSelected && (
//                 <div className="mt-6 border-t border-white/10 pt-6">
//                   <ul className="space-y-3 text-left">
//                     {plan.features.map((f, i) => (
//                       <li key={i} className="flex gap-2 text-sm text-slate-200">
//                         <Check className="w-4 h-4 text-emerald-400 mt-1" />
//                         {f}
//                       </li>
//                     ))}
//                   </ul>
//                 </div>
//               )}
//             </motion.div>
//           );
//         })}
//       </div>

//       {/* SUBSCRIBE SECTION */}
//       {selected && (
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="max-w-xl mx-auto mt-12 text-center"
//         >
//           <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
//             <h3 className="text-xl font-semibold">
//               You selected: {selected.name}
//             </h3>
//             <p className="text-slate-400 text-sm mt-1">
//               {selected.price} • {selected.credits}
//             </p>

//             <button
//               onClick={handleSubscribe}
//               disabled={isPending}
//               className="mt-6 w-full py-3 rounded-xl font-medium bg-indigo-600 hover:bg-indigo-700 transition"
//             >
//               {isPending ? "Processing..." : "Subscribe Now"}
//             </button>
//           </div>
//         </motion.div>
//       )}
//     </div>
//   );
// }
