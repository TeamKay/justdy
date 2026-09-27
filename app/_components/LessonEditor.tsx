"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Plus, Save, Trash2 } from "lucide-react";

type LessonSection = {
  id: string;
  title: string;
  content: string;
};

type LessonPlan = {
  title: string;
  description: string | null;
  subject: string | null;
  gradeLevel: string | null;
  topic: string | null;
  duration: number | null;
  learningObjectives: string[];
  sections: LessonSection[];
};

function normalizeLesson(value: unknown): LessonPlan | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  const sections = Array.isArray(data.sections)
    ? data.sections
        .filter((item): item is Record<string, unknown> =>
          typeof item === "object" && item !== null && !Array.isArray(item),
        )
        .map((item, index) => ({
          id: typeof item.id === "string" ? item.id : `section-${index + 1}`,
          title:
            typeof item.title === "string" ? item.title : `Section ${index + 1}`,
          content: typeof item.content === "string" ? item.content : "",
        }))
    : [];

  return {
    title: typeof data.title === "string" ? data.title : "Lesson Plan",
    description:
      typeof data.description === "string" ? data.description : null,
    subject: typeof data.subject === "string" ? data.subject : null,
    gradeLevel:
      typeof data.gradeLevel === "string" ? data.gradeLevel : null,
    topic: typeof data.topic === "string" ? data.topic : null,
    duration:
      typeof data.duration === "number" ? data.duration : null,
    learningObjectives: Array.isArray(data.learningObjectives)
      ? data.learningObjectives.filter(
          (item): item is string => typeof item === "string",
        )
      : [],
    sections,
  };
}

export default function LessonEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const generationId = searchParams.get("generationId")?.trim() || null;
  const resourceId = searchParams.get("resourceId")?.trim() || null;

  const [lesson, setLesson] = useState<LessonPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const loadLesson = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const url = resourceId
        ? `/api/resources/lesson-plan/resource/${encodeURIComponent(resourceId)}`
        : generationId
          ? `/api/resources/lesson-plan/${encodeURIComponent(generationId)}`
          : null;

      if (!url) throw new Error("A lesson plan ID is required.");

      const response = await fetch(url, { cache: "no-store" });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || "Unable to load the lesson plan.");
      }

      const normalized = normalizeLesson(data.lessonPlan ?? data.resource?.content);
      if (!normalized) {
        throw new Error("The lesson plan could not be read.");
      }

      setLesson(normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load the lesson plan.");
    } finally {
      setLoading(false);
    }
  }, [generationId, resourceId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadLesson();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadLesson]);

  function updateSection(
    sectionId: string,
    field: "title" | "content",
    value: string,
  ) {
    setLesson((current) =>
      current
        ? {
            ...current,
            sections: current.sections.map((section) =>
              section.id === sectionId
                ? { ...section, [field]: value }
                : section,
            ),
          }
        : current,
    );
    setSaved(false);
  }

  function updateObjective(index: number, value: string) {
    setLesson((current) =>
      current
        ? {
            ...current,
            learningObjectives: current.learningObjectives.map((item, i) =>
              i === index ? value : item,
            ),
          }
        : current,
    );
    setSaved(false);
  }

  function addObjective() {
    setLesson((current) =>
      current
        ? { ...current, learningObjectives: [...current.learningObjectives, ""] }
        : current,
    );
    setSaved(false);
  }

  function removeObjective(index: number) {
    setLesson((current) =>
      current
        ? {
            ...current,
            learningObjectives: current.learningObjectives.filter(
              (_, i) => i !== index,
            ),
          }
        : current,
    );
    setSaved(false);
  }

  function addSection() {
    setLesson((current) =>
      current
        ? {
            ...current,
            sections: [
              ...current.sections,
              {
                id: `section-${Date.now()}`,
                title: "New section",
                content: "",
              },
            ],
          }
        : current,
    );
    setSaved(false);
  }

  function removeSection(sectionId: string) {
    setLesson((current) =>
      current
        ? {
            ...current,
            sections: current.sections.filter(
              (section) => section.id !== sectionId,
            ),
          }
        : current,
    );
    setSaved(false);
  }

  async function handleSave() {
    if (!lesson || (!generationId && !resourceId)) return;

    setSaving(true);
    setError("");
    setSaved(false);

    try {
      let url = "";

      if (resourceId) {
        url = `/api/resources/lesson-plan/resource/${encodeURIComponent(resourceId)}`;
      } else {
        url = `/api/resources/lesson-plan/${encodeURIComponent(generationId!)}`;
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: lesson }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || "Unable to save the lesson plan.");
      }

      setSaved(true);
      if (data.resourceId && !resourceId) {
        router.replace(
          `/create/lesson/editor?resourceId=${encodeURIComponent(data.resourceId)}`,
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save the lesson plan.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-full items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </main>
    );
  }

  if (!lesson) {
    return (
      <main className="mx-auto max-w-3xl p-8">
        <button
          type="button"
          onClick={() => router.push("/library")}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Library
        </button>
        <div className="rounded-2xl border bg-card p-6 text-sm text-destructive">
          {error || "Lesson plan unavailable."}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-full bg-background">
      <div className="mx-auto w-full max-w-5xl px-6 py-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => router.push("/library")}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Library
          </button>

          <div className="flex items-center gap-3">
            {saved ? (
              <span className="text-sm text-muted-foreground">Saved</span>
            ) : null}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-foreground px-4 text-sm font-medium text-background hover:opacity-90 disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "Saving…" : "Save to Library"}
            </button>
          </div>
        </div>

        {error ? (
          <div className="mb-5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="space-y-6">
          <section className="rounded-2xl border bg-card p-6 shadow-sm">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Lesson title
            </label>
            <input
              value={lesson.title}
              onChange={(event) => {
                setLesson({ ...lesson, title: event.target.value });
                setSaved(false);
              }}
              className="mt-2 w-full border-0 bg-transparent p-0 text-3xl font-semibold outline-none"
            />

            <textarea
              value={lesson.description ?? ""}
              onChange={(event) => {
                setLesson({ ...lesson, description: event.target.value });
                setSaved(false);
              }}
              placeholder="Add a short description"
              rows={2}
              className="mt-3 w-full resize-none rounded-xl border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-foreground/10"
            />

            <div className="mt-4 grid gap-4 sm:grid-cols-4">
              {[
                ["Subject", "subject"],
                ["Grade / age", "gradeLevel"],
                ["Topic", "topic"],
                ["Duration", "duration"],
              ].map(([label, key]) => (
                <div key={key}>
                  <label className="text-xs font-medium text-muted-foreground">
                    {label}
                  </label>
                  <input
                    value={
                      key === "duration"
                        ? lesson.duration ?? ""
                        : lesson[key as "subject" | "gradeLevel" | "topic"] ?? ""
                    }
                    onChange={(event) => {
                      const value = event.target.value;
                      setLesson({
                        ...lesson,
                        ...(key === "duration"
                          ? { duration: value ? Number(value) : null }
                          : { [key]: value }),
                      });
                      setSaved(false);
                    }}
                    className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-foreground/10"
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Learning objectives</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  What learners should know or be able to do.
                </p>
              </div>
              <button
                type="button"
                onClick={addObjective}
                className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm hover:bg-muted"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {lesson.learningObjectives.map((objective, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    value={objective}
                    onChange={(event) =>
                      updateObjective(index, event.target.value)
                    }
                    className="h-10 flex-1 rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-foreground/10"
                  />
                  <button
                    type="button"
                    onClick={() => removeObjective(index)}
                    className="rounded-lg p-2 text-muted-foreground hover:text-destructive"
                    aria-label="Remove objective"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {lesson.sections.map((section, index) => (
            <section
              key={section.id}
              className="rounded-2xl border bg-card p-6 shadow-sm"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-medium text-muted-foreground">
                  Section {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeSection(section.id)}
                  className="rounded-lg p-2 text-muted-foreground hover:text-destructive"
                  aria-label={`Remove ${section.title}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <input
                value={section.title}
                onChange={(event) =>
                  updateSection(section.id, "title", event.target.value)
                }
                className="mt-2 w-full rounded-xl border bg-background px-3 py-2 text-lg font-semibold outline-none focus:ring-2 focus:ring-foreground/10"
              />

              <textarea
                value={section.content}
                onChange={(event) =>
                  updateSection(section.id, "content", event.target.value)
                }
                rows={8}
                className="mt-3 w-full resize-y rounded-xl border bg-background px-3 py-3 text-sm leading-6 outline-none focus:ring-2 focus:ring-foreground/10"
              />
            </section>
          ))}

          <button
            type="button"
            onClick={addSection}
            className="inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-medium hover:bg-muted"
          >
            <Plus className="h-4 w-4" />
            Add section
          </button>
        </div>
      </div>
    </main>
  );
}
