"use client";

import Image from "next/image";

const testimonials = [
  {
    id: 1,
    name: "Sarah W.",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
    content:
      "Coursera's reputation for high-quality content, paired with its flexible structure, made it possible for me to dive into data analytics while managing family, health, and everyday life.",
  },
  {
    id: 2,
    name: "Noeris B.",
    avatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200",
    content:
      "Coursera rebuilt my confidence and showed me I could dream bigger. It wasn't just about gaining knowledge—it was about believing in my potential again.",
  },
  {
    id: 3,
    name: "Abdullahi M.",
    avatar:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200",
    content:
      "I now feel more prepared to take on leadership roles and have already started mentoring some of my colleagues.",
  },
  {
    id: 4,
    name: "Anas A.",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
    content:
      "Learning with Coursera has expanded my professional expertise by giving me access to cutting-edge research, practical tools, and global perspectives.",
  },
];

export default function Testimonials() {
  return (
    <section className="py-12 bg-background">
      <div className="max-w-8xl mx-auto px-6  sm:px-6 md:px-28 lg:px-28">
        {/* Section Header */}
        <h2 className="text-xl sm:text-xl font-semibold tracking-tight text-blue-500 mb-3">
          Why people choose Justdy
        </h2>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="bg-emerald-900/20 rounded-md p-6 flex flex-col justify-start space-y-4"
            >
              {/* Profile Section */}
              <div className="flex items-center gap-3.5">
                <div className="relative w-12 h-12 shrink-0 rounded-full overflow-hidden bg-gray-100">
                  <Image
                    src={t.avatar}
                    alt={t.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <h3 className="font-bold text-blue-800 text-sm tracking-tight">
                  {t.name}
                </h3>
              </div>

              {/* Quote Content */}
              <p className="text-gray-800 text-sm leading-relaxed font-normal">
                &quot;{t.content}&quot;
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
