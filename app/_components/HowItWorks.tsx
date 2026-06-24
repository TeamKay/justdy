import Link from "next/link";
import React from "react";

const cards = [
  {
    title: "Our Program",
    tag: "Explore Now",
    link: "/programs",
    tagColor: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    description:
      "Discover our comprehensive educational framework designed to build core competencies. From foundational concepts to mastery, explore structured curriculums that set you up for long-term academic success.",
    glow: "bg-blue-500/20",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
      >
        {/* Graduation cap / Academy icon */}
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.26 10.147L12 14.28l7.74-4.133a1 1 0 000-1.753L12 4.26 4.26 8.394a1 1 0 000 1.753z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.25 12.5v4.618a1 1 0 01-.553.894L12 21.75l-7.697-4.238a1 1 0 01-.553-.894V12.5"
        />
      </svg>
    ),
  },
  {
    title: "Our Approach",
    tag: "How It Works",
    link: "/ourapproach",
    tagColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    description:
      "We pair proven pedagogical frameworks with hands-on, interactive execution. By focusing on critical thinking, targeted feedback, and continuous progress tracking, we transform how students internalize knowledge.",
    glow: "bg-emerald-500/20",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
      >
        {/* Strategy / Pathway icon */}
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    title: "AI Smart Tutoring",
    tag: "24/7 Support",
    link: "/aitutor",
    tagColor: "text-orange-400 bg-orange-400/10 border-orange-400/20",
    description:
      "Experience deeply hyper-personalized guidance with our advanced AI tutor. Get instant concept breakdowns, step-by-step problem-solving hints, and adaptive drills tailored dynamically to your real-time learning pace.",
    glow: "bg-orange-500/20",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
      >
        {/* Chip / Spark / AI icon */}
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.813 15.904L9 21l8.982-11.795H14.19C15.42 6.578 17.513 3 17.513 3L8.529 14.795h5.454L9.813 15.904z"
        />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-background py-0 px-0 mb-40">
      <div className="max-w-7xl mx-auto px-12">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-semibold text-white mb-4 tracking-tight">
            How we serve you!
          </h2>
          <p className="text-neutral-400 text-base max-w-2xl mx-auto">
            Discover a modern ecosystem built around structured learning,
            optimized pedagogy, and next-generation intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card, i) => (
            <div
              key={i}
              className="group relative bg-neutral-900/40 border border-neutral-800 rounded-md p-8 overflow-hidden 
                         transition-all duration-500 ease-out
                         hover:border-neutral-700 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]"
            >
              {/* Animated Texture Overlay */}
              <div className="absolute inset-0 bg-grid-lines opacity-20 transition-opacity duration-500 group-hover:opacity-40 pointer-events-none" />

              {/* Dynamic Glow Effect */}
              <div
                className={`absolute -top-24 -left-24 w-64 h-64 ${card.glow} blur-[80px] rounded-md 
                               transition-all duration-700 ease-in-out
                               group-hover:scale-150 group-hover:translate-x-12 group-hover:translate-y-12 opacity-50 group-hover:opacity-100 pointer-events-none`}
              />

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-10">
                  {/* Icon with scaling effect */}
                  <div className="bg-neutral-800 p-2.5 rounded-md border border-neutral-700 text-white transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                    {card.icon}
                  </div>
                  <span
                    className={`text-[10px] tracking-widest font-bold px-3 py-1 rounded-md border transition-colors duration-300 ${card.tagColor}`}
                  >
                    {card.tag}
                  </span>
                </div>

                <h3 className="text-xl font-semibold text-white mb-3 transition-colors duration-300 group-hover:text-neutral-100">
                  {card.title}
                </h3>
                <p className="text-neutral-400 text-sm leading-relaxed mb-8 transition-colors duration-300 group-hover:text-neutral-300">
                  {card.description}
                </p>

                <Link
                  href={card.link}
                  className="inline-flex items-center gap-2 text-sm font-medium text-white  bg-neutral-800 border border-neutral-700 px-4 py-2 rounded-md transition-all duration-300 hover:bg-neutral-700 hover:border-neutral-600"
                >
                  Learn More →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
