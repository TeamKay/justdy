"use client";

import { ChevronDown, Filter, Search } from "lucide-react";

type BookingFiltersProps = {
  search: string;
  selectedDate: string;
  selectedStatus: string;
};

export default function BookingFilters({
  search,
  selectedDate,
  selectedStatus,
}: BookingFiltersProps) {
  return (
    <form
      method="GET"
      action="/admin/bookings"
      className="flex flex-wrap items-center gap-2"
    >
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          name="search"
          defaultValue={search}
          placeholder="Search bookings..."
          aria-label="Search bookings"
          className="h-10 w-full rounded-lg border border-border/70 bg-background pl-9 pr-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 sm:w-[260px]"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
        />
      </div>

      <div className="relative">
        <select
          name="date"
          defaultValue={selectedDate}
          aria-label="Filter bookings by date"
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
          className="h-10 appearance-none rounded-md border border-border/70 bg-background pl-3 pr-9 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
        >
          <option value="ALL">All dates</option>
          <option value="TODAY">Today</option>
          <option value="UPCOMING">Upcoming</option>
          <option value="PAST">Past</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>

      <div className="relative">
        <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <select
          name="status"
          defaultValue={selectedStatus}
          aria-label="Filter bookings by status"
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
          className="h-10 appearance-none rounded-lg border border-border/70 bg-background pl-9 pr-9 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
        >
          <option value="ALL">All statuses</option>
          <option value="Scheduled">Scheduled</option>
          <option value="PendingPayment">Pending payment</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
          <option value="NoShow">No show</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    </form>
  );
}
