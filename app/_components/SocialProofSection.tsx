import { Star } from "lucide-react";

export default function SocialProofSection() {
  return (
    <section className="w-full bg-slate-50/60 border-y border-slate-200/80 py-16 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-16">
        {/* ================= 1. METRICS STATS BAR ================= */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/70 shadow-sm text-center">
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-2xl sm:text-3xl font-extrabold text-slate-900">
              <span>12,000+</span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-500">
              Active Learners
            </p>
          </div>

          <div className="space-y-1 border-l border-slate-100 pl-4 sm:pl-0 sm:border-l-0">
            <div className="flex items-center justify-center gap-1 text-2xl sm:text-3xl font-extrabold text-slate-900">
              <span>4.9</span>
              <Star className="w-5 h-5 fill-amber-400 text-amber-400 inline-block mb-1" />
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-500">
              Average Rating (2.4k+ Reviews)
            </p>
          </div>

          <div className="space-y-1 border-t sm:border-t-0 border-slate-100 pt-4 sm:pt-0">
            <div className="flex items-center justify-center gap-1.5 text-2xl sm:text-3xl font-extrabold text-slate-900">
              <span>45,000+</span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-500">
              Resources Downloaded
            </p>
          </div>

          <div className="space-y-1 border-l border-t sm:border-t-0 border-slate-100 pl-4 sm:pl-0 pt-4 sm:pt-0">
            <div className="flex items-center justify-center gap-1.5 text-2xl sm:text-3xl font-extrabold text-slate-900">
              <span>1,800+</span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-500">
              1-on-1 Sessions Completed
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
