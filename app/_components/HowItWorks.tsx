import Link from "next/link";
import React from "react";

const cards = [
  {
    title: "Private Learning Studio",
    tag: "Available now",
    link: "/session",
    tagColor: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    description:
      "Engage in real-time, one-on-one or group video sessions with expert tutors. Get instant feedback, ask questions freely, and experience personalized learning that adapts to your pace.",

    glow: "bg-blue-500/20",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 14l9-5-9-5-9 5 9 5z" />
        <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
      </svg>
    ),
  },
  {
    title: "Guided Learning Paths",
    tag: "Coming soon",
    link: "/courses",
    tagColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    description:
      "Explore structured, hands-on courses designed to make learning engaging and effective. Practice with interactive exercises, track your progress, and master concepts step by step.",
    glow: "bg-emerald-500/20",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
    ),
  },
  {
    title: "Intelligent Tutor",
    tag: "Coming soon",
    link: "/aitutor",
    tagColor: "text-orange-400 bg-orange-400/10 border-orange-400/20",
    description:
      "Learn anytime with your intelligent AI tutor. Get instant explanations, guided problem-solving, and adaptive support tailored to your unique learning style—24/7.",
    glow: "bg-orange-500/20",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
        />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-background mt-5 mb-30 px-6">
      <div className="max-w-7xl mx-auto px-8">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-semibold text-white mb-4 tracking-tight">
            How we serve you!
          </h2>
          <p className="text-neutral-400 text-base max-w-2xl mx-auto">
            We bridge the gap between connecting you with expert tutors.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card, i) => (
            <div
              key={i}
              className="group relative bg-neutral-900/40 border border-neutral-800 rounded-2xl p-8 overflow-hidden 
                         transition-all duration-500 ease-out
                         hover:border-neutral-700 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]"
            >
              {/* Animated Texture Overlay */}
              <div className="absolute inset-0 bg-grid-lines opacity-20 transition-opacity duration-500 group-hover:opacity-40 pointer-events-none" />

              {/* Dynamic Glow Effect */}
              <div
                className={`absolute -top-24 -left-24 w-64 h-64 ${card.glow} blur-[80px] rounded-full 
                               transition-all duration-700 ease-in-out
                               group-hover:scale-150 group-hover:translate-x-12 group-hover:translate-y-12 opacity-50 group-hover:opacity-100 pointer-events-none`}
              />

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-10">
                  {/* Icon with scaling effect */}
                  <div className="bg-neutral-800 p-2.5 rounded-lg border border-neutral-700 text-white transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                    {card.icon}
                  </div>
                  <span
                    className={`text-[10px] tracking-widest font-bold px-3 py-1 rounded-full border transition-colors duration-300 ${card.tagColor}`}
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
                  className="inline-flex items-center gap-2 text-sm font-medium text-white  bg-neutral-800 border border-neutral-700 px-4 py-2 rounded-lg transition-all duration-300 hover:bg-neutral-700 hover:border-neutral-600"
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
