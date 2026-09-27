"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  CalendarDays,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";

type AvailabilityStatus =
  | "Available"
  | "Booked"
  | "Blocked"
  | string;

type Availability = {
  id: string;
  startTime: string;
  endTime: string;
  status: AvailabilityStatus;
};

type Props = {
  initialAvailability: Availability[];
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid time";
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function sortAvailability(
  items: Availability[],
): Availability[] {
  return [...items].sort(
    (a, b) =>
      new Date(a.startTime).getTime() -
      new Date(b.startTime).getTime(),
  );
}

function getStatusClasses(status: AvailabilityStatus) {
  switch (status) {
    case "Available":
      return "bg-emerald-50 text-emerald-700";

    case "Booked":
      return "bg-blue-50 text-blue-700";

    case "Blocked":
      return "bg-slate-200 text-slate-600";

    default:
      return "bg-white text-slate-500";
  }
}

export default function AvailabilityManager({
  initialAvailability,
}: Props) {
  const [availability, setAvailability] =
    useState<Availability[]>(() =>
      sortAvailability(initialAvailability),
    );

  const [date, setDate] = useState("");
  const [startTime, setStartTime] =
    useState("09:00");
  const [endTime, setEndTime] =
    useState("10:00");

  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] =
    useState<string | null>(null);
  const [error, setError] =
    useState<string | null>(null);

  const minimumDate = useMemo(
    () => getTodayDate(),
    [],
  );

  function validateForm() {
    if (!date) {
      return "Please choose a date.";
    }

    if (!startTime || !endTime) {
      return "Please choose both a start and end time.";
    }

    const start = new Date(
      `${date}T${startTime}:00`,
    );

    const end = new Date(
      `${date}T${endTime}:00`,
    );

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      return "Please enter a valid date and time.";
    }

    if (start >= end) {
      return "The end time must be later than the start time.";
    }

    if (start <= new Date()) {
      return "Availability must be scheduled for a future time.";
    }

    return null;
  }

  async function addSlot(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const start = new Date(
        `${date}T${startTime}:00`,
      );

      const end = new Date(
        `${date}T${endTime}:00`,
      );

      const response = await fetch(
        "/api/educator/availability",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            startTime: start.toISOString(),
            endTime: end.toISOString(),
          }),
        },
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to create availability.",
        );
      }

      if (!data?.availability) {
        throw new Error(
          "The availability was created, but the server did not return the new availability record.",
        );
      }

      setAvailability((current) =>
        sortAvailability([
          ...current,
          data.availability as Availability,
        ]),
      );

      setDate("");
      setStartTime("09:00");
      setEndTime("10:00");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while creating availability.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeSlot(id: string) {
    const slot = availability.find(
      (item) => item.id === id,
    );

    if (!slot) {
      return;
    }

    if (slot.status === "Booked") {
      setError(
        "A booked tutoring time cannot be removed.",
      );
      return;
    }

    if (slot.status !== "Available") {
      setError(
        "This availability is not currently available for removal.",
      );
      return;
    }

    if (
      !window.confirm(
        "Remove this availability slot? Learners will no longer be able to book this time.",
      )
    ) {
      return;
    }

    setRemovingId(id);
    setError(null);

    try {
      const response = await fetch(
        "/api/educator/availability",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id,
          }),
        },
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to remove availability.",
        );
      }

      setAvailability((current) =>
        current.filter(
          (item) => item.id !== id,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to remove availability.",
      );
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="space-y-5">
      {error ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      ) : null}

      {/* =========================================================
          CREATE AVAILABILITY
      ========================================================== */}

      <form
        onSubmit={addSlot}
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <CalendarDays className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Add bookable time
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Learners will see these times when
              booking one of your tutoring services.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {/* DATE */}

          <div>
            <label
              htmlFor="availability-date"
              className="text-sm font-semibold text-slate-800"
            >
              Date
            </label>

            <input
              id="availability-date"
              type="date"
              value={date}
              min={minimumDate}
              onChange={(event) =>
                setDate(event.target.value)
              }
              required
              disabled={saving}
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50"
            />
          </div>

          {/* START */}

          <div>
            <label
              htmlFor="availability-start"
              className="text-sm font-semibold text-slate-800"
            >
              Start
            </label>

            <input
              id="availability-start"
              type="time"
              value={startTime}
              onChange={(event) =>
                setStartTime(event.target.value)
              }
              required
              disabled={saving}
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50"
            />
          </div>

          {/* END */}

          <div>
            <label
              htmlFor="availability-end"
              className="text-sm font-semibold text-slate-800"
            >
              End
            </label>

            <input
              id="availability-end"
              type="time"
              value={endTime}
              onChange={(event) =>
                setEndTime(event.target.value)
              }
              required
              disabled={saving}
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}

            {saving
              ? "Adding..."
              : "Add availability"}
          </button>
        </div>
      </form>

      {/* =========================================================
          UPCOMING AVAILABILITY
      ========================================================== */}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div>
          <h2 className="text-base font-semibold text-slate-950">
            Upcoming availability
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            These are the bookable times currently
            associated with your tutoring profile.
          </p>
        </div>

        {availability.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-400">
              <CalendarDays className="h-5 w-5" />
            </div>

            <p className="mt-4 text-sm font-semibold text-slate-700">
              No availability yet.
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Add your first bookable time above.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {availability.map((slot) => {
              const isBooked =
                slot.status === "Booked";

              const isAvailable =
                slot.status === "Available";

              const isRemoving =
                removingId === slot.id;

              return (
                <div
                  key={slot.id}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      {formatDate(slot.startTime)}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {formatTime(slot.startTime)}{" "}
                      –{" "}
                      {formatTime(slot.endTime)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                        slot.status,
                      )}`}
                    >
                      {slot.status}
                    </span>

                    {isAvailable ? (
                      <button
                        type="button"
                        onClick={() =>
                          removeSlot(slot.id)
                        }
                        disabled={isRemoving}
                        aria-label={`Remove availability for ${formatDate(
                          slot.startTime,
                        )} at ${formatTime(
                          slot.startTime,
                        )}`}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isRemoving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    ) : null}

                    {isBooked ? (
                      <span className="text-xs text-slate-400">
                        Booked
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}