"use client";

import React, { useRef } from "react";
import {
  Video,
  Calendar,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
  Star,
} from "lucide-react";
import Link from "next/link";

export default function SessionPage() {
  const videoRef = useRef(null);

  const steps = [
    {
      title: "Book Your Session",
      desc: "Choose a convenient time and topic that fits your learning goals.",
      icon: <Calendar className="w-5 h-5 text-emerald-400" />,
    },
    {
      title: "Booking Confirmation",
      desc: "Receive instant confirmation and reminders for your scheduled session.",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
    },
    {
      title: "Join Live Video",
      desc: "Access your private video session with a single click from any device.",
      icon: <Video className="w-5 h-5 text-emerald-400" />,
    },
    {
      title: "Interactive Setup",
      desc: "Get ready with shared tools, whiteboard, and real-time collaboration.",
      icon: <MessageSquare className="w-5 h-5 text-emerald-400" />,
    },
    {
      title: "Guided Problem Solving",
      desc: "Work through concepts step-by-step with real-time tutor guidance.",
      icon: <MessageSquare className="w-5 h-5 text-emerald-400" />,
    },
    {
      title: "Instant Feedback",
      desc: "Receive immediate corrections and explanations as you learn.",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
    },
    {
      title: "Session Summary",
      desc: "Get clear notes and key takeaways after each completed session.",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
    },
    {
      title: "Practice & Next Steps",
      desc: "Continue learning with personalized exercises and improvement tips.",
      icon: <Star className="w-5 h-5 text-emerald-400" />,
    },
  ];

  const testimonials = [
    {
      name: "Ama K.",
      text: "I finally understand calculus after just a few sessions. Very clear teaching style.",
    },
    {
      name: "John M.",
      text: "The sessions are interactive and really helped me improve my grades fast.",
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-[#050705] via-[#07130f] to-[#020604] text-white p-6 md:p-20 font-sans">
      <div className="max-w-7xl mx-auto px-12">
        {/* HEADER */}
        <div className="text-center space-y-5 mb-14">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Live Sessions <br />
            <span className="text-emerald-400">Made Simple & Professional</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Personalized one-on-one tutoring sessions designed to help you
            master concepts, solve problems confidently, and achieve academic
            excellence.
          </p>
        </div>

        {/* OUTER FRAME */}
        <div className="relative rounded-md border border-emerald-500/20 bg-white/5 backdrop-blur-2xl p-6 md:p-10 shadow-2xl">
          {/* decorative corners */}
          <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-emerald-400 rounded-tl-md" />
          <div className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-emerald-400 rounded-tr-md" />
          <div className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-emerald-400 rounded-bl-md" />
          <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-emerald-400 rounded-br-md" />

          {/* CONTENT GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-7 space-y-10">
              {/* STEPS */}
              <div className="grid md:grid-cols-2 gap-5">
                {steps.map((step, i) => (
                  <div
                    key={i}
                    className="backdrop-blur-xl bg-black/20 border border-emerald-500/10 rounded-md p-6 flex gap-4 hover:border-emerald-400/40 transition-all"
                  >
                    <div className="bg-emerald-500/10 p-3 rounded-xl h-fit">
                      {step.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{step.title}</h3>
                      <p className="text-sm text-gray-400">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* TESTIMONIALS */}
              <div className="space-y-5">
                <h2 className="text-xl font-semibold text-white">
                  Student Results
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {testimonials.map((t, i) => (
                    <div
                      key={i}
                      className="backdrop-blur-xl bg-black/20 border border-emerald-500/10 rounded-md p-5"
                    >
                      <div className="flex gap-1 mb-2 text-emerald-400">
                        <Star className="w-4 h-4" />
                        <Star className="w-4 h-4" />
                        <Star className="w-4 h-4" />
                        <Star className="w-4 h-4" />
                        <Star className="w-4 h-4" />
                      </div>
                      <p className="text-sm text-gray-300 mb-3">
                        &quot;{t.text}&quot;
                      </p>
                      <p className="text-xs text-gray-500">— {t.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN VIDEO */}
            <div className="lg:col-span-5 lg:sticky lg:top-20">
              <div className="relative rounded-md overflow-hidden border border-emerald-500/20 shadow-2xl bg-black/30 backdrop-blur-xl">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  poster="https://images.unsplash.com/photo-1523240795612-9a054b0db644"
                  src="/session-demo.mp4"
                />

                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />

                <div className="absolute bottom-0 p-6 space-y-2">
                  <h3 className="text-xl font-semibold">
                    Live Session Preview
                  </h3>
                  <p className="text-sm text-gray-300">
                    Experience how professional online tutoring sessions feel.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16">
          <div className="rounded-md border border-emerald-500/20 bg-linear-to-r from-emerald-500/10 via-black/30 to-emerald-500/10 backdrop-blur-2xl p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold">
                Start Your Learning Journey
              </h2>
              <p className="text-gray-300 max-w-xl">
                Book your first session today and experience structured,
                high-quality tutoring designed for real results.
              </p>
            </div>

            <Link
              href="/educators"
              className="bg-[#857938] hover:bg-[#8d7e28] text-white font-semibold px-8 py-3 rounded-md flex items-center gap-2 transition-all"
            >
              Book Session <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
