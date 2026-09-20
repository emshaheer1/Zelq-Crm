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
import type { Prisma } from "@prisma/client";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { NewEventDialog } from "@/components/forms/entity-forms";
import { DeleteButton } from "@/components/shared/delete-menu-item";
import { apiJson } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/shared/surface";
import { eventTypeLabel } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { asDate } from "@/lib/dates";

type TaskItem = Prisma.TaskGetPayload<{ include: { assignedTo: true; project: true } }>;
type ProjectItem = Prisma.ProjectGetPayload<{ include: { client: true } }>;
type EventItem = Prisma.CalendarEventGetPayload<{
  include: { project: true; client: true; assignees: { include: { user: true } } };
}>;

export function CalendarWorkspace({
  tasks,
  projects,
  events,
  clients,
  employees,
  projectOptions,
  canCreate,
  openCreate,
}: {
  tasks: TaskItem[];
  projects: ProjectItem[];
  events: EventItem[];
  clients: { id: string; name: string }[];
  employees: { id: string; name: string }[];
  projectOptions: { id: string; name: string }[];
  canCreate: boolean;
  openCreate: boolean;
}) {
  const router = useRouter();
  const [cursor, setCursor] = useState(new Date());
  const [open, setOpen] = useState(openCreate);
  const [selected, setSelected] = useState<EventItem | null>(null);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const itemsForDay = (day: Date) => {
    const taskItems = tasks
      .filter((task) => {
        const deadline = asDate(task.deadline);
        return deadline && isSameDay(deadline, day);
      })
      .map((task) => {
        const deadline = asDate(task.deadline);
        return {
          id: task.id,
          label: task.title,
          kind: "task" as const,
          href: `/tasks/${task.id}`,
          overdue: Boolean(
            task.status !== "COMPLETED" &&
              deadline &&
              deadline < new Date() &&
              !isSameDay(deadline, new Date()),
          ),
        };
      });
    const projectItems = projects
      .filter((project) => {
        const deadline = asDate(project.deadline);
        return deadline && isSameDay(deadline, day);
      })
      .map((project) => ({
        id: project.id,
        label: project.name,
        kind: "project" as const,
        href: `/projects/${project.id}`,
        overdue: false,
      }));
    const eventItems = events
      .filter((event) => {
        const date = asDate(event.date);
        return date && isSameDay(date, day);
      })
      .map((event) => ({
        id: event.id,
        label: event.title,
        kind: "event" as const,
        event,
        overdue: false,
        type: event.type,
      }));
    return [...taskItems, ...projectItems, ...eventItems];
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        description="Task deadlines, project dates, and meetings."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setCursor(new Date())}>Today</Button>
      <Button variant="outline" size="icon" onClick={() => setCursor((current) => addMonths(current, -1))} aria-label="Previous month">
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setCursor((current) => addMonths(current, 1))} aria-label="Next month">
              <ChevronRight className="size-4" />
            </Button>
            {canCreate ? (
              <Button onClick={() => setOpen(true)}>
                <Plus className="size-4" />
                New Event
              </Button>
            ) : null}
          </div>
        }
      />
      <p className="text-lg font-semibold text-foreground">{format(cursor, "MMMM yyyy")}</p>
      <Surface padded={false} className="overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border bg-muted/50 text-[12px] font-medium text-muted-foreground">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div key={day} className="px-3 py-3">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const items = itemsForDay(day);
            const today = isSameDay(day, new Date());
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-32 border-r border-b border-border p-2 last:border-r-0",
                  !isSameMonth(day, cursor) && "bg-muted/30 text-muted-foreground",
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
                  {items.map((item) => (
                    <button
                      key={`${item.kind}-${item.id}`}
                      className={cn(
                        "block w-full truncate rounded-md px-1.5 py-1 text-left text-[11px] font-medium transition-colors duration-150",
                        item.kind === "task" && !item.overdue && "bg-[#FFFAEB] text-[#B54708]",
                        item.kind === "project" && "bg-[#F4F3FF] text-[#6941C6]",
                        item.kind === "event" && eventTone(item.type),
                        item.overdue && "bg-[#FEF3F2] text-[#B42318]",
                      )}
                      onClick={() => {
                        if (item.kind === "event") setSelected(item.event);
                        else router.push(item.href);
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Surface>

      {selected ? (
        <Surface>
          <h2 className="text-sm font-semibold text-[#111827]">{selected.title}</h2>
          <p className="mt-1 text-sm text-[#667085]">
            {eventTypeLabel[selected.type]} · {asDate(selected.date) ? format(asDate(selected.date) as Date, "MMM d, yyyy") : "—"}
            {selected.time ? ` · ${selected.time}` : ""}
          </p>
          {selected.project ? (
            <button className="mt-2 text-sm font-medium text-[#111827]" onClick={() => router.push(`/projects/${selected.projectId}`)}>
              {selected.project.name}
            </button>
          ) : null}
          {selected.description ? <p className="mt-3 text-sm text-[#344054]">{selected.description}</p> : null}
          {canCreate ? (
            <div className="mt-4">
              <DeleteButton
                label="event"
                onDelete={async () => {
                  await apiJson(`/api/calendar/${selected.id}`, { method: "DELETE" });
                  setSelected(null);
                }}
              />
            </div>
          ) : null}
        </Surface>
      ) : null}

      {events.length === 0 && tasks.length === 0 ? (
        <EmptyState title="No calendar items yet." description="Deadlines and meetings will appear on this calendar." />
      ) : null}

      <NewEventDialog
        open={open}
        onOpenChange={setOpen}
        projects={projectOptions}
        clients={clients}
        employees={employees}
      />
    </div>
  );
}

function eventTone(type?: string) {
  if (type === "MEETING" || type === "FOLLOW_UP") return "bg-[#F2F4F7] text-[#344054]";
  if (type === "PROJECT_REVIEW" || type === "IMPORTANT_DEADLINE") return "bg-[#F4F3FF] text-[#6941C6]";
  if (type === "INTERNAL_MEETING") return "bg-[#F2F4F7] text-[#475467]";
  return "bg-[#F2F4F7] text-[#475467]";
}
