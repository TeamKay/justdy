"use client";

import {
  Check,
  Clock3,
  Pencil,
  Ban,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";

type AvailabilityStatus = "Available" | "Booked" | "Blocked";

type AvailabilityItem = {
  id: string;
  startTime: string;
  endTime: string;
  status: AvailabilityStatus;
  recurringRuleId?: string | null;
  createdAt: string;
  updatedAt: string;
};

type RecurringRuleItem = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timeZone: string;
  active: boolean;
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
  initialRecurringRules: RecurringRuleItem[];
  publishedServices: ServiceItem[];
};

const DAYS = [
  { value: 0, label: "Sunday", short: "Sun" },
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
];

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string =>
      typeof item === "string" && item.trim().length > 0,
  );
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


function dayName(dayOfWeek: number) {
  return DAYS.find((day) => day.value === dayOfWeek)?.label ?? "Unknown day";
}


export default function EducatorAvailabilityStudio({
  profile,
  initialAvailability,
  initialRecurringRules,
}: Props) {
  const [availability, setAvailability] =
    useState<AvailabilityItem[]>(initialAvailability);

  const [recurringRules, setRecurringRules] =
    useState<RecurringRuleItem[]>(initialRecurringRules);

  const [startTime, setStartTime] = useState(getDefaultStart);
  const [endTime, setEndTime] = useState(getDefaultEnd);

  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [isAvailable24Hours, setIsAvailable24Hours] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [openActionId, setOpenActionId] = useState<string | null>(null);

  const [isAddAvailabilityOpen, setIsAddAvailabilityOpen] =
    useState(false);

  const [editingAvailability, setEditingAvailability] =
    useState<AvailabilityItem | null>(null);

  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");

  const [isEditing, setIsEditing] = useState(false);

  const [editingRecurringRule, setEditingRecurringRule] =
    useState<RecurringRuleItem | null>(null);
  const [editRecurringDay, setEditRecurringDay] = useState<number>(1);
  const [editRecurringStartTime, setEditRecurringStartTime] = useState("");
  const [editRecurringEndTime, setEditRecurringEndTime] = useState("");
  const [isEditingRecurring, setIsEditingRecurring] = useState(false);

  const subjects = useMemo(
    () => toStringArray(profile.subjects),
    [profile.subjects],
  );

  const gradeLevels = useMemo(
    () => toStringArray(profile.gradeLevels),
    [profile.gradeLevels],
  );

  const concreteAvailability = useMemo(
    () => availability.filter((slot) => !slot.recurringRuleId),
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
    };
  }, [concreteAvailability]);

  function toggleDay(day: number) {
    setSelectedDays((current) =>
      current.includes(day)
        ? current.filter((item) => item !== day)
        : [...current, day].sort((a, b) => a - b),
    );
  }

  function closeAddAvailability() {
    if (isCreating) {
      return;
    }

    setIsAddAvailabilityOpen(false);
  }

  async function createAvailability(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (selectedDays.length === 0) {
      toast.error("Please select at least one day.");
      return;
    }

    const startTemplate = new Date(`1970-01-01T${startTime}`);
    const endTemplate = new Date(`1970-01-01T${endTime}`);

    if (
      Number.isNaN(startTemplate.getTime()) ||
      Number.isNaN(endTemplate.getTime())
    ) {
      toast.error("Please enter a valid start and end time.");
      return;
    }

    if (endTemplate <= startTemplate) {
      toast.error("The end time must be after the start time.");
      return;
    }

    const durationMinutes =
      (endTemplate.getTime() - startTemplate.getTime()) / 60000;

    if (durationMinutes < 15) {
      toast.error("Availability must be at least 15 minutes long.");
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch(
        "/api/educator/availability",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            daysOfWeek: selectedDays,
            startTime,
            endTime,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to create recurring availability.",
        );
      }

      if (Array.isArray(data.recurringRules)) {
        setRecurringRules((current) => {
          const merged = [...current, ...data.recurringRules];

          return merged.filter(
            (rule, index, array) =>
              array.findIndex((item) => item.id === rule.id) === index,
          );
        });
      }

      const dayCount = selectedDays.length;

      toast.success(
        `${dayCount} recurring ${dayCount === 1 ? "schedule" : "schedules"} added. They will repeat every week automatically.`,
      );

      setSelectedDays([]);
      setIsAddAvailabilityOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to create recurring availability.");
    } finally {
      setIsCreating(false);
    }
  }


  function closeEditAvailability() {
    if (isEditing) {
      return;
    }

    setEditingAvailability(null);
    setEditStartTime("");
    setEditEndTime("");
  }

  async function updateAvailability(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!editingAvailability) {
      return;
    }

    const start = new Date(editStartTime);
    const end = new Date(editEndTime);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
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

    const durationMinutes =
      (end.getTime() - start.getTime()) / 60000;

    if (durationMinutes < 15) {
      toast.error("Availability slots must be at least 15 minutes long.");
      return;
    }

    setIsEditing(true);

    try {
      const response = await fetch(
        "/api/educator/availability",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: editingAvailability.id,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to update availability.",
        );
      }

      if (data.availability) {
        setAvailability((current) =>
          current
            .map((slot) =>
              slot.id === data.availability.id
                ? data.availability
                : slot,
            )
            .sort(
              (a, b) =>
                new Date(a.startTime).getTime() -
                new Date(b.startTime).getTime(),
            ),
        );
      }

      setEditingAvailability(null);
      setEditStartTime("");
      setEditEndTime("");

      toast.success("Availability updated successfully.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to update availability.");
    } finally {
      setIsEditing(false);
    }
  }


  function openEditRecurringRule(rule: RecurringRuleItem) {
    setEditingRecurringRule(rule);
    setEditRecurringDay(rule.dayOfWeek);
    setEditRecurringStartTime(rule.startTime);
    setEditRecurringEndTime(rule.endTime);
  }

  function closeEditRecurringRule() {
    if (isEditingRecurring) {
      return;
    }

    setEditingRecurringRule(null);
    setEditRecurringDay(1);
    setEditRecurringStartTime("");
    setEditRecurringEndTime("");
  }

  async function updateRecurringRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingRecurringRule) {
      return;
    }

    const start = new Date(`1970-01-01T${editRecurringStartTime}`);
    const end = new Date(`1970-01-01T${editRecurringEndTime}`);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      !/^\\d{2}:\\d{2}$/.test(editRecurringStartTime) ||
      !/^\\d{2}:\\d{2}$/.test(editRecurringEndTime)
    ) {
      toast.error("Please enter valid start and end times.");
      return;
    }

    if (end <= start) {
      toast.error("The end time must be after the start time.");
      return;
    }

    if ((end.getTime() - start.getTime()) / 60000 < 15) {
      toast.error("Availability must be at least 15 minutes long.");
      return;
    }

    setIsEditingRecurring(true);

    try {
      const response = await fetch("/api/educator/availability", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ruleId: editingRecurringRule.id,
          dayOfWeek: editRecurringDay,
          startTime: editRecurringStartTime,
          endTime: editRecurringEndTime,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to update recurring availability.",
        );
      }

      if (data.recurringRule) {
        setRecurringRules((current) =>
          current
            .map((rule) =>
              rule.id === data.recurringRule.id
                ? data.recurringRule
                : rule,
            )
            .sort(
              (a, b) =>
                a.dayOfWeek - b.dayOfWeek ||
                a.startTime.localeCompare(b.startTime),
            ),
        );
      }

      toast.success("Weekly availability updated successfully.");
      closeEditRecurringRule();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to update recurring availability.");
    } finally {
      setIsEditingRecurring(false);
    }
  }

  async function blockRecurringRule(id: string) {

    try {
      const response = await fetch("/api/educator/availability", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ruleId: id,
          active: false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to block recurring availability.",
        );
      }

      if (data.recurringRule) {
        setRecurringRules((current) =>
          current.map((rule) =>
            rule.id === data.recurringRule.id
              ? data.recurringRule
              : rule,
          ),
        );
      }

      toast.success("Weekly availability blocked successfully.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to block recurring availability.");
    } finally {
      setOpenActionId(null);
    }
  }

  async function deleteRecurringRule(id: string) {

    try {
      const response = await fetch(
        "/api/educator/availability",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ruleId: id,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to remove recurring schedule.",
        );
      }

      setRecurringRules((current) =>
        current.filter((rule) => rule.id !== id),
      );

      setAvailability((current) =>
        current.filter((slot) => slot.recurringRuleId !== id),
      );

      toast.success(
        "Recurring schedule removed. Existing booked sessions were preserved.",
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to remove recurring schedule.");
    }
  }



  return (
    <div className="space-y-4">
      {/* Hero */}
      <section className="overflow-hidden shadow-sm">
        <div className="relative px-0 py-0 sm:px-8 lg:px-0 lg:py-5">
          <div className="absolute right-0 top-0 h-48 w-48 rounded-sm blur-3xl" />

          <div className="relative max-w-4xl">
            <div className="mt-0 flex flex-wrap gap-2">
              {subjects.slice(0, 5).map((subject) => (
                <span
                  key={subject}
                  className="rounded-sm bg-card border border-emerald-900 px-3 py-1.5 text-xs font-medium text-white"
                >
                  {subject}
                </span>
              ))}

              {gradeLevels.slice(0, 4).map((gradeLevel) => (
                <span
                  key={gradeLevel}
                  className="rounded-sm bg-card border border-emerald-900 px-3 py-1.5 text-xs font-medium text-white"
                >
                  {gradeLevel}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

    

      {/* Main workspace */}
      <section className="grid w-full gap-6">
        {/* Schedule */}
        <div className="w-full rounded-sm border border-emerald-950 bg-card shadow-sm">
          <div className="border-b border-emerald-950 px-6 py-5 sm:px-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="mt-1 text-xl font-semibold text-white">
                  Upcoming Availability
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-none px-3 py-1.5 text-xs font-medium text-white">
                  {stats.available} open{" "}
                  {stats.available === 1 ? "slot" : "slots"}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsAddAvailabilityOpen(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-sm bg-emerald-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-950"
                >
                  <Plus className="h-4 w-4" />
                  Add availability
                </button>
              </div>
            </div>
          </div>

          <div className="border-b border-emerald-950 rounded-sm p-2 sm:p-2">
            {recurringRules.length === 0 ? (
              <p className="mt-0 text-sm text-slate-500">
                No weekly schedules have been added yet.
              </p>
            ) : (
              <div className="mt-4 overflow-hidden rounded-sm border border-emerald-950">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-190 border-collapse">
                    <thead>
                      <tr className="border-b border-emerald-900 bg-emerald-950">
                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-white">
                          Day
                        </th>
                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-white">
                          Time range
                        </th>
                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-white">
                          Hours
                        </th>
                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-white">
                          Status
                        </th>
                        <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-white">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-emerald-950 bg-card">
                      {recurringRules.map((rule) => {
                        const [startHour, startMinute] = rule.startTime
                          .split(":")
                          .map(Number);
                        const [endHour, endMinute] = rule.endTime
                          .split(":")
                          .map(Number);

                        const durationMinutes =
                          endHour * 60 +
                          endMinute -
                          (startHour * 60 + startMinute);

                        const hours = durationMinutes / 60;
                        const hoursLabel =
                          Number.isInteger(hours)
                            ? `${hours} hr`
                            : `${hours.toFixed(2)} hr`;

                        const actionsOpen = openActionId === rule.id;

                        return (
                          <tr
                            key={rule.id}
                            className="transition hover:bg-emerald-900"
                          >
                            <td className="px-5 py-4">
                              <span className="text-sm font-semibold text-white">
                                {dayName(rule.dayOfWeek)}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <span className="text-sm font-semibold text-white">
                                {rule.startTime} – {rule.endTime}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <span className="text-sm text-white">
                                {hoursLabel}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <RecurringStatusBadge active={rule.active} />
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => openEditRecurringRule(rule)}
                                  className="inline-flex items-center gap-1.5 rounded-none px-2.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-100 hover:text-slate-900"
                                  title="Edit weekly schedule"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() => deleteRecurringRule(rule.id)}
                                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                                  title="Delete weekly schedule"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete
                                </button>

                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setOpenActionId(
                                        actionsOpen ? null : rule.id,
                                      )
                                    }
                                    disabled={!rule.active}
                                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-amber-600 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    title={
                                      rule.active
                                        ? "Block weekly schedule"
                                        : "Schedule already blocked"
                                    }
                                  >
                                    <Ban className="h-3.5 w-3.5" />
                                    Block
                                  </button>

                                  {actionsOpen && rule.active ? (
                                    <div className="absolute right-0 top-10 z-30 w-48 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-xl">
                                      <p className="text-xs leading-5 text-slate-500">
                                        Blocking this schedule stops future
                                        occurrences from being bookable.
                                      </p>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          blockRecurringRule(rule.id)
                                        }
                                        className="mt-3 w-full rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                                      >
                                        Confirm block
                                      </button>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          </div>
          <div className="p-4 sm:p-6">
          </div>
        </section>


      {/* Add Availability Modal */}
      {isAddAvailabilityOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeAddAvailability();
            }
          }}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-sm bg-card border border-emerald-950 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-availability-title"
          >
            

          
            <form
              onSubmit={createAvailability}
              className="space-y-6 p-6"
            >
              <div>
                <label className="mb-3 block text-sm font-medium text-white/90">
                  Available days
                </label>

                {/* 24/7 availability option */}
                <label
                  className={`mb-4 flex cursor-pointer items-center gap-3 rounded-sm border p-4 transition ${
                    isAvailable24Hours
                      ? "border-violet-600 bg-violet-600/10"
                      : "border-emerald-950 bg-card hover:border-emerald-900"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isAvailable24Hours}
                    onChange={(event) => {
                      const checked = event.target.checked;

                      setIsAvailable24Hours(checked);

                      if (checked) {
                        // Select all 7 days
                        setSelectedDays(DAYS.map((day) => day.value));

                        // Full-day availability
                        setStartTime("00:00");
                        setEndTime("23:59");
                      }
                    }}
                    className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-600"
                  />

                  <div>
                    <p className="text-sm font-semibold text-white">
                      Available 24 hours a day, 7 days a week
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      I am ready and available for tutoring at any time, every day.
                    </p>
                  </div>
                </label>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {DAYS.map((day) => {
                    const selected = selectedDays.includes(day.value);

                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleDay(day.value)}
                        disabled={isAvailable24Hours}
                        className={`rounded-sm border px-3 py-2 text-sm font-semibold transition ${
                          selected
                            ? "border-violet-600 bg-violet-600 text-white shadow-sm"
                            : "border-emerald-950 bg-card text-white/80 hover:border-emerald-900 hover:bg-emerald-900"
                        } ${
                          isAvailable24Hours
                            ? "cursor-not-allowed opacity-70"
                            : ""
                        }`}
                      >
                        {day.short}
                      </button>
                    );
                  })}
                </div>

                <p className="mt-2 text-xs text-muted-foreground">
                  {isAvailable24Hours
                    ? "You are marked as available 24 hours a day, 7 days a week."
                    : "You can select multiple days."}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="startTime"
                    className="mb-2 block text-sm font-medium text-white/90"
                  >
                    Start time
                  </label>

                  <input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(event) =>
                      setStartTime(event.target.value)
                    }
                    required
                    disabled={isAvailable24Hours}
                    className="w-full rounded-sm border border-emerald-950 bg-card px-3 py-2.5 text-sm text-white/90 outline-none transition disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                <div>
                  <label
                    htmlFor="endTime"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    End time
                  </label>

                  <input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(event) =>
                      setEndTime(event.target.value)
                    }
                    required
                    disabled={isAvailable24Hours}
                    className="w-full rounded-sm border border-emerald-950 bg-card px-3 py-2.5 text-sm text-white/90 outline-none transition disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="rounded-sm bg-background p-4">
                <div className="flex gap-3">
                  <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                  <div>
                    <p className="text-xs font-semibold text-slate-700">
                      {isAvailable24Hours
                        ? "24/7 tutoring availability"
                        : "Flexible session length"}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {isAvailable24Hours
                        ? "You are available for tutoring at any time, every day of the week. Learners will see your availability throughout the entire week."
                        : "The selected time represents when you are available. Learners will select a compatible service during booking."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-white/50 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeAddAvailability}
                  disabled={isCreating}
                  className="inline-flex items-center justify-center rounded-sm border border-emerald-950 bg-card px-5 py-3 text-sm font-semibold text-white/50 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isCreating}
                  className="inline-flex items-center justify-center gap-2 rounded-sm bg-emerald-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Add availability
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Edit Weekly Schedule Modal */}
      {editingRecurringRule && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeEditRecurringRule();
            }
          }}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-recurring-title"
          >
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                    <Pencil className="h-5 w-5" />
                  </div>
                  <div>
                    <h2
                      id="edit-recurring-title"
                      className="text-lg font-semibold text-slate-950"
                    >
                      Edit weekly schedule
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Update the recurring day and time.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={closeEditRecurringRule}
                disabled={isEditingRecurring}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={updateRecurringRule}
              className="space-y-6 p-6"
            >
              <div>
                <label
                  htmlFor="editRecurringDay"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Day
                </label>
                <select
                  id="editRecurringDay"
                  value={editRecurringDay}
                  onChange={(event) =>
                    setEditRecurringDay(Number(event.target.value))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
                >
                  {DAYS.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="editRecurringStartTime"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Start time
                  </label>
                  <input
                    id="editRecurringStartTime"
                    type="time"
                    value={editRecurringStartTime}
                    onChange={(event) =>
                      setEditRecurringStartTime(event.target.value)
                    }
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
                  />
                </div>

                <div>
                  <label
                    htmlFor="editRecurringEndTime"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    End time
                  </label>
                  <input
                    id="editRecurringEndTime"
                    type="time"
                    value={editRecurringEndTime}
                    onChange={(event) =>
                      setEditRecurringEndTime(event.target.value)
                    }
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeEditRecurringRule}
                  disabled={isEditingRecurring}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isEditingRecurring}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isEditingRecurring ? (
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
      )}

      {/* Edit Availability Modal */}
      {editingAvailability && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeEditAvailability();
            }
          }}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-availability-title"
          >
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                    <Pencil className="h-5 w-5" />
                  </div>

                  <div>
                    <h2
                      id="edit-availability-title"
                      className="text-lg font-semibold text-slate-950"
                    >
                      Edit availability
                    </h2>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Update the date and time for this slot.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={closeEditAvailability}
                disabled={isEditing}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={updateAvailability}
              className="space-y-6 p-6"
            >
              <div>
                <label
                  htmlFor="editStartTime"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Start
                </label>

                <input
                  id="editStartTime"
                  type="datetime-local"
                  value={editStartTime}
                  onChange={(event) =>
                    setEditStartTime(event.target.value)
                  }
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
                />
              </div>

              <div>
                <label
                  htmlFor="editEndTime"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  End
                </label>

                <input
                  id="editEndTime"
                  type="datetime-local"
                  value={editEndTime}
                  onChange={(event) =>
                    setEditEndTime(event.target.value)
                  }
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeEditAvailability}
                  disabled={isEditing}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isEditing}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
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
      )}
    </div>
  );
}


function RecurringStatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      {active ? "Available" : "Blocked"}
    </span>
  );
}






