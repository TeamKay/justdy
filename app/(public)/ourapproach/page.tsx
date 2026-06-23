import React from "react";
import { Button } from "@/components/ui/button";

import {
  Target,
  Users,
  Sparkles,
  ArrowRight,
  GraduationCap,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import Link from "next/link";

export default function OurApproach() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32 bg-linear-to-b from-primary/5 via-transparent to-transparent">
        <div className="container max-w-6xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-full bg-primary/10 text-primary mb-6 animate-fade-in">
            <GraduationCap className="h-4 w-4" />
            <span>The Learning Blueprint</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 max-w-3xl mx-auto">
            How We Turn Academic Potential Into <br />
            <span className="text-primary">Proven Success</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            We don&apos;t believe in one-size-fits-all cramming. Our structured,
            personalized approach builds deep understanding, confidence, and
            lifelong learning habits.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="gap-2" asChild>
              <Link href="/onboarding">
                Book a Session <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>

            <Button size="lg" variant="outline" asChild>
              <Link href="/programs">Explore Our Programs</Link>
            </Button>
          </div>
        </div>
      </section>

      <hr className="border-border my-0" />

      {/* 2. Core Pillars / Methodology */}
      <section className="py-20 bg-muted/30">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Our Three Core Pillars
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Every session, tutor match, and custom lesson plan we build is
              rooted in three fundamental principles.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-background shadow-md border-muted">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Target className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">Hyper-Personalization</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  No two students learn alike. We match tutors based on
                  personality, learning style, and academic goals, crafting a
                  tailored curriculum for every single student.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-background shadow-md border-muted">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Users className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">
                  Elite Elite Mentorship
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Our tutors aren&apos;t just subject matter experts; they are
                  mentors. Hailing from top universities, they inspire
                  confidence and model winning study habits.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-background shadow-md border-muted">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">Measurable Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  We demystify the learning process. Parents receive detailed
                  post-session reports, tracking milestones and highlighting
                  areas of continuous improvement.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 3. The Step-by-Step Process */}
      <section className="py-20">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              The Student Journey
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              From your initial diagnostic to top-tier marks, here is exactly
              what working with us looks like.
            </p>
          </div>

          <div className="relative border-l border-muted pl-6 ml-4 md:ml-6 space-y-12">
            {/* Step 1 */}
            <div className="relative">
              <div className="absolute -left-8.75 top-0 bg-primary text-primary-foreground h-7 w-7 rounded-full flex items-center justify-center text-sm font-bold shadow-sm">
                1
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <h3 className="text-xl font-bold">
                    Comprehensive Assessment
                  </h3>
                </div>
                <div className="md:col-span-2 text-muted-foreground">
                  We begin with a proprietary diagnostic evaluation to pinpoint
                  conceptual gaps, strengths, and underlying learning
                  preferences. This ensures we never waste time relearning what
                  they already know.
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="absolute -left-8.75 top-0 bg-primary text-primary-foreground h-7 w-7 rounded-full flex items-center justify-center text-sm font-bold shadow-sm">
                2
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <h3 className="text-xl font-bold">The Perfect Match</h3>
                </div>
                <div className="md:col-span-2 text-muted-foreground">
                  Using data from the assessment, we pair the student with a
                  certified tutor specialized in both the required subject
                  matter and the specific teaching style that unlocks the
                  student&apos;s motivation.
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="absolute -left-8.75 top-0 bg-primary text-primary-foreground h-7 w-7 rounded-full flex items-center justify-center text-sm font-bold shadow-sm">
                3
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <h3 className="text-xl font-bold">Interactive Learning</h3>
                </div>
                <div className="md:col-span-2 text-muted-foreground">
                  Sessions take place in our secure, custom virtual classroom.
                  Equipped with interactive whiteboards, collaborative code/text
                  editors, and video recording capabilities, students learn by
                  *doing*, not just listening.
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative">
              <div className="absolute -left-8.75 top-0 bg-primary text-primary-foreground h-7 w-7 rounded-full flex items-center justify-center text-sm font-bold shadow-sm">
                4
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <h3 className="text-xl font-bold">Feedback Loop</h3>
                </div>
                <div className="md:col-span-2 text-muted-foreground">
                  After every single hour of instruction, parents receive a
                  concise summary outlining exactly what was covered, homework
                  assignments, and real-time progress insights.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CTA / Final Push Section */}

      <section className="py-20 bg-emerald-900/20 text-primary-foreground">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
            Ready to Experience a Better Way to Learn?
          </h2>
          <p className="text-primary-foreground/80 text-lg max-w-xl mx-auto mb-8">
            Schedule a risk-free, 30-minute discovery call with our learning
            director today to build your customized tutoring plan.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              variant="secondary"
              className="font-semibold px-8"
              asChild
            >
              {/* Replace +11234567890 with your actual phone number */}
              <Link href="tel:+17087692256">Schedule My Free Call</Link>
            </Button>
            <span className="text-sm text-primary-foreground/70">
              No credit card required.
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
