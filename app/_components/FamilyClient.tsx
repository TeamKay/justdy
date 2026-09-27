"use client";

import * as React from "react";
import Link from "next/link";
import TutoringProgressCard from "@/app/_components/TutoringProgressCard";

interface Child {
  id: string;
  name: string;
  email: string;
  status: string;
  gradeLevel: string | null;
}

interface Family {
  id: string;
  name: string | null;
  role: "PARENT" | "GUARDIAN";
  children: Child[];
}

export default function FamilyClient({ userName }: { userName: string }) {
  const [enabled, setEnabled] = React.useState(false);
  const [families, setFamilies] = React.useState<Family[]>([]);
  const [familyName, setFamilyName] = React.useState("My Family");
  const [childEmail, setChildEmail] = React.useState("");
  const [selectedFamilyId, setSelectedFamilyId] = React.useState("");
  const [role, setRole] = React.useState<"PARENT" | "GUARDIAN">("PARENT");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const children = React.useMemo(() => Array.from(new Map(families.flatMap((family) => family.children).map((child) => [child.id, child])).values()), [families]);
  const [selectedChildId, setSelectedChildId] = React.useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/family", { cache: "no-store" });
      const data = (await response.json()) as { enabled?: boolean; families?: Family[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Failed to load family.");
      const nextFamilies = data.families ?? [];
      const nextChildren = Array.from(new Map(nextFamilies.flatMap((family) => family.children).map((child) => [child.id, child])).values());
      setEnabled(Boolean(data.enabled));
      setFamilies(nextFamilies);
      setSelectedFamilyId((current) => current || nextFamilies[0]?.id || "");
      setSelectedChildId((current) => current || nextChildren[0]?.id || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load family.");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    let cancelled = false;

    async function loadInitialFamily() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/family", { cache: "no-store" });
        const data = (await response.json()) as {
          enabled?: boolean;
          families?: Family[];
          error?: string;
        };
        if (!response.ok) throw new Error(data.error ?? "Failed to load family.");

        const nextFamilies = data.families ?? [];
        const nextChildren = Array.from(
          new Map(
            nextFamilies
              .flatMap((family) => family.children)
              .map((child) => [child.id, child]),
          ).values(),
        );

        if (cancelled) return;

        setEnabled(Boolean(data.enabled));
        setFamilies(nextFamilies);
        setSelectedFamilyId((current) => current || nextFamilies[0]?.id || "");
        setSelectedChildId((current) => current || nextChildren[0]?.id || "");
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load family.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadInitialFamily();

    return () => {
      cancelled = true;
    };
  }, []);

  async function enableFamily() {
    setSaving(true); setError(null); setMessage(null);
    try {
      const response = await fetch("/api/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "enable_parent", familyName, role }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not enable family management.");
      setMessage("Family management is ready. You can now invite an existing learner account.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not enable family management.");
    } finally { setSaving(false); }
  }

  async function addChild(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true); setError(null); setMessage(null);
    try {
      const response = await fetch("/api/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "invite_child", familyId: selectedFamilyId, childEmail }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not add learner.");
      setChildEmail("");
      setMessage(`An invitation was sent to ${data.child?.name ?? "the learner"}. They must accept it before you can book tutoring for them.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add learner.");
    } finally { setSaving(false); }
  }

  return (
    <main className="min-h-full bg-background text-foreground">
      <div className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-8 lg:py-10">
        <div className="mb-8">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Family</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Manage learners</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Add existing Justdy learner accounts so you can book tutoring for them and keep their learning history connected.
          </p>
        </div>

        {(error || message) && (
          <div className={`mb-5 rounded-xl border p-4 text-sm ${error ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-border bg-muted/50"}`}>
            {error ?? message}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">Loading family settings…</div>
        ) : !enabled ? (
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-base font-semibold">Set up family management</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {userName ? `${userName}, ` : ""}choose whether this account manages children as a parent or guardian. This keeps your own learner account separate from the children you book for.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm">
                <span className="font-medium">Family name</span>
                <input value={familyName} onChange={(e) => setFamilyName(e.target.value)} className="h-10 rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-ring" maxLength={120} />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="font-medium">Your role</span>
                <select value={role} onChange={(e) => setRole(e.target.value as "PARENT" | "GUARDIAN")} className="h-10 rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-ring">
                  <option value="PARENT">Parent</option>
                  <option value="GUARDIAN">Guardian</option>
                </select>
              </label>
            </div>
            <button type="button" onClick={() => void enableFamily()} disabled={saving} className="mt-5 inline-flex h-10 items-center rounded-lg bg-foreground px-4 text-sm font-semibold text-background disabled:opacity-60">
              {saving ? "Setting up…" : "Set up family"}
            </button>
          </section>
        ) : (
          <>
            <section className="rounded-2xl border border-border bg-card shadow-sm">
              <div className="border-b border-border/70 px-5 py-4 sm:px-6">
                <h2 className="text-sm font-semibold">Your learners</h2>
                <p className="mt-1 text-xs text-muted-foreground">Learners listed here can be selected during tutoring checkout.</p>
              </div>
              <div className="divide-y divide-border/70">
                {families.flatMap((family) => family.children).length === 0 ? (
                  <div className="p-6 text-sm text-muted-foreground">No children have been added yet.</div>
                ) : families.flatMap((family) => family.children).map((child) => (
                  <div key={child.id} className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
                    <div className="min-w-0"><p className="truncate text-sm font-medium">{child.name}</p><p className="truncate text-xs text-muted-foreground">{child.email}{child.gradeLevel ? ` · Grade ${child.gradeLevel}` : ""}</p></div>
                    <span className="shrink-0 rounded-full border border-border px-2 py-1 text-[10px] font-medium uppercase tracking-wide">{child.status}</span>
                  </div>
                ))}
              </div>
            </section>

            {children.length > 0 && (
              <section className="mt-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-sm font-semibold">Learner progress</h2>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">Review completed tutoring lessons and tutor-recorded practice areas.</p>
                  </div>
                  <select value={selectedChildId} onChange={(e) => setSelectedChildId(e.target.value)} className="h-10 rounded-lg border border-border bg-background px-3 text-sm sm:min-w-52">
                    {children.map((child) => <option key={child.id} value={child.id}>{child.name}</option>)}
                  </select>
                </div>
                <div className="mt-5">
                  <TutoringProgressCard studentId={selectedChildId} compact />
                </div>
              </section>
            )}

            <section className="mt-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <h2 className="text-sm font-semibold">Invite an existing learner</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">The learner must already have a verified Justdy account. They will receive an invitation and must accept it before you can book for them.</p>
              {families.length > 1 && <select value={selectedFamilyId} onChange={(e) => setSelectedFamilyId(e.target.value)} className="mt-4 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm">{families.map((family) => <option key={family.id} value={family.id}>{family.name ?? "Family"}</option>)}</select>}
              <form onSubmit={addChild} className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input type="email" required value={childEmail} onChange={(e) => setChildEmail(e.target.value)} placeholder="learner@example.com" className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
                <button type="submit" disabled={saving || !selectedFamilyId} className="h-10 rounded-lg bg-foreground px-4 text-sm font-semibold text-background disabled:opacity-60">{saving ? "Sending…" : "Send invitation"}</button>
              </form>
            </section>
          </>
        )}

        <Link href="/tutoring" className="mt-6 inline-flex text-sm font-medium underline underline-offset-4">Back to tutoring</Link>
      </div>
    </main>
  );
}
