"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from "lucide-react";
import { useMemo, useState } from "react";

interface PresentationSlide {
  id: string;
  title: string;
  subtitle?: string | null;
  content?: string | null;
  bullets?: string[];
  notes?: string | null;
}

interface PresentationLearnerProps {
  resourceId: string;
  slug: string;
  title: string;
  description?: string | null;
  slides: PresentationSlide[];
}

export default function PresentationLearner({
  resourceId,
  slug,
  title,
  description,
  slides,
}: PresentationLearnerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState(false);

  const currentSlide = slides[currentIndex];

  const progress = useMemo(() => {
    if (slides.length <= 1) return 100;
    return Math.round(
      ((currentIndex + 1) / slides.length) * 100,
    );
  }, [currentIndex, slides.length]);

  function goNext() {
    if (currentIndex >= slides.length - 1) {
      setCompleted(true);
      return;
    }

    setCurrentIndex((index) => index + 1);
    setCompleted(false);
  }

  function goPrevious() {
    setCurrentIndex((index) => Math.max(0, index - 1));
    setCompleted(false);
  }

  function toggleFullscreen() {
    const element = document.getElementById(
      `presentation-${resourceId}`,
    );

    if (!element) return;

    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void element.requestFullscreen?.();
    }
  }

  if (!currentSlide) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <p className="text-muted-foreground">
            This presentation does not contain any slides.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      id={`presentation-${resourceId}`}
      className="min-h-screen bg-background text-foreground"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link
            href={`/resources/${encodeURIComponent(slug)}`}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium transition hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to resource
          </Link>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium transition hover:bg-muted"
          >
            <Maximize2 className="h-4 w-4" />
            <span className="hidden sm:inline">
              Fullscreen
            </span>
          </button>
        </div>

        <header className="mb-6">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <BookOpen className="h-3.5 w-3.5" />
            Presentation
          </div>

          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {title}
          </h1>

          {description ? (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
              {description}
            </p>
          ) : null}
        </header>

        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="h-1 w-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="min-h-[560px] px-6 py-10 sm:px-12 sm:py-14 lg:px-20">
            <div className="mx-auto flex min-h-[460px] max-w-4xl flex-col justify-center">
              <div className="mb-6 text-sm font-medium text-muted-foreground">
                Slide {currentIndex + 1} of {slides.length}
              </div>

              <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
                {currentSlide.title}
              </h2>

              {currentSlide.subtitle ? (
                <p className="mt-4 text-lg text-muted-foreground sm:text-xl">
                  {currentSlide.subtitle}
                </p>
              ) : null}

              {currentSlide.content ? (
                <p className="mt-8 max-w-3xl whitespace-pre-wrap text-base leading-8 text-foreground/90 sm:text-lg">
                  {currentSlide.content}
                </p>
              ) : null}

              {currentSlide.bullets &&
              currentSlide.bullets.length > 0 ? (
                <ul className="mt-8 space-y-4">
                  {currentSlide.bullets.map(
                    (bullet, index) => (
                      <li
                        key={`${currentSlide.id}-bullet-${index}`}
                        className="flex gap-3 text-base leading-7 sm:text-lg"
                      >
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        <span>{bullet}</span>
                      </li>
                    ),
                  )}
                </ul>
              ) : null}
            </div>
          </div>

          <div className="border-t border-border bg-muted/30 px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={goPrevious}
                disabled={currentIndex === 0}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <div className="hidden items-center gap-1 sm:flex">
                {slides.map((slide, index) => (
                  <button
                    key={slide.id}
                    type="button"
                    aria-label={`Go to slide ${index + 1}`}
                    onClick={() => {
                      setCurrentIndex(index);
                      setCompleted(false);
                    }}
                    className={`h-2 rounded-full transition-all ${
                      index === currentIndex
                        ? "w-6 bg-primary"
                        : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={goNext}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              >
                {completed ? (
                  <>
                    <Check className="h-4 w-4" />
                    Completed
                  </>
                ) : currentIndex === slides.length - 1 ? (
                  <>
                    Finish
                    <Check className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
