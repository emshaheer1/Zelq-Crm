"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FolderKanban } from "lucide-react";
import { Surface, SectionTitle } from "@/components/shared/surface";
import { EmptyState } from "@/components/shared/empty-state";
import { UserAvatar } from "@/components/shared/user-avatar";
import { cn } from "@/lib/utils";

export type ProjectDayPerson = {
  id: string;
  name: string;
  avatarUrl: string | null;
  done: boolean;
};

export type ProjectDayPoint = {
  key: string;
  label: string;
  dateLabel: string;
  completed: number;
  open: number;
  total: number;
  people: ProjectDayPerson[];
  tasks: {
    id: string;
    title: string;
    status: string;
    project: string;
    assignee: {
      id: string;
      name: string;
      avatarUrl: string | null;
    };
  }[];
};

export type ProjectStatusData = {
  status: {
    notStarted: number;
    inProgress: number;
    onHold: number;
    completed: number;
  };
  days: ProjectDayPoint[];
  projectCount: number;
};

const STATUS = [
  { key: "notStarted" as const, label: "Not started", color: "#98A2B3" },
  { key: "inProgress" as const, label: "In progress", color: "#B7FF00" },
  { key: "onHold" as const, label: "On hold", color: "#F79009" },
  { key: "completed" as const, label: "Completed", color: "#12B76A" },
];

export function ProjectStatusChart({ data }: { data: ProjectStatusData }) {
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const totalProjects = STATUS.reduce((sum, item) => sum + data.status[item.key], 0);
  const maxDay = Math.max(...data.days.map((day) => day.total), 1);
  const activeDay = data.days.find((day) => day.key === active) ?? null;

  const dayTotals = useMemo(
    () =>
      data.days.reduce(
        (acc, day) => ({
          completed: acc.completed + day.completed,
          open: acc.open + day.open,
        }),
        { completed: 0, open: 0 },
      ),
    [data.days],
  );

  return (
    <Surface>
      <SectionTitle
        title="Project delivery"
        description="Project status overview and daily task volume for the last 14 days."
      />

      {data.projectCount === 0 ? (
        <EmptyState title="No projects yet." description="Create a project to track delivery progress." icon={FolderKanban} />
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {STATUS.map((item, index) => {
              const value = data.status[item.key];
              const share = totalProjects === 0 ? 0 : Math.round((value / totalProjects) * 100);
              return (
                <div
                  key={item.key}
                  className={cn(
                    "rounded-xl border border-border bg-card p-3.5",
                    ready && "project-kpi-in",
                  )}
                  style={{ animationDelay: `${index * 55}ms` }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-medium text-muted-foreground">{item.label}</p>
                    <span className="size-2 rounded-full" style={{ background: item.color }} />
                  </div>
                  <p className="mt-2 text-[26px] font-semibold leading-none tabular-nums text-foreground">
                    {String(value).padStart(2, "0")}
                  </p>
                  <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full motion-safe:transition-[width] motion-safe:duration-700 motion-safe:ease-out"
                      style={{
                        width: ready ? `${share}%` : "0%",
                        background: item.color,
                        transitionDelay: `${100 + index * 50}ms`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[12px] font-medium text-foreground">Daily volume</p>
                <p className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
                  <span className="text-[#12B76A]">{dayTotals.completed} done</span>
                  {" · "}
                  <span className="text-[#F79009]">{dayTotals.open} open</span>
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-sm bg-[#12B76A]" />
                  Done
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-sm bg-[#F79009]" />
                  Open
                </span>
              </div>
            </div>

            <div className="flex min-h-[220px] items-end gap-1.5 overflow-x-auto rounded-xl border border-border bg-muted/30 px-3 py-4 sm:gap-2">
              {data.days.map((day, index) => {
                const isActive = active === day.key;
                const dimmed = active !== null && !isActive;
                const stackH = day.total === 0 ? 0 : Math.max(10, Math.round((day.total / maxDay) * 150));
                const doneH =
                  day.total === 0 ? 0 : Math.round((day.completed / day.total) * stackH);
                const openH = Math.max(0, stackH - doneH);

                return (
                  <button
                    key={day.key}
                    type="button"
                    onMouseEnter={() => setActive(day.key)}
                    onMouseLeave={() => setActive(null)}
                    onFocus={() => setActive(day.key)}
                    onBlur={() => setActive(null)}
                    className={cn(
                      "flex min-w-[44px] flex-1 flex-col items-center gap-2 rounded-lg px-0.5 py-1 outline-none transition-all duration-200",
                      isActive && "bg-card shadow-sm",
                      ready && "project-kpi-in",
                    )}
                    style={{
                      opacity: dimmed ? 0.35 : 1,
                      animationDelay: `${80 + index * 30}ms`,
                    }}
                  >
                    <div className="flex h-[150px] w-full items-end justify-center">
                      <div
                        className="flex w-7 flex-col-reverse overflow-hidden rounded-md sm:w-8"
                        style={{ height: ready ? stackH : 0, transition: `height 650ms cubic-bezier(0.22,1,0.36,1) ${90 + index * 28}ms` }}
                      >
                        <div
                          className="w-full bg-[#12B76A]"
                          style={{ height: ready ? doneH : 0, transition: `height 650ms ease ${110 + index * 28}ms` }}
                        />
                        <div
                          className="w-full bg-[#F79009]"
                          style={{ height: ready ? openH : 0, transition: `height 650ms ease ${130 + index * 28}ms` }}
                        />
                      </div>
                    </div>

                    {day.people[0] ? (
                      <UserAvatar
                        name={day.people[0].name}
                        src={day.people[0].avatarUrl}
                        className={cn(
                          "size-6 border border-white shadow-sm transition-transform",
                          isActive && "scale-110",
                        )}
                      />
                    ) : (
                      <span className="size-6" />
                    )}

                    <div className="text-center">
                      <p
                        className={cn(
                          "text-[10px] font-medium tabular-nums",
                          isActive ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {day.label.replace(/^[A-Za-z]+ /, "")}
                      </p>
                      <p className="text-[10px] tabular-nums text-muted-foreground">{day.total}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {activeDay ? (
            <div key={activeDay.key} className="project-panel-in rounded-xl border border-border bg-card p-3.5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[13px] font-semibold text-foreground">{activeDay.dateLabel}</p>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    <span className="text-[#12B76A]">{activeDay.completed} done</span>
                    {" · "}
                    <span className="text-[#F79009]">{activeDay.open} open</span>
                  </p>
                </div>
                {activeDay.people.length > 0 ? (
                  <div className="flex -space-x-2">
                    {activeDay.people.slice(0, 5).map((person) => (
                      <UserAvatar
                        key={person.id}
                        name={person.name}
                        src={person.avatarUrl}
                        className="size-7 border-2 border-card"
                      />
                    ))}
                  </div>
                ) : null}
              </div>

              {activeDay.tasks.length === 0 ? (
                <p className="text-[13px] text-muted-foreground">No tasks on this day.</p>
              ) : (
                <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
                  {activeDay.tasks.map((task) => (
                    <li key={task.id}>
                      <Link
                        href={`/tasks/${task.id}`}
                        className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/50"
                      >
                        <UserAvatar
                          name={task.assignee.name}
                          src={task.assignee.avatarUrl}
                          className="size-7 shrink-0"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-medium text-foreground">
                            {task.title}
                          </span>
                          <span className="block truncate text-[11px] text-muted-foreground">
                            {task.assignee.name} · {task.project}
                          </span>
                        </span>
                        <span
                          className={cn(
                            "shrink-0 text-[11px] font-medium",
                            task.status === "COMPLETED" ? "text-[#027A48]" : "text-[#B54708]",
                          )}
                        >
                          {task.status === "COMPLETED" ? "Done" : "Open"}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <p className="text-center text-[12px] text-muted-foreground">
              Hover a day column to see tasks and people
            </p>
          )}
        </div>
      )}
    </Surface>
  );
}
