/**
 * One way to turn a number of minutes into something a person reads.
 *
 * There were five: three identical copies of `formatDuration`, a `fmt` in the
 * manager navbar, and a `toHours`/`toMins` pair in the worker's history. They
 * did not all agree — the worker's home screen rendered fifty minutes as
 * "0h 50m" where everywhere else showed "50m" — and the history page used
 * `toHours` alone for its period totals, so the headline number a worker reads
 * for a month quietly dropped up to fifty-nine minutes of their own work.
 */

/** Hours and whole minutes, for places that style the two differently. */
export const splitDuration = (minutes: number) => {
  const safe = Math.max(0, Math.round(minutes));
  return { hours: Math.floor(safe / 60), minutes: safe % 60 };
};

/**
 * "7h 50m", "1h", "50m". Minutes are never dropped: a total that is not a
 * whole number of hours says so.
 */
export const formatDuration = (minutes: number): string => {
  const { hours, minutes: mins } = splitDuration(minutes);

  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};
