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

const DONE = "#12B76A";
const OPEN = "#F79009";
const GRID = "#EEF1F4";
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

  const plot = { left: 36, right: 18, top: 22, bottom: 34, w: 720, h: 248 };
  const innerW = plot.w - plot.left - plot.right;
  const innerH = plot.h - plot.top - plot.bottom;
  const max = Math.max(...data.days.map((day) => Math.max(day.completed, day.open, 1)), 1);

  const totalProjects = STATUS.reduce((sum, item) => sum + data.status[item.key], 0);
  const completedRate =
    totalProjects === 0 ? 0 : Math.round((data.status.completed / totalProjects) * 100);

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
        description="Project pipeline status and task momentum across the last 14 days."
        action={
          totalProjects > 0 ? (
            <p className="text-[12px] tabular-nums text-muted-foreground">
              <span className="font-semibold text-foreground">{completedRate}%</span> projects completed
            </p>
          ) : null
        }
      />

      {data.projectCount === 0 ? (
        <EmptyState title="No projects yet." description="Create a project to track delivery progress." icon={FolderKanban} />
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STATUS.map((item, index) => (
              <div
                key={item.key}
                className={cn(
                  "relative overflow-hidden rounded-xl border border-border bg-card px-3.5 py-3",
                  ready && "project-kpi-in",
                )}
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: item.color }} />
                <p className="text-[11px] font-medium text-muted-foreground">{item.label}</p>
                <p className="mt-1.5 text-[24px] font-semibold leading-none tabular-nums text-foreground">
                  {String(data.status[item.key]).padStart(2, "0")}
                </p>
              </div>
            ))}
          </div>

          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[12px] font-medium text-foreground">14-day task momentum</p>
                <p className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
                  <span className="text-[#12B76A]">{dayTotals.completed} tasks done</span>
                  {" · "}
                  <span className="text-[#F79009]">{dayTotals.open} tasks open</span>
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-[2px] w-3 rounded-full bg-[#12B76A]" />
                  Done
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-[2px] w-3 rounded-full bg-[#F79009]" />
                  Open
                </span>
              </div>
            </div>

            <div className="relative w-full rounded-xl border border-border bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FAFC_100%)] p-2 sm:p-3">
              <div className="relative w-full" style={{ aspectRatio: `${plot.w} / ${plot.h}` }}>
                <svg
                  viewBox={`0 0 ${plot.w} ${plot.h}`}
                  className="absolute inset-0 size-full"
                  role="img"
                  aria-label="Task momentum over the last 14 days"
                >
                  <defs>
                    <linearGradient id="delivery-area" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#B7FF00" stopOpacity="0.28" />
                      <stop offset="100%" stopColor="#B7FF00" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {[0, 0.5, 1].map((tick) => {
                    const y = plot.top + innerH - tick * innerH;
                    return (
                      <g key={tick}>
                        <line x1={plot.left} x2={plot.w - plot.right} y1={y} y2={y} stroke={GRID} />
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
                      strokeWidth="1.75"
                    />
                  ) : null}

                  {areaPath ? (
                    <path
                      d={areaPath}
                      fill="url(#delivery-area)"
                      style={{ opacity: ready ? 1 : 0, transition: "opacity 650ms ease" }}
                    />
                  ) : null}

                  <path
                    d={openPath}
                    fill="none"
                    stroke={OPEN}
                    strokeWidth="2.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    pathLength={1}
                    style={{
                      strokeDasharray: 1,
                      strokeDashoffset: ready ? 0 : 1,
                      transition: "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)",
                    }}
                  />
                  <path
                    d={completedPath}
                    fill="none"
                    stroke={DONE}
                    strokeWidth="2.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    pathLength={1}
                    style={{
                      strokeDasharray: 1,
                      strokeDashoffset: ready ? 0 : 1,
                      transition: "stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1) 50ms",
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
                          r={20}
                          fill="transparent"
                          className="cursor-pointer"
                          onMouseEnter={() => setActive(point.day.key)}
                          onMouseLeave={() => setActive(null)}
                        />
                        <circle
                          cx={point.x}
                          cy={openY}
                          r={ready ? (isActive ? 4.5 : 3) : 0}
                          fill="#fff"
                          stroke={OPEN}
                          strokeWidth="1.75"
                          style={{ transition: `r 280ms ease ${140 + index * 22}ms` }}
                          pointerEvents="none"
                        />
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r={ready ? (isActive ? 5.5 : 3.5) : 0}
                          fill="#fff"
                          stroke={DONE}
                          strokeWidth="2"
                          style={{ transition: `r 280ms ease ${160 + index * 22}ms` }}
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
                            fill={isActive ? "#101828" : AXIS}
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

                <div className="pointer-events-none absolute inset-0">
                  {completedPoints.map((point, index) => {
                    if (point.day.people.length === 0) return null;
                    const isActive = active === point.day.key;
                    const lead = point.day.people[0]!;
                    return (
                      <div
                        key={`avatar-${point.day.key}`}
                        className={cn("absolute transition-all duration-200", isActive && "z-10")}
                        style={{
                          left: `${(point.x / plot.w) * 100}%`,
                          top: `${(point.y / plot.h) * 100}%`,
                          transform: isActive
                            ? "translate(-50%, calc(-50% - 22px)) scale(1.08)"
                            : "translate(-50%, calc(-50% - 18px)) scale(1)",
                          opacity: !ready ? 0 : active && !isActive ? 0.35 : 1,
                          transitionDelay: ready ? "0ms" : `${240 + index * 35}ms`,
                        }}
                      >
                        <UserAvatar
                          name={lead.name}
                          src={lead.avatarUrl}
                          className="size-6 border-2 border-white shadow-sm"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {activeDay ? (
            <div key={activeDay.key} className="project-panel-in rounded-xl border border-border bg-card p-3.5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[13px] font-semibold text-foreground">{activeDay.dateLabel}</p>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    <span className="text-[#12B76A]">{activeDay.completed} tasks done</span>
                    {" · "}
                    <span className="text-[#F79009]">{activeDay.open} tasks open</span>
                  </p>
                </div>
                {activeDay.people.length > 0 ? (
                  <div className="flex items-center -space-x-2">
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
              Hover a day on the curve to inspect tasks and people
            </p>
          )}
        </div>
      )}
    </Surface>
  );
}
