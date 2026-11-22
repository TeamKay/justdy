
const testimonials = [
  {
    quote:
      "Justdy makes mathematics easier to understand. I can ask questions, get guidance, and learn at my own pace.",
    name: "Ama O.",
    role: "Student",
    initials: "AO",
    color: "bg-[#E5F3EF] text-[#147D72]",
  },
  {
    quote:
      "I used to struggle with difficult math problems. Having a place where I can get help and practice has made learning more enjoyable.",
    name: "Michael K.",
    role: "Student",
    initials: "MK",
    color: "bg-[#F1EAF8] text-[#76529A]",
  },
  {
    quote:
      "Justdy brings learning and support together. It is a wonderful way for learners to build confidence and become better problem solvers.",
    name: "Sarah A.",
    role: "Parent",
    initials: "SA",
    color: "bg-[#FFF1E5] text-[#C47735]",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="relative overflow-hidden bg-[#fbfefb] px-5 py-20 sm:px-8 lg:py-28">
      {/* Decorative background elements */}
      <div className="pointer-events-none absolute -left-24 top-20 h-64 w-64 rounded-full bg-[#147D72]/[0.04] blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-64 w-64 rounded-full bg-[#76529A]/[0.05] blur-3xl" />

      <div className="relative mx-auto max-w-6xl">
        {/* Section heading */}
        <div className="mx-auto max-w-2xl text-center">
          
           <h2 className="font-chalkduster mt-4 text-3xl font-bold tracking-tight text-[#302044] sm:text-4xl lg:text-5xl">
               Learning is better when{" "}
                <span className="relative inline-block bg-linear-to-r from-[#55984A] via-[#70A94D] to-[#E89A42] bg-clip-text text-transparent">
                  we grow together.
                </span>
              </h2>

          <p className="mt-5 text-base leading-7 text-[#51465D]/75 sm:text-lg">
            Every learning journey is different. Discover what learners and
            families value about having the right support along the way.
          </p>
        </div>

        {/* Testimonial cards */}
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((item, index) => (
            <article
              key={item.name}
              className={`group relative flex h-full flex-col rounded-lg border border-[#E9EDE9] bg-white p-7 shadow-[0_8px_30px_rgba(48,32,68,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(48,32,68,0.09)] sm:p-8 ${
                index === 1 ? "lg:translate-y-5" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex gap-1 text-[#E5A84B]">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path d="M10 1.8l2.45 5.05 5.57.81-4.01 3.91.95 5.52L10 14.48l-4.96 2.61.95-5.52-4.01-3.91 5.57-.81L10 1.8z" />
                    </svg>
                  ))}
                </div>

                <span className="text-4xl font-serif leading-none text-[#147D72]/20">
                  “
                </span>
              </div>

              <blockquote className="mt-5 flex-1 text-[15px] leading-7 text-[#51465D]">
                “{item.quote}”
              </blockquote>

              <div className="mt-8 border-t border-[#F0F1EE] pt-6">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${item.color}`}
                  >
                    {item.initials}
                  </div>

                  <div>
                    <p className="text-sm font-bold text-[#302044]">
                      {item.name}
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-[#51465D]/60">
                      {item.role}
                    </p>
                  </div>

                  <div className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-[#EAF5F1] text-[#147D72]">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 12.5l4 4L19 6.5"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Closing statement */}
        <div className="mt-16 text-center lg:mt-20">
          <p className="text-sm font-medium text-[#51465D]/70">
            Every question is an opportunity to learn something new.
          </p>
          <p className="mt-2 text-sm font-bold text-[#147D72]">
            That is the Justdy way.
          </p>
        </div>
      </div>
    </section>
  );
}
