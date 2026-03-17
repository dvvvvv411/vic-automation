/**
 * Checks if the chat is currently online based on time-of-day schedule.
 * @param from - time string like "08:00:00" or "08:00"
 * @param until - time string like "17:00:00" or "17:00"
 * @returns true if current local time is within [from, until)
 */
export function isChatOnline(from?: string | null, until?: string | null): boolean {
  if (!from || !until) return false;
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();

  const parse = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + (m || 0);
  };

  const fromMin = parse(from);
  const untilMin = parse(until);

  return minutes >= fromMin && minutes < untilMin;
}
