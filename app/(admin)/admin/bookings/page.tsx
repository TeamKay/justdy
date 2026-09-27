import Link from "next/link";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  Filter,
  MoreHorizontal,
  Search,
  UserRound,
  Video,
  XCircle,
} from "lucide-react";

import prisma from "@/lib/prisma";

type BookingStatus =
  | "Scheduled"
  | "PendingPayment"
  | "Completed"
  | "Cancelled"
  | "NoShow";

type SearchParams = {
  search?: string;
  status?: string;
  date?: string;
  page?: string;
};

const PAGE_SIZE = 20;

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatMoney(
  amount: number | null | undefined,
  currency = "USD",
) {
  if (amount === null || amount === undefined) {
    return "—";
  }


  const value = amount / 100;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

function getStatusStyles(status: BookingStatus) {
  switch (status) {
    case "Scheduled":
      return {
        container:
          "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
        dot: "bg-emerald-500",
      };

    case "PendingPayment":
      return {
        container:
          "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
        dot: "bg-amber-500",
      };

    case "Completed":
      return {
        container:
          "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
        dot: "bg-blue-500",
      };

    case "Cancelled":
      return {
        container:
          "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400",
        dot: "bg-red-500",
      };

    case "NoShow":
      return {
        container:
          "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
        dot: "bg-slate-500",
      };

    default:
      return {
        container:
          "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
        dot: "bg-slate-500",
      };
  }
}

function getStatusLabel(status: BookingStatus) {
  switch (status) {
    case "PendingPayment":
      return "Pending payment";

    case "NoShow":
      return "No show";

    case "Scheduled":
      return "Scheduled";

    case "Completed":
      return "Completed";

    case "Cancelled":
      return "Cancelled";

    default:
      return status;
  }
}

function BookingAvatar({
  name,
  type,
}: {
  name: string;
  type: "student" | "tutor";
}) {
  const initials =
    name
      ?.split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
        type === "student"
          ? "bg-primary/10 text-primary"
          : "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
      }`}
    >
      {initials}
    </div>
  );
}

function buildQuery(params: {
  search?: string;
  status?: string;
  date?: string;
  page?: string;
}) {
  const query = new URLSearchParams();

  if (params.search) {
    query.set("search", params.search);
  }

  if (params.status && params.status !== "ALL") {
    query.set("status", params.status);
  }

  if (params.date && params.date !== "ALL") {
    query.set("date", params.date);
  }

  if (params.page && params.page !== "1") {
    query.set("page", params.page);
  }

  const value = query.toString();

  return value ? `?${value}` : "";
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
 

  const params = await searchParams;

  const search = params.search?.trim() ?? "";

  const selectedStatus =
    params.status && params.status !== "ALL"
      ? (params.status as BookingStatus)
      : null;

  const selectedDate = params.date ?? "ALL";

  const requestedPage = Number(params.page ?? "1");

  const currentPage =
    Number.isFinite(requestedPage) && requestedPage > 0
      ? Math.floor(requestedPage)
      : 1;

  /*
   * ------------------------------------------------------------
   * DATE FILTER
   * ------------------------------------------------------------
   */

  const now = new Date();

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  let dateWhere:
    | {
        gte?: Date;
        lt?: Date;
        lte?: Date;
      }
    | undefined;

  if (selectedDate === "TODAY") {
    dateWhere = {
      gte: startOfToday,
      lt: endOfToday,
    };
  }

  if (selectedDate === "UPCOMING") {
    dateWhere = {
      gte: startOfToday,
    };
  }

  if (selectedDate === "PAST") {
    dateWhere = {
      lt: startOfToday,
    };
  }

  

  const searchWhere = search
    ? {
        OR: [
          {
            id: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            subject: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            student: {
              name: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          },
          {
            student: {
              email: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          },
          {
            educator: {
              name: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          },
          {
            educator: {
              email: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          },
          {
            service: {
              title: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          },
        ],
      }
    : {};

  /*
   * ------------------------------------------------------------
   * BOOKING WHERE CLAUSE
   * ------------------------------------------------------------
   */

  const where = {
    ...(selectedStatus
      ? {
          status: selectedStatus,
        }
      : {}),

    ...(dateWhere
      ? {
          startTime: dateWhere,
        }
      : {}),

    ...searchWhere,
  };

  /*
   * ------------------------------------------------------------
   * REAL DATABASE QUERIES
   * ------------------------------------------------------------
   */

  const [
    totalBookings,
    pendingBookings,
    scheduledBookings,
    completedBookings,
    totalRevenueResult,
  ] = await Promise.all([
    prisma.booking.count(),

    prisma.booking.count({
      where: {
        status: "PendingPayment",
      },
    }),

    prisma.booking.count({
      where: {
        status: "Scheduled",
      },
    }),

    prisma.booking.count({
      where: {
        status: "Completed",
      },
    }),

    prisma.booking.findMany({
      where: {
        OR: [
          {
            status: "Scheduled",
          },
          {
            status: "Completed",
          },
        ],
        service: {
          price: {
            not: null,
          },
        },
      },
      select: {
        service: {
          select: {
            price: true,
          },
        },
      },
    }),
  ]);

  /*
   * ------------------------------------------------------------
   * PAGINATED BOOKINGS
   * ------------------------------------------------------------
   */

  const totalFilteredBookings = await prisma.booking.count({
    where,
  });

  const totalPages = Math.max(
    1,
    Math.ceil(totalFilteredBookings / PAGE_SIZE),
  );

  const safePage = Math.min(currentPage, totalPages);

  const bookings = await prisma.booking.findMany({
    where,

    orderBy: {
      startTime: "desc",
    },

    skip: (safePage - 1) * PAGE_SIZE,

    take: PAGE_SIZE,

    select: {
      id: true,

      studentId: true,
      educatorId: true,

      serviceId: true,
      availabilityId: true,

      startTime: true,
      endTime: true,

      subject: true,
      gradeLevel: true,

      status: true,

      description: true,

      payoutStatus: true,

      videoSessionId: true,

      createdAt: true,
      updatedAt: true,

      student: {
        select: {
          id: true,
          name: true,
          email: true,
          imageUrl: true,
        },
      },

      educator: {
        select: {
          id: true,
          name: true,
          email: true,
          imageUrl: true,
        },
      },

      service: {
        select: {
          id: true,
          title: true,
          type: true,
          price: true,
          currency: true,
          durationMinutes: true,
          subject: true,
        },
      },

      availability: {
        select: {
          id: true,
          startTime: true,
          endTime: true,
          status: true,
        },
      },

      
    },
  });

  /*
   * Service prices are stored in cents/smallest currency unit.
   */

  const totalRevenue = totalRevenueResult.reduce(
    (total, booking) => {
      return total + (booking.service?.price ?? 0);
    },
    0,
  );

  /*
   * ------------------------------------------------------------
   * PAGINATION
   * ------------------------------------------------------------
   */

  const previousPage =
    safePage > 1 ? safePage - 1 : null;

  const nextPage =
    safePage < totalPages
      ? safePage + 1
      : null;

  return (
    <div className="space-y-6 mx-auto max-w-6xl mt-8">
      {/* ========================================================
          PAGE HEADER
          ======================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
         
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            My Bookings
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            View and manage all tutoring bookings on Justdy.
          </p>
        </div>

        <Link
          href="/admin/tutoring"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border/70 bg-background px-4 text-sm font-medium shadow-sm transition hover:bg-muted"
        >
          <CalendarDays className="h-4 w-4" />
          Tutoring workspace
        </Link>
      </div>

      {/* ========================================================
          SUMMARY CARDS
          ======================================================== */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total */}

        <div className="rounded-md border border-border/70 bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Total bookings
              </p>

              <p className="mt-2 text-2xl font-semibold tracking-tight">
                {totalBookings.toLocaleString()}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarDays className="h-5 w-5" />
            </div>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            All tutoring bookings
          </p>
        </div>

        {/* Pending */}

        <div className="rounded-md border border-border/70 bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Pending payment
              </p>

              <p className="mt-2 text-2xl font-semibold tracking-tight">
                {pendingBookings.toLocaleString()}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <Clock3 className="h-5 w-5" />
            </div>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Awaiting payment
          </p>
        </div>

        {/* Scheduled */}

        <div className="rounded-md border border-border/70 bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Scheduled
              </p>

              <p className="mt-2 text-2xl font-semibold tracking-tight">
                {scheduledBookings.toLocaleString()}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <Video className="h-5 w-5" />
            </div>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Upcoming tutoring sessions
          </p>
        </div>

        {/* Revenue */}

        <div className="rounded-md border border-border/70 bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Booking value
              </p>

              <p className="mt-2 text-2xl font-semibold tracking-tight">
                {formatMoney(totalRevenue)}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">
              <UserRound className="h-5 w-5" />
            </div>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Scheduled and completed bookings
          </p>
        </div>
      </div>

      {/* ========================================================
          BOOKINGS CARD
          ======================================================== */}

      <section className="overflow-hidden rounded-md border border-border/70 bg-card shadow-sm">
        {/* Header */}

        <div className="border-b border-border/70 p-5">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-base font-semibold">
                All bookings
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Real-time tutoring bookings from your database.
              </p>
            </div>

            <form
              method="GET"
              className="flex flex-wrap items-center gap-2"
            >
              {/* Search */}

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <input
                  type="text"
                  name="search"
                  defaultValue={search}
                  placeholder="Search bookings..."
                  className="h-10 w-full rounded-lg border border-border/70 bg-background pl-9 pr-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 sm:w-[260px]"
                />
              </div>

              {/* Date */}

              <div className="relative">
                <select
                  name="date"
                  defaultValue={selectedDate}
                  className="h-10 appearance-none rounded-md border border-border/70 bg-background pl-3 pr-9 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                >
                  <option value="ALL">
                    All dates
                  </option>

                  <option value="TODAY">
                    Today
                  </option>

                  <option value="UPCOMING">
                    Upcoming
                  </option>

                  <option value="PAST">
                    Past
                  </option>
                </select>

                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>

              {/* Status */}

              <div className="relative">
                <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <select
                  name="status"
                  defaultValue={selectedStatus ?? "ALL"}
                  className="h-10 appearance-none rounded-lg border border-border/70 bg-background pl-9 pr-9 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                >
                  <option value="ALL">
                    All statuses
                  </option>

                  <option value="Scheduled">
                    Scheduled
                  </option>

                  <option value="PendingPayment">
                    Pending payment
                  </option>

                  <option value="Completed">
                    Completed
                  </option>

                  <option value="Cancelled">
                    Cancelled
                  </option>

                  <option value="NoShow">
                    No show
                  </option>
                </select>

                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>

              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              >
                Search
              </button>
            </form>
          </div>
        </div>

        {/* ======================================================
            DESKTOP TABLE
            ====================================================== */}

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-287.5">
            <thead>
              <tr className="border-b border-border/70 bg-muted/20 text-left">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Booking
                </th>

                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Student
                </th>

                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Tutor
                </th>

                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Subject
                </th>

                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Schedule
                </th>

                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Status
                </th>

                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Amount
                </th>

                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-16 text-center"
                  >
                    <div className="mx-auto flex max-w-sm flex-col items-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <CalendarDays className="h-5 w-5 text-muted-foreground" />
                      </div>

                      <h3 className="mt-4 text-sm font-semibold">
                        No bookings found
                      </h3>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Try changing your search or filters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => {
                  const statusStyles =
                    getStatusStyles(
                      booking.status as BookingStatus,
                    );

                  const serviceTitle =
                    booking.service?.title ??
                    "Tutoring";

                  const subject =
                    booking.subject ??
                    booking.service?.subject ??
                    "General tutoring";

                  return (
                    <tr
                      key={booking.id}
                      className="border-b border-border/60 transition hover:bg-muted/20 last:border-b-0"
                    >
                      {/* Booking */}

                      <td className="px-5 py-4">
                        <div>
                          <p className="font-mono text-xs font-semibold">
                            {booking.id}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {serviceTitle}
                          </p>
                        </div>
                      </td>

                      {/* Student */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <BookingAvatar
                            name={booking.student.name}
                            type="student"
                          />

                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {booking.student.name}
                            </p>

                            <p className="truncate text-xs text-muted-foreground">
                              {booking.student.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Tutor */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <BookingAvatar
                            name={booking.educator.name}
                            type="tutor"
                          />

                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {booking.educator.name}
                            </p>

                            <p className="truncate text-xs text-muted-foreground">
                              {booking.educator.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Subject */}

                      <td className="px-5 py-4">
                        <div>
                          <p className="text-sm font-medium">
                            {subject}
                          </p>

                          {booking.gradeLevel ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Grade{" "}
                              {booking.gradeLevel}
                            </p>
                          ) : null}

                          {booking.service
                            ?.durationMinutes ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {
                                booking.service
                                  .durationMinutes
                              }{" "}
                              minutes
                            </p>
                          ) : null}
                        </div>
                      </td>

                      {/* Schedule */}

                      <td className="px-5 py-4">
                        <div>
                          <p className="text-sm font-medium">
                            {formatDate(
                              booking.startTime,
                            )}
                          </p>

                          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock3 className="h-3.5 w-3.5" />

                            {formatTime(
                              booking.startTime,
                            )}

                            <span>—</span>

                            {formatTime(
                              booking.endTime,
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status */}

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles.container}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${statusStyles.dot}`}
                          />

                          {getStatusLabel(
                            booking.status as BookingStatus,
                          )}
                        </span>
                      </td>

                      {/* Amount */}

                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold">
                          {formatMoney(
                            booking.service?.price,
                            booking.service?.currency ??
                              "USD",
                          )}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {booking.payoutStatus}
                        </p>
                      </td>

                      {/* Actions */}

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1">
                          <Link
                            href={`/admin/bookings/${booking.id}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                            aria-label={`View booking ${booking.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Link>

                          <button
                            type="button"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                            aria-label={`More actions for ${booking.id}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>

                          {booking.status !==
                            "Cancelled" &&
                          booking.status !==
                            "Completed" ? (
                            <button
                              type="button"
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/30"
                              aria-label={`Cancel booking ${booking.id}`}
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ======================================================
            MOBILE
            ====================================================== */}

        <div className="divide-y divide-border/60 lg:hidden">
          {bookings.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <CalendarDays className="h-5 w-5 text-muted-foreground" />
              </div>

              <h3 className="mt-4 text-sm font-semibold">
                No bookings found
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Try changing your search or filters.
              </p>
            </div>
          ) : (
            bookings.map((booking) => {
              const statusStyles =
                getStatusStyles(
                  booking.status as BookingStatus,
                );

              const subject =
                booking.subject ??
                booking.service?.subject ??
                "General tutoring";

              return (
                <div
                  key={booking.id}
                  className="space-y-4 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-mono text-xs font-semibold">
                        {booking.id}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {booking.service?.title ??
                          "Tutoring"}
                      </p>
                    </div>

                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles.container}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${statusStyles.dot}`}
                      />

                      {getStatusLabel(
                        booking.status as BookingStatus,
                      )}
                    </span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Student */}

                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                        Student
                      </p>

                      <div className="mt-2 flex items-center gap-2.5">
                        <BookingAvatar
                          name={booking.student.name}
                          type="student"
                        />

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {booking.student.name}
                          </p>

                          <p className="truncate text-xs text-muted-foreground">
                            {booking.student.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Tutor */}

                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                        Tutor
                      </p>

                      <div className="mt-2 flex items-center gap-2.5">
                        <BookingAvatar
                          name={booking.educator.name}
                          type="tutor"
                        />

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {booking.educator.name}
                          </p>

                          <p className="truncate text-xs text-muted-foreground">
                            {booking.educator.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-border/60 pt-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                        Subject
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {subject}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                        Date
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {formatDate(
                          booking.startTime,
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                        Time
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {formatTime(
                          booking.startTime,
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                        Amount
                      </p>

                      <p className="mt-1 text-sm font-semibold">
                        {formatMoney(
                          booking.service?.price,
                          booking.service?.currency ??
                            "USD",
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t border-border/60 pt-4">
                    <Link
                      href={`/admin/bookings/${booking.id}`}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-border/70 px-3 text-sm font-medium transition hover:bg-muted"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Link>

                    {booking.status !==
                      "Cancelled" &&
                    booking.status !==
                      "Completed" ? (
                      <button
                        type="button"
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-200 px-3 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
                      >
                        <XCircle className="h-4 w-4" />
                        Cancel
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ======================================================
            FOOTER / PAGINATION
            ====================================================== */}

        <div className="flex flex-col gap-3 border-t border-border/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">
              {bookings.length}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground">
              {totalFilteredBookings}
            </span>{" "}
            matching bookings
          </p>

          <div className="flex items-center gap-2">
            {previousPage ? (
              <Link
                href={buildQuery({
                  search,
                  status:
                    selectedStatus ?? "ALL",
                  date: selectedDate,
                  page: String(previousPage),
                })}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-lg border border-border/70 text-muted-foreground opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}

            <div className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-primary px-2 text-xs font-semibold text-primary-foreground">
              {safePage}
            </div>

            {nextPage ? (
              <Link
                href={buildQuery({
                  search,
                  status:
                    selectedStatus ?? "ALL",
                  date: selectedDate,
                  page: String(nextPage),
                })}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-lg border border-border/70 text-muted-foreground opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}