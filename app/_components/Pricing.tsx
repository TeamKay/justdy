"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

const plans = [
  {
    id: "free_credit",
    name: "Basic",
    price: "Free",
    description: "Perfect for first-time users",
    credits: "2 free credits",
    highlight: "Getting started",
    features: [
      "1 free live session with an expert tutor",
      "Personalized topic selection",
      "Real-time Q&A during the session",
      "Interactive whiteboard learning",
      "Session summary after class",
      "Flexible scheduling",
      "Access to session recording (limited time)",
      "No commitment required",
    ],
    cta: "Get Started Free",
    popular: false,
  },
  {
    id: "standard_monthly",
    name: "Standard",
    price: "$29",
    description: "Best for consistent learners",
    credits: "50 credits / month",
    highlight: "Most popular",
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
    cta: "Subscribe Standard",
    popular: true,
  },
  {
    id: "pro_monthly",
    name: "Pro",
    price: "$99",
    description: "For serious learners & professionals",
    credits: "200 credits / month",
    highlight: "Maximum value",
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
    cta: "Go Pro",
    popular: false,
  },
];

const benefits = [
  {
    title: "Flat Rate Sessions",
    description: "Every session costs the same regardless of duration.",
    highlight: "2 credits only",
  },
  {
    title: "No Expiration",
    description: "Your credits stay forever until you use them.",
    highlight: "Never expire",
  },
  {
    title: "Monthly Refills",
    description: "Subscriptions renew your credits automatically.",
    highlight: "Fresh credits",
  },
  {
    title: "Total Flexibility",
    description: "Upgrade, downgrade, or cancel anytime.",
    highlight: "No commitment",
  },
];

export default function PricingPage({ currentUserPackageId = null }) {
  return (
    <div className="min-h-screen bg-linear-to-br bg-background text-white px-6 py-0">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-semibold text-white mb-2 tracking-tight">
          Session Pricing
        </h2>
        <p className="text-neutral-400 text-base max-w-2xl mx-auto mb-10">
          Schedule a live session with our expert instructors and get real-time
          help
        </p>
      </div>
      <div className="max-w-7xl mx-auto px-8">
        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, idx) => {
            // LOGIC CHECKS
            const isCurrentPlan = currentUserPackageId === plan.id;

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.15 }}
                className={`relative rounded-2xl border p-6 backdrop-blur-xl shadow-xl transition-all duration-300 hover:scale-[1.03]
                ${
                  plan.popular
                    ? "border-indigo-500 bg-white/10"
                    : "border-white/10 bg-white/5"
                } ${isCurrentPlan ? "ring-2 ring-emerald-500" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 right-4 bg-[#857938] text-xs px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute -top-3 left-4 bg-emerald-600 text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full">
                    Active Plan
                  </div>
                )}

                <div className="mb-4">
                  <h2 className="text-2xl font-semibold">{plan.name}</h2>
                  <p className="text-slate-300 text-sm">{plan.description}</p>
                </div>

                <div className="mb-4">
                  <div className="text-4xl font-bold">{plan.price}</div>
                  <div className="text-slate-400 text-sm mt-1">
                    {plan.credits}
                  </div>
                </div>

                <div className="mb-6 text-indigo-300 text-sm font-medium">
                  {plan.highlight}
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((f, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-slate-200"
                    >
                      <Check className="w-4 h-4 text-green-400 mt-1" />
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        {/* Credits Benefits */}
        <div className="relative bg-background overflow-hidden mt-10">
          {/* Fade edges */}
          <div className="pointer-events-none absolute left-0 top-0 h-full w-16 bg-linear-to-r z-10" />
          <div className="pointer-events-none absolute right-0 top-0 h-full w-16 bg-linear-to-l z-10" />

          {/* Scrolling track */}
          <motion.div
            className="flex w-max items-center"
            animate={{ x: ["0%", "-50%"] }}
            transition={{
              repeat: Infinity,
              duration: 20,
              ease: "linear",
            }}
          >
            {[...benefits, ...benefits].map((item, index) => (
              <div
                key={index}
                className="flex items-center text-sm text-slate-300"
              >
                <div className="flex items-center gap-2 px-4 whitespace-nowrap">
                  <Check className="w-4 h-4 text-emerald-400" />

                  <span className="text-white font-medium">{item.title}</span>
                  <span className="text-slate-400">– {item.description}</span>

                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    {item.highlight}
                  </span>
                </div>

                <span className="mx-2 text-slate-500">•</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
