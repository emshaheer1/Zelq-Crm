import {
  endOfMonth,
  format,
  formatDistanceToNow,
  parseISO,
  startOfMonth,
} from "date-fns";

/** Business calendar for date-only deadlines (stored as UTC midnight of YYYY-MM-DD). */
export const CRM_TIMEZONE = "Asia/Karachi";

export function calendarDateKey(date: Date = new Date(), timeZone = CRM_TIMEZONE) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** UTC day bounds for a calendar YYYY-MM-DD (matches `new Date("yyyy-MM-dd")` storage). */
export function utcDayRange(dayKey: string) {
  return {
    start: new Date(`${dayKey}T00:00:00.000Z`),
    end: new Date(`${dayKey}T23:59:59.999Z`),
  };
}

export function shiftDayKey(dayKey: string, days: number) {
  const [year, month, day] = dayKey.split("-").map(Number);
  const shifted = new Date(Date.UTC(year!, month! - 1, day! + days));
  return shifted.toISOString().slice(0, 10);
}

export function deadlineDayKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function startOfToday() {
  return utcDayRange(calendarDateKey()).start;
}

export function endOfToday() {
  return utcDayRange(calendarDateKey()).end;
}

export function startOfTomorrow() {
  return utcDayRange(shiftDayKey(calendarDateKey(), 1)).start;
}

export function endOfTomorrow() {
  return utcDayRange(shiftDayKey(calendarDateKey(), 1)).end;
}

export function monthRange(year: number, month: number) {
  const date = new Date(year, month - 1, 1);
  return { start: startOfMonth(date), end: endOfMonth(date) };
}

export function asDate(value?: Date | string | null) {
  if (!value) return null;
  const date = typeof value === "string" ? parseISO(value) : value;
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value?: Date | string | null) {
  const date = asDate(value);
  return date ? format(date, "MMM d, yyyy") : "—";
}

export function formatDateTime(value?: Date | string | null) {
  const date = asDate(value);
  return date ? format(date, "MMM d, yyyy · h:mm a") : "—";
}

export function formatTime(value?: Date | string | null) {
  const date = asDate(value);
  return date ? format(date, "h:mm a") : "";
}

export function toDateInput(value?: Date | string | null) {
  const date = asDate(value);
  if (!date) return "";
  // Date-only fields are stored as UTC midnight of the intended calendar day.
  return deadlineDayKey(date);
}

export function isOverdue(deadline?: Date | string | null, status?: string) {
  const date = asDate(deadline);
  if (!date || status === "COMPLETED") return false;
  return deadlineDayKey(date) < calendarDateKey();
}

export function isDueToday(deadline?: Date | string | null) {
  const date = asDate(deadline);
  return date ? deadlineDayKey(date) === calendarDateKey() : false;
}

export function monthLabel(year: number, month: number) {
  return format(new Date(year, month - 1, 1), "MMMM yyyy");
}

export function formatRelativeTime(value?: Date | string | null) {
  const date = asDate(value);
  return date ? formatDistanceToNow(date, { addSuffix: true }) : "—";
}

export function formatDateBlock(value?: Date | string | null) {
  const date = asDate(value);
  if (!date) return { month: "—", day: "—" };
  return {
    month: format(date, "MMM").toUpperCase(),
    day: format(date, "d"),
  };
}

export function formatDeadlineLabel(value?: Date | string | null) {
  const date = asDate(value);
  if (!date) return "No deadline";
  const key = deadlineDayKey(date);
  const today = calendarDateKey();
  if (key === today) return "Today";
  if (key === shiftDayKey(today, 1)) return "Tomorrow";
  return format(date, "MMM d, yyyy");
}
