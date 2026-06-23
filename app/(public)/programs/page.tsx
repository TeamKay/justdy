import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Clock, Calendar, ShieldCheck } from "lucide-react";
import { Badge } from "@/app/_components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";

export default function OurPrograms() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 1. Hero Section */}
      <section className="py-20 bg-linear-to-b from-primary/5 via-transparent to-transparent">
        <div className="container max-w-5xl mx-auto px-4 text-center">
          <Badge
            variant="secondary"
            className="mb-4 text-sm px-3 py-1 font-medium"
          >
            Math Programs (K-12 & College Prep)
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Find the Perfect Fit for Your{" "}
            <span className="text-primary">Math Journey</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From foundational arithmetic to advanced calculus, we provide
            flexible learning options designed to eliminate math anxiety and
            boost grades.
          </p>
        </div>
      </section>

      {/* 2. Subjects & Grade Levels */}
      <section className="pb-20">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-2">
              Expertise Across All Levels
            </h2>
            <p className="text-muted-foreground">
              We meet students exactly where they are in their curriculum.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Elementary School */}
            <div className="p-6 rounded-xl border border-border bg-card/50">
              <span className="text-xs font-bold tracking-widest text-primary uppercase">
                Grades K-5
              </span>
              <h3 className="text-lg font-bold mt-2 mb-3">Elementary Math</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Building core confidence, number sense, fractions, and basic
                word problems through engaging, visual methods.
              </p>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline">Basic Arithmetic</Badge>
                <Badge variant="outline">Early Algebra</Badge>
              </div>
            </div>

            {/* Middle School */}
            <div className="p-6 rounded-xl border border-border bg-card/50">
              <span className="text-xs font-bold tracking-widest text-primary uppercase">
                Grades 6-8
              </span>
              <h3 className="text-lg font-bold mt-2 mb-3">
                Middle School Math
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Transitioning seamlessly to abstract thinking. Preparing minds
                for complex multi-step high school math tracking.
              </p>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline">Pre-Algebra</Badge>
                <Badge variant="outline">Ratios & Geometry</Badge>
              </div>
            </div>

            {/* High School */}
            <div className="p-6 rounded-xl border border-border bg-card/50">
              <span className="text-xs font-bold tracking-widest text-primary uppercase">
                Grades 9-12
              </span>
              <h3 className="text-lg font-bold mt-2 mb-3">High School Math</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Mastering the critical heavy-hitter subjects needed for high GPA
                maintenance and college transcripts.
              </p>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline">Algebra I & II</Badge>
                <Badge variant="outline">Geometry</Badge>
                <Badge variant="outline">Pre-Calculus</Badge>
              </div>
            </div>

            {/* Advanced & Test Prep */}
            <div className="p-6 rounded-xl border border-border bg-card/50">
              <span className="text-xs font-bold tracking-widest text-primary uppercase">
                Advanced
              </span>
              <h3 className="text-lg font-bold mt-2 mb-3">AP & Exam Prep</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Rigorous, strategy-based coaching targeting top-percentile
                scores on standardized tests and college placement exams.
              </p>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline">AP Calculus AB/BC</Badge>
                <Badge variant="outline">SAT / ACT Math</Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Pricing & Subscription Models */}
      <section className="py-20 bg-muted/30 border-y border-border">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Choose Your Learning Mode
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Whether you need quick help prepping for a single test or
              consistent ongoing support, we have a plan built for you.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
            {/* Mode A: Hourly Pay-As-You-Go */}
            <Card className="flex flex-col bg-background border-border relative">
              <CardHeader className="pb-4">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase mb-2">
                  <Clock className="h-3.5 w-3.5" /> Short-Term Flexibility
                </div>
                <CardTitle className="text-2xl">Hourly Pay-As-You-Go</CardTitle>
                <CardDescription>
                  Perfect for sudden test prep or target-fixing tough concepts.
                </CardDescription>
              </CardHeader>
              <CardContent className="grow">
                <div className="mb-6">
                  <span className="text-4xl font-bold">$35</span>
                  <span className="text-muted-foreground"> / hour</span>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>
                      Zero long-term commitment — book only when needed
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>
                      Upload specific homework assignments before the call
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>
                      Recorded sessions available for download and review
                    </span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant="outline" asChild>
                  <Link href="/onboarding">Book Single Session</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Mode B: Monthly Subscription (Popular) */}
            <Card className="flex flex-col bg-background border-primary shadow-lg relative overflow-hidden ring-1 ring-primary/20">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl">
                Most Popular
              </div>
              <CardHeader className="pb-4">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase mb-2">
                  <Calendar className="h-3.5 w-3.5" /> Long-Term Mastery
                </div>
                <CardTitle className="text-2xl">
                  Monthly Subscriptions
                </CardTitle>
                <CardDescription>
                  Continuous support designed to build lasting habits and keep
                  grades high.
                </CardDescription>
              </CardHeader>
              <CardContent className="grow">
                <div className="mb-6">
                  <span className="text-sm text-muted-foreground block line-through">
                    $380 value
                  </span>
                  <span className="text-4xl font-bold">$230</span>
                  <span className="text-muted-foreground"> / month</span>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span className="font-medium text-foreground">
                      2 weekly sessions (8 total hours per month)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>
                      Guaranteed recurring time slot with your favorite tutor
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>
                      Unlimited chat/messaging support between sessions
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>Monthly detailed progress reports for parents</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/95"
                  asChild
                >
                  <Link href="/onboarding">Subscribe & Save $50</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* 4. Conversion Boosters (Why Choose Us) */}
      <section className="py-20">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="bg-card border border-border rounded-2xl p-8 md:p-12 shadow-sm grid md:grid-cols-5 gap-8 items-center">
            <div className="md:col-span-2 flex flex-col items-center md:items-start text-center md:text-left">
              <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold mb-2">
                Our Risk-Free Guarantee
              </h3>
              <p className="text-sm text-muted-foreground">
                We back our teaching methods completely.
              </p>
            </div>
            <div className="md:col-span-3 text-muted-foreground text-sm space-y-4">
              <p>
                Finding the right learning chemistry matters. If your student
                doesn&apos;t perfectly click with their assigned math tutor
                during the very first session, **we will credit that hour back
                to your account** and match you with a new instructor completely
                free of charge.
              </p>
              <p className="font-semibold text-foreground">
                No awkward conversations, no hidden fees, just guaranteed
                learning compatibility.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Quick Call-To-Action */}
      <section className="pb-20 text-center container max-w-3xl mx-auto px-4">
        <h2 className="text-2xl font-bold tracking-tight mb-4">
          Unsure which package your student needs?
        </h2>
        <p className="text-muted-foreground mb-6">
          Every student gets a personalized path. Talk to our academic director
          to run a quick evaluation diagnostic.
        </p>
        <Button size="lg" className="gap-2" asChild>
          <Link href="/book-consultation">
            Get an Academic Assessment <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </section>
    </div>
  );
}
