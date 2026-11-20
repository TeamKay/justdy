
export default function StatsSection() {
  const statistics = [
    {
      label: "Active Learners",
      value: "20K+",
    },
    {
      label: "Verified Tutors",
      value: "1K+",
    },
    {
      label: "Interactive Video Lessons",
      value: "50K+",
    },
    {
      label: "Guided Learning Projects",
      value: "15K+",
    },
  ];

  return (
    <section
      id="platform-stats"
      className="relative overflow-hidden bg-white px-5 py-10 sm:px-12"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-12">

        {/* Section heading */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-lg bg-[#F0F7ED] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#55984A]">
            <span className="h-2 w-2 rounded-full bg-[#55984A]" />
            The Justdy Community
          </span>
        </div>

        {/* Statistics strip */}
        <div className="mx-auto mt-5 max-w-6xl border-y border-[#55984A]/20">
          <div className="grid grid-cols-2 sm:grid-cols-4">

            {statistics.map((stat, index) => (
              <div
                key={stat.label}
                className={`
                  flex flex-col items-center justify-center
                  px-3 py-8 text-center sm:px-5 sm:py-10
                  ${index % 2 === 0 ? "border-r border-[#55984A]/20" : ""}
                  ${index < 2 ? "border-b border-[#55984A]/20 sm:border-b-0" : ""}
                  ${index < 3 ? "sm:border-r sm:border-[#55984A]/20" : ""}
                `}
              >
                <h3 className="text-3xl font-bold tracking-tight text-[#55984A] sm:text-4xl lg:text-5xl">
                  {stat.value}
                </h3>

                <p className="mt-3 max-w-45 text-xs font-medium leading-5 text-gray-500 sm:text-sm">
                  {stat.label}
                </p>
              </div>
            ))}

          </div>
        </div>

      </div>
    </section>
  );
}
