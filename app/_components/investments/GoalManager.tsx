"use client";

import { useEffect, useState } from "react";
import { Flag, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

type Goal = {
  id: string;
  name: string;
  targetAmount: string;
  startingAmount: string;
  currency: "USD" | "GHS";
  targetDate: string;
  expectedAnnualReturn: string | null;
  notes: string | null;
};

type GoalForm = {
  name: string;
  targetAmount: string;
  startingAmount: string;
  currency: "USD" | "GHS";
  targetDate: string;
  expectedAnnualReturn: string;
  notes: string;
};

const money = (value: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);

export default function GoalManager({
  initialGoals,
}: {
  initialGoals: Goal[];
}) {
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [form, setForm] = useState<GoalForm>({
    name: "",
    targetAmount: "",
    startingAmount: "0",
    currency: "USD",
    targetDate: "",
    expectedAnnualReturn: "",
    notes: "",
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);

    try {
      const response = await fetch("/api/admin/investments/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = (await response.json()) as Goal & { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Unable to create goal");
      }

      toast.success("Investment goal created");
      setOpen(false);
      setForm({
        name: "",
        targetAmount: "",
        startingAmount: "0",
        currency: "USD",
        targetDate: "",
        expectedAnnualReturn: "",
        notes: "",
      });

      const freshResponse = await fetch("/api/admin/investments/goals");
      const fresh = (await freshResponse.json()) as Goal[];

      if (freshResponse.ok && Array.isArray(fresh)) {
        setGoals(fresh);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to create goal",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-muted-foreground">Long-term planning</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Investment goals
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Turn your portfolio into measurable targets with clear dates and progress.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          <Plus className="h-4 w-4" />
          New goal
        </button>
      </div>

      {!goals.length ? (
        <div className="rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
          <Flag className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="mt-3 font-semibold">No goals yet</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Create a target such as a retirement balance, home fund, education
            fund, or financial independence milestone.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {goals.map((goal) => {
            const target = Number(goal.targetAmount);
            const start = Number(goal.startingAmount);
            const pct = Math.max(
              0,
              Math.min(100, target ? (start / target) * 100 : 0),
            );
            const days = Math.max(
              0,
              Math.ceil(
                (new Date(goal.targetDate).getTime() - now) / 86_400_000,
              ),
            );

            return (
              <section
                key={goal.id}
                className="rounded-2xl border bg-card p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold">{goal.name}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Target {new Date(goal.targetDate).toLocaleDateString()} ·{" "}
                      {days} days remaining
                    </p>
                  </div>
                  <Flag className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="mt-6 flex items-end justify-between">
                  <div>
                    <div className="text-2xl font-semibold">
                      {money(start, goal.currency)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      starting progress
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-semibold">
                      {money(target, goal.currency)}
                    </div>
                    <div className="text-xs text-muted-foreground">target</div>
                  </div>
                </div>

                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>{pct.toFixed(0)}% funded</span>
                  <span>
                    {money(Math.max(0, target - start), goal.currency)} remaining
                  </span>
                </div>

                {goal.expectedAnnualReturn && (
                  <p className="mt-4 text-xs text-muted-foreground">
                    Planning assumption:{" "}
                    {Number(goal.expectedAnnualReturn).toFixed(1)}% annual return.
                  </p>
                )}
              </section>
            );
          })}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <form
            onSubmit={submit}
            className="w-full max-w-lg rounded-2xl border bg-background p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Create investment goal</h2>
                <p className="text-xs text-muted-foreground">
                  Use planning assumptions, not guarantees.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm text-muted-foreground"
              >
                Close
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 sm:col-span-2">
                <span className="text-xs font-medium">Goal name</span>
                <input
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      name: e.target.value,
                    }))
                  }
                  className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                  placeholder="Retirement portfolio"
                />
              </label>

              <Field
                label="Target amount"
                type="number"
                value={form.targetAmount}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    targetAmount: value,
                  }))
                }
              />
              <Field
                label="Starting amount"
                type="number"
                value={form.startingAmount}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    startingAmount: value,
                  }))
                }
              />

              <label className="space-y-1.5">
                <span className="text-xs font-medium">Currency</span>
                <select
                  value={form.currency}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      currency: e.target.value as GoalForm["currency"],
                    }))
                  }
                  className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                >
                  <option>USD</option>
                  <option>GHS</option>
                </select>
              </label>

              <Field
                label="Target date"
                type="date"
                value={form.targetDate}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    targetDate: value,
                  }))
                }
              />
              <Field
                label="Expected annual return %"
                type="number"
                value={form.expectedAnnualReturn}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    expectedAnnualReturn: value,
                  }))
                }
              />

              <label className="space-y-1.5 sm:col-span-2">
                <span className="text-xs font-medium">Notes</span>
                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      notes: e.target.value,
                    }))
                  }
                  className="min-h-20 w-full rounded-lg border bg-background p-3 text-sm"
                />
              </label>
            </div>

            <button
              disabled={pending}
              className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {pending ? "Creating…" : "Create goal"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-medium">{label}</span>
      <input
        required={label !== "Expected annual return %"}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
      />
    </label>
  );
}
