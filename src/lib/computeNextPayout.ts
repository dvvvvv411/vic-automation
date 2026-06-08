/**
 * Compute the next salary payout date.
 * Base date priority:
 *   1. firstWorkdayDate (first_workday_appointments.appointment_date)
 *   2. desiredStartDate (employment_contracts.desired_start_date)
 *   3. submittedAt (employment_contracts.submitted_at)
 *   4. Fallback: 15. of current/next month
 *
 * First payout = base + 30 days, then in 30-day cycles until in the future.
 */
export function computeNextPayout(opts: {
  firstWorkdayDate?: string | null;
  desiredStartDate?: string | null;
  submittedAt?: string | null;
}): Date {
  const today = new Date();
  const baseStr =
    opts.firstWorkdayDate || opts.desiredStartDate || opts.submittedAt || null;

  if (!baseStr) {
    const d15 = new Date(today.getFullYear(), today.getMonth(), 15);
    return today.getDate() < 15
      ? d15
      : new Date(today.getFullYear(), today.getMonth() + 1, 15);
  }

  // Date-only strings -> parse as local midnight
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(baseStr)
    ? baseStr + "T00:00:00"
    : baseStr;
  const start = new Date(normalized);
  if (isNaN(start.getTime())) {
    const d15 = new Date(today.getFullYear(), today.getMonth(), 15);
    return today.getDate() < 15
      ? d15
      : new Date(today.getFullYear(), today.getMonth() + 1, 15);
  }

  // First payout is exactly 30 days after start
  let next = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
  while (next <= today) {
    next = new Date(next.getTime() + 30 * 24 * 60 * 60 * 1000);
  }
  return next;
}
