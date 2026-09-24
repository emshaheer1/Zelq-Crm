import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  BadgeCheck,
  CalendarDays,
  ClipboardList,
  FolderKanban,
  RefreshCcw,
  ScanEye,
} from "lucide-react";
import type { NotificationType } from "@prisma/client";

export const notificationTypeMeta: Record<
  NotificationType,
  { label: string; icon: LucideIcon; tone: string; text: string }
> = {
  TASK_ASSIGNED: {
    label: "Assignment",
    icon: ClipboardList,
    tone: "bg-[#EFF8FF] text-[#175CD3]",
    text: "text-[#175CD3]",
  },
  DEADLINE_TOMORROW: {
    label: "Deadline",
    icon: CalendarDays,
    tone: "bg-[#FFFAEB] text-[#B54708]",
    text: "text-[#B54708]",
  },
  TASK_OVERDUE: {
    label: "Overdue",
    icon: AlertCircle,
    tone: "bg-[#FEF3F2] text-[#B42318]",
    text: "text-[#B42318]",
  },
  REVIEW_SUBMITTED: {
    label: "Review",
    icon: ScanEye,
    tone: "bg-[#F4F3FF] text-[#6941C6]",
    text: "text-[#6941C6]",
  },
  REVISION_REQUESTED: {
    label: "Revision",
    icon: RefreshCcw,
    tone: "bg-[#FFF6ED] text-[#C4320A]",
    text: "text-[#C4320A]",
  },
  TASK_APPROVED: {
    label: "Approved",
    icon: BadgeCheck,
    tone: "bg-[#ECFDF3] text-[#027A48]",
    text: "text-[#027A48]",
  },
  PROJECT_DEADLINE_APPROACHING: {
    label: "Project",
    icon: FolderKanban,
    tone: "bg-[#FEFBE8] text-[#CA8A04]",
    text: "text-[#CA8A04]",
  },
};

export const notificationFilterTypes = [
  { value: "all", label: "All types" },
  { value: "TASK_ASSIGNED", label: "Assignment" },
  { value: "REVIEW_SUBMITTED", label: "Review" },
  { value: "REVISION_REQUESTED", label: "Revision" },
  { value: "TASK_APPROVED", label: "Approved" },
  { value: "DEADLINE_TOMORROW", label: "Deadline" },
  { value: "TASK_OVERDUE", label: "Overdue" },
  { value: "PROJECT_DEADLINE_APPROACHING", label: "Project" },
] as const;
