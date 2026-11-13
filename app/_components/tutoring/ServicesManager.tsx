"use client";

import { FormEvent, useState } from "react";
import { Archive, Check, Loader2, Plus, Save, X } from "lucide-react";

type Service = {
  id: string;
  title: string;
  description: string | null;
  durationMinutes: number | null;
  price: number | null;
  currency: string;
  status: string;
  subject: string | null;
  gradeLevels: unknown;
};

type Props = {
  initialServices: Service[];
};

export default function ServicesManager({ initialServices }: Props) {
  const [services, setServices] = useState<Service[]>(initialServices);

  const [showForm, setShowForm] = useState(initialServices.length === 0);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [subject, setSubject] = useState("");
  const [gradeLevels, setGradeLevels] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/educator/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          durationMinutes,
          price,
          currency,
          subject,
          gradeLevels: gradeLevels
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to create service.");
      }

      setServices((current) => [data.service, ...current]);

      setTitle("");
      setDescription("");
      setDurationMinutes("60");
      setPrice("");
      setSubject("");
      setGradeLevels("");
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function updateService(id: string, changes: Record<string, unknown>) {
    const response = await fetch("/api/educator/services", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id,
        ...changes,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || "Unable to update service.");
    }

    setServices((current) =>
      current.map((service) => (service.id === id ? data.service : service)),
    );
  }

  async function archiveService(id: string) {
    if (!window.confirm("Archive this tutoring service?")) {
      return;
    }

    try {
      await updateService(id, {
        status: "Archived",
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to archive service.",
      );
    }
  }

  return (
    <div className="space-y-5">
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" />
          Add service
        </button>
      </div>

      {showForm ? (
        <form
          onSubmit={createService}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-950">
              New tutoring service
            </h2>

            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 grid gap-5">
            <div>
              <label className="text-sm font-semibold text-slate-800">
                Service title
              </label>

              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                placeholder="1-on-1 Mathematics Tutoring"
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-800">
                Description
              </label>

              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={5}
                placeholder="Describe what learners will receive."
                className="mt-2 w-full resize-none rounded-xl border border-slate-200 p-3 text-sm leading-6 outline-none focus:border-slate-400"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <label className="text-sm font-semibold text-slate-800">
                  Duration
                </label>

                <input
                  type="number"
                  min="15"
                  step="15"
                  value={durationMinutes}
                  onChange={(event) => setDurationMinutes(event.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-800">
                  Price
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  placeholder="35"
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-800">
                  Currency
                </label>

                <select
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
                >
                  <option value="USD">USD</option>
                  <option value="GHS">GHS</option>
                </select>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-800">
                  Subject
                </label>

                <input
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="Mathematics"
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-800">
                  Grade levels
                </label>

                <input
                  value={gradeLevels}
                  onChange={(event) => setGradeLevels(event.target.value)}
                  placeholder="Grade 4, Grade 5"
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                />
              </div>
            </div>
          </div>

          <div className="mt-7 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save service
            </button>
          </div>
        </form>
      ) : null}

      {services.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-sm font-semibold text-slate-700">
            No tutoring services yet.
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Create your first service to start building your tutoring offering.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((service) => (
            <div
              key={service.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold text-slate-950">
                      {service.title}
                    </h2>

                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      {service.status}
                    </span>
                  </div>

                  {service.description ? (
                    <p className="mt-2 max-w-2xl text-sm leading-5 text-slate-500">
                      {service.description}
                    </p>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
                    {service.durationMinutes ? (
                      <span>{service.durationMinutes} minutes</span>
                    ) : null}

                    {service.price !== null ? (
                      <span>
                        {service.currency} {(service.price / 100).toFixed(2)}
                      </span>
                    ) : null}

                    {service.subject ? <span>{service.subject}</span> : null}
                  </div>
                </div>

                <div className="flex gap-2">
                  {service.status === "Draft" ? (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await updateService(service.id, {
                            status: "Published",
                          });
                        } catch (err) {
                          setError(
                            err instanceof Error
                              ? err.message
                              : "Unable to publish service.",
                          );
                        }
                      }}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3 text-xs font-semibold text-white"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Publish
                    </button>
                  ) : null}

                  {service.status !== "Archived" ? (
                    <button
                      type="button"
                      onClick={() => archiveService(service.id)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      <Archive className="h-3.5 w-3.5" />
                      Archive
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
