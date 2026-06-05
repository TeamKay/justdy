"use client";

import { useState, useTransition } from "react";
import { X, Sparkles, ShieldCheck, Users } from "lucide-react";
import JoinCommunityButton from "@/app/_components/JoinCommunityButton";
import { joinCommunity } from "../actions/admin-communities";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface CommunityJoinClientProps {
  slug: string;
  price: number;
  name: string;
  description: string;
  stats?: { label: string; value: string }[];
}

export default function CommunityJoinClient({
  slug,
  price,
  name,
  description,
}: CommunityJoinClientProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="p-3 pt-0">
      {/* CTA */}
      <JoinCommunityButton
        slug={slug}
        price={price}
        onOpenModal={() => setOpen(true)}
      />

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-900/10 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-md border border-zinc-800 bg-zinc-950 shadow-[0_0_60px_rgba(0,0,0,0.6)]">
            {/* Close */}
            <button
              onClick={() => setOpen(false)}
              className="absolute right-5 top-5 z-20 flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="grid md:grid-cols-2">
              {/* LEFT SIDE */}
              <div className="relative overflow-hidden bg-emerald-900/30 p-8 text-white">
                {/* Decorative */}
                <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute bottom-0 right-0 h-52 w-52 rounded-full bg-black/10 blur-3xl" />

                <div className="relative z-10 flex h-full flex-col justify-between">
                  <div>
                    <div className="mb-6 inline-flex items-center gap-2 rounded-md bg-white/15 px-4 py-1.5 text-xs font-semibold backdrop-blur-sm">
                      <Sparkles className="h-4 w-4" />
                      {price === 0
                        ? "Free Community Access"
                        : "Premium Membership"}
                    </div>

                    <h2 className="text-2xl font-black leading-tight tracking-tight">
                      Join <br /> {name}
                    </h2>

                    <p className="mt-5 max-w-md text-sm leading-relaxed text-emerald-50/90">
                      {description ||
                        "Connect with ambitious learners, access premium educational resources, and grow with a thriving community."}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mt-10 rounded-md border border-white/20 bg-white/10 p-5 backdrop-blur-md">
                    <p className="text-xs tracking-[0.2em] text-emerald-100">
                      Membership Price
                    </p>

                    <div className="mt-2 flex items-end gap-2">
                      <span className="text-5xl font-black">
                        {price === 0 ? "FREE" : `$${price}`}
                      </span>

                      {price !== 0 && (
                        <span className="pb-1 text-sm text-emerald-100">
                          /month
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT SIDE */}
              <div className="flex flex-col justify-between bg-zinc-950 p-8 text-white">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
                    What&apos;s Included
                  </p>

                  <div className="mt-8 space-y-5">
                    <div className="flex gap-4 rounded-md border border-white/5 bg-white/3 p-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-400">
                        <Users className="h-6 w-6" />
                      </div>

                      <div>
                        <h3 className="font-semibold text-white">
                          Private Community Access
                        </h3>

                        <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                          Join exclusive channels, discussions, and networking
                          groups.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4 rounded-md border border-white/5 bg-white/3 p-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-400">
                        <Sparkles className="h-6 w-6" />
                      </div>

                      <div>
                        <h3 className="font-semibold text-white">
                          Premium Learning Resources
                        </h3>

                        <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                          Access workshops, recordings, downloads, and expert
                          insights.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4 rounded-md border border-white/5 bg-white/3 p-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-400">
                        <ShieldCheck className="h-6 w-6" />
                      </div>

                      <div>
                        <h3 className="font-semibold text-white">
                          Flexible Membership
                        </h3>

                        <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                          Upgrade, pause, or cancel your membership anytime.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-10 flex gap-3">
                  <button
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-5 py-4 text-sm font-semibold text-zinc-300 transition hover:border-zinc-500 hover:text-white"
                  >
                    Maybe Later
                  </button>

                  <button
                    disabled={isPending}
                    onClick={() => {
                      startTransition(async () => {
                        try {
                          const result = await joinCommunity(slug);

                          if (!result.success) {
                            toast.error(result.message);
                            return;
                          }

                          // Already exists
                          if (result.alreadyJoined) {
                            toast.info(result.message);

                            setTimeout(() => {
                              return;
                            }, 1000);

                            return;
                          }

                          // Success
                          toast.success(result.message);

                          setTimeout(() => {
                            router.push("/learner");
                          }, 1200);
                        } catch (error) {
                          console.error(error);

                          toast.error("Something went wrong");
                        }
                      });
                    }}
                    className="flex-1 rounded-md bg-emerald-500 px-5 py-4 text-sm font-bold text-white transition hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50"
                  >
                    {isPending ? "Joining..." : "Confirm & Join"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
