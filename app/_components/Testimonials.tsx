


"use client"

import { useEffect, useRef } from "react";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Product Manager",
    company: "TechFlow",
    content:
      "This platform completely transformed how our team works. Productivity is up and stress is down.",
  },
  {
    name: "Michael Chen",
    role: "Founder",
    company: "Startly",
    content:
      "The best SaaS tool we've invested in. Clean, powerful, and incredibly easy to use.",
  },
  {
    name: "Amina Yusuf",
    role: "Operations Lead",
    company: "CoreOps",
    content:
      "Automation features saved us hundreds of hours. Highly recommend to any growing business.",
  },
  {
    name: "David Smith",
    role: "CTO",
    company: "DevNest",
    content:
      "Beautiful UI, fast performance, and excellent support. Exactly what we needed.",
  },
];

export default function Testimonials() {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = scrollRef.current as HTMLDivElement | null;
    let scrollAmount = 0;

    const interval = setInterval(() => {
      if (container) {
        scrollAmount += 1;
        container.scrollLeft = scrollAmount;

        if (scrollAmount >= container.scrollWidth / 2) {
          scrollAmount = 0;
        }
      }
    }, 20);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-0">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white">
            Testimonies
          </h2>
          <p className="mt-4 text-muted-foreground text-base">
            See what our users are saying about our platform
          </p>
        </div>

        <div className="relative overflow-hidden">
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-hidden"
          >
            {[...testimonials, ...testimonials].map((t, i) => (
              <div
                key={i}
                className="min-w-[320px] bg-background rounded-2xl shadow-md p-6 border border-b hover:shadow-xl transition-all duration-300"
              >
                <p className="text-gray-700 leading-relaxed mb-6">
                  “{t.content}”
                </p>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-linear-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {t.name.charAt(0)}
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {t.name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {t.role} · {t.company}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Gradient fade edges */}
          <div className="pointer-events-none absolute top-0 left-0 h-full w-24 bg-linear-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute top-0 right-0 h-full w-24 bg-linear-to-l from-background to-transparent" />
        </div>
      </div>
    </section>
  );
}

