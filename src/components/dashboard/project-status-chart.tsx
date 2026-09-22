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
  { key: "notStarted" as const, label: "Not started", color: "#D0D5DD" },
  { key: "inProgress" as const, label: "In progress", color: "#B7FF00" },
  { key: "onHold" as const, label: "On hold", color: "#F79009" },
  { key: "completed" as const, label: "Completed", color: "#12B76A" },
];

const DONE = "#101828";
const OPEN = "#F79009";
const GRID = "#F2F4F7";
const AXIS = "#98A2B3";

function smoothPath(points: { x: number; y: number }[]) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0]!.x} ${points[0]!.y}`;
  let path = `M ${points[0]!.x} ${points[0]!.y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const current = points[i]!;
    const next = points[i + 1]!;
    const cx = (current.x + next.x) / 2;
    path += ` C ${cx} ${current.y}, ${cx} ${next.y}, ${next.x} ${next.y}`;
  }
  return path;
}

export function ProjectStatusChart({ data }: { data: ProjectStatusData }) {
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const plot = { left: 36, right: 16, top: 24, bottom: 36, w: 720, h: 260 };
  const innerW = plot.w - plot.left - plot.right;
  const innerH = plot.h - plot.top - plot.bottom;
  const max = Math.max(...data.days.map((day) => Math.max(day.completed, day.open, 1)), 1);

  const totalProjects = STATUS.reduce((sum, item) => sum + data.status[item.key], 0);
  const deliveryRate =
    totalProjects === 0 ? 0 : Math.round((data.status.completed / totalProjects) * 100);

  const completedPoints = useMemo(
    () =>
      data.days.map((day, index) => ({
        x: plot.left + (data.days.length <= 1 ? innerW / 2 : (index / (data.days.length - 1)) * innerW),
        y: plot.top + innerH - (day.completed / max) * innerH,
        day,
      })),
    [data.days, innerH, innerW, max, plot.left, plot.top],
  );

  const openPoints = useMemo(
    () =>
      data.days.map((day, index) => ({
        x: plot.left + (data.days.length <= 1 ? innerW / 2 : (index / (data.days.length - 1)) * innerW),
        y: plot.top + innerH - (day.open / max) * innerH,
        day,
      })),
    [data.days, innerH, innerW, max, plot.left, plot.top],
  );

  const completedPath = smoothPath(completedPoints);
  const openPath = smoothPath(openPoints);
  const areaPath =
    completedPoints.length > 0
      ? `${completedPath} L ${completedPoints[completedPoints.length - 1]!.x} ${plot.top + innerH} L ${completedPoints[0]!.x} ${plot.top + innerH} Z`
      : "";

  const activeDay = data.days.find((day) => day.key === active) ?? null;
  const activePoint = completedPoints.find((point) => point.day.key === active);

  return (
    <Surface>
      <SectionTitle
        title="Project delivery"
        description="Project status overview and daily completed vs open work."
        action={
          totalProjects > 0 ? (
            <p className="text-[13px] tabular-nums text-muted-foreground">
              <span className="font-semibold text-foreground">{deliveryRate}%</span> completed
            </p>
          ) : null
        }
      />

      {data.projectCount === 0 ? (
        <EmptyState title="No projects yet." description="Create a project to track delivery progress." icon={FolderKanban} />
      ) : (
        <div className="space-y-6">
          {/* Status strip */}
          <div>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4">
              {STATUS.map((item, index) => (
                <div
                  key={item.key}
                  className={cn("bg-card px-4 py-3", ready && "project-kpi-in")}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full" style={{ background: item.color }} />
                    <p className="text-[11px] font-medium text-muted-foreground">{item.label}</p>
                  </div>
                  <p className="mt-2 text-[22px] font-semibold leading-none tracking-tight tabular-nums text-foreground">
                    {String(data.status[item.key]).padStart(2, "0")}
                  </p>
                </div>
              ))}
            </div>

            {totalProjects > 0 ? (
              <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-muted">
                {STATUS.map((item) => {
                  const value = data.status[item.key];
                  if (value === 0) return null;
                  return (
                    <div
                      key={item.key}
                      className="h-full first:rounded-l-full last:rounded-r-full motion-safe:transition-[width] motion-safe:duration-700 motion-safe:ease-out"
                      style={{
                        width: ready ? `${(value / totalProjects) * 100}%` : "0%",
                        background: item.color,
                        transitionDelay: "80ms",
                      }}
                      title={`${item.label}: ${value}`}
                    />
                  );
                })}
              </div>
            ) : null}
          </div>

          {/* Chart */}
          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-4 text-[12px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-[2px] w-3 rounded-full bg-foreground" />
                  Completed
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-[2px] w-3 rounded-full bg-[#F79009]" />
                  Open
                </span>
              </div>
              <p className="text-[12px] text-muted-foreground">Last 14 days</p>
            </div>

            <div className="relative w-full" style={{ aspectRatio: `${plot.w} / ${plot.h}` }}>
              <svg
                viewBox={`0 0 ${plot.w} ${plot.h}`}
                className="absolute inset-0 size-full"
                role="img"
                aria-label="Completed and open tasks over the last 14 days"
              >
                <defs>
                  <linearGradient id="project-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#B7FF00" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#B7FF00" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {[0, 0.5, 1].map((tick) => {
                  const y = plot.top + innerH - tick * innerH;
                  return (
                    <g key={tick}>
                      <line
                        x1={plot.left}
                        x2={plot.w - plot.right}
                        y1={y}
                        y2={y}
                        stroke={GRID}
                        strokeWidth="1"
                      />
                      <text x={plot.left - 8} y={y + 3.5} textAnchor="end" fill={AXIS} fontSize="10">
                        {Math.round(max * tick)}
                      </text>
                    </g>
                  );
                })}

                {activePoint ? (
                  <line
                    x1={activePoint.x}
                    x2={activePoint.x}
                    y1={plot.top}
                    y2={plot.top + innerH}
                    stroke="#B7FF00"
                    strokeWidth="1.5"
                  />
                ) : null}

                {areaPath ? (
                  <path
                    d={areaPath}
                    fill="url(#project-fill)"
                    style={{ opacity: ready ? 1 : 0, transition: "opacity 600ms ease" }}
                  />
                ) : null}

                <path
                  d={openPath}
                  fill="none"
                  stroke={OPEN}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={1}
                  style={{
                    strokeDasharray: 1,
                    strokeDashoffset: ready ? 0 : 1,
                    transition: "stroke-dashoffset 850ms cubic-bezier(0.22,1,0.36,1)",
                  }}
                />
                <path
                  d={completedPath}
                  fill="none"
                  stroke={DONE}
                  strokeWidth="2.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={1}
                  style={{
                    strokeDasharray: 1,
                    strokeDashoffset: ready ? 0 : 1,
                    transition: "stroke-dashoffset 950ms cubic-bezier(0.22,1,0.36,1) 40ms",
                  }}
                />

                {completedPoints.map((point, index) => {
                  const isActive = active === point.day.key;
                  const openY = openPoints[index]?.y ?? point.y;
                  return (
                    <g key={point.day.key}>
                      <circle
                        cx={point.x}
                        cy={(point.y + openY) / 2}
                        r={22}
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setActive(point.day.key)}
                        onMouseLeave={() => setActive(null)}
                      />
                      <circle
                        cx={point.x}
                        cy={openY}
                        r={ready ? (isActive ? 4 : 3) : 0}
                        fill="#fff"
                        stroke={OPEN}
                        strokeWidth="1.75"
                        style={{ transition: `r 280ms ease ${140 + index * 24}ms` }}
                        pointerEvents="none"
                      />
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r={ready ? (isActive ? 5 : 3.5) : 0}
                        fill="#fff"
                        stroke={DONE}
                        strokeWidth="2"
                        style={{ transition: `r 280ms ease ${160 + index * 24}ms` }}
                        pointerEvents="none"
                      />
                      {(index === 0 ||
                        index === completedPoints.length - 1 ||
                        index % 3 === 0 ||
                        isActive) && (
                        <text
                          x={point.x}
                          y={plot.h - 10}
                          textAnchor="middle"
                          fill={isActive ? DONE : AXIS}
                          fontSize="10"
                          fontWeight={isActive ? 600 : 500}
                        >
                          {point.day.label}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Day detail */}
          {activeDay ? (
            <div key={activeDay.key} className="project-panel-in border-t border-border pt-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-foreground">{activeDay.dateLabel}</p>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    <span className="text-[#12B76A]">{activeDay.completed} completed</span>
                    {" · "}
                    <span className="text-[#F79009]">{activeDay.open} open</span>
                  </p>
                </div>
                {activeDay.people.length > 0 ? (
                  <div className="flex items-center -space-x-2">
                    {activeDay.people.slice(0, 5).map((person) => (
                      <UserAvatar
                        key={person.id}
                        name={person.name}
                        src={person.avatarUrl}
                        className="size-8 border-2 border-card"
                      />
                    ))}
                    {activeDay.people.length > 5 ? (
                      <span className="grid size-8 place-items-center rounded-full border-2 border-card bg-muted text-[10px] font-semibold text-muted-foreground">
                        +{activeDay.people.length - 5}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {activeDay.tasks.length === 0 ? (
                <p className="text-[13px] text-muted-foreground">No tasks on this day.</p>
              ) : (
                <ul className="divide-y divide-border rounded-lg border border-border">
                  {activeDay.tasks.map((task) => (
                    <li key={task.id}>
                      <Link
                        href={`/tasks/${task.id}`}
                        className="flex items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-muted/50"
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
                          <span className="block truncate text-[12px] text-muted-foreground">
                            {task.assignee.name} · {task.project}
                          </span>
                        </span>
                        <span
                          className={cn(
                            "shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium",
                            task.status === "COMPLETED"
                              ? "bg-[#ECFDF3] text-[#027A48]"
                              : "bg-[#FFFAEB] text-[#B54708]",
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
            <p className="border-t border-border pt-4 text-center text-[12px] text-muted-foreground">
              Hover a day on the chart to see tasks and people
            </p>
          )}
        </div>
      )}
    </Surface>
  );
}
