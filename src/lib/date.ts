const DEFAULT_TZ = "Asia/Tokyo";

export function todayKey(date: Date = new Date(), timeZone: string = DEFAULT_TZ) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function calcSleepHours(date: string, start?: string | null, end?: string | null) {
  if (!start || !end) return null;
  const startDate = new Date(`${date}T${start}:00`);
  let endDate = new Date(`${date}T${end}:00`);
  if (endDate <= startDate) {
    endDate = new Date(endDate.getTime() + 24 * 60 * 60 * 1000);
  }
  const diffHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
  return Number(diffHours.toFixed(2));
}
