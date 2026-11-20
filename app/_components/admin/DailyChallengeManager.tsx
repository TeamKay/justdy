
"use client";

import { useState, useTransition } from "react";
import {
  CalendarDays,
  CheckCircle2,
  CirclePlus,
  FileEdit,
  FlaskConical,
  Lightbulb,
  LoaderCircle,
  Pencil,
  Send,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";

import {
  createDailyChallenge,
  updateDailyChallenge,
  setDailyChallengeStatus,
} from "@/app/actions/daily-challenge-admin";

type Challenge = {
  id: string;
  challengeDate: string;
  gradeLevel: string;
  subject: string;
  topic: string;
  difficulty: string;
  title: string;
  question: string;
  options: string[];
  correctAnswer: string;
  hint: string | null;
  explanation: string;
  points: number;
  status: string;
  attemptCount: number;
};

const grades = [
  "Pre-K", "Kindergarten",
  ...Array.from({ length: 12 }, (_, index) => `Grade ${index + 1}`),
];

const initialForm = {
  challengeDate: new Date().toISOString().slice(0, 10),
  gradeLevel: "Grade 5",
  subject: "Mathematics",
  topic: "",
  difficulty: "MEDIUM",
  title: "",
  question: "",
  options: ["", "", "", ""],
  correctAnswer: "",
  hint: "",
  explanation: "",
  points: 100,
};

type FormState = typeof initialForm;

const inputClass =
  "w-full rounded-xl border border-[#DCE8DD] bg-white px-4 py-3 text-sm text-[#20372A] outline-none transition placeholder:text-[#9AA99B] focus:border-[#69A85F] focus:ring-4 focus:ring-[#69A85F]/10";

const labelClass =
  "mb-2 block text-sm font-semibold text-[#344B39]";

export default function DailyChallengeManager({
  initialChallenges,
}: {
  initialChallenges: Challenge[];
}) {
  const [challenges] = useState(initialChallenges);
  const [form, setForm] = useState<FormState>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function updateField<K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
    setError("");
    setMessage("");
  }

  function editChallenge(challenge: Challenge) {
    setEditingId(challenge.id);
    setForm({
      challengeDate: challenge.challengeDate,
      gradeLevel: challenge.gradeLevel,
      subject: challenge.subject,
      topic: challenge.topic,
      difficulty: challenge.difficulty,
      title: challenge.title,
      question: challenge.question,
      options: challenge.options,
      correctAnswer: challenge.correctAnswer,
      hint: challenge.hint ?? "",
      explanation: challenge.explanation,
      points: challenge.points,
    });
    setError("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    startTransition(async () => {
      const result = editingId
        ? await updateDailyChallenge(editingId, form)
        : await createDailyChallenge(form);

      if (!result.success) {
       setError(result.error ?? "Something went wrong. Please try again.");
        return;
      }

      setMessage(result.message ?? "Operation completed successfully.");
      window.location.reload();
    });
  }

  function changeStatus(id: string, status: "DRAFT" | "PUBLISHED") {
    setError("");
    setMessage("");

    startTransition(async () => {
      const result = await setDailyChallengeStatus(id, status);

      if (!result.success) {
        setError(result.error ?? "Something went wrong. Please try again.");
        return;
      }

      setMessage(result.message ?? "Operation completed successfully.");
      window.location.reload();
    });
  }

  const publishedCount = challenges.filter(
    (item) => item.status === "PUBLISHED"
  ).length;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Trophy}
          label="Total challenges"
          value={challenges.length}
        />
        <StatCard
          icon={CheckCircle2}
          label="Published"
          value={publishedCount}
        />
        <StatCard
          icon={FileEdit}
          label="Drafts"
          value={challenges.length - publishedCount}
        />
      </div>

      {(error || message) && (
        <div
          role="status"
          className={`rounded-xl border px-4 py-3 text-sm ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-green-200 bg-green-50 text-green-800"
          }`}
        >
          {error || message}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-[#E2EDE2] bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAF0E9] px-6 py-5">
          <div>
            <div className="flex items-center gap-2 text-[#43844A]">
              <Sparkles size={17} />
              <span className="text-xs font-bold uppercase tracking-wider">
                Challenge studio
              </span>
            </div>
            <h2 className="mt-1 text-xl font-bold text-[#20372A]">
              {editingId ? "Edit challenge" : "Create a daily challenge"}
            </h2>
            <p className="mt-1 text-sm text-[#758477]">
              Create engaging questions for learners across school grades.
            </p>
          </div>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-[#536457] hover:bg-[#F5F8F4]"
            >
              <X size={15} /> Cancel editing
            </button>
          )}
        </div>

        <form onSubmit={submitForm} className="space-y-7 p-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className={labelClass}>Challenge date</label>
              <input
                type="date"
                required
                className={inputClass}
                value={form.challengeDate}
                onChange={(e) => updateField("challengeDate", e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Grade level</label>
              <select
                className={inputClass}
                value={form.gradeLevel}
                onChange={(e) => updateField("gradeLevel", e.target.value)}
              >
                {grades.map((grade) => (
                  <option key={grade}>{grade}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Subject</label>
              <select
                className={inputClass}
                value={form.subject}
                onChange={(e) => updateField("subject", e.target.value)}
              >
                {["Mathematics", "English", "Science", "Social Studies"].map(
                  (subject) => <option key={subject}>{subject}</option>
                )}
              </select>
            </div>

            <div>
              <label className={labelClass}>Difficulty</label>
              <select
                className={inputClass}
                value={form.difficulty}
                onChange={(e) => updateField("difficulty", e.target.value)}
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Topic</label>
              <input
                required
                maxLength={100}
                className={inputClass}
                placeholder="e.g. Fractions"
                value={form.topic}
                onChange={(e) => updateField("topic", e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Challenge title</label>
              <input
                required
                maxLength={160}
                className={inputClass}
                placeholder="e.g. The Fraction Quest"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Question</label>
            <textarea
              required
              rows={4}
              maxLength={10000}
              className={inputClass}
              placeholder="Write the question learners will solve..."
              value={form.question}
              onChange={(e) => updateField("question", e.target.value)}
            />
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className={labelClass}>Answer choices</label>
              <span className="text-xs text-[#849285]">
                Select the correct answer below
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {form.options.map((option, index) => (
                <div key={index} className="relative">
                  <label className="mb-1 block text-xs font-semibold text-[#879589]">
                    OPTION {String.fromCharCode(65 + index)}
                  </label>
                  <input
                    required
                    maxLength={300}
                    className={`${inputClass} pr-10`}
                    placeholder={`Enter option ${index + 1}`}
                    value={option}
                    onChange={(e) => {
                      const next = [...form.options];
                      next[index] = e.target.value;
                      updateField("options", next);
                    }}
                  />
                  {form.correctAnswer === option && option.trim() && (
                    <CheckCircle2
                      className="absolute right-3 top-9 text-[#55A45C]"
                      size={18}
                    />
                  )}
                </div>
              ))}
            </div>

            <label className={`${labelClass} mt-5`}>
              Correct answer
            </label>
            <select
              required
              className={inputClass}
              value={form.correctAnswer}
              onChange={(e) => updateField("correctAnswer", e.target.value)}
            >
              <option value="">Select the correct answer</option>
              {form.options.filter((option) => option.trim()).map(
                (option, index) => (
                  <option key={`${index}-${option}`} value={option}>
                    {String.fromCharCode(65 + index)}. {option}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={labelClass}>
                <span className="inline-flex items-center gap-2">
                  <Lightbulb size={15} /> Optional hint
                </span>
              </label>
              <textarea
                rows={3}
                maxLength={2000}
                className={inputClass}
                placeholder="Give learners a helpful clue..."
                value={form.hint}
                onChange={(e) => updateField("hint", e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Answer explanation</label>
              <textarea
                required
                rows={3}
                maxLength={5000}
                className={inputClass}
                placeholder="Explain why this answer is correct..."
                value={form.explanation}
                onChange={(e) => updateField("explanation", e.target.value)}
              />
            </div>
          </div>

          <div className="max-w-xs">
            <label className={labelClass}>Points for a correct answer</label>
            <input
              type="number"
              required
              min={1}
              max={1000}
              className={inputClass}
              value={form.points}
              onChange={(e) => updateField("points", Number(e.target.value))}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EAF0E9] pt-5">
            <p className="text-xs text-[#879589]">
              New challenges are saved as drafts.
            </p>

            <button
              disabled={isPending}
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-[#4B9A50] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#3D8543] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : editingId ? (
                <Pencil size={16} />
              ) : (
                <CirclePlus size={17} />
              )}
              {editingId ? "Save changes" : "Save challenge"}
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#E2EDE2] bg-white shadow-sm">
        <div className="border-b border-[#EAF0E9] px-6 py-5">
          <h2 className="text-lg font-bold text-[#20372A]">
            Your challenges
          </h2>
          <p className="mt-1 text-sm text-[#758477]">
            Manage scheduled questions and publication status.
          </p>
        </div>

        {challenges.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EFF7EC] text-[#57965A]">
              <FlaskConical size={25} />
            </div>
            <h3 className="mt-4 font-bold text-[#304834]">
              Your challenge library is empty
            </h3>
            <p className="mt-1 text-sm text-[#879589]">
              Create your first daily challenge above.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#EDF2EC]">
            {challenges.map((challenge) => (
              <div
                key={challenge.id}
                className="flex flex-col justify-between gap-4 px-6 py-5 sm:flex-row sm:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#EFF7EC] px-2.5 py-1 text-xs font-semibold text-[#477D49]">
                      {challenge.gradeLevel}
                    </span>
                    <span className="rounded-full bg-[#F1F5F8] px-2.5 py-1 text-xs font-semibold text-[#64788A]">
                      {challenge.subject}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        challenge.status === "PUBLISHED"
                          ? "bg-green-50 text-green-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {challenge.status === "PUBLISHED" ? "Published" : "Draft"}
                    </span>
                  </div>

                  <h3 className="mt-3 truncate font-bold text-[#253B2A]">
                    {challenge.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-[#758477]">
                    {challenge.question}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-[#89968A]">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays size={13} /> {challenge.challengeDate}
                    </span>
                    <span>{challenge.topic}</span>
                    <span>{challenge.points} points</span>
                    <span>{challenge.attemptCount} attempts</span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={isPending || challenge.attemptCount > 0}
                    title={
                      challenge.attemptCount > 0
                        ? "Cannot edit after learners have submitted"
                        : "Edit challenge"
                    }
                    onClick={() => editChallenge(challenge)}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#DCE8DD] px-3 py-2 text-xs font-semibold text-[#49604C] hover:bg-[#F5F8F4] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Pencil size={14} /> Edit
                  </button>

                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() =>
                      changeStatus(
                        challenge.id,
                        challenge.status === "PUBLISHED"
                          ? "DRAFT"
                          : "PUBLISHED"
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-lg bg-[#4B9A50] px-3 py-2 text-xs font-semibold text-white hover:bg-[#3D8543] disabled:opacity-50"
                  >
                    {challenge.status === "PUBLISHED" ? (
                      <>
                        <FileEdit size={14} /> Unpublish
                      </>
                    ) : (
                      <>
                        <Send size={14} /> Publish
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-[#E2EDE2] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[#758477]">{label}</p>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EFF7EC] text-[#57965A]">
          <Icon size={18} />
        </div>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-[#20372A]">
        {value}
      </p>
    </div>
  );
}
