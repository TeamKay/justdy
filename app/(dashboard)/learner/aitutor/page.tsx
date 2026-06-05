"use client";

import { motion } from "framer-motion";

import { Sparkles, BookOpen, Brain } from "lucide-react";
import { Card, CardContent } from "@/app/_components/ui/card";
import { Input } from "@/app/_components/ui/input";
import { Button } from "@/app/_components/ui/button";
import { useState } from "react";

export default function ComingSoonPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (email.includes("@")) {
      setSubmitted(true);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-background text-white flex items-center justify-center p-6">
      <div className="max-w-3xl w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex justify-center mb-4">
            <Brain size={48} className="text-purple-300" />
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            AI Tutor is Coming Soon
          </h1>

          <p className="text-lg text-gray-300 mb-8">
            Learn smarter with an AI-powered tutor that explains, tests, and
            guides you step-by-step in Mathematics, Science, and more.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4 mb-10">
          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-6">
              <Sparkles className="mx-auto mb-2" />
              <h3 className="font-semibold">Interactive Learning</h3>
              <p className="text-sm text-gray-300">
                Ask questions and get instant explanations.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-6">
              <BookOpen className="mx-auto mb-2" />
              <h3 className="font-semibold">Step-by-Step Guidance</h3>
              <p className="text-sm text-gray-300">
                Learn concepts in a structured way.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-6">
              <Brain className="mx-auto mb-2" />
              <h3 className="font-semibold">Smart Testing</h3>
              <p className="text-sm text-gray-300">
                Evaluate your understanding instantly.
              </p>
            </CardContent>
          </Card>
        </div>

        {!submitted ? (
          <div className="flex flex-col md:flex-row gap-3 justify-center">
            <Input
              placeholder="Enter your email for early access"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="max-w-sm text-black"
            />
            <Button
              onClick={handleSubmit}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Notify Me
            </Button>
          </div>
        ) : (
          <p className="text-green-400 font-semibold">
            🎉 You&apos;re on the list! We&apos;ll notify you soon.
          </p>
        )}

        <footer className="mt-10 text-sm text-gray-400">
          © {new Date().getFullYear()} AI Tutor. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
