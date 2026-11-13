"use client";

import {
  Check,
  Clock3,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { toast } from "sonner";

type AvailabilityStatus = "Available" | "Booked" | "Blocked";

type AvailabilityItem = {
  id: string;
  startTime: string;
  endTime: string;
  status: AvailabilityStatus;
  type?: "ONE_OFF" | "RECURRING" | "OCCURRENCE";
  recurrenceKey?: string | null;
  isAlwaysAvailable?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type ServiceItem = {
  id: string;
  title: string;
  subject: string | null;
  durationMinutes: number | null;
  price: number | null;
  currency: string;
  status: string;
};

type Profile = {
  id: string;
  headline: string | null;
  specialty: string | null;
  verificationStatus: string;
  subjects: unknown;
  gradeLevels: unknown;
};

type Props = {
  profile: Profile;
  initialAvailability: AvailabilityItem[];
  initialRecurringRules?: unknown[];
  publishedServices: ServiceItem[];
};

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

type WeeklyDay = {
  key: DayKey;
  label: string;
  shortLabel: string;
  selected: boolean;
  startTime: string;
  endTime: string;
};

type WeeklyRule = {
  id: string;
  day: DayKey;
  dayLabel: string;
  startTime: string;
  endTime: string;
  isAlwaysAvailable: boolean;
};

const DAYS: WeeklyDay[] = [
  {
    key: "mon",
    label: "Monday",
    shortLabel: "Mon",
    selected: false,
    startTime: "09:00",
    endTime: "17:00",
  },
  {
    key: "tue",
    label: "Tuesday",
    shortLabel: "Tue",
    selected: false,
    startTime: "09:00",
    endTime: "17:00",
  },
  {
    key: "wed",
    label: "Wednesday",
    shortLabel: "Wed",
    selected: false,
    startTime: "09:00",
    endTime: "17:00",
  },
  {
    key: "thu",
    label: "Thursday",
    shortLabel: "Thu",
    selected: false,
    startTime: "09:00",
    endTime: "17:00",
  },
  {
    key: "fri",
    label: "Friday",
    shortLabel: "Fri",
    selected: false,
    startTime: "09:00",
    endTime: "17:00",
  },
  {
    key: "sat",
    label: "Saturday",
    shortLabel: "Sat",
    selected: false,
    startTime: "09:00",
    endTime: "17:00",
  },
  {
    key: "sun",
    label: "Sunday",
    shortLabel: "Sun",
    selected: false,
    startTime: "09:00",
    endTime: "17:00",
  },
];

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (item): item is string =>
      typeof item === "string" && item.trim().length > 0,
  );
}

function formatTimeValue(value: string) {
  if (value === "24:00") return "11:59 PM +";

  const [hourString, minuteString] = value.split(":");
  const hour = Number(hourString);
  const minute = Number(minuteString);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return value;

  const date = new Date();
  date.setHours(hour, minute, 0, 0);

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatDurationFromClock(startTime: string, endTime: string) {
  if (startTime === "00:00" && endTime === "24:00") return "24 hr";

  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  if (
    !Number.isFinite(startHour) ||
    !Number.isFinite(startMinute) ||
    !Number.isFinite(endHour) ||
    !Number.isFinite(endMinute)
  ) {
    return "";
  }

  let minutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);

  // Allow a schedule such as 10:00 PM → 2:00 AM.
  if (minutes <= 0) minutes += 24 * 60;

  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  return remainder === 0 ? `${hours} hr` : `${hours} hr ${remainder} min`;
}

function toLocalDateTimeInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function getDefaultStart() {
  const date = new Date();
  date.setMinutes(date.getMinutes() + 60);
  date.setSeconds(0);
  date.setMilliseconds(0);
  return toLocalDateTimeInput(date);
}

function getDefaultEnd() {
  const date = new Date();
  date.setMinutes(date.getMinutes() + 120);
  date.setSeconds(0);
  date.setMilliseconds(0);
  return toLocalDateTimeInput(date);
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatDuration(startTime: string, endTime: string) {
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "";
  }

  const minutes = Math.round((end.getTime() - start.getTime()) / 60000);

  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (remainder === 0) return `${hours} hr`;

  return `${hours} hr ${remainder} min`;
}

export default function EducatorAvailabilityStudio({
  profile,
  initialAvailability,
  initialRecurringRules = [],
}: Props) {
  const [availability, setAvailability] =
    useState<AvailabilityItem[]>(initialAvailability);

  const [isAddAvailabilityOpen, setIsAddAvailabilityOpen] = useState(false);

  const [isCreating, setIsCreating] = useState(false);

  const [editingAvailability, setEditingAvailability] =
    useState<AvailabilityItem | null>(null);

  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [weeklyDays, setWeeklyDays] = useState<WeeklyDay[]>(DAYS);
  const [is24x7, setIs24x7] = useState(false);
  const [editingWeeklyRuleId, setEditingWeeklyRuleId] = useState<string | null>(
    null,
  );
  function normalizeRecurringRules(value: unknown[]): WeeklyRule[] {
    return value.flatMap((item): WeeklyRule[] => {
      if (typeof item !== "object" || item === null || Array.isArray(item)) {
        return [];
      }

      const rule = item as Record<string, unknown>;
      const dayOfWeek = Number(rule.dayOfWeek);
      if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6)
        return [];

      const day = DAYS.find(
        (candidate) =>
          ["sun", "mon", "tue", "wed", "thu", "fri", "sat"].indexOf(
            candidate.key,
          ) === dayOfWeek,
      );
      if (!day) return [];

      return [
        {
          id: String(rule.id ?? ""),
          day: day.key,
          dayLabel: day.label,
          startTime: Boolean(rule.isAlwaysAvailable)
            ? "00:00"
            : String(rule.weeklyStartTime ?? rule.startTime ?? "09:00"),
          endTime: Boolean(rule.isAlwaysAvailable)
            ? "00:00"
            : String(rule.weeklyEndTime ?? rule.endTime ?? "17:00"),
          isAlwaysAvailable: Boolean(rule.isAlwaysAvailable),
        },
      ];
    });
  }

  const [weeklyRules, setWeeklyRules] = useState<WeeklyRule[]>(() =>
    normalizeRecurringRules(initialRecurringRules),
  );

  const subjects = useMemo(
    () => toStringArray(profile.subjects),
    [profile.subjects],
  );

  const gradeLevels = useMemo(
    () => toStringArray(profile.gradeLevels),
    [profile.gradeLevels],
  );

  const concreteAvailability = useMemo(
    () =>
      [...availability]
        .filter((slot) => slot.type === "ONE_OFF" || !slot.type)
        .sort(
          (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
        ),
    [availability],
  );

  const stats = useMemo(() => {
    const available = concreteAvailability.filter(
      (slot) => slot.status === "Available",
    ).length;

    const booked = concreteAvailability.filter(
      (slot) => slot.status === "Booked",
    ).length;

    const blocked = concreteAvailability.filter(
      (slot) => slot.status === "Blocked",
    ).length;

    return {
      total: concreteAvailability.length,
      available,
      booked,
      blocked,
      weekly: weeklyRules.length,
    };
  }, [concreteAvailability, weeklyRules.length]);

  const selectedDayCount = weeklyDays.filter((day) => day.selected).length;

  function toggleDay(day: DayKey) {
    if (is24x7) return;

    setWeeklyDays((current) =>
      current.map((item) =>
        item.key === day ? { ...item, selected: !item.selected } : item,
      ),
    );
  }

  function updateDayTime(
    day: DayKey,
    field: "startTime" | "endTime",
    value: string,
  ) {
    setWeeklyDays((current) =>
      current.map((item) =>
        item.key === day ? { ...item, [field]: value } : item,
      ),
    );
  }

  function selectAllDays() {
    if (is24x7) return;

    setWeeklyDays((current) =>
      current.map((day) => ({ ...day, selected: true })),
    );
  }

  function clearDays() {
    if (is24x7) return;

    setWeeklyDays((current) =>
      current.map((day) => ({ ...day, selected: false })),
    );
  }

  function closeAddAvailability() {
    if (isCreating) return;

    setIsAddAvailabilityOpen(false);
    setIs24x7(false);
    setEditingWeeklyRuleId(null);
    setWeeklyDays(DAYS);
  }

  function validateWeeklySchedule() {
    if (!is24x7 && selectedDayCount === 0) {
      toast.error("Select at least one day.");
      return false;
    }

    if (!is24x7) {
      for (const day of weeklyDays.filter((item) => item.selected)) {
        const [startHour, startMinute] = day.startTime.split(":").map(Number);
        const [endHour, endMinute] = day.endTime.split(":").map(Number);

        const start = startHour * 60 + startMinute;
        let end = endHour * 60 + endMinute;

        if (end <= start) end += 24 * 60;

        if (end - start < 15) {
          toast.error(`${day.label} must be at least 15 minutes long.`);
          return false;
        }
      }
    }

    return true;
  }

  function dayNumber(day: DayKey) {
    return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"].indexOf(day);
  }

  async function refreshWeeklyAvailability() {
    const response = await fetch("/api/educator/availability", {
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data?.error || "Unable to refresh availability.");

    if (Array.isArray(data.availability)) {
      setAvailability(data.availability);
    }
    if (Array.isArray(data.recurringRules)) {
      setWeeklyRules(normalizeRecurringRules(data.recurringRules));
    }
  }

  async function saveWeeklyAvailability(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateWeeklySchedule()) {
      return;
    }

    setIsCreating(true);

    try {
      const timeZone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

      /*
       * 24/7 availability is intentionally NOT recurring.
       *
       * The API creates exactly seven concrete ONE_OFF rows:
       * one full local calendar day for each of the next seven days.
       *
       * This prevents 24/7 from being expanded into hundreds of
       * recurring occurrences.
       */
      if (is24x7) {
        const response = await fetch("/api/educator/availability", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isAlwaysAvailable: true,
            timeZone,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Unable to save 24/7 availability.");
        }

        await refreshWeeklyAvailability();

        toast.success(
          "24/7 availability saved as seven full-day availability records.",
        );

        closeAddAvailability();

        return;
      }

      /*
       * Only save the days that the educator selected.
       */
      const selectedDays = weeklyDays.filter((day) => day.selected);

      if (selectedDays.length === 0) {
        toast.error("Select at least one day.");
        return;
      }

      /*
       * When editing an existing rule, PATCH that rule.
       *
       * The API's PATCH endpoint edits one recurring rule at a time.
       */
      if (editingWeeklyRuleId) {
        const day = selectedDays[0];

        const response = await fetch("/api/educator/availability", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ruleId: editingWeeklyRuleId,
            dayOfWeek: dayNumber(day.key),
            startTime: day.startTime,
            endTime: day.endTime,
            isAlwaysAvailable: false,
            timeZone,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Unable to update availability.");
        }

        await refreshWeeklyAvailability();

        toast.success("Availability updated.");

        closeAddAvailability();

        return;
      }

      /*
       * Create one recurring Availability rule for each
       * selected day.
       *
       * This is important because each day can have a
       * different start/end time.
       */
      for (const day of selectedDays) {
        const response = await fetch("/api/educator/availability", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            daysOfWeek: [dayNumber(day.key)],
            startTime: day.startTime,
            endTime: day.endTime,
            isAlwaysAvailable: false,
            timeZone,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error || `Unable to save ${day.label} availability.`,
          );
        }
      }

      await refreshWeeklyAvailability();

      toast.success(
        `${selectedDays.length} weekly ${
          selectedDays.length === 1 ? "day" : "days"
        } saved.`,
      );

      closeAddAvailability();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save availability.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function createConcreteAvailability(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const startValue = String(form.get("startTime") || "");
    const endValue = String(form.get("endTime") || "");

    const start = new Date(startValue);
    const end = new Date(endValue);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      toast.error("Please enter a valid start and end time.");
      return;
    }

    if (start <= new Date()) {
      toast.error("Availability must be scheduled for a future time.");
      return;
    }

    if (end <= start) {
      toast.error("The end time must be after the start time.");
      return;
    }

    const durationMinutes = (end.getTime() - start.getTime()) / 60000;

    if (durationMinutes < 15) {
      toast.error("Availability must be at least 15 minutes long.");
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch("/api/tutoring/slots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to create availability.");
      }

      if (data.slot) {
        setAvailability((current) =>
          [...current, data.slot].sort(
            (a, b) =>
              new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
          ),
        );
      }

      toast.success("Availability added successfully.");
      setIsAddAvailabilityOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to create availability.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  function openEditAvailability(slot: AvailabilityItem) {
    if (slot.status !== "Available") {
      toast.error("Only available slots can be edited.");
      return;
    }

    setEditingAvailability(slot);
    setEditStartTime(toLocalDateTimeInput(new Date(slot.startTime)));
    setEditEndTime(toLocalDateTimeInput(new Date(slot.endTime)));
  }

  function closeEditAvailability() {
    if (isEditing) return;

    setEditingAvailability(null);
    setEditStartTime("");
    setEditEndTime("");
  }

  async function updateAvailability(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingAvailability) return;

    const start = new Date(editStartTime);
    const end = new Date(editEndTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      toast.error("Please enter a valid start and end time.");
      return;
    }

    if (start <= new Date()) {
      toast.error("Availability must be scheduled for a future time.");
      return;
    }

    if (end <= start) {
      toast.error("The end time must be after the start time.");
      return;
    }

    const durationMinutes = (end.getTime() - start.getTime()) / 60000;

    if (durationMinutes < 15) {
      toast.error("Availability must be at least 15 minutes long.");
      return;
    }

    setIsEditing(true);

    try {
      const response = await fetch("/api/tutoring/slots", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingAvailability.id,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to update availability.");
      }

      if (data.availability) {
        setAvailability((current) =>
          current
            .map((slot) =>
              slot.id === data.availability.id ? data.availability : slot,
            )
            .sort(
              (a, b) =>
                new Date(a.startTime).getTime() -
                new Date(b.startTime).getTime(),
            ),
        );
      }

      closeEditAvailability();
      toast.success("Availability updated successfully.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update availability.",
      );
    } finally {
      setIsEditing(false);
    }
  }

  async function deleteAvailability(id: string) {
    const slot = availability.find((item) => item.id === id);

    if (!slot) return;

    if (slot.status !== "Available") {
      toast.error(
        slot.status === "Booked"
          ? "Booked availability cannot be deleted."
          : "Only available slots can be deleted.",
      );
      return;
    }

    const confirmed = window.confirm(
      "Remove this availability slot? Learners will no longer be able to book it.",
    );

    if (!confirmed) return;

    setDeletingId(id);

    try {
      const response = await fetch("/api/tutoring/slots", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to delete availability.");
      }

      setAvailability((current) => current.filter((item) => item.id !== id));

      toast.success("Availability removed.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to delete availability.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  function editWeeklyRule(rule: WeeklyRule) {
    setEditingWeeklyRuleId(rule.id);
    setIs24x7(rule.isAlwaysAvailable);
    setWeeklyDays(
      DAYS.map((day) => ({
        ...day,
        selected: day.key === rule.day,
        startTime: day.key === rule.day ? rule.startTime : day.startTime,
        endTime: day.key === rule.day ? rule.endTime : day.endTime,
      })),
    );
    setIsAddAvailabilityOpen(true);
  }

  async function deleteWeeklyRule(rule: WeeklyRule) {
    const confirmed = window.confirm(
      `Remove ${rule.dayLabel} from your weekly availability?`,
    );
    if (!confirmed) return;

    setDeletingId(rule.id);
    try {
      const response = await fetch("/api/educator/availability", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ruleId: rule.id }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data?.error || "Unable to remove availability.");

      await refreshWeeklyAvailability();
      toast.success("Weekly availability removed.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to remove availability.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6 mt-10">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              {subjects.slice(0, 5).map((subject) => (
                <span
                  key={subject}
                  className="rounded-lg bg-slate-300 px-3 py-1 text-xs font-medium text-slate-700"
                >
                  {subject}
                </span>
              ))}
              {gradeLevels.slice(0, 4).map((gradeLevel) => (
                <span
                  key={gradeLevel}
                  className="rounded-lg bg-slate-300 px-3 py-1 text-xs font-medium text-slate-700"
                >
                  {gradeLevel}
                </span>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAddAvailabilityOpen(true)}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950/20"
          >
            <Plus className="h-4 w-4" />
            Add availability
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Weekly availability
            </h2>
          </div>

          {weeklyRules.length > 0 ? (
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Active schedule
            </span>
          ) : (
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
              No weekly hours
            </span>
          )}
        </div>

        {weeklyRules.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <Clock3 className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-slate-950">
              No weekly availability yet
            </h3>
            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
              Add your regular days and hours so learners know when you are
              normally available.
            </p>
            <button
              type="button"
              onClick={() => setIsAddAvailabilityOpen(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              Set weekly availability
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <TableHead>Day</TableHead>
                  <TableHead>Start time</TableHead>
                  <TableHead>End time</TableHead>
                  <TableHead>Total duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead align="right">Action</TableHead>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {weeklyRules.map((rule) => (
                  <tr key={rule.id} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-700">
                          {rule.dayLabel.slice(0, 2)}
                        </div>
                        <span className="text-sm font-semibold text-slate-900">
                          {rule.dayLabel}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600 sm:px-6">
                      {formatTimeValue(rule.startTime)}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600 sm:px-6">
                      {formatTimeValue(rule.endTime)}
                    </td>

                    <td className="px-5 py-4 sm:px-6">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {formatDurationFromClock(rule.startTime, rule.endTime)}
                      </span>
                    </td>

                    <td className="px-5 py-4 sm:px-6">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Available
                      </span>
                    </td>

                    <td className="px-5 py-4 sm:px-6">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => editWeeklyRule(rule)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteWeeklyRule(rule)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isAddAvailabilityOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeAddAvailability();
            }
          }}
        >
          <div
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-availability-title"
          >
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white/95 px-6 py-5 backdrop-blur sm:px-7">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-white shadow-sm">
                  <Plus className="h-5 w-5" />
                </div>

                <div>
                  <h2
                    id="add-availability-title"
                    className="text-lg font-semibold text-slate-950"
                  >
                    {editingWeeklyRuleId
                      ? "Edit weekly availability"
                      : "Add availability"}
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Choose the days and hours learners can book.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeAddAvailability}
                disabled={isCreating}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={saveWeeklyAvailability}
              className="space-y-7 p-6 sm:p-7"
            >
              <div>
                <div className="mb-3 flex items-center justify-between gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-950">
                      Days and hours
                    </label>
                    <p className="mt-1 text-xs text-slate-500">
                      Turn on a day, then choose its start and end time.
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-1.5">
                    <button
                      type="button"
                      onClick={selectAllDays}
                      disabled={is24x7}
                      className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={clearDays}
                      disabled={is24x7}
                      className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 disabled:opacity-40"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {weeklyDays.map((day) => (
                    <div
                      key={day.key}
                      className={[
                        "rounded-lg border p-3 transition sm:p-3.0",
                        day.selected && !is24x7
                          ? "border-slate-300 bg-emerald-100 shadow-sm"
                          : "border-slate-200 bg-slate-50/60",
                      ].join(" ")}
                    >
                      <div className="grid gap-3 sm:grid-cols-[150px_1fr_1fr] sm:items-center">
                        <button
                          type="button"
                          onClick={() => toggleDay(day.key)}
                          disabled={is24x7}
                          aria-pressed={day.selected}
                          className="flex items-center gap-3 text-left disabled:cursor-not-allowed"
                        >
                          <span
                            className={[
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition",
                              day.selected || is24x7
                                ? "bg-slate-950 text-white"
                                : "bg-white text-slate-500 ring-1 ring-slate-200",
                            ].join(" ")}
                          >
                            {day.shortLabel}
                          </span>

                          <span>
                            <span className="block text-sm font-semibold text-slate-900">
                              {day.label}
                            </span>
                            <span className="mt-0.5 block text-[11px] text-slate-400">
                              {day.selected || is24x7
                                ? "Available"
                                : "Unavailable"}
                            </span>
                          </span>
                        </button>

                        <div>
                          <label
                            htmlFor={`${day.key}-start`}
                            className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-slate-400"
                          >
                            Start
                          </label>
                          <input
                            id={`${day.key}-start`}
                            type="time"
                            value={is24x7 ? "00:00" : day.startTime}
                            disabled={!day.selected || is24x7}
                            onChange={(event) =>
                              updateDayTime(
                                day.key,
                                "startTime",
                                event.target.value,
                              )
                            }
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={`${day.key}-end`}
                            className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-slate-400"
                          >
                            End
                          </label>
                          <input
                            id={`${day.key}-end`}
                            type="time"
                            value={is24x7 ? "00:00" : day.endTime}
                            disabled={!day.selected || is24x7}
                            onChange={(event) =>
                              updateDayTime(
                                day.key,
                                "endTime",
                                event.target.value,
                              )
                            }
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      24/7 availability
                    </p>
                    <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">
                      Make every day active from midnight through the end of the
                      day.
                    </p>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={is24x7}
                    onClick={() => setIs24x7((current) => !current)}
                    className={[
                      "relative h-6 w-11 shrink-0 rounded-lg transition",
                      is24x7 ? "bg-slate-950" : "bg-slate-300",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "absolute top-1 h-4 w-4 rounded-lg bg-white shadow-sm transition",
                        is24x7 ? "left-6" : "left-1",
                      ].join(" ")}
                    />
                  </button>
                </div>
              </div>

              {is24x7 ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                      <Check className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-900">
                        24/7 is active
                      </p>
                      <p className="mt-1 text-xs leading-5 text-emerald-700">
                        All seven days will be marked available for the full
                        24-hour day.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeAddAvailability}
                  disabled={isCreating}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isCreating || (!is24x7 && selectedDayCount === 0)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isCreating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      {editingWeeklyRuleId
                        ? "Save changes"
                        : "Save availability"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {editingAvailability ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeEditAvailability();
            }
          }}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-availability-title"
          >
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-white">
                  <Pencil className="h-5 w-5" />
                </div>
                <div>
                  <h2
                    id="edit-availability-title"
                    className="text-lg font-semibold text-slate-950"
                  >
                    Edit availability
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Update this individual availability slot.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeEditAvailability}
                disabled={isEditing}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={updateAvailability} className="space-y-5 p-6">
              <TimeField
                id="edit-start-time"
                label="Start time"
                type="datetime-local"
                value={editStartTime}
                onChange={setEditStartTime}
              />

              <TimeField
                id="edit-end-time"
                label="End time"
                type="datetime-local"
                value={editEndTime}
                onChange={setEditEndTime}
              />

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeEditAvailability}
                  disabled={isEditing}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isEditing}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {isEditing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Save changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>
    </div>
  );
}

function TableHead({
  children,
  align = "left",
}: {
  children: ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={[
        "px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 sm:px-6",
        align === "right" ? "text-right" : "text-left",
      ].join(" ")}
    >
      {children}
    </th>
  );
}

function TimeField({
  id,
  label,
  value,
  onChange,
  type = "time",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "time" | "datetime-local";
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold text-slate-900"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5"
      />
    </div>
  );
}

function AvailabilityStatusBadge({ status }: { status: AvailabilityStatus }) {
  const config =
    status === "Available"
      ? {
          label: "Available",
          className: "bg-emerald-50 text-emerald-700",
        }
      : status === "Booked"
        ? {
            label: "Booked",
            className: "bg-blue-50 text-blue-700",
          }
        : {
            label: "Blocked",
            className: "bg-slate-100 text-slate-500",
          };

  return (
    <span
      className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}
