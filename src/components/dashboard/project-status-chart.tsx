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

const statusBlocks = [
  { key: "notStarted" as const, label: "Not started", color: "#98A2B3" },
  { key: "inProgress" as const, label: "In progress", color: "#111827" },
  { key: "onHold" as const, label: "On hold", color: "#F79009" },
  { key: "completed" as const, label: "Completed", color: "#12B76A" },
];

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

  const plot = { left: 40, right: 22, top: 34, bottom: 40, w: 720, h: 280 };
  const innerW = plot.w - plot.left - plot.right;
  const innerH = plot.h - plot.top - plot.bottom;
  const max = Math.max(...data.days.map((day) => Math.max(day.completed, day.open, day.total)), 1);

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

  return (
    <Surface>
      <SectionTitle
        title="Project status"
        description="How projects are tracking over the last 14 days. Avatar dots show who worked that day."
      />

      <div className="mb-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {statusBlocks.map((block) => (
          <div
            key={block.key}
            className="rounded-xl border border-[#EAECF0] bg-[#F9FAFB] px-3.5 py-3 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2"
          >
            <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">{block.label}</p>
            <p className="mt-1 text-[22px] font-semibold tabular-nums" style={{ color: block.color }}>
              {String(data.status[block.key]).padStart(2, "0")}
            </p>
          </div>
        ))}
      </div>

      {data.projectCount === 0 ? (
        <EmptyState title="No projects yet." description="Create a project to track delivery progress." icon={FolderKanban} />
      ) : (
        <div className="min-w-0">
          <div className="relative w-full" style={{ aspectRatio: `${plot.w} / ${plot.h}` }}>
            <svg
              viewBox={`0 0 ${plot.w} ${plot.h}`}
              className="absolute inset-0 size-full"
              role="img"
              aria-label="Project progress curve for the last 14 days"
            >
              <defs>
                <linearGradient id="project-area" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#12B76A" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#12B76A" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
                const y = plot.top + innerH - tick * innerH;
                return (
                  <g key={tick}>
                    <line
                      x1={plot.left}
                      x2={plot.w - plot.right}
                      y1={y}
                      y2={y}
                      stroke="#EAECF0"
                      strokeDasharray={tick === 0 ? "0" : "4 4"}
                    />
                    <text x={plot.left - 8} y={y + 3} textAnchor="end" fill="#98A2B3" fontSize="10">
                      {Math.round(max * tick)}
                    </text>
                  </g>
                );
              })}

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
                stroke="#F79009"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                style={{
                  strokeDasharray: 1,
                  strokeDashoffset: ready ? 0 : 1,
                  transition: "stroke-dashoffset 900ms ease",
                }}
              />
              <path
                d={completedPath}
                fill="none"
                stroke="#12B76A"
                strokeWidth="2.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                style={{
                  strokeDasharray: 1,
                  strokeDashoffset: ready ? 0 : 1,
                  transition: "stroke-dashoffset 1100ms ease",
                }}
              />

              {openPoints.map((point, index) =>
                point.day.people.length === 0 ? (
                  <circle
                    key={`open-dot-${point.day.key}`}
                    cx={point.x}
                    cy={point.y}
                    r={ready ? 4 : 0}
                    fill="#FFFFFF"
                    stroke="#F79009"
                    strokeWidth="2"
                    className="motion-safe:transition-[r] motion-safe:duration-500"
                    style={{ transitionDelay: `${200 + index * 35}ms` }}
                  />
                ) : null,
              )}

              {completedPoints.map((point, index) =>
                point.day.people.length === 0 ? (
                  <g key={`done-dot-${point.day.key}`}>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={16}
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setActive(point.day.key)}
                      onMouseLeave={() => setActive(null)}
                    />
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={ready ? (active === point.day.key ? 6 : 4.5) : 0}
                      fill="#FFFFFF"
                      stroke="#12B76A"
                      strokeWidth="2.5"
                      className="pointer-events-none motion-safe:transition-[r] motion-safe:duration-300"
                      style={{ transitionDelay: `${260 + index * 35}ms` }}
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
                    fill="#667085"
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
                      "pointer-events-auto absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full transition-transform duration-300 outline-none",
                      ready ? "scale-100 opacity-100" : "scale-50 opacity-0",
                      isActive && "z-10 scale-110",
                    )}
                    style={{
                      left: `${(point.x / plot.w) * 100}%`,
                      top: `${(point.y / plot.h) * 100}%`,
                      transitionDelay: `${280 + index * 40}ms`,
                    }}
                  >
                    <span
                      className={cn(
                        "relative flex items-center rounded-full bg-white p-0.5 shadow-[0_4px_14px_rgba(16,24,40,0.14)] ring-2",
                        lead.done ? "ring-[#12B76A]" : "ring-[#F79009]",
                        isActive && "ring-[3px]",
                      )}
                    >
                      <UserAvatar name={lead.name} src={lead.avatarUrl} className="size-7" />
                      {extra > 0 ? (
                        <span className="absolute -right-1 -bottom-1 grid size-4 place-items-center rounded-full bg-[#111827] text-[9px] font-semibold text-white ring-2 ring-white">
                          +{extra}
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-[12px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-[#12B76A]" />
              Completed tasks
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-[#F79009]" />
              Open tasks
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full ring-2 ring-[#12B76A] ring-offset-1" />
              Employee on that day
            </span>
          </div>

          {activeDay ? (
            <div className="mt-4 rounded-xl border border-[#EAECF0] bg-[#F9FAFB] p-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-[#111827]">{activeDay.dateLabel}</p>
                  <p className="mt-0.5 text-[12px] text-[#667085]">
                    {activeDay.completed} completed · {activeDay.open} open
                  </p>
                  {activeDay.people.length > 0 ? (
                    <div className="mt-2.5 flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {activeDay.people.slice(0, 4).map((person) => (
                          <UserAvatar
                            key={person.id}
                            name={person.name}
                            src={person.avatarUrl}
                            className="size-7 border-2 border-white"
                          />
                        ))}
                      </div>
                      <p className="truncate text-[12px] text-[#344054]">
                        {activeDay.people.map((person) => person.name.split(" ")[0]).join(", ")}
                      </p>
                    </div>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <span className="rounded-lg bg-white px-2.5 py-1 text-[12px] font-semibold tabular-nums text-[#12B76A]">
                    {String(activeDay.completed).padStart(2, "0")} done
                  </span>
                  <span className="rounded-lg bg-white px-2.5 py-1 text-[12px] font-semibold tabular-nums text-[#F79009]">
                    {String(activeDay.open).padStart(2, "0")} open
                  </span>
                </div>
              </div>
              {activeDay.tasks.length === 0 ? (
                <p className="mt-3 text-[12px] text-[#98A2B3]">No tasks tied to this calendar day.</p>
              ) : (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {activeDay.tasks.map((task) => (
                    <Link
                      key={task.id}
                      href={`/tasks/${task.id}`}
                      className="flex items-start gap-2.5 rounded-lg border border-[#EAECF0] bg-white px-3 py-2 transition-colors hover:border-[#D0D5DD]"
                    >
                      <UserAvatar
                        name={task.assignee.name}
                        src={task.assignee.avatarUrl}
                        className="mt-0.5 size-7 shrink-0"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-[12px] font-medium text-[#111827]">{task.title}</span>
                        <span className="mt-0.5 block truncate text-[11px] text-[#667085]">
                          {task.assignee.name.split(" ")[0]} · {task.project}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="mt-3 text-center text-[12px] text-muted-foreground">
              Hover an avatar on the curve to see that calendar day’s people and tasks
            </p>
          )}
        </div>
      )}
    </Surface>
  );
}
