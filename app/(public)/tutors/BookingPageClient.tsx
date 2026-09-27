"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  loadStripe,
  type Stripe,
  type StripeCheckoutElementsSdk,
  type StripeCheckoutElementsSdkOptions,
  type StripeCheckoutLoadActionsSuccess,
  type StripePaymentElement,
} from "@stripe/stripe-js";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  LockKeyhole,
  Search,
  UserRound,
  Smartphone,

} from "lucide-react";

type Slot = {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  recurringRuleId?: string;
};

type BookingInterval = {
  startTime: string;
  endTime: string;
};

type TimeOption = {
  value: string;
  availabilityId: string;
  recurringRuleId?: string;
  startTime: string;
  endTime: string;
};

type Service = {
  id: string;
  title: string;
  description: string | null;
  durationMinutes: number | null;
  price: number | null;
  currency: string;
  subject: string | null;
  gradeLevels: unknown;
};

type PendingBookingDraft = {
  tutorId?: string;
  selectedDate?: string;
  sessionDuration?: number;
  startTime?: string;
  endTime?: string;
  subject?: string;
  gradeLevel?: string;
  topic?: string;
  description?: string;
  callback?: string;
};

type Tutor = {
  id: string;
  name: string;
  imageUrl: string | null;
  teachingProfile: {
    headline: string | null;
    specialty: string | null;
    experience: number | null;
    description: string | null;
    verificationStatus: string;
    hourlyRate: number | null;
    currency: string;
  };
  facilitatorProfile: {
    specialty: string | null;
    experience: number | null;
    description: string | null;
    verificationStatus: string;
  } | null;
  firstAvailableSlot: Slot | null;
  availabilities: Slot[];
  bookings: BookingInterval[];
  services: Service[];
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function localDateKey(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function formatDateKey(value: string) {
  const date = parseDateKey(value);

  return date
    ? date.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Select a date";
}

function combineDateAndTime(dateKey: string, timeValue: string) {
  if (!dateKey || !timeValue) return null;

  const date = parseDateKey(dateKey);
  if (!date) return null;

  const [hours, minutes] = timeValue.split(":").map(Number);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  date.setHours(hours, minutes, 0, 0);
  return date;
}

function startOfCalendarMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12, 0, 0, 0);
}

function calendarMonthLabel(date: Date) {
  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function ceilToQuarterHour(timestamp: number) {
  const quarterHour = 15 * 60 * 1000;
  return Math.ceil(timestamp / quarterHour) * quarterHour;
}

function getTimeOptions(
  dateKey: string,
  duration: number,
  availabilities: Slot[],
  bookings: BookingInterval[],
  nowMs: number,
): TimeOption[] {
  if (!dateKey || duration <= 0) return [];

  const date = parseDateKey(dateKey);
  if (!date) return [];

  const dayStart = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0,
    0,
    0,
    0,
  ).getTime();
  const dayEnd = dayStart + 24 * 60 * 60 * 1000;
  const options = new Map<string, TimeOption>();

  for (const availability of availabilities) {
  const availabilityStart = new Date(availability.startTime).getTime();
  const availabilityEnd = new Date(availability.endTime).getTime();

  if (
    Number.isNaN(availabilityStart) ||
    Number.isNaN(availabilityEnd) ||
    availabilityEnd <= availabilityStart
  ) {
    continue;
  }

  const todayKey = localDateKey(new Date(nowMs));
  const isToday = dateKey === todayKey;

  // Ignore availability that has completely expired.
  if (availabilityEnd <= nowMs) {
    continue;
  }

  // For today, never offer a time before the current moment.
  // For future dates, use the actual availability start.
  const windowStart = Math.max(
    availabilityStart,
    dayStart,
    isToday ? nowMs : dayStart,
  );

  const windowEnd = Math.min(
    availabilityEnd,
    dayEnd,
  );

  // There must be enough availability remaining for the selected session.
  if (windowEnd - windowStart < duration * 60_000) {
    continue;
  }

  let candidate = ceilToQuarterHour(windowStart);

  while (candidate + duration * 60_000 <= windowEnd) {
    const candidateEnd = candidate + duration * 60_000;

    const overlapsBooking = bookings.some((booking) => {
      const bookingStart = new Date(booking.startTime).getTime();
      const bookingEnd = new Date(booking.endTime).getTime();

      if (
        Number.isNaN(bookingStart) ||
        Number.isNaN(bookingEnd) ||
        bookingEnd <= bookingStart
      ) {
        return false;
      }

      return candidate < bookingEnd && candidateEnd > bookingStart;
    });

    if (!overlapsBooking) {
      const start = new Date(candidate);
      const end = new Date(candidateEnd);
      const value = start.toISOString();

      options.set(value, {
        value,
        availabilityId: availability.id,
        recurringRuleId: availability.recurringRuleId,
        startTime: value,
        endTime: end.toISOString(),
      });
    }

    candidate += 15 * 60 * 1000;
  }
}
  return Array.from(options.values()).sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );
}



const stripePublishableKey =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

const stripePromise = stripePublishableKey
  ? loadStripe(stripePublishableKey)
  : null;

  type StripeWithCheckoutElements = Stripe & {
  initCheckoutElementsSdk(
    options: StripeCheckoutElementsSdkOptions,
  ): StripeCheckoutElementsSdk;
};

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "TU"
  );
}

export default function TutoringBookPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tutorId = searchParams.get("tutorId") || "";
const [selectedStartTimeInput, setSelectedStartTimeInput] = useState("");
const [selectedEndTimeInput, setSelectedEndTimeInput] = useState("");
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [sessionDuration, setSessionDuration] = useState(60);
  const [calendarMonth, setCalendarMonth] = useState(() =>
    startOfCalendarMonth(new Date()),
  );
  const [subject, setSubject] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [query, setQuery] = useState("");
  const [tutorsLoaded, setTutorsLoaded] = useState(false);
  const [loadedTutorId, setLoadedTutorId] = useState<string | null>(null);
  const pendingBookingRestoredRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutClientSecret, setCheckoutClientSecret] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [customerEmail, setCustomerEmail] = useState("");
  const [checkoutCurrency, setCheckoutCurrency] = useState("USD");
  const [checkoutAmount, setCheckoutAmount] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "mtn_momo">("card");
  const [momoPhone, setMomoPhone] = useState("");
  const [momoMessage, setMomoMessage] = useState("");
  const [checkoutReady, setCheckoutReady] = useState(false);
  const [paying, setPaying] = useState(false);
  const checkoutActionsRef = useRef<StripeCheckoutLoadActionsSuccess | null>(null);
  const checkoutInstanceRef = useRef<StripeCheckoutElementsSdk | null>(null);
  const paymentElementRef = useRef<StripePaymentElement | null>(null);
  const billingAddressElementRef = useRef<
    ReturnType<StripeCheckoutElementsSdk["createBillingAddressElement"]> | null
  >(null);
  // Capture the booking page's current time once when the component mounts.
  // Keeping this in state avoids calling Date.now() directly during render.
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

useEffect(() => {
  const interval = window.setInterval(() => {
    setNowMs(Date.now());
  }, 30_000);

  return () => {
    window.clearInterval(interval);
  };
}, []);
  useEffect(() => {
    let cancelled = false;

    async function loadCurrentUser() {
      try {
        const response = await fetch("/api/auth/get-session", {
          cache: "no-store",
        });
        const data = await response.json();
        const email = data?.user?.email || data?.session?.user?.email || "";

        if (!cancelled && typeof email === "string") {
          setCustomerEmail(email);
        }
      } catch {
        // The booking API remains the authoritative source for the email.
      }
    }

    void loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!checkoutOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCheckoutOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [checkoutOpen]);

  useEffect(() => {
    if (!checkoutOpen || !checkoutClientSecret || !stripePromise) return;

    // Capture the narrowed state value before entering the nested async
    // function so TypeScript keeps it as a definite string.
    const clientSecret = checkoutClientSecret;

    let cancelled = false;

    async function mountCheckoutElements() {
      setCheckoutReady(false);
      toast.dismiss();

      try {
        const stripe = await stripePromise;

        if (!stripe) {
          throw new Error("Secure payment is temporarily unavailable.");
        }

        const checkout = (stripe as StripeWithCheckoutElements).initCheckoutElementsSdk({
          clientSecret,
  elementsOptions: {
    appearance: {
      theme: "stripe",
      variables: {
        colorPrimary: "#3730ff",
        colorBackground: "#ffffff",
        colorText: "#111827",
        colorDanger: "#dc2626",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSizeBase: "14px",
        spacingUnit: "4px",
        borderRadius: "0px",
      },
      rules: {
        ".Input": {
          border: "1px solid #dfe3e8",
          boxShadow: "none",
          padding: "12px",
        },
        ".Input:focus": {
          border: "1px solid #3730ff",
          boxShadow: "0 0 0 1px #3730ff",
        },
        ".Label": {
          fontSize: "13px",
          fontWeight: "600",
          color: "#111827",
        },
        ".Error": {
          fontSize: "12px",
        },
      },
    },
  },
        });

        if (cancelled) return;

        checkoutInstanceRef.current = checkout;
        const billingAddressElement = checkout.createBillingAddressElement();

        billingAddressElementRef.current = billingAddressElement;
        billingAddressElement.mount("#justdy-billing-address-element");
        const paymentElement = checkout.createPaymentElement({
          fields: {
            billingDetails: {
              name: "never",
              email: "never",
              phone: "never",
              address: "never",
            },
          },
        });

        paymentElementRef.current = paymentElement;
        paymentElement.mount("#justdy-payment-element");

        const loadActionsResult = await checkout.loadActions();

        if (cancelled) return;

        if (loadActionsResult.type !== "success") {
          throw new Error(
            loadActionsResult.error?.message ||
              "Unable to initialize secure payment.",
          );
        }

        checkoutActionsRef.current = loadActionsResult.actions;
        setCheckoutReady(true);
      } catch (checkoutError) {
        if (!cancelled) {
          toast.error(
            checkoutError instanceof Error
              ? checkoutError.message
              : "Unable to initialize secure payment.",
          );
          setCheckoutReady(false);
        }
      }
    }

    void mountCheckoutElements();

    return () => {
      cancelled = true;

      try {
        billingAddressElementRef.current?.unmount?.();
      } catch {
        // The element may already have been removed during modal close.
      }

      try {
        paymentElementRef.current?.unmount?.();
      } catch {
        // The element may already have been removed during modal close.
      }

      billingAddressElementRef.current = null;
      paymentElementRef.current = null;
      checkoutActionsRef.current = null;
      checkoutInstanceRef.current = null;
    };
  }, [checkoutOpen, checkoutClientSecret]);

  useEffect(() => {
    let cancelled = false;

    async function loadTutors() {
      try {
        const response = await fetch("/api/tutoring/tutors", {
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Unable to load tutors.");
        }

        const availableTutors = Array.isArray(data?.tutors)
          ? data.tutors
          : [];

        if (!cancelled) {
          setTutors(availableTutors);

          const selected = tutorId
            ? availableTutors.find(
                (item: Tutor) => item.id === tutorId,
              ) || null
            : null;

          setTutor(selected);

          // Restore the pending booking as part of the asynchronous tutor
          // loading operation. This avoids a second effect that performs
          // synchronous state updates and triggers cascading renders.
          let pendingBooking: PendingBookingDraft | null = null;

          try {
            const storedDraft = window.sessionStorage.getItem(
              "justdy:pending-tutoring-booking",
            );

            if (storedDraft) {
              const parsed = JSON.parse(storedDraft) as unknown;

              if (
                parsed &&
                typeof parsed === "object" &&
                typeof (parsed as { tutorId?: unknown }).tutorId === "string"
              ) {
                pendingBooking = parsed as PendingBookingDraft;
              }
            }
          } catch (storageError) {
            console.error(
              "Failed to restore pending tutoring booking:",
              storageError,
            );
          }

          const hasPendingBooking =
            Boolean(selected) && pendingBooking?.tutorId === selected?.id;

          const firstAvailability = selected?.availabilities?.[0] ?? null;
          const firstDate = firstAvailability
            ? localDateKey(firstAvailability.startTime)
            : "";
          const restoredDate =
            hasPendingBooking && pendingBooking?.selectedDate
              ? pendingBooking.selectedDate
              : firstDate;

          if (restoredDate) {
            setSelectedDate(restoredDate);

            const restoredDateObject = parseDateKey(restoredDate);
            if (restoredDateObject) {
              setCalendarMonth(startOfCalendarMonth(restoredDateObject));
            }
          } else {
            setSelectedDate("");
          }

          if (
            hasPendingBooking &&
            typeof pendingBooking?.sessionDuration === "number" &&
            pendingBooking.sessionDuration > 0
          ) {
            setSessionDuration(pendingBooking.sessionDuration);
          }

          setSelectedStartTimeInput(
            hasPendingBooking ? pendingBooking?.startTime || "" : "",
          );
          setSelectedEndTimeInput(
            hasPendingBooking ? pendingBooking?.endTime || "" : "",
          );

          if (hasPendingBooking) {
            setSubject(pendingBooking?.subject || "");
            setGradeLevel(pendingBooking?.gradeLevel || "");
            setTopic(pendingBooking?.topic || "");
            setDescription(pendingBooking?.description || "");
          }

          setLoadedTutorId(tutorId || null);
          setTutorsLoaded(true);
        }
      } catch (loadError) {
        if (!cancelled) {
          toast.error(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load tutors.",
          );
          setLoadedTutorId(tutorId || null);
          setTutorsLoaded(true);
        }
      }
    }

    void loadTutors();

    return () => {
      cancelled = true;
    };
  }, [tutorId]);

  const selectedTutor =
    tutorId && tutor?.id === tutorId ? tutor : null;

const availableDateKeys = useMemo(() => {
  const keys = new Set<string>();

  if (!selectedTutor) return keys;

  const today = new Date(nowMs);
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();

  for (const availability of selectedTutor.availabilities) {
    const start = new Date(availability.startTime);
    const end = new Date(availability.endTime);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end.getTime() <= nowMs
    ) {
      continue;
    }

    const cursor = new Date(Math.max(start.getTime(), todayMs));
    cursor.setHours(0, 0, 0, 0);

    while (cursor.getTime() < end.getTime()) {
      const key = localDateKey(cursor);

      if (key) {
        const options = getTimeOptions(
          key,
          sessionDuration,
          selectedTutor.availabilities,
          selectedTutor.bookings,
          nowMs,
        );

        if (options.length > 0) {
          keys.add(key);
        }
      }

      cursor.setDate(cursor.getDate() + 1);
      cursor.setHours(0, 0, 0, 0);
    }
  }

  return keys;
}, [selectedTutor, sessionDuration, nowMs]);

  const timeOptions = useMemo(
    () =>
      selectedTutor
        ? getTimeOptions(
            selectedDate,
            sessionDuration,
            selectedTutor.availabilities,
            selectedTutor.bookings,
            nowMs,
          )
        : [],
    [selectedTutor, selectedDate, sessionDuration, nowMs],
  );

  // Derive default time values instead of setting state inside an effect.
  // This keeps the inputs preselected without triggering cascading renders.
  const effectiveStartTimeInput = useMemo(() => {
    if (selectedStartTimeInput) return selectedStartTimeInput;
    if (!selectedDate || timeOptions.length === 0) return "";

    const start = new Date(timeOptions[0].startTime);
    if (Number.isNaN(start.getTime())) return "";

    return start.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }, [selectedDate, selectedStartTimeInput, timeOptions]);

  const effectiveEndTimeInput = useMemo(() => {
    if (selectedEndTimeInput) return selectedEndTimeInput;
    if (!selectedDate || timeOptions.length === 0) return "";

    const end = new Date(timeOptions[0].endTime);
    if (Number.isNaN(end.getTime())) return "";

    return end.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }, [selectedDate, selectedEndTimeInput, timeOptions]);

  const selectedStartTime = useMemo(
    () => combineDateAndTime(selectedDate, effectiveStartTimeInput),
    [selectedDate, effectiveStartTimeInput],
  );

  const selectedEndTime = useMemo(
    () => combineDateAndTime(selectedDate, effectiveEndTimeInput),
    [selectedDate, effectiveEndTimeInput],
  );

  const selectedSessionDuration = useMemo(() => {
    if (!selectedStartTime || !selectedEndTime) return null;

    const duration =
      (selectedEndTime.getTime() - selectedStartTime.getTime()) / 60_000;

    return duration > 0 ? duration : null;
  }, [selectedStartTime, selectedEndTime]);

  const selectedSlot = useMemo(() => {
    if (
      !selectedTutor ||
      !selectedDate ||
      !selectedStartTime ||
      !selectedEndTime
    ) {
      return null;
    }

    const selectedStartMs = selectedStartTime.getTime();
    const selectedEndMs = selectedEndTime.getTime();

    if (selectedEndMs <= selectedStartMs) return null;

    return (
      selectedTutor.availabilities.find((availability) => {
        const availabilityStart = new Date(availability.startTime).getTime();
        const availabilityEnd = new Date(availability.endTime).getTime();

        if (
          Number.isNaN(availabilityStart) ||
          Number.isNaN(availabilityEnd) ||
          availabilityEnd <= availabilityStart
        ) {
          return false;
        }

        // The selected interval must be completely inside one availability.
        if (
          selectedStartMs < availabilityStart ||
          selectedEndMs > availabilityEnd
        ) {
          return false;
        }

        // Never allow a new booking to overlap an existing booking.
        return !selectedTutor.bookings.some((booking) => {
          const bookingStart = new Date(booking.startTime).getTime();
          const bookingEnd = new Date(booking.endTime).getTime();

          if (
            Number.isNaN(bookingStart) ||
            Number.isNaN(bookingEnd) ||
            bookingEnd <= bookingStart
          ) {
            return false;
          }

          return selectedStartMs < bookingEnd && selectedEndMs > bookingStart;
        });
      }) || null
    );
  }, [
    selectedTutor,
    selectedDate,
    selectedStartTime,
    selectedEndTime,
  ]);

  const selectedTimeIsValid = Boolean(
    selectedStartTime &&
      selectedEndTime &&
      selectedSessionDuration != null &&
      selectedSessionDuration > 0 &&
      selectedSlot,
  );

  const selectedHourlyPrice = useMemo(() => {
    if (
      !selectedTutor ||
      selectedSessionDuration == null ||
      selectedSessionDuration <= 0
    ) {
      return null;
    }

    const hourlyRate = selectedTutor.teachingProfile.hourlyRate;
    if (hourlyRate == null || hourlyRate <= 0) return null;

    return Math.round((hourlyRate * selectedSessionDuration) / 60);
  }, [selectedTutor, selectedSessionDuration]);

  const calendarDays = useMemo(() => {
    const firstDay = startOfCalendarMonth(calendarMonth);
    const firstWeekday = firstDay.getDay();
    const days: Array<Date | null> = Array.from(
      { length: firstWeekday },
      () => null,
    );

    const daysInMonth = new Date(
      firstDay.getFullYear(),
      firstDay.getMonth() + 1,
      0,
    ).getDate();

    for (let day = 1; day <= daysInMonth; day += 1) {
      days.push(
        new Date(
          firstDay.getFullYear(),
          firstDay.getMonth(),
          day,
          12,
          0,
          0,
          0,
        ),
      );
    }

    while (days.length % 7 !== 0) {
      days.push(null);
    }

    return days;
  }, [calendarMonth]);

  const canContinueToPayment =
    Boolean(
      selectedTutor &&
        selectedTimeIsValid &&
        selectedSlot &&
        selectedTutor.teachingProfile.hourlyRate != null &&
        selectedTutor.teachingProfile.hourlyRate > 0,
    ) && !submitting;

  const paymentButtonReason = useMemo(() => {
    if (!selectedTutor) return "Select a tutor.";
    if (!selectedDate) return "Select a date.";
    if (!effectiveStartTimeInput) return "Select a start time.";
    if (!effectiveEndTimeInput) return "Select an end time.";
    if (!selectedSessionDuration || selectedSessionDuration <= 0) {
      return "End time must be after start time.";
    }
    if (!selectedSlot) {
      return "Choose a time that is inside the tutor's available time and does not overlap another booking.";
    }
    if (
      selectedTutor.teachingProfile.hourlyRate == null ||
      selectedTutor.teachingProfile.hourlyRate <= 0
    ) {
      return "This tutor does not currently have a valid hourly rate.";
    }
    return null;
  }, [
    selectedTutor,
    selectedDate,
    effectiveStartTimeInput,
    effectiveEndTimeInput,
    selectedSessionDuration,
    selectedSlot,
  ]);

  const loading =
    tutorId.length === 0 ? !tutorsLoaded : loadedTutorId !== tutorId;

  const filteredTutors = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) return tutors;

    return tutors.filter((item) => {
      const profile = item.facilitatorProfile;
      const haystack = [
        item.name,
        profile?.specialty,
        profile?.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalized);
    });
  }, [query, tutors]);

  async function submitBooking(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (bookingId) {
      setCheckoutOpen(true);
      return;
    }

    if (
      !selectedTutor ||
      !selectedTimeIsValid ||
      !selectedStartTime ||
      !selectedEndTime ||
      !selectedSlot ||
      selectedHourlyPrice == null
    ) {
      toast.error("Select a date and time that falls within the tutor's availability.");
      return;
    }

    setSubmitting(true);
    toast.dismiss();

    try {
      const response = await fetch("/api/tutoring/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          educatorId: tutorId,
          availabilityId: selectedSlot.id.startsWith("recurring:")
            ? undefined
            : selectedSlot.id,
          recurringRuleId: selectedSlot.recurringRuleId,
          startTime: selectedStartTime.toISOString(),
          endTime: selectedEndTime.toISOString(),
          ...(subject.trim() ? { subject: subject.trim() } : {}),
          ...(gradeLevel.trim() ? { gradeLevel: gradeLevel.trim() } : {}),
          ...(topic.trim() ? { topic: topic.trim() } : {}),
          ...(description.trim() ? { description: description.trim() } : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          const callback = `${window.location.pathname}${window.location.search}`;

          try {
            window.sessionStorage.setItem(
              "justdy:pending-tutoring-booking",
              JSON.stringify({
                tutorId,
                selectedDate,
                sessionDuration,
                startTime: effectiveStartTimeInput,
                endTime: effectiveEndTimeInput,
                subject,
                gradeLevel,
                topic,
                description,
                callback,
              }),
            );
          } catch (storageError) {
            console.error(
              "Failed to preserve pending tutoring booking:",
              storageError,
            );
          }

          router.push(
            `/auth?mode=signin&callbackUrl=${encodeURIComponent(callback)}`,
          );
          return;
        }

        throw new Error(data?.error || "Unable to create booking.");
      }

      try {
        window.sessionStorage.removeItem(
          "justdy:pending-tutoring-booking",
        );
      } catch (storageError) {
        console.error(
          "Failed to clear pending tutoring booking:",
          storageError,
        );
      }

      setBookingId(data?.bookingId || null);
      setCustomerEmail(data?.customerEmail || customerEmail);
      setCheckoutCurrency(String(data?.currency || selectedTutor.teachingProfile.currency || "USD").toUpperCase());
      setCheckoutAmount(
        typeof data?.amount === "number" ? data.amount : selectedHourlyPrice,
      );
      setCheckoutClientSecret(data?.clientSecret || null);
      setPaymentMethod(data?.clientSecret ? "card" : "mtn_momo");
      setMomoMessage("");
      setCheckoutOpen(true);
      setSubmitting(false);
    } catch (submitError) {
      toast.error(
        submitError instanceof Error
          ? submitError.message
          : "Unable to create booking.",
      );
      setSubmitting(false);
    }
  }

  if (!tutorId) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <section className="border-b border-border/70">
          <div className="mx-auto max-w-6xl px-6 py-14 sm:px-8 lg:px-12">
            <Link
              href="/tutoring"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to tutoring
            </Link>

            <div className="mt-4 max-w-xl">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search expert tutors by name or specialty"
                  className="h-12 w-full rounded-none border border-border bg-card pl-11 pr-4 text-sm outline-none transition focus:border-emerald-500"
                />
              </div>
            </div>

            {loading ? (
              <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-64 animate-pulse rounded-none border border-border bg-card"
                  />
                ))}
              </div>
            ) : filteredTutors.length === 0 ? (
              <div className="mt-10 rounded-none border border-border bg-card p-10 text-center">
                <UserRound className="mx-auto h-8 w-8 text-muted-foreground" />
                <h2 className="mt-4 text-lg font-semibold">
                  No tutors found
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try another search or check back when more tutors become
                  available.
                </p>
              </div>
            ) : (
              <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredTutors.map((item) => {
                    const profile = item.facilitatorProfile;

                    return (
                      <Link
                        key={item.id}
                        href={`/tutors?tutorId=${encodeURIComponent(item.id)}`}
                        className="group block h-full"
                        aria-label={`View ${item.name}'s tutoring profile`}
                      >
                       <article
                          className="
                            group relative h-120 w-full overflow-hidden
                            rounded-sm
                            border border-emerald-900/10
                            bg-[#fffefa]
                            shadow-[0_12px_35px_rgba(15,23,42,0.08)]
                            transition-all duration-300
                            hover:-translate-y-1
                            hover:shadow-[0_20px_50px_rgba(15,23,42,0.13)]
                            active:scale-[0.995]
                          "
                        >
                          {/* =========================================================
                          * TOP — PROFILE IMAGE
                          * ========================================================= */}

                          <div className="relative h-[52%] w-full overflow-hidden bg-slate-200">

                            {item.imageUrl ? (
                              <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="
                                    absolute inset-0
                                    h-full w-full
                                    object-cover
                                    object-center
                                    transition-transform duration-700 ease-out
                                    group-hover:scale-[1.035]
                                  "
                                />

                                {/* Very subtle image treatment */}
                                <div className="absolute inset-0 bg-linear-to-t from-slate-950/20 via-transparent to-transparent" />
                              </>
                            ) : (
                              /* -------------------------------------------------------
                              * FALLBACK
                              * ------------------------------------------------------- */

                              <div
                                className="
                                  absolute inset-0
                                  flex items-center justify-center
                                  bg-linear-to-br
                                  from-emerald-50
                                  via-slate-100
                                  to-sky-100
                                "
                              >
                                <span
                                  className="
                                    text-7xl
                                    font-bold
                                    tracking-[-0.06em]
                                    text-emerald-900/80
                                  "
                                >
                                  {initials(item.name)}
                                </span>
                              </div>
                            )}
                          </div>


                          {/* =========================================================
                          * BOTTOM — PROFILE INFORMATION
                          * ========================================================= */}

                          <div
                            className="
                              relative
                              flex h-[48%]
                              flex-col
                              bg-[#fffefa]
                              px-6
                              pb-5
                              pt-5
                            "
                          >

                            {/* -------------------------------------------------------
                            * NAME + VERIFIED
                            * ------------------------------------------------------- */}

                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <h2
                                    className="
                                      truncate
                                      text-[24px]
                                      font-bold
                                      leading-tight
                                      tracking-[-0.035em]
                                      text-emerald-950
                                    "
                                  >
                                    {item.name}
                                  </h2>

                                  {/* Verified badge */}
                                  <span
                                    className="
                                      flex h-6 w-6 shrink-0
                                      items-center justify-center
                                      rounded-full
                                      bg-emerald-500
                                      shadow-[0_3px_8px_rgba(16,185,129,0.20)]
                                      transition-transform
                                      duration-300
                                      group-hover:scale-110
                                    "
                                  >
                                    <CheckCircle2
                                      className="h-4 w-4 text-white"
                                      strokeWidth={3}
                                    />
                                  </span>

                                </div>


                                {/* Professional role */}

                                <p
                                  className="
                                    mt-1
                                    text-sm
                                    font-medium
                                    text-slate-500
                                  "
                                >
                                  {profile?.specialty || "Mathematics Tutor"}
                                </p>

                              </div>

                            </div>


                            {/* -------------------------------------------------------
                            * DESCRIPTION
                            * ------------------------------------------------------- */}

                            <p
                              className="
                                mt-4
                                line-clamp-2
                                min-h-10.5
                                text-[14px]
                                leading-normal
                                text-slate-600
                              "
                            >
                              {profile?.description ||
                                "Personalized live tutoring focused on your learning goals."}
                            </p>

                            {/* -------------------------------------------------------
                            * BOTTOM ACTION
                            * ------------------------------------------------------- */}

                            <div className="mt-5">

                              <div
                                className="
                                  flex h-11
                                  w-full
                                  items-center
                                  justify-center
                                  gap-2
                                  rounded-sm
                                  bg-emerald-900
                                  px-5
                                  text-sm
                                  font-semibold
                                  text-white
                                  shadow-[0_6px_18px_rgba(6,78,59,0.14)]
                                  transition-all
                                  duration-300
                                  group-hover:bg-emerald-950
                                  group-hover:shadow-[0_8px_24px_rgba(6,78,59,0.20)]
                                "
                              >
                                View tutor profile

                                <ArrowRight
                                  className="
                                    h-4 w-4
                                    transition-transform
                                    duration-300
                                    group-hover:translate-x-1
                                  "
                                />
                              </div>
                            </div>
                          </div>
                        </article>
                      </Link>
                    );
                  })}
              </div>
            )}
          </div>
        </section>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background px-6 py-20">
        <div className="mx-auto max-w-5xl animate-pulse">
          <div className="h-8 w-64 rounded bg-muted" />
          <div className="mt-8 h-96 rounded-3xl bg-card" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-14 sm:px-8 lg:px-12">
        <Link
          href="/tutors"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to tutors
        </Link>

        {!selectedTutor ? (
          <div className="mt-8 rounded-sm border border-border bg-card p-10 text-center">
            <h1 className="text-xl font-semibold">Tutor unavailable</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This tutor may no longer be accepting bookings.
            </p>
            <Link
              href="/tutors"
              className="mt-6 inline-flex items-center gap-2 rounded-none bg-foreground px-5 py-3 text-sm font-semibold text-background"
            >
              Find another tutor
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <aside className="rounded-sm border border-border bg-white p-7 shadow-sm">
              <div className="flex items-center gap-4">
                {selectedTutor.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedTutor.imageUrl}
                    alt={selectedTutor.name}
                    className="h-30 w-30 rounded-sm object-cover"
                  />
                ) : (
                  <div className="flex h-30 w-30 items-center justify-center rounded-sm bg-emerald-900 text-[80px] font-semibold text-white">
                    {initials(selectedTutor.name)}
                  </div>
                )}

                <div>
                  <h1 className="text-xl font-semibold">{selectedTutor.name}</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedTutor.facilitatorProfile?.specialty ||
                      "Mathematics tutor"}
                  </p>
                   <p className="mt-1 text-sm text-muted-foreground">
                    {selectedTutor.facilitatorProfile?.experience}+ years of experience
                  </p>
                </div>
              </div>

            
              <p className="mt-5 text-sm leading-6 text-muted-foreground">
                {selectedTutor.facilitatorProfile?.description ||
                  "A verified Justdy tutor ready to help you."}
              </p>

              <div className="mt-7 rounded-sm bg-background p-5">
                <div className="text-sm text-muted-foreground">
                  Session rate
                </div>
                <div className="mt-1 text-2xl font-semibold">
                  {selectedTutor.teachingProfile.hourlyRate != null
                    ? `${selectedTutor.teachingProfile.currency} ${(selectedTutor.teachingProfile.hourlyRate / 100).toFixed(2)}/hr`
                    : "Rate unavailable"}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Your total is calculated from the tutor&apos;s hourly rate and the selected time.
                </div>
              </div>
            </aside>

           <form
  onSubmit={submitBooking}
  className="
    relative overflow-hidden
    rounded-sm
    border border-slate-200/80
    bg-[#fffefa]
    shadow-[0_20px_60px_rgba(15,23,42,0.08)]
  "
>
  {/* =========================================================
   * SUBTLE TOP ACCENT
   * ========================================================= */}

  <div className="absolute inset-x-0 top-0 h-1 bg-emerald-800" />
  <div className="p-5 sm:p-7 lg:p-8">
    <div className="mb-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div
              className="
                flex h-9 w-9
                items-center justify-center
                rounded-xl
                bg-emerald-50
                text-emerald-800
              "
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5"
              >
                <rect
                  x="3"
                  y="4"
                  width="18"
                  height="17"
                  rx="3"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />

                <path
                  d="M8 2v4M16 2v4M3 9h18"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />

                <path
                  d="M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div>
              <h2 className="text-lg font-bold tracking-[-0.02em] text-emerald-950">
                Book a tutoring session
              </h2>
            </div>
          </div>
        </div>


        {/* Selected date indicator */}

        {selectedDate ? (
          <div
            className="
              hidden shrink-0
              rounded-full
              bg-emerald-50
              px-3 py-1.5
              text-xs
              font-semibold
              text-emerald-800
              sm:block
            "
          >
            {formatDateKey(selectedDate)}
          </div>
        ) : null}
      </div>
    </div>


    {/* =======================================================
     * STEP 1 — DATE
     * ======================================================= */}

    <section>
      <div className="mb-3 flex items-center gap-3">
        <div
          className="
            flex h-7 w-7
            items-center justify-center
            rounded-full
            bg-emerald-900
            text-xs
            font-bold
            text-white
          "
        >
          1
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Choose a date
          </h3>

          <p className="text-xs text-slate-500">
            Select one of the tutor&apos;s available days.
          </p>
        </div>
      </div>


      {selectedTutor.availabilities.length === 0 ? (

        <div
          className="
            rounded-sm
            border border-slate-200
            bg-white
            px-5 py-6
            text-center
          "
        >
          <div
            className="
              mx-auto mb-3
              flex h-11 w-11
              items-center justify-center
              rounded-full
              bg-slate-100
              text-slate-400
            "
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
            >
              <rect
                x="3"
                y="4"
                width="18"
                height="17"
                rx="3"
                stroke="currentColor"
                strokeWidth="1.7"
              />

              <path
                d="M8 2v4M16 2v4M3 9h18"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <p className="text-sm font-semibold text-slate-700">
            No upcoming availability
          </p>

          <p className="mt-1 text-xs text-slate-500">
            This tutor currently has no available sessions.
          </p>
        </div>

      ) : (

        <div
          className="
            overflow-hidden
            rounded-sm
            border border-slate-200
            bg-slate-50/70
          "
        >

          {/* Calendar header */}

          <div
            className="
              flex items-center justify-between
              border-b border-slate-200
              bg-white/70
              px-4 py-3
            "
          >

            <button
              type="button"
              onClick={() =>
                setCalendarMonth(
                  (current) =>
                    new Date(
                      current.getFullYear(),
                      current.getMonth() - 1,
                      1,
                      12,
                    ),
                )
              }
              className="
                flex h-9 w-9
                items-center justify-center
                rounded-xl
                border border-slate-200
                bg-white
                text-slate-500
                shadow-sm
                transition
                hover:border-emerald-300
                hover:bg-emerald-50
                hover:text-emerald-800
              "
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>


            <div className="text-sm font-bold text-slate-800">
              {calendarMonthLabel(calendarMonth)}
            </div>


            <button
              type="button"
              onClick={() =>
                setCalendarMonth(
                  (current) =>
                    new Date(
                      current.getFullYear(),
                      current.getMonth() + 1,
                      1,
                      12,
                    ),
                )
              }
              className="
                flex h-9 w-9
                items-center justify-center
                rounded-xl
                border border-slate-200
                bg-white
                text-slate-500
                shadow-sm
                transition
                hover:border-emerald-300
                hover:bg-emerald-50
                hover:text-emerald-800
              "
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

          </div>


          {/* Week labels */}

          <div
            className="
              grid grid-cols-7
              gap-1
              px-3 pt-3
              text-center
              text-[10px]
              font-bold
              uppercase
              tracking-wider
              text-slate-400
            "
          >
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
              (day) => (
                <div key={day} className="py-2">
                  {day}
                </div>
              ),
            )}
          </div>


          {/* Calendar days */}

          <div className="grid grid-cols-7 gap-1 px-3 pb-4">

            {calendarDays.map((day, index) => {

              if (!day) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="h-11"
                  />
                );
              }

              const dayKey = localDateKey(day);

              const isAvailable =
                availableDateKeys.has(dayKey);

              const isSelected =
                selectedDate === dayKey;

              const isToday =
                localDateKey(new Date()) === dayKey;

              return (
                <button
                  key={dayKey}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => {
                    setSelectedDate(dayKey);
                    setSelectedStartTimeInput("");
                    setSelectedEndTimeInput("");
                  }}
                  className={`
                    relative
                    flex h-11
                    items-center
                    justify-center
                    rounded-xl
                    text-sm
                    font-medium
                    transition-all duration-200

                    ${
                      isSelected
                        ? `
                          bg-emerald-900
                          font-bold
                          text-white
                          shadow-[0_5px_14px_rgba(6,78,59,0.20)]
                        `
                        : isAvailable
                          ? `
                            bg-white
                            text-slate-700
                            shadow-sm
                            hover:-translate-y-0.5
                            hover:bg-emerald-50
                            hover:text-emerald-800
                          `
                          : `
                            cursor-not-allowed
                            text-slate-300
                          `
                    }
                  `}
                  aria-label={`${formatDateKey(dayKey)}${
                    isAvailable ? "" : " unavailable"
                  }`}
                >

                  {day.getDate()}

                  {/* Available indicator */}

                  {isAvailable && !isSelected ? (
                    <span
                      className="
                        absolute bottom-1.5
                        h-1 w-1
                        rounded-full
                        bg-emerald-500
                      "
                    />
                  ) : null}


                  {/* Today indicator */}

                  {isToday && !isSelected ? (
                    <span
                      className="
                        absolute right-1.5 top-1.5
                        h-1.5 w-1.5
                        rounded-full
                        bg-emerald-500
                      "
                    />
                  ) : null}

                </button>
              );
            })}

          </div>

        </div>
      )}

    </section>


    {/* =======================================================
     * STEP 2 — TIME
     * ======================================================= */}

    <section className="mt-7">

      <div className="mb-3 flex items-center gap-3">

        <div
          className="
            flex h-7 w-7
            items-center justify-center
            rounded-full
            bg-emerald-900
            text-xs
            font-bold
            text-white
          "
        >
          2
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Choose your session time
          </h3>
        </div>

      </div>


      {selectedDate ? (

        timeOptions.length > 0 ? (

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

            {/* Start time */}

            <div
              className="
                rounded-sm
                border border-slate-200
                bg-slate-50/70
                p-3
                transition
                focus-within:border-emerald-400
                focus-within:bg-white
                focus-within:shadow-[0_0_0_3px_rgba(16,185,129,0.08)]
              "
            >

              <label
                htmlFor="start-time"
                className="
                  mb-2
                  flex items-center gap-2
                  text-[11px]
                  font-bold
                  uppercase
                  tracking-[0.08em]
                  text-slate-500
                "
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Start time
              </label>

              <input
                id="start-time"
                type="time"
                lang="en-US"
                step="60"
                value={effectiveStartTimeInput}
                onChange={(e) =>
                  setSelectedStartTimeInput(e.target.value)
                }
                className="
                  h-11 w-full
                  border-0
                  bg-transparent
                  px-1
                  text-base
                  font-semibold
                  text-slate-900
                  outline-none
                "
              />

            </div>


            {/* End time */}

            <div
              className="
                rounded-sm
                border border-slate-200
                bg-slate-50/70
                p-3
                transition
                focus-within:border-emerald-400
                focus-within:bg-white
                focus-within:shadow-[0_0_0_3px_rgba(16,185,129,0.08)]
              "
            >

              <label
                htmlFor="end-time"
                className="
                  mb-2
                  flex items-center gap-2
                  text-[11px]
                  font-bold
                  uppercase
                  tracking-[0.08em]
                  text-slate-500
                "
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                End time
              </label>

              <input
                id="end-time"
                type="time"
                lang="en-US"
                step="60"
                value={effectiveEndTimeInput}
                onChange={(e) =>
                  setSelectedEndTimeInput(e.target.value)
                }
                className="
                  h-11 w-full
                  border-0
                  bg-transparent
                  px-1
                  text-base
                  font-semibold
                  text-slate-900
                  outline-none
                "
              />

            </div>

          </div>

        ) : (

          <div
            className="
              rounded-sm
              border border-amber-200
              bg-amber-50
              px-4 py-4
              text-sm
              text-amber-800
            "
          >
            <div className="font-semibold">
              No session time available
            </div>

            <p className="mt-1 text-xs leading-5 text-amber-700">
              No {sessionDuration}-minute session fits inside this
              tutor&apos;s availability on {formatDateKey(selectedDate)}.
              Choose another date or session length.
            </p>
          </div>
        )

      ) : (

        <div
          className="
            flex items-center gap-3
            rounded-sm
            border border-dashed border-slate-300
            bg-slate-50
            px-4 py-4
            text-sm
            text-slate-500
          "
        >
          <div
            className="
              flex h-8 w-8
              shrink-0
              items-center justify-center
              rounded-full
              bg-white
              text-slate-400
              shadow-sm
            "
          >
            2
          </div>

          Select a date first to see available times.
        </div>
      )}

    </section>


    {/* =======================================================
     * STEP 3 — WHAT DO YOU NEED HELP WITH?
     * ======================================================= */}

    <section className="mt-7">
      <div className="mb-3 flex items-center gap-3">
        <div
          className="
            flex h-7 w-7
            items-center justify-center
            rounded-full
            bg-emerald-900
            text-xs
            font-bold
            text-white
          "
        >
          3
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Tell your tutor what you need
          </h3>

          <p className="text-xs text-slate-500">
            Help your tutor prepare for your session.
          </p>
        </div>

      </div>


      <div
        className="
          overflow-hidden
          rounded-sm
          border border-slate-200
          bg-slate-50/60
          transition
          focus-within:border-emerald-400
          focus-within:bg-white
          focus-within:shadow-[0_0_0_3px_rgba(16,185,129,0.08)]
        "
      >

        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={5}
          placeholder="For example: I need help preparing for my algebra exam, especially equations and word problems."
          className="
            w-full
            resize-none
            border-0
            bg-transparent
            px-4 py-4
            text-sm
            leading-6
            text-slate-800
            outline-none
            placeholder:text-slate-400
          "
        />

        <div
          className="
            flex items-center justify-between
            border-t border-slate-200/70
            px-4 py-2.5
          "
        >
          <span className="text-[11px] text-slate-400">
            Optional
          </span>

          <span className="text-[11px] text-slate-400">
            Share topics, goals, or questions
          </span>
        </div>
      </div>
    </section>


    {/* =======================================================
     * BOOKING SUMMARY
     * ======================================================= */}

    <div
      className="
        mt-7
        overflow-hidden
        rounded-sm
        border border-emerald-900/10
        bg-emerald-50/70
      "
    >

      {/* Summary heading */}

      <div
        className="
          flex items-center justify-between
          border-b border-emerald-900/10
          px-4 py-3
        "
      >

        <div className="flex items-center gap-2">

          <div
            className="
              flex h-8 w-8
              items-center justify-center
              rounded-full
              bg-emerald-950
              text-white
              shadow-sm
            "
          >
            <LockKeyhole className="h-3 w-3" />
          </div>

          <span className="text-sm font-bold text-emerald-950">
            Booking summary
          </span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
          Secure checkout
        </span>

      </div>


      {/* Summary details */}
      <div className="px-4 py-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Total today
            </p>
            <div className="mt-1 text-2xl font-bold tracking-tight text-emerald-950">
              {selectedTutor.teachingProfile.currency === "GHS"
                ? "GHS "
                : "$"}
              {selectedHourlyPrice != null
                ? (selectedHourlyPrice / 100).toFixed(2)
                : "0.00"}
            </div>
          </div>

          <div className="text-right">

            <p className="text-sm font-semibold text-slate-800">
              {selectedSessionDuration != null
                ? selectedSessionDuration
                : 0}{" "}
              minutes
            </p>

            <p className="mt-1 text-[11px] text-slate-500">
              Tutoring session
            </p>
          </div>
        </div>
      </div>
    </div>


    {/* =======================================================
     * CHECKOUT BUTTON
     * ======================================================= */}

    <button
      disabled={!canContinueToPayment}
      type="submit"
      title={
        paymentButtonReason ||
        "Continue to secure payment"
      }
      aria-disabled={!canContinueToPayment}
      className="
        mt-4
        flex h-14 w-full
        items-center justify-center
        gap-2.5
        rounded-sm
        bg-emerald-900
        px-5
        text-sm
        font-bold
        text-white
        shadow-[0_10px_25px_rgba(6,78,59,0.16)]
        transition-all duration-300

        hover:bg-emerald-800
        hover:shadow-[0_14px_30px_rgba(6,78,59,0.20)]

        active:scale-[0.99]

        disabled:cursor-not-allowed
        disabled:bg-slate-300
        disabled:text-slate-500
        disabled:shadow-none
      "
    >

      {submitting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Preparing secure checkout…
        </>
      ) : checkoutClientSecret ? (
        <>
          <LockKeyhole className="h-4 w-4" />
          Resume secure payment
          <ArrowRight className="h-4 w-4" />
        </>
      ) : (
        <>
          <LockKeyhole className="h-4 w-4" />
          Continue to secure payment
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </>
      )}

    </button>


    {/* =======================================================
     * SECURITY MESSAGE
     * ======================================================= */}

    <div
      className="
        mt-4
        flex items-center justify-center
        gap-2
        text-center
        text-[11px]
        leading-5
        text-slate-400
      "
    >

      <span
        className="
          flex h-5 w-5
          items-center justify-center
          rounded-full
          bg-slate-100
          text-slate-500
        "
      >
        <LockKeyhole className="h-3 w-3" />
      </span>

      <span>
        Secure payment powered by Stripe
      </span>

    </div>


    <p className="mt-2 text-center text-[10px] leading-4 text-slate-400">
      After successful payment, your tutoring booking will be
      confirmed automatically.
    </p>

  </div>
</form>
          </div>
        )}
      </div>

      {checkoutOpen && (checkoutClientSecret || paymentMethod === "mtn_momo") ? (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tutoring-checkout-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setCheckoutOpen(false);
            }
          }}
        >
          <div className="flex h-full w-full max-w-145 flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[96vh]">
            <div className="min-h-0 flex-1 overflow-y-auto px-7 pb-7 pt-6 sm:px-8">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCheckoutOpen(false)}
                  className="text-[13px] font-semibold text-slate-600 transition hover:text-slate-950 focus:outline-none"
                >
                  ← BACK
                </button>

                <button
                  type="button"
                  onClick={() => setCheckoutOpen(false)}
                  aria-label="Close payment dialog"
                  className="text-2xl font-light leading-none text-slate-800 transition hover:text-black focus:outline-none"
                >
                  ×
                </button>
              </div>

              <h2 id="tutoring-checkout-title" className="sr-only">
                Payment
              </h2>

            

              {checkoutCurrency === "USD" ? (
                <button
                  type="button"
                  className="mx-auto mt-3 block text-[11px] font-semibold text-blue-600 hover:text-blue-700 focus:outline-none"
                >
                
                </button>
              ) : (
                <div className="mt-3 text-center text-[11px] text-slate-400">
                  MTN MoMo is available for GHS tutoring services.
                </div>
              )}

            

              <div className="mt-3">
                <label
                  htmlFor="customer-email"
                  className="block text-[13px] font-semibold text-slate-800"
                >
                   This email will receive the receipt
                </label>
                
                <input
                  id="customer-email"
                  value={customerEmail}
                  readOnly
                  placeholder="Your email"
                  className="mt-1.5 h-8 w-full border border-slate-200 bg-slate-50 px-3 text-[12px] text-slate-700 outline-none"
                />
              </div>

              {paymentMethod === "card" ? (
                <div className="mt-3">
                  <div className="mb-1.5 text-[14px] font-medium text-slate-800">
                    Card Information
                  </div>

                  <div id="justdy-payment-element" className="min-h-47.5" />

                  <div className="mt-5">
                    <div className="mb-1.5 text-[14px] font-medium text-slate-800">
                      Billing Address
                    </div>
                    <div
                      id="justdy-billing-address-element"
                      className="min-h-57.5"
                    />
                  </div>

                </div>
              ) : (
                <div className="mt-5">
                  <div className="flex items-center gap-2 text-[14px] font-semibold text-slate-800">
                    <Smartphone className="h-4 w-4 text-[#eab308]" />
                    MTN MoMo
                  </div>
                  <p className="mt-1 text-[11px] leading-5 text-slate-500">
                    Enter the MTN number that should receive the payment authorization request.
                  </p>
                  <input
                    value={momoPhone}
                    onChange={(event) => setMomoPhone(event.target.value)}
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="e.g. 0551234567"
                    className="mt-3 h-10.5 w-full border border-slate-200 bg-white px-3 text-[13px] text-slate-800 outline-none focus:border-[#f4c400] focus:ring-1 focus:ring-[#f4c400]"
                  />
                  {momoMessage ? (
                    <div className="mt-3 border border-yellow-200 bg-yellow-50 px-3 py-3 text-[11px] leading-5 text-yellow-900">
                      {momoMessage}
                    </div>
                  ) : null}
                </div>
              )}

              <div className="mt-7 h-px bg-transparent" />

              <div className="mt-2 text-center">
                <div className="text-[28px] font-bold tracking-tight text-slate-900">
                  {checkoutCurrency === "GHS" ? "GHS " : "$"}
                  {checkoutAmount != null
                    ? (checkoutAmount / 100).toFixed(2)
                    : "0.00"}
                </div>
              </div>

              <div className="mt-2 flex w-full items-stretch gap-2">
                <button
                  type="button"
                  disabled={paying || (paymentMethod === "card" ? !checkoutReady : !bookingId)}
                  onClick={async () => {
                  setPaying(true);
                  toast.dismiss();

                  try {
                    if (paymentMethod === "mtn_momo") {
                      if (!bookingId) {
                        throw new Error("Tutoring booking is not ready.");
                      }

                      if (!momoPhone.trim()) {
                        throw new Error("Enter your MTN mobile number.");
                      }

                      const startResponse = await fetch("/api/tutoring/momo", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          action: "start",
                          bookingId,
                          phone: momoPhone,
                        }),
                      });

                      const startData = await startResponse.json();

                      if (!startResponse.ok) {
                        throw new Error(startData?.error || "Unable to start MTN MoMo payment.");
                      }

                      const reference = startData?.reference;
                      if (!reference) {
                        throw new Error("MTN MoMo did not return a payment reference.");
                      }

                      setMomoMessage(
                        startData?.displayText ||
                          "Approve the payment request on your MTN phone. Waiting for confirmation…",
                      );

                      for (let attempt = 0; attempt < 60; attempt += 1) {
                        await new Promise((resolve) => setTimeout(resolve, 3000));

                        const verifyResponse = await fetch("/api/tutoring/momo", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            action: "verify",
                            bookingId,
                            reference,
                          }),
                        });

                        const verifyData = await verifyResponse.json();

                        if (!verifyResponse.ok) {
                          throw new Error(verifyData?.error || "Unable to verify MTN MoMo payment.");
                        }

                        if (verifyData?.paid) {
                          setMomoMessage("Payment confirmed. Your tutoring session is booked.");
                          setPaying(false);
                          setCheckoutOpen(false);
                          return;
                        }

                        setMomoMessage(
                          verifyData?.message ||
                            "Payment is still pending. Approve the request on your MTN phone.",
                        );
                      }

                      throw new Error("The MTN MoMo payment timed out. Please try again.");
                    }

                    const actions = checkoutActionsRef.current;

                    if (!actions) {
                      throw new Error("Secure payment is not ready yet.");
                    }

                    const result = await actions.confirm();

                    if (result?.type === "error") {
                      throw new Error(
                        result.error?.message || "Payment could not be completed.",
                      );
                    }
                  } catch (confirmError) {
                    toast.error(
                      confirmError instanceof Error
                        ? confirmError.message
                        : "Payment could not be completed.",
                    );
                    setPaying(false);
                  }
                }}
                  className={`flex h-10 w-[70%] shrink-0 items-center justify-center text-[14px] font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  paymentMethod === "mtn_momo"
                    ? "bg-[#ffcc00] text-slate-950 hover:bg-[#f4c400]"
                    : "bg-[#3730ff] hover:bg-[#3029e8]"
                }`}
              >
                {paying
                  ? paymentMethod === "mtn_momo"
                    ? "Waiting for MTN approval…"
                    : "Processing…"
                  : paymentMethod === "mtn_momo"
                    ? "Pay with MTN MoMo"
                    : "Pay"}
                </button>

              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}