import Link from "next/link";
import { CalendarDays } from "lucide-react";
import type { Priority, TaskStatus } from "@prisma/client";
import { DriveBadge, PriorityBadge } from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { formatDate, isOverdue } from "@/lib/dates";
import { cn } from "@/lib/utils";

type TaskCardTask = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  deadline: Date | string | null;
  driveUploaded: boolean;
  project: { name: string };
  assignedTo: { name: string; avatarUrl: string | null };
};

export function TaskCard({ task, compact = false }: { task: TaskCardTask; compact?: boolean }) {
  const overdue = isOverdue(task.deadline, task.status);

  return (
    <Link
      href={`/tasks/${task.id}`}
      className={cn(
        "block rounded-xl border border-border bg-card p-4 transition-colors duration-150 hover:border-[#d0d5dd] hover:bg-muted/40",
        compact && "p-3.5",
      )}
    >
      <p className="truncate text-[12px] font-medium text-muted-foreground">{task.project.name}</p>
      <p className="mt-1.5 text-sm font-semibold text-foreground">{task.title}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <PriorityBadge value={task.priority} />
        <div className={cn("flex items-center gap-1 text-[12px]", overdue ? "text-destructive" : "text-muted-foreground")}>
          <CalendarDays className="size-3.5" aria-hidden="true" />
          {formatDate(task.deadline)}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <UserAvatar name={task.assignedTo.name} src={task.assignedTo.avatarUrl} className="size-5" />
          <span>{task.assignedTo.name.split(" ")[0]}</span>
        </div>
        <DriveBadge uploaded={task.driveUploaded} />
      </div>
    </Link>
  );
}
