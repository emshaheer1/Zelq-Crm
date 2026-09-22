"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CircleCheckBig, FolderKanban, PauseCircle, PlayCircle } from "lucide-react";
import { Surface, SectionTitle } from "@/components/shared/surface";
import { EmptyState } from "@/components/shared/empty-state";
import { UserAvatar } from "@/components/shared/user-avatar";
import { IconBox, type IconTone } from "@/components/shared/icon-box";
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

const statusBlocks: {
  key: keyof ProjectStatusData["status"];
  label: string;
  tone: IconTone;
  Icon: typeof FolderKanban;
}[] = [
  { key: "notStarted", label: "Not started", tone: "muted", Icon: FolderKanban },
  { key: "inProgress", label: "In progress", tone: "lime", Icon: PlayCircle },
  { key: "onHold", label: "On hold", tone: "orange", Icon: PauseCircle },
  { key: "completed", label: "Completed", tone: "green", Icon: CircleCheckBig },
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

  const plot = { left: 40, right: 24, top: 28, bottom: 40, w: 760, h: 280 };
  const innerW = plot.w - plot.left - plot.right;
  const innerH = plot.h - plot.top - plot.bottom;
  const max = Math.max(...data.days.map((day) => Math.max(day.completed, day.open, day.total)), 1);
  const totalProjects =
    data.status.notStarted + data.status.inProgress + data.status.onHold + data.status.completed;
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
        description="Completed vs open work over the last 14 days. Hover a day to see who worked on it."
        action={
          totalProjects > 0 ? (
            <div className="rounded-lg bg-muted/60 px-3 py-2 text-right">
              <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">Delivery</p>
              <p className="text-[16px] font-semibold tabular-nums text-foreground">{deliveryRate}%</p>
            </div>
          ) : null
        }
      />

      <div className="mb-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {statusBlocks.map((block, index) => (
          <div
            key={block.key}
            className={cn(
              "flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3.5 py-3",
              ready && "project-kpi-in",
            )}
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-muted-foreground">{block.label}</p>
              <p className="mt-1 text-[22px] font-semibold leading-none tabular-nums text-foreground">
                {String(data.status[block.key]).padStart(2, "0")}
              </p>
            </div>
            <IconBox icon={block.Icon} tone={block.tone} className="size-9" iconClassName="size-4" />
          </div>
        ))}
      </div>

      {data.projectCount === 0 ? (
        <EmptyState title="No projects yet." description="Create a project to track delivery progress." icon={FolderKanban} />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-4 rounded-full" style={{ background: DONE }} />
                Completed
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-4 rounded-full" style={{ background: OPEN }} />
                Open
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">Last 14 days</p>
          </div>

          <div className="relative w-full rounded-xl border border-border bg-muted/30 p-2 sm:p-3">
            <div className="relative w-full" style={{ aspectRatio: `${plot.w} / ${plot.h}` }}>
              <svg
                viewBox={`0 0 ${plot.w} ${plot.h}`}
                className="absolute inset-0 size-full"
                role="img"
                aria-label="Project progress curve for the last 14 days"
              >
                <defs>
                  <linearGradient id="project-area" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={DONE} stopOpacity="0.16" />
                    <stop offset="100%" stopColor={DONE} stopOpacity="0" />
                  </linearGradient>
                </defs>

                {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
                  const y = plot.top + innerH - tick * innerH;
                  return (
                    <g key={tick}>
                      <line x1={plot.left} x2={plot.w - plot.right} y1={y} y2={y} stroke={GRID} strokeWidth="1" />
                      <text x={plot.left - 8} y={y + 3} textAnchor="end" fill={AXIS} fontSize="10">
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
                    strokeDasharray="3 4"
                    opacity="0.9"
                  />
                ) : null}

                {areaPath ? (
                  <path
                    d={areaPath}
                    fill="url(#project-area)"
                    className="motion-safe:transition-opacity motion-safe:duration-700"
                    style={{ opacity: ready ? 1 : 0 }}
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
                    transition: "stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1) 60ms",
                  }}
                />

                {openPoints.map((point, index) =>
                  point.day.people.length === 0 ? (
                    <circle
                      key={`open-dot-${point.day.key}`}
                      cx={point.x}
                      cy={point.y}
                      r={ready ? 3.5 : 0}
                      fill="#fff"
                      stroke={OPEN}
                      strokeWidth="2"
                      style={{ transition: `r 400ms ease ${160 + index * 28}ms` }}
                    />
                  ) : null,
                )}

                {completedPoints.map((point, index) =>
                  point.day.people.length === 0 ? (
                    <g key={`done-dot-${point.day.key}`}>
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r={18}
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setActive(point.day.key)}
                        onMouseLeave={() => setActive(null)}
                      />
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r={ready ? (active === point.day.key ? 5 : 4) : 0}
                        fill="#fff"
                        stroke={DONE}
                        strokeWidth="2.25"
                        style={{ transition: `r 280ms ease ${200 + index * 28}ms` }}
                      />
                    </g>
                  ) : null,
                )}

                {completedPoints.map((point, index) =>
                  index === 0 || index === completedPoints.length - 1 || index % 2 === 0 ? (
                    <text
                      key={`label-${point.day.key}`}
                      x={point.x}
                      y={plot.h - 12}
                      textAnchor="middle"
                      fill={AXIS}
                      fontSize="10"
                      fontWeight="500"
                    >
                      {point.day.label}
                    </text>
                  ) : null,
                )}
              </svg>

              <div className="pointer-events-none absolute inset-0">
                {completedPoints.map((point, index) => {
                  if (point.day.people.length === 0) return null;
                  const isActive = active === point.day.key;
                  const lead = point.day.people[0]!;
                  const extra = point.day.people.length - 1;
                  return (
                    <button
                      key={`avatar-${point.day.key}`}
                      type="button"
                      title={point.day.people.map((person) => person.name).join(", ")}
                      onMouseEnter={() => setActive(point.day.key)}
                      onMouseLeave={() => setActive(null)}
                      onFocus={() => setActive(point.day.key)}
                      onBlur={() => setActive(null)}
                      className={cn(
                        "pointer-events-auto absolute flex items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
                        ready && "project-mark-in",
                        isActive && "z-20",
                      )}
                      style={{
                        left: `${(point.x / plot.w) * 100}%`,
                        top: `${(point.y / plot.h) * 100}%`,
                        animationDelay: `${220 + index * 40}ms`,
                        transform: isActive
                          ? "translate(-50%, -50%) scale(1.1)"
                          : "translate(-50%, -50%) scale(1)",
                        transition: "transform 200ms ease",
                      }}
                    >
                      <span
                        className={cn(
                          "relative rounded-full bg-card p-[2px] shadow-sm ring-2 ring-offset-1 ring-offset-background",
                          lead.done ? "ring-[#12B76A]" : "ring-[#F79009]",
                          isActive && "ring-primary",
                        )}
                      >
                        <UserAvatar name={lead.name} src={lead.avatarUrl} className="size-7" />
                        {extra > 0 ? (
                          <span className="absolute -right-1 -bottom-1 grid size-4 place-items-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground ring-2 ring-card">
                            +{extra}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {activeDay ? (
            <div
              key={activeDay.key}
              className="project-panel-in overflow-hidden rounded-xl border border-border bg-card"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-muted-foreground">{activeDay.dateLabel}</p>
                  <p className="mt-0.5 text-[13px] font-semibold text-foreground">
                    {activeDay.total} task{activeDay.total === 1 ? "" : "s"} this day
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {activeDay.people.slice(0, 4).map((person) => (
                    <UserAvatar
                      key={person.id}
                      name={person.name}
                      src={person.avatarUrl}
                      className="size-7 border-2 border-card"
                    />
                  ))}
                  <div className="ml-1 flex gap-1.5">
                    <span className="rounded-md bg-[#ECFDF3] px-2 py-1 text-[11px] font-semibold tabular-nums text-[#027A48]">
                      {activeDay.completed} done
                    </span>
                    <span className="rounded-md bg-[#FFFAEB] px-2 py-1 text-[11px] font-semibold tabular-nums text-[#B54708]">
                      {activeDay.open} open
                    </span>
                  </div>
                </div>
              </div>

              {activeDay.tasks.length === 0 ? (
                <p className="px-4 py-4 text-[13px] text-muted-foreground">No tasks tied to this day yet.</p>
              ) : (
                <div className="divide-y divide-border sm:grid sm:grid-cols-2 sm:divide-y-0">
                  {activeDay.tasks.map((task, index) => (
                    <Link
                      key={task.id}
                      href={`/tasks/${task.id}`}
                      className={cn(
                        "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50",
                        index % 2 === 0 && "sm:border-r sm:border-border",
                        index < 2 && activeDay.tasks.length > 2 && "sm:border-b sm:border-border",
                      )}
                    >
                      <UserAvatar
                        name={task.assignee.name}
                        src={task.assignee.avatarUrl}
                        className="mt-0.5 size-8 shrink-0"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-medium text-foreground">{task.title}</span>
                        <span className="mt-0.5 block truncate text-[12px] text-muted-foreground">
                          {task.assignee.name} · {task.project}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-[12px] text-muted-foreground">
              Hover a point or avatar on the chart to inspect that day
            </p>
          )}
        </div>
      )}
    </Surface>
  );
}
