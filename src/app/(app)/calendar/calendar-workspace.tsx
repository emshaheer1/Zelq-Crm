"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flag,
  FolderKanban,
  Play,
  TriangleAlert,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { UserAvatar } from "@/components/shared/user-avatar";
import { PriorityBadge, StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Surface, SectionTitle } from "@/components/shared/surface";
import { AppSelect } from "@/components/ui/app-select";
import { fieldSelectClass } from "@/lib/styles";
import { formatDate, isOverdue, asDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

type TaskItem = {
  id: string;
  title: string;
  status: string;
  priority: string;
  startDate: Date | string | null;
  deadline: Date | string | null;
  projectId: string;
  assignedTo: { id: string; name: string; avatarUrl: string | null };
  project: { id: string; name: string };
};

type ProjectItem = {
  id: string;
  name: string;
  status: string;
  deadline: Date | string | null;
  client: { id: string; name: string };
};

type DayChip = {
  id: string;
  label: string;
  tone: "start" | "due" | "overdue" | "done" | "delivery";
  href: string;
};

const chipTone: Record<DayChip["tone"], string> = {
  start: "bg-[#EFF8FF] text-[#175CD3]",
  due: "bg-[#FFFAEB] text-[#B54708]",
  overdue: "bg-[#FEF3F2] text-[#B42318]",
  done: "bg-[#ECFDF3] text-[#027A48]",
  delivery: "bg-primary/20 text-[#111111]",
};

export function CalendarWorkspace({
  projects,
  tasks,
  selectedProjectId,
}: {
  projects: ProjectItem[];
  tasks: TaskItem[];
  selectedProjectId: string;
  canCreate: boolean;
}) {
  const router = useRouter();
  const [cursor, setCursor] = useState(new Date());
  const [projectId, setProjectId] = useState(selectedProjectId);
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());

  const project = projects.find((item) => item.id === projectId) ?? null;
  const projectTasks = useMemo(
    () => tasks.filter((task) => task.projectId === projectId),
    [tasks, projectId],
  );

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const stats = useMemo(() => {
    const open = projectTasks.filter((task) => task.status !== "COMPLETED");
    return {
      total: projectTasks.length,
      open: open.length,
      overdue: open.filter((task) => isOverdue(task.deadline, task.status)).length,
      done: projectTasks.filter((task) => task.status === "COMPLETED").length,
    };
  }, [projectTasks]);

  const chipsForDay = (day: Date): DayChip[] => {
    if (!project) return [];
    const chips: DayChip[] = [];

    const projectDeadline = asDate(project.deadline);
    if (projectDeadline && isSameDay(projectDeadline, day)) {
      chips.push({
        id: `delivery-${project.id}`,
        label: "Delivery",
        tone: "delivery",
        href: `/projects/${project.id}`,
      });
    }

    for (const task of projectTasks) {
      const deadline = asDate(task.deadline);
      const start = asDate(task.startDate);
      const completed = task.status === "COMPLETED";

      // Completed work is green — never blue "Start".
      if (completed) {
        const onDeadline = deadline && isSameDay(deadline, day);
        const onStart = start && isSameDay(start, day);
        if (onDeadline || (!deadline && onStart)) {
          chips.push({
            id: `${task.id}-done`,
            label: task.title,
            tone: "done",
            href: `/tasks/${task.id}`,
          });
        }
        continue;
      }

      if (start && isSameDay(start, day)) {
        chips.push({
          id: `${task.id}-start`,
          label: task.title,
          tone: "start",
          href: `/tasks/${task.id}`,
        });
      }
      if (deadline && isSameDay(deadline, day)) {
        chips.push({
          id: `${task.id}-due`,
          label: task.title,
          tone: isOverdue(task.deadline, task.status) ? "overdue" : "due",
          href: `/tasks/${task.id}`,
        });
      }
    }
    return chips;
  };

  const dayTasks = selectedDay
    ? projectTasks.filter((task) => {
        const deadline = asDate(task.deadline);
        const start = asDate(task.startDate);
        return (
          (deadline && isSameDay(deadline, selectedDay)) ||
          (start && isSameDay(start, selectedDay))
        );
      })
    : projectTasks;

  const onSelectProject = (nextId: string) => {
    setProjectId(nextId);
    setSelectedDay(new Date());
    setCursor(new Date());
    router.replace(`/calendar?project=${nextId}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        description="Select a project to view its task starts and deadlines."
      />

      <Surface>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <SectionTitle
              title="Select project"
              description="Calendar shows only the chosen project's dated work."
            />
            <AppSelect
              value={projectId}
              onChange={(event) => onSelectProject(event.target.value)}
              className={cn(fieldSelectClass, "h-10 max-w-xl")}
            >
              {projects.length === 0 ? <option value="">No projects</option> : null}
              {projects.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.client.name}
                </option>
              ))}
            </AppSelect>
          </div>

          {project ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <MiniStat label="Tasks" value={stats.total} />
              <MiniStat label="Open" value={stats.open} />
              <MiniStat label="Done" value={stats.done} />
              <MiniStat label="Overdue" value={stats.overdue} danger={stats.overdue > 0} />
            </div>
          ) : null}
        </div>

        {project ? (
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-4">
            <p className="text-[12px] text-muted-foreground">
              <span className="font-medium text-foreground">{project.client.name}</span>
              {project.deadline ? ` · Delivery ${formatDate(project.deadline)}` : null}
            </p>
            <span className="hidden h-3 w-px bg-border sm:block" />
            <LegendSwatch className="bg-[#EFF8FF] text-[#175CD3]" icon={Play} label="Start" />
            <LegendSwatch className="bg-[#FFFAEB] text-[#B54708]" icon={Flag} label="Due" />
            <LegendSwatch className="bg-[#FEF3F2] text-[#B42318]" icon={TriangleAlert} label="Overdue" />
            <LegendSwatch className="bg-[#ECFDF3] text-[#027A48]" icon={CheckCircle2} label="Done" />
            <LegendSwatch className="bg-primary/20 text-[#111111]" icon={FolderKanban} label="Delivery" />
          </div>
        ) : null}
      </Surface>

      {!project ? (
        <Surface>
          <EmptyState
            title="No project selected"
            description="Create a project first, then open the calendar."
            icon={FolderKanban}
          />
        </Surface>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.85fr)]">
          <Surface padded={false} className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
              <div>
                <p className="text-[15px] font-semibold text-foreground">{project.name}</p>
                <p className="mt-0.5 text-[13px] text-muted-foreground">{format(cursor, "MMMM yyyy")}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setCursor(new Date())}>
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCursor((current) => addMonths(current, -1))}
                  aria-label="Previous month"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCursor((current) => addMonths(current, 1))}
                  aria-label="Next month"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-[12px] font-medium text-muted-foreground">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <div key={day} className="px-3 py-3">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {days.map((day) => {
                const chips = chipsForDay(day);
                const today = isSameDay(day, new Date());
                const active = selectedDay ? isSameDay(day, selectedDay) : false;
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={cn(
                      "min-h-28 border-r border-b border-border p-2 text-left last:border-r-0 transition-colors hover:bg-muted/40 sm:min-h-32",
                      !isSameMonth(day, cursor) && "bg-muted/20 text-muted-foreground",
                      active && "bg-primary/10",
                    )}
                  >
                    <span
                      className={cn(
                        "mb-2 inline-flex size-7 items-center justify-center rounded-lg text-xs font-semibold",
                        today && "bg-primary text-primary-foreground",
                        !today && active && "bg-secondary text-secondary-foreground",
                        !today && !active && "text-muted-foreground",
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    <div className="space-y-1">
                      {chips.slice(0, 3).map((chip) => (
                        <span
                          key={chip.id}
                          className={cn(
                            "block w-full truncate rounded-md px-1.5 py-1 text-[11px] font-medium",
                            chipTone[chip.tone],
                          )}
                          title={chip.label}
                        >
                          {chip.label}
                        </span>
                      ))}
                      {chips.length > 3 ? (
                        <span className="px-1 text-[10px] text-muted-foreground">
                          +{chips.length - 3} more
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </Surface>

          <Surface padded={false}>
            <div className="border-b border-border px-5 py-4">
              <SectionTitle
                title={
                  selectedDay
                    ? format(selectedDay, "EEEE, MMM d")
                    : "All dated tasks"
                }
                description={
                  selectedDay
                    ? `${dayTasks.length} task${dayTasks.length === 1 ? "" : "s"} on this date`
                    : "Click a date on the calendar to filter."
                }
                action={
                  selectedDay ? (
                    <button
                      type="button"
                      className="text-[12px] font-medium text-muted-foreground hover:text-foreground"
                      onClick={() => setSelectedDay(null)}
                    >
                      Show all
                    </button>
                  ) : null
                }
              />
            </div>

            {dayTasks.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title={selectedDay ? "No tasks on this date." : "No dated tasks in this project."}
                  description="Tasks with a start date or deadline will appear here."
                  icon={CalendarDays}
                />
              </div>
            ) : (
              <div className="divide-y divide-border">
                {dayTasks.map((task) => {
                  const start = asDate(task.startDate);
                  const deadline = asDate(task.deadline);
                  const completed = task.status === "COMPLETED";
                  const showStart =
                    !completed &&
                    Boolean(start) &&
                    (!selectedDay || isSameDay(start!, selectedDay));
                  const showDue =
                    !completed &&
                    Boolean(deadline) &&
                    (!selectedDay || isSameDay(deadline!, selectedDay));
                  const showDone = completed;
                  const overdue = isOverdue(task.deadline, task.status);

                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => router.push(`/tasks/${task.id}`)}
                      className="flex w-full items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-muted/50"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {showDone ? (
                            <span className="rounded-md bg-[#ECFDF3] px-1.5 py-0.5 text-[10px] font-semibold text-[#027A48]">
                              Done
                            </span>
                          ) : null}
                          {showStart ? (
                            <span className="rounded-md bg-[#EFF8FF] px-1.5 py-0.5 text-[10px] font-semibold text-[#175CD3]">
                              Start
                            </span>
                          ) : null}
                          {showDue ? (
                            <span
                              className={cn(
                                "rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                                overdue
                                  ? "bg-[#FEF3F2] text-[#B42318]"
                                  : "bg-[#FFFAEB] text-[#B54708]",
                              )}
                            >
                              {overdue ? "Overdue" : "Due"}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1.5 truncate text-[13px] font-medium text-foreground">{task.title}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 text-[12px] text-foreground">
                            <UserAvatar
                              name={task.assignedTo.name}
                              src={task.assignedTo.avatarUrl}
                              className="size-5"
                            />
                            {task.assignedTo.name.split(" ")[0]}
                          </span>
                          <PriorityBadge value={task.priority as "HIGH" | "MEDIUM" | "LOW"} />
                          <StatusBadge value={task.status as never} />
                        </div>
                        <p className="mt-1.5 text-[11px] text-muted-foreground">
                          {task.startDate ? `Start ${formatDate(task.startDate)}` : null}
                          {task.startDate && task.deadline ? " · " : null}
                          {task.deadline ? `Due ${formatDate(task.deadline)}` : null}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Surface>
        </div>
      )}
    </div>
  );
}

function MiniStat({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div className="min-w-[72px] rounded-xl border border-border bg-muted/30 px-3 py-2">
      <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <p
        className={cn(
          "mt-1 text-[18px] font-semibold tabular-nums",
          danger ? "text-[#B42318]" : "text-foreground",
        )}
      >
        {String(value).padStart(2, "0")}
      </p>
    </div>
  );
}

function LegendSwatch({
  className,
  icon: Icon,
  label,
}: {
  className: string;
  icon: typeof Play;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
      <span className={cn("inline-flex size-5 items-center justify-center rounded-md", className)}>
        <Icon className="size-3" />
      </span>
      <span className="text-foreground">{label}</span>
    </span>
  );
}
