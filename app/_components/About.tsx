import React from "react";
import Image from "next/image";
import HeroImage from "@/public/images/hero.png";

export default function AboutUs() {
  return (
    <main className="bg-background">
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-12 bg-emerald-900/20 text-white py-20  mt-6 rounded-2xl">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Elevate Your Learning
          </h1>
          <p className="text-lg md:text-xl opacity-90">anytime, anywhere</p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto p-5 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl font-semibold mb-4">Our Story</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We aspire to transform learning into a journey where every
              student—regardless of background, level, or learning gap—discovers
              confidence, clarity, and long-term academic success. We are a
              group of dedicated professional educators with several years of
              teaching experience across different educational systems and
              learner needs. Over the years, we have come to understand that
              every student learns differently. Some need a stronger foundation,
              others need renewed confidence, and many simply need the right
              guidance to unlock their full potential. Our mission is to bridge
              these gaps by providing personalized, high-quality instruction
              that goes beyond memorization. While we have a strong focus on
              mathematics, our approach extends to all core areas of learning,
              helping students build a solid academic foundation that supports
              success across subjects.
            </p>
            <p className="text-gray-600 leading-relaxed">
              We believe that true education is not just about passing exams—it
              is about developing critical thinking, problem-solving skills, and
              a lifelong love for learning. That is why we design our teaching
              to be clear, practical, and engaging, ensuring that every student
              feels supported and empowered at every step. Whether a student is
              struggling to keep up, aiming to excel, or preparing for major
              academic milestones, we are committed to guiding them with
              patience, expertise, and care. Together, we are building more than
              just academic success—we are shaping confident learners ready to
              take on the world.
            </p>
          </div>
          <div className=" rounded-2xl h-120 flex items-center justify-center">
            <span className="text-gray-400">
              <Image
                src={HeroImage}
                alt="Hero"
                className="w-full h-full object-cover"
                priority
              />
            </span>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-6xl mx-auto px-0 bg-emerald-900/20 text-white py-20  mt-6 mb-20 rounded-2xl">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-semibold mb-4">
            Join the Future of Learning
          </h2>
          <p className="mb-6 opacity-90">
            Experience personalized education like never before with TutorMind.
          </p>
          <button className="bg-white text-indigo-600 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition">
            Get Started
          </button>
        </div>
      </section>
    </main>
  );
}
