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
import { Surface } from "@/components/shared/surface";
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
  tone: "start" | "due" | "overdue" | "delivery";
  href: string;
};

const chipTone: Record<DayChip["tone"], string> = {
  start: "bg-[#EFF8FF] text-[#175CD3] border-[#B2DDFF]",
  due: "bg-[#FFFAEB] text-[#B54708] border-[#FEDF89]",
  overdue: "bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]",
  delivery: "bg-primary/25 text-[#111111] border-[#d8f28a]",
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
    : [];

  const onSelectProject = (nextId: string) => {
    setProjectId(nextId);
    setSelectedDay(new Date());
    setCursor(new Date());
    router.replace(`/calendar?project=${nextId}`, { scroll: false });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Project Calendar"
        description="Choose a project, then track starts and deadlines day by day."
      />

      {/* Project picker */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgba(16,24,40,0.04)]">
        <div className="bg-[#111111] px-5 py-5 text-white md:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold tracking-[0.18em] text-primary uppercase">
                Active project
              </p>
              <div className="mt-3 max-w-xl">
                <AppSelect
                  value={projectId}
                  onChange={(event) => onSelectProject(event.target.value)}
                  className={cn(
                    fieldSelectClass,
                    "h-11 border-white/15 bg-white/10 text-white focus-visible:border-primary focus-visible:ring-primary/30",
                  )}
                >
                  {projects.length === 0 ? <option value="">No projects</option> : null}
                  {projects.map((item) => (
                    <option key={item.id} value={item.id} className="text-foreground">
                      {item.name} — {item.client.name}
                    </option>
                  ))}
                </AppSelect>
              </div>
              {project ? (
                <p className="mt-2 text-[13px] text-white/65">
                  Client <span className="font-medium text-white">{project.client.name}</span>
                  {project.deadline ? (
                    <>
                      {" "}
                      · Delivery <span className="font-medium text-white">{formatDate(project.deadline)}</span>
                    </>
                  ) : null}
                </p>
              ) : null}
            </div>

            {project ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <StatPill label="Dated tasks" value={stats.total} />
                <StatPill label="Open" value={stats.open} />
                <StatPill label="Done" value={stats.done} />
                <StatPill label="Overdue" value={stats.overdue} danger={stats.overdue > 0} />
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border bg-[#FCFFF5] px-5 py-3 md:px-6">
          <LegendSwatch className="bg-[#EFF8FF] text-[#175CD3]" icon={Play} label="Start" />
          <LegendSwatch className="bg-[#FFFAEB] text-[#B54708]" icon={Flag} label="Due" />
          <LegendSwatch className="bg-[#FEF3F2] text-[#B42318]" icon={TriangleAlert} label="Overdue" />
          <LegendSwatch className="bg-primary/30 text-[#111111]" icon={FolderKanban} label="Project delivery" />
        </div>
      </div>

      {!project ? (
        <Surface>
          <EmptyState
            title="No project to show"
            description="Create a project first, then open its calendar here."
            icon={FolderKanban}
          />
        </Surface>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.9fr)]">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgba(16,24,40,0.04)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3.5 md:px-5">
              <div>
                <p className="text-[15px] font-semibold tracking-tight text-foreground">
                  {format(cursor, "MMMM yyyy")}
                </p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  Click any date to see that day&apos;s work
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setCursor((current) => addMonths(current, -1))}
                  aria-label="Previous month"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setCursor((current) => addMonths(current, 1))}
                  aria-label="Next month"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 border-b border-border bg-[#F8FAFC] text-center text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <div key={day} className="px-1 py-2.5">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 auto-rows-fr">
              {days.map((day) => {
                const chips = chipsForDay(day);
                const today = isSameDay(day, new Date());
                const active = selectedDay ? isSameDay(day, selectedDay) : false;
                const inMonth = isSameMonth(day, cursor);
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={cn(
                      "group relative flex min-h-[108px] flex-col border-r border-b border-border p-1.5 text-left transition-colors last:border-r-0 sm:min-h-[118px] sm:p-2",
                      !inMonth && "bg-[#F8FAFC]/80 text-muted-foreground",
                      inMonth && "bg-white hover:bg-[#FCFFF5]",
                      active && "bg-primary/10 ring-2 ring-inset ring-primary",
                    )}
                  >
                    <span
                      className={cn(
                        "mb-1.5 inline-flex size-7 items-center justify-center rounded-full text-[12px] font-semibold",
                        today && "bg-secondary text-secondary-foreground",
                        !today && active && "bg-primary text-primary-foreground",
                        !today && !active && "text-muted-foreground group-hover:text-foreground",
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden">
                      {chips.slice(0, 3).map((chip) => (
                        <span
                          key={chip.id}
                          className={cn(
                            "block truncate rounded-md border px-1.5 py-0.5 text-[10px] font-semibold leading-tight sm:text-[11px]",
                            chipTone[chip.tone],
                          )}
                          title={chip.label}
                        >
                          {chip.label}
                        </span>
                      ))}
                      {chips.length > 3 ? (
                        <span className="px-1 text-[10px] font-medium text-muted-foreground">
                          +{chips.length - 3} more
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgba(16,24,40,0.04)]">
            <div className="border-b border-border bg-[#111111] px-5 py-4 text-white">
              <p className="text-[11px] font-semibold tracking-[0.16em] text-primary uppercase">
                Day detail
              </p>
              <p className="mt-1.5 text-[16px] font-semibold tracking-tight">
                {selectedDay ? format(selectedDay, "EEEE, MMM d") : "Pick a date"}
              </p>
              <p className="mt-1 text-[12px] text-white/60">
                {selectedDay
                  ? `${dayTasks.length} task${dayTasks.length === 1 ? "" : "s"} on this day`
                  : "Select a day on the calendar"}
              </p>
            </div>

            {!selectedDay ? (
              <div className="p-6">
                <EmptyState title="Select a date" description="Task details will appear here." icon={CalendarDays} />
              </div>
            ) : dayTasks.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="Clear day"
                  description="No starts or deadlines for this project on this date."
                  icon={CalendarDays}
                />
              </div>
            ) : (
              <div className="divide-y divide-border">
                {dayTasks.map((task) => {
                  const start = asDate(task.startDate);
                  const deadline = asDate(task.deadline);
                  const startsToday = selectedDay && start && isSameDay(start, selectedDay);
                  const dueToday = selectedDay && deadline && isSameDay(deadline, selectedDay);
                  const overdue = isOverdue(task.deadline, task.status);
                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => router.push(`/tasks/${task.id}`)}
                      className="flex w-full gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/40"
                    >
                      <div
                        className={cn(
                          "mt-0.5 w-1 shrink-0 rounded-full",
                          overdue ? "bg-[#B42318]" : dueToday ? "bg-[#F79009]" : "bg-[#2E90FA]",
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {startsToday ? (
                            <span className="rounded-md bg-[#EFF8FF] px-1.5 py-0.5 text-[10px] font-semibold text-[#175CD3]">
                              Start
                            </span>
                          ) : null}
                          {dueToday ? (
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
                        <p className="mt-1.5 text-[13px] font-semibold text-foreground">{task.title}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
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
                        <p className="mt-2 text-[11px] text-muted-foreground">
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

            {projectTasks.length > 0 && selectedDay && dayTasks.length === 0 ? (
              <div className="border-t border-border px-4 py-3">
                <button
                  type="button"
                  className="text-[12px] font-medium text-foreground underline-offset-2 hover:underline"
                  onClick={() => setSelectedDay(null)}
                >
                  Browse all {projectTasks.length} dated tasks
                </button>
              </div>
            ) : null}

            {selectedDay === null && projectTasks.length > 0 ? (
              <div className="divide-y divide-border border-t border-border">
                {projectTasks.slice(0, 8).map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => router.push(`/tasks/${task.id}`)}
                    className="flex w-full items-start gap-3 px-4 py-3.5 text-left hover:bg-muted/40"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-foreground">{task.title}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {task.deadline ? `Due ${formatDate(task.deadline)}` : `Start ${formatDate(task.startDate)}`}
                      </p>
                    </div>
                    <StatusBadge value={task.status as never} />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

function StatPill({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
      <p className="text-[10px] font-medium tracking-wide text-white/50 uppercase">{label}</p>
      <p className={cn("mt-1 text-[18px] font-semibold tabular-nums", danger ? "text-[#FDA29B]" : "text-white")}>
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
    <span className="inline-flex items-center gap-1.5 text-[12px] text-foreground">
      <span className={cn("inline-flex size-5 items-center justify-center rounded-md", className)}>
        <Icon className="size-3" />
      </span>
      {label}
    </span>
  );
}
