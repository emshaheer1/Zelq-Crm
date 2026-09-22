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

function polar(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, start: number, end: number) {
  const sweep = end - start;
  if (sweep <= 0) return "";
  const large = sweep > 180 ? 1 : 0;
  const from = polar(cx, cy, r, start);
  const to = polar(cx, cy, r, end);
  return `M ${from.x} ${from.y} A ${r} ${r} 0 ${large} 1 ${to.x} ${to.y}`;
}

export function ProjectStatusChart({ data }: { data: ProjectStatusData }) {
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const totalProjects = STATUS.reduce((sum, item) => sum + data.status[item.key], 0);
  const deliveryRate =
    totalProjects === 0 ? 0 : Math.round((data.status.completed / totalProjects) * 100);

  const arcs = useMemo(() => {
    let angle = 0;
    const gap = totalProjects > 1 ? 3 : 0;
    return STATUS.map((item) => {
      const value = data.status[item.key];
      const slice = totalProjects === 0 ? 0 : (value / totalProjects) * (360 - gap * STATUS.filter((s) => data.status[s.key] > 0).length);
      const start = angle;
      const end = angle + slice;
      angle = end + (value > 0 ? gap : 0);
      return { ...item, value, start, end };
    }).filter((item) => item.value > 0);
  }, [data.status, totalProjects]);

  const maxDay = Math.max(...data.days.map((day) => day.total), 1);
  const activeDay = data.days.find((day) => day.key === active) ?? null;
  const busiest = useMemo(
    () => [...data.days].sort((a, b) => b.total - a.total).slice(0, 1)[0] ?? null,
    [data.days],
  );

  return (
    <Surface>
      <SectionTitle
        title="Project delivery"
        description="Project pipeline and the last 14 days of completed vs open work."
      />

      {data.projectCount === 0 ? (
        <EmptyState title="No projects yet." description="Create a project to track delivery progress." icon={FolderKanban} />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[200px_minmax(0,1fr)] lg:items-start">
          {/* Status donut */}
          <div className="flex flex-col items-center">
            <div className="relative size-[168px]">
              <svg viewBox="0 0 168 168" className="size-full">
                <circle cx="84" cy="84" r="58" fill="none" stroke="#EEF1F4" strokeWidth="14" />
                {arcs.map((item, index) => (
                  <path
                    key={item.key}
                    d={arcPath(84, 84, 58, item.start, item.end)}
                    fill="none"
                    stroke={item.color}
                    strokeWidth="14"
                    strokeLinecap="butt"
                    pathLength={1}
                    style={{
                      strokeDasharray: 1,
                      strokeDashoffset: ready ? 0 : 1,
                      transition: `stroke-dashoffset 700ms cubic-bezier(0.22,1,0.36,1) ${index * 80}ms`,
                    }}
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-[28px] font-semibold leading-none tabular-nums text-foreground">
                  {deliveryRate}%
                </p>
                <p className="mt-1 text-[11px] font-medium text-muted-foreground">Delivered</p>
              </div>
            </div>

            <div className="mt-5 grid w-full gap-1.5">
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

          {/* 14-day activity board */}
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[12px] font-medium text-foreground">Daily activity</p>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-sm bg-[#12B76A]" />
                  Completed
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-sm bg-[#F79009]" />
                  Open
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
                      <span className="text-[#12B76A]">{activeDay.completed} done</span>
                      {" · "}
                      <span className="text-[#F79009]">{activeDay.open} open</span>
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
