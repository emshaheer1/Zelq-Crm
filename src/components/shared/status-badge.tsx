import type { Priority, TaskStatus, ProjectStatus, UserStatus, ClientStatus } from "@prisma/client";
import {
  ArrowDown,
  ArrowUp,
  CircleCheck,
  Clock3,
  CloudOff,
  Eye,
  LoaderCircle,
  Minus,
  Pause,
  RotateCcw,
  TriangleAlert,
  CircleDashed,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  clientStatusLabel,
  priorityLabel,
  projectStatusLabel,
  taskStatusLabel,
  userStatusLabel,
} from "@/lib/labels";
import { cn } from "@/lib/utils";

const statusClass: Record<string, string> = {
  PENDING: "border-transparent bg-[#F2F4F7] text-[#475467]",
  IN_PROGRESS: "border-transparent bg-[#EFF8FF] text-[#175CD3]",
  READY_FOR_REVIEW: "border-transparent bg-[#F4F3FF] text-[#6941C6]",
  REVISION_REQUIRED: "border-transparent bg-[#FFF6ED] text-[#C4320A]",
  COMPLETED: "border-transparent bg-[#ECFDF3] text-[#027A48]",
  ON_HOLD: "border-transparent bg-[#FEFBE8] text-[#CA8A04]",
  NOT_STARTED: "border-transparent bg-[#F2F4F7] text-[#475467]",
  ACTIVE: "border-transparent bg-[#ECFDF3] text-[#027A48]",
  INACTIVE: "border-transparent bg-[#F2F4F7] text-[#475467]",
};

const statusIcon: Partial<Record<string, typeof CircleCheck>> = {
  PENDING: Clock3,
  IN_PROGRESS: LoaderCircle,
  READY_FOR_REVIEW: Eye,
  REVISION_REQUIRED: RotateCcw,
  COMPLETED: CircleCheck,
  ON_HOLD: Pause,
  NOT_STARTED: CircleDashed,
  ACTIVE: CircleCheck,
  INACTIVE: Pause,
};

export function StatusBadge({
  value,
}: {
  value: TaskStatus | ProjectStatus | UserStatus | ClientStatus;
}) {
  const label =
    value in taskStatusLabel
      ? taskStatusLabel[value as TaskStatus]
      : value in projectStatusLabel
        ? projectStatusLabel[value as ProjectStatus]
        : value in userStatusLabel
          ? userStatusLabel[value as UserStatus]
          : clientStatusLabel[value as ClientStatus];
  const Icon = statusIcon[value];

  return (
    <Badge
      variant="outline"
      className={cn(
        "h-6 gap-1 rounded-full border px-2 text-[11px] font-medium",
        statusClass[value],
      )}
    >
      {Icon ? <Icon className="size-3.5" /> : null}
      {label}
    </Badge>
  );
}

export function PriorityBadge({ value }: { value: Priority }) {
  const Icon = value === "HIGH" ? ArrowUp : value === "LOW" ? ArrowDown : Minus;

  return (
    <Badge
      variant="outline"
      className={cn(
        "h-6 gap-1 rounded-full border px-2 text-[11px] font-medium",
        value === "HIGH" && "border-transparent bg-[#FEF3F2] text-[#B42318]",
        value === "MEDIUM" && "border-transparent bg-[#FFFAEB] text-[#B54708]",
        value === "LOW" && "border-transparent bg-[#F2F4F7] text-[#475467]",
      )}
    >
      <Icon className="size-3.5" />
      {priorityLabel[value]}
    </Badge>
  );
}

export function OverdueBadge() {
  return (
    <Badge
      variant="outline"
      className="h-6 gap-1.5 rounded-full border-transparent bg-[#FEF3F2] text-[11px] font-medium text-[#B42318]"
    >
      <TriangleAlert className="size-3.5" />
      Overdue
    </Badge>
  );
}

export function DriveBadge({ uploaded }: { uploaded: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-6 gap-1.5 rounded-full border text-[11px] font-medium",
        uploaded
          ? "border-transparent bg-[#ECFDF3] text-[#027A48]"
          : "border-transparent bg-[#FFF6ED] text-[#C4320A]",
      )}
    >
      {uploaded ? <CircleCheck className="size-3.5" /> : <CloudOff className="size-3.5" />}
      {uploaded ? "Drive Uploaded" : "Drive Pending"}
    </Badge>
  );
}
