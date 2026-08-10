export function currentWeekStart(now = new Date()) {
  const nairobiDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const date = new Date(`${nairobiDate}T00:00:00Z`);
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - daysSinceMonday);
  return date.toISOString().slice(0, 10);
}

export function shiftWeek(weekStart: string, weeks: number) {
  const date = new Date(`${weekStart}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + weeks * 7);
  return date.toISOString().slice(0, 10);
}

export function weekDayDate(weekStart: string, dayOfWeek: number) {
  const date = new Date(`${weekStart}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + dayOfWeek);
  return date;
}

export function formatWeekRange(weekStart: string) {
  const start = weekDayDate(weekStart, 0);
  const end = weekDayDate(weekStart, 6);
  const sameMonth = start.getUTCMonth() === end.getUTCMonth();
  const startLabel = new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    ...(start.getUTCFullYear() !== end.getUTCFullYear() ? { year: "numeric" } : {}),
    timeZone: "UTC",
  }).format(start);
  const endLabel = new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: sameMonth ? undefined : "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(end);
  return `${startLabel} – ${endLabel}`;
}
