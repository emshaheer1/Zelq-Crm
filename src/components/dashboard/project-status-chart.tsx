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
  const completedProjects = data.status.completed;
  const completedRate =
    totalProjects === 0 ? 0 : Math.round((completedProjects / totalProjects) * 100);

  const dayTotals = useMemo(() => {
    return data.days.reduce(
      (acc, day) => ({
        completed: acc.completed + day.completed,
        open: acc.open + day.open,
      }),
      { completed: 0, open: 0 },
    );
  }, [data.days]);

  const maxDay = Math.max(...data.days.map((day) => day.total), 1);
  const activeDay = data.days.find((day) => day.key === active) ?? null;
  const busiest = useMemo(
    () => [...data.days].sort((a, b) => b.total - a.total).slice(0, 1)[0] ?? null,
    [data.days],
  );

  const radius = 58;
  const ring = 2 * Math.PI * radius;

  return (
    <Surface>
      <SectionTitle
        title="Project delivery"
        description="Project completion rate on the left. Task activity for the last 14 days on the right."
      />

      {data.projectCount === 0 ? (
        <EmptyState title="No projects yet." description="Create a project to track delivery progress." icon={FolderKanban} />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[200px_minmax(0,1fr)] lg:items-start">
          {/* Project completion ring — % matches the green arc */}
          <div className="flex flex-col items-center">
            <div className="relative size-[168px]">
              <svg viewBox="0 0 168 168" className="size-full -rotate-90">
                <circle cx="84" cy="84" r={radius} fill="none" stroke="#EEF1F4" strokeWidth="14" />
                <circle
                  cx="84"
                  cy="84"
                  r={radius}
                  fill="none"
                  stroke="#12B76A"
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={ring}
                  strokeDashoffset={ready ? ring * (1 - completedRate / 100) : ring}
                  className="motion-safe:transition-[stroke-dashoffset] motion-safe:duration-700 motion-safe:ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-[28px] font-semibold leading-none tabular-nums text-foreground">
                  {completedRate}%
                </p>
                <p className="mt-1 text-[11px] font-medium text-muted-foreground">Completed</p>
              </div>
            </div>

            <p className="mt-3 text-center text-[12px] text-muted-foreground">
              <span className="font-semibold tabular-nums text-foreground">{completedProjects}</span>
              {" of "}
              <span className="font-semibold tabular-nums text-foreground">{totalProjects}</span>
              {" projects"}
            </p>

            <div className="mt-4 grid w-full gap-1.5">
              {STATUS.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 hover:bg-muted/60"
                >
                  <span className="inline-flex items-center gap-2 text-[12px] text-muted-foreground">
                    <span className="size-2 rounded-full" style={{ background: item.color }} />
                    {item.label}
                  </span>
                  <span className="text-[13px] font-semibold tabular-nums text-foreground">
                    {String(data.status[item.key]).padStart(2, "0")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 14-day task activity */}
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[12px] font-medium text-foreground">Task activity</p>
                <p className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
                  <span className="text-[#12B76A]">{dayTotals.completed} done</span>
                  {" · "}
                  <span className="text-[#F79009]">{dayTotals.open} open</span>
                  {" · last 14 days"}
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-sm bg-[#12B76A]" />
                  Tasks done
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-sm bg-[#F79009]" />
                  Tasks open
                </span>
              </div>
            </div>

            <div className="space-y-1">
              {data.days.map((day, index) => {
                const isActive = active === day.key;
                const doneW = day.total === 0 ? 0 : (day.completed / maxDay) * 100;
                const openW = day.total === 0 ? 0 : (day.open / maxDay) * 100;
                const lead = day.people[0];

                return (
                  <button
                    key={day.key}
                    type="button"
                    onMouseEnter={() => setActive(day.key)}
                    onMouseLeave={() => setActive(null)}
                    onFocus={() => setActive(day.key)}
                    onBlur={() => setActive(null)}
                    className={cn(
                      "grid w-full grid-cols-[72px_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-2.5 py-2 text-left outline-none transition-colors",
                      isActive ? "bg-muted/80" : "hover:bg-muted/40",
                      ready && "project-kpi-in",
                    )}
                    style={{ animationDelay: `${index * 35}ms` }}
                  >
                    <span className="text-[12px] font-medium tabular-nums text-muted-foreground">
                      {day.label}
                    </span>

                    <span className="relative flex h-2.5 min-w-0 overflow-hidden rounded-full bg-[#EEF1F4]">
                      <span
                        className="h-full rounded-l-full bg-[#12B76A] motion-safe:transition-[width] motion-safe:duration-700 motion-safe:ease-out"
                        style={{
                          width: ready ? `${doneW}%` : "0%",
                          transitionDelay: `${80 + index * 30}ms`,
                          borderRadius: openW === 0 ? 999 : undefined,
                        }}
                      />
                      <span
                        className="h-full bg-[#F79009] motion-safe:transition-[width] motion-safe:duration-700 motion-safe:ease-out"
                        style={{
                          width: ready ? `${openW}%` : "0%",
                          transitionDelay: `${110 + index * 30}ms`,
                          borderRadius: doneW === 0 ? 999 : undefined,
                        }}
                      />
                    </span>

                    <span className="flex min-w-[76px] items-center justify-end gap-2">
                      {lead ? (
                        <span className="flex items-center -space-x-1.5">
                          {day.people.slice(0, 2).map((person) => (
                            <UserAvatar
                              key={person.id}
                              name={person.name}
                              src={person.avatarUrl}
                              className="size-6 border border-card"
                            />
                          ))}
                          {day.people.length > 2 ? (
                            <span className="grid size-6 place-items-center rounded-full border border-card bg-muted text-[9px] font-semibold text-muted-foreground">
                              +{day.people.length - 2}
                            </span>
                          ) : null}
                        </span>
                      ) : (
                        <span className="size-6" />
                      )}
                      <span className="w-8 text-right text-[12px] font-semibold tabular-nums text-foreground">
                        {day.total}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {activeDay ? (
              <div key={activeDay.key} className="project-panel-in mt-4 rounded-xl border border-border bg-card p-3.5">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">{activeDay.dateLabel}</p>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                      <span className="text-[#12B76A]">{activeDay.completed} tasks done</span>
                      {" · "}
                      <span className="text-[#F79009]">{activeDay.open} tasks open</span>
                    </p>
                  </div>
                  {busiest?.key === activeDay.key && activeDay.total > 0 ? (
                    <span className="rounded-md bg-primary/20 px-2 py-0.5 text-[11px] font-semibold text-foreground">
                      Busiest day
                    </span>
                  ) : null}
                </div>

                {activeDay.tasks.length === 0 ? (
                  <p className="text-[13px] text-muted-foreground">No tasks on this day.</p>
                ) : (
                  <ul className="space-y-1">
                    {activeDay.tasks.map((task) => (
                      <li key={task.id}>
                        <Link
                          href={`/tasks/${task.id}`}
                          className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/60"
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
              <p className="mt-4 text-center text-[12px] text-muted-foreground">
                Hover a day to see who worked and which tasks moved
              </p>
            )}
          </div>
        </div>
      )}
    </Surface>
  );
}
