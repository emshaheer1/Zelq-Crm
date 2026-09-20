import {
  addDays,
  endOfDay,
  endOfMonth,
  format,
  formatDistanceToNow,
  isBefore,
  isSameDay,
  parseISO,
  startOfDay,
  startOfMonth,
} from "date-fns";

export function startOfToday() {
  return startOfDay(new Date());
}

export function endOfToday() {
  return endOfDay(new Date());
}

export function startOfTomorrow() {
  return startOfDay(addDays(new Date(), 1));
}

export function endOfTomorrow() {
  return endOfDay(addDays(new Date(), 1));
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
  return date ? format(date, "yyyy-MM-dd") : "";
}

export function isOverdue(deadline?: Date | string | null, status?: string) {
  const date = asDate(deadline);
  if (!date || status === "COMPLETED") return false;
  return isBefore(endOfDay(date), startOfToday());
}

export function isDueToday(deadline?: Date | string | null) {
  const date = asDate(deadline);
  return date ? isSameDay(date, new Date()) : false;
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
  if (isSameDay(date, new Date())) return `Today · ${format(date, "h:mm a")}`;
  if (isSameDay(date, addDays(new Date(), 1))) return `Tomorrow · ${format(date, "h:mm a")}`;
  return format(date, "MMM d · h:mm a");
}
