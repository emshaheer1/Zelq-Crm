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

export function formatDate(value?: Date | string | null) {
  if (!value) return "—";
  const date = typeof value === "string" ? parseISO(value) : value;
  return format(date, "MMM d, yyyy");
}

export function formatDateTime(value?: Date | string | null) {
  if (!value) return "—";
  const date = typeof value === "string" ? parseISO(value) : value;
  return format(date, "MMM d, yyyy · h:mm a");
}

export function formatTime(value?: Date | string | null) {
  if (!value) return "";
  const date = typeof value === "string" ? parseISO(value) : value;
  return format(date, "h:mm a");
}

export function toDateInput(value?: Date | string | null) {
  if (!value) return "";
  const date = typeof value === "string" ? parseISO(value) : value;
  return format(date, "yyyy-MM-dd");
}

export function isOverdue(deadline?: Date | string | null, status?: string) {
  if (!deadline || status === "COMPLETED") return false;
  const date = typeof deadline === "string" ? parseISO(deadline) : deadline;
  return isBefore(endOfDay(date), startOfToday());
}

export function isDueToday(deadline?: Date | string | null) {
  if (!deadline) return false;
  const date = typeof deadline === "string" ? parseISO(deadline) : deadline;
  return isSameDay(date, new Date());
}

export function monthLabel(year: number, month: number) {
  return format(new Date(year, month - 1, 1), "MMMM yyyy");
}

export function formatRelativeTime(value?: Date | string | null) {
  if (!value) return "—";
  const date = typeof value === "string" ? parseISO(value) : value;
  return formatDistanceToNow(date, { addSuffix: true });
}

export function formatDateBlock(value?: Date | string | null) {
  if (!value) return { month: "—", day: "—" };
  const date = typeof value === "string" ? parseISO(value) : value;
  return {
    month: format(date, "MMM").toUpperCase(),
    day: format(date, "d"),
  };
}

export function formatDeadlineLabel(value?: Date | string | null) {
  if (!value) return "No deadline";
  const date = typeof value === "string" ? parseISO(value) : value;
  if (isSameDay(date, new Date())) return `Today · ${format(date, "h:mm a")}`;
  if (isSameDay(date, addDays(new Date(), 1))) return `Tomorrow · ${format(date, "h:mm a")}`;
  return format(date, "MMM d · h:mm a");
}
