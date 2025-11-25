const DEFAULT_TZ = "Asia/Tokyo";

export function todayKey(date: Date = new Date(), timeZone: string = DEFAULT_TZ) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
