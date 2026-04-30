import Link from "next/link";

export default function CTASection() {
  return (
    <section className="bg-background py-20 flex justify-center items-center">
      <div className="relative max-w-4xl w-full px-8 py-16 rounded-2xl border border-white/10 bg-linear-to-b from-zinc-900 to-black text-center">

        {/* Decorative corner borders */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Top left */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-white/30"></div>
          {/* Top right */}
          <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-white/30"></div>
          {/* Bottom left */}
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-white/30"></div>
          {/* Bottom right */}
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-white/30"></div>
        </div>

        {/* Content */}
        <h2 className="text-3xl md:text-3xl font-semibold text-white tracking-tight">
          Ready to Build Something Great?
        </h2>

        <p className="mt-4 text-gray-400 text-base md:text-base max-w-2xl mx-auto">
          Join the waitlist for early access to the SaaS Starter Kit, or start
          learning with our free tutorials today.
        </p>

        {/* Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          
          {/* Free Tutorials Button */}
          <Link
            href="/courses"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-zinc-800 text-gray-200 hover:bg-zinc-700 transition"
          >
            <span className="w-5 h-5 flex items-center justify-center border border-gray-400 rounded-full text-xs">
              ▶
            </span>
            Free Courses
          </Link>

          {/* Join Waitlist Button */}
         <Link
            href="/signup"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-sm bg-[#857938] text-white hover:bg-[#857938] transition font-medium"
          >
            Get Started
            <span>→</span>
          </Link>

        </div>
      </div>
    </section>
  );
}