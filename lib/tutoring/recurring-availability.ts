/**
 * Recurring availability is intentionally NOT materialized.
 *
 * A RecurringAvailability row is the source of truth for a weekly schedule.
 * Future occurrences must be calculated in memory by the marketplace/booking
 * flow and must never be inserted into Availability.
 *
 * This function is retained as a compatibility no-op so any legacy caller
 * cannot accidentally recreate 52/53 database rows.
 */
export async function materializeRecurringAvailability(
  _educatorId?: string,
): Promise<void> {
  return;
}
