const DEFAULT_TZ = "Asia/Tokyo";

export function todayKey(date: Date = new Date(), timeZone: string = DEFAULT_TZ) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function yesterdayKey(timeZone: string = DEFAULT_TZ) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(yesterday);
}
