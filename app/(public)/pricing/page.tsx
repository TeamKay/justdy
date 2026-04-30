import { CreditCard } from "lucide-react";

export default function Pricing() {
  return (
    <div className="min-h-screen bg-background p-8 font-sans">
      <div className="max-w-4xl mx-auto text-center mb-16">
        {/* Badge Decorator */}
        <span className="inline-block px-4 py-1.5 mb-6 text-xs font-bold tracking-widest text-primary uppercase bg-primary/10 rounded-full">
          Fuel Your Learning
        </span>

        {/* Main Catchy Title */}
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight leading-tight">
          Invest in your{" "}
          <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-emerald-400">
            breakthrough.
          </span>
        </h2>

        {/* Clear, Step-by-Step Subtitle */}
        <div className="space-y-4">
          <p className="text-lg text-neutral-300 max-w-2xl mx-auto leading-relaxed">
            Grab a credit bundle to unlock instant, 1-on-1 access to expert
            instructors. No subscriptions, no stress—just pure progress.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-sm text-neutral-500 font-medium">
            <span className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-neutral-800 text-white text-[10px]">
                1
              </span>
              Pick a bundle
            </span>
            <div className="hidden md:block w-8 h-px bg-neutral-800" />
            <span className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-neutral-800 text-white text-[10px]">
                2
              </span>
              Top up your credits
            </span>
            <div className="hidden md:block w-8 h-px bg-neutral-800" />
            <span className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-neutral-800 text-white text-[10px]">
                3
              </span>
              Book your session
            </span>
          </div>
        </div>
      </div>

      {/* The Pricing Card component remains untouched */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <CreditCard />
      </div>
    </div>
  );
}
