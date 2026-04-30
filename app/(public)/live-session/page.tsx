"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { Calendar, User, Mail, BookOpen } from "lucide-react";

export default function BookingPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    date: "",
    time: "",
    plan: "standard",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed");

      setSuccess(true);
    } catch (error) {
      throw new Error("Something went wrong" + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-zinc-950 via-zinc-900 to-black text-white px-6 py-16">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-semibold tracking-tight mb-3">
            Book a Live Math Session
          </h1>
          <p className="text-zinc-400 max-w-xl mx-auto">
            Choose your preferred time, select a plan, and start learning with
            expert tutors.
          </p>
        </div>

        {/* Card */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* LEFT INFO PANEL */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 backdrop-blur">
            <h2 className="text-xl font-medium mb-6">Why Book With Us?</h2>

            <ul className="space-y-4 text-zinc-400 text-sm">
              <li>✔ 1-on-1 live tutoring</li>
              <li>✔ Personalized learning paths</li>
              <li>✔ Flexible scheduling</li>
              <li>✔ Expert math instructors</li>
            </ul>
          </div>

          {/* FORM */}
          <form
            onSubmit={handleSubmit}
            className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8 space-y-6 backdrop-blur-xl shadow-xl"
          >
            {/* Inputs */}
            <div className="space-y-4">
              <div className="relative">
                <User
                  className="absolute left-3 top-3 text-zinc-500"
                  size={18}
                />
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  required
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 rounded-md bg-zinc-800 border border-zinc-700 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="relative">
                <Mail
                  className="absolute left-3 top-3 text-zinc-500"
                  size={18}
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  required
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 rounded-md bg-zinc-800 border border-zinc-700 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="relative">
                <BookOpen
                  className="absolute left-3 top-3 text-zinc-500"
                  size={18}
                />
                <input
                  type="text"
                  name="subject"
                  placeholder="Subject (Algebra, Calculus...)"
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 rounded-md bg-zinc-800 border border-zinc-700 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <Calendar
                  className="absolute left-3 top-3 text-zinc-500"
                  size={18}
                />
                <input
                  type="date"
                  name="date"
                  required
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 rounded-md bg-zinc-800 border border-zinc-700 focus:border-blue-500 outline-none"
                />
              </div>

              <input
                type="time"
                name="time"
                required
                onChange={handleChange}
                className="px-4 py-3 rounded-md bg-zinc-800 border border-zinc-700 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Plans */}
            <div>
              <h3 className="mb-3 text-sm text-zinc-400">Select Plan</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "basic", price: "$10" },
                  { id: "standard", price: "$40" },
                  { id: "premium", price: "$70" },
                ].map((plan) => (
                  <button
                    type="button"
                    key={plan.id}
                    onClick={() => setForm({ ...form, plan: plan.id })}
                    className={`p-3 rounded-lg border text-sm transition ${
                      form.plan === plan.id
                        ? "bg-blue-600 border-blue-500"
                        : "border-zinc-700 hover:border-zinc-500"
                    }`}
                  >
                    <p className="capitalize">{plan.id}</p>
                    <p className="text-xs text-zinc-300">{plan.price}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-md bg-blue-600 hover:bg-blue-700 transition font-medium"
            >
              {loading ? "Processing..." : "Confirm Booking"}
            </button>

            {success && (
              <p className="text-green-500 text-sm text-center">
                Booking successful! Check your email.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
