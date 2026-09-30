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
import { CalendarDays, ChevronLeft, ChevronRight, FolderKanban } from "lucide-react";
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

type DayItem = {
  id: string;
  label: string;
  kind: "task" | "project";
  href: string;
  overdue: boolean;
  assignee?: string;
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
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

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

  const itemsForDay = (day: Date): DayItem[] => {
    if (!project) return [];

    const taskItems = projectTasks.flatMap((task) => {
      const items: DayItem[] = [];
      const deadline = asDate(task.deadline);
      const start = asDate(task.startDate);

      if (deadline && isSameDay(deadline, day)) {
        items.push({
          id: `${task.id}-deadline`,
          label: task.title,
          kind: "task",
          href: `/tasks/${task.id}`,
          overdue: isOverdue(task.deadline, task.status),
          assignee: task.assignedTo.name.split(" ")[0],
        });
      } else if (start && isSameDay(start, day)) {
        items.push({
          id: `${task.id}-start`,
          label: task.title,
          kind: "task",
          href: `/tasks/${task.id}`,
          overdue: false,
          assignee: task.assignedTo.name.split(" ")[0],
        });
      }
      return items;
    });

    const projectDeadline = asDate(project.deadline);
    const projectItems =
      projectDeadline && isSameDay(projectDeadline, day)
        ? [
            {
              id: project.id,
              label: `${project.name} due`,
              kind: "project" as const,
              href: `/projects/${project.id}`,
              overdue: false,
            },
          ]
        : [];

    return [...projectItems, ...taskItems];
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
    setSelectedDay(null);
    router.replace(`/calendar?project=${nextId}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        description="Pick a project to see only its tasks by date."
      />

      <Surface>
        <SectionTitle
          title="Select project"
          description="Calendar below shows deadlines for the chosen project only."
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label className="mb-1.5 block text-[12px] font-medium text-muted-foreground">Project</label>
            <AppSelect
              value={projectId}
              onChange={(event) => onSelectProject(event.target.value)}
              className={cn(fieldSelectClass, "h-10")}
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
            <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-[12px] text-muted-foreground sm:min-w-[220px]">
              <p className="font-medium text-foreground">{project.client.name}</p>
              <p className="mt-0.5">
                {projectTasks.length} dated task{projectTasks.length === 1 ? "" : "s"}
                {project.deadline ? ` · Due ${formatDate(project.deadline)}` : ""}
              </p>
            </div>
          ) : null}
        </div>
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
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
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

          <Surface padded={false} className="overflow-hidden">
            <div className="grid grid-cols-7 border-b border-border bg-muted/50 text-[12px] font-medium text-muted-foreground">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <div key={day} className="px-3 py-3">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map((day) => {
                const items = itemsForDay(day);
                const today = isSameDay(day, new Date());
                const active = selectedDay ? isSameDay(day, selectedDay) : false;
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={cn(
                      "min-h-28 border-r border-b border-border p-2 text-left last:border-r-0 transition-colors hover:bg-muted/40",
                      !isSameMonth(day, cursor) && "bg-muted/20 text-muted-foreground",
                      active && "bg-primary/10",
                    )}
                  >
                    <span
                      className={cn(
                        "mb-2 inline-flex size-7 items-center justify-center rounded-lg text-xs font-semibold",
                        today && "bg-primary text-primary-foreground",
                        !today && "text-muted-foreground",
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    <div className="space-y-1">
                      {items.slice(0, 3).map((item) => (
                        <span
                          key={item.id}
                          className={cn(
                            "block w-full truncate rounded-md px-1.5 py-1 text-[11px] font-medium",
                            item.kind === "project" && "bg-[#F4F3FF] text-[#6941C6]",
                            item.kind === "task" && !item.overdue && "bg-[#FFFAEB] text-[#B54708]",
                            item.overdue && "bg-[#FEF3F2] text-[#B42318]",
                          )}
                          title={item.assignee ? `${item.label} · ${item.assignee}` : item.label}
                        >
                          {item.label}
                        </span>
                      ))}
                      {items.length > 3 ? (
                        <span className="px-1 text-[10px] text-muted-foreground">+{items.length - 3} more</span>
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
                    ? `Tasks on ${format(selectedDay, "MMM d, yyyy")}`
                    : "Project tasks"
                }
                description={
                  selectedDay
                    ? "Tasks starting or due on this date."
                    : "Click a date to filter, or browse all dated tasks below."
                }
              />
            </div>
            {(selectedDay ? dayTasks : projectTasks).length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title={selectedDay ? "No tasks on this date." : "No dated tasks in this project."}
                  description="Tasks with a start date or deadline will appear here."
                  icon={CalendarDays}
                />
              </div>
            ) : (
              <div className="divide-y divide-border">
                {(selectedDay ? dayTasks : projectTasks).map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => router.push(`/tasks/${task.id}`)}
                    className="flex w-full items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-foreground">{task.title}</p>
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
                        {task.startDate ? (
                          <span className="text-[12px] text-muted-foreground">
                            Start {formatDate(task.startDate)}
                          </span>
                        ) : null}
                        {task.deadline ? (
                          <span
                            className={cn(
                              "text-[12px]",
                              isOverdue(task.deadline, task.status)
                                ? "text-destructive"
                                : "text-muted-foreground",
                            )}
                          >
                            Due {formatDate(task.deadline)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Surface>
        </>
      )}
    </div>
  );
}
