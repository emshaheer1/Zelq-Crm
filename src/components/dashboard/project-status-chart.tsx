"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FolderKanban } from "lucide-react";
import { Surface, SectionTitle } from "@/components/shared/surface";
import { EmptyState } from "@/components/shared/empty-state";

export type ProjectDayPoint = {
  key: string;
  label: string;
  dateLabel: string;
  completed: number;
  open: number;
  total: number;
  tasks: {
    id: string;
    title: string;
    status: string;
    project: string;
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

  const plot = { left: 36, right: 18, top: 18, bottom: 36, w: 720, h: 260 };
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
        description="How projects are tracking over the last 14 days. Hover a point to see that day’s tasks."
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
        <div className="relative min-w-0">
          <svg
            viewBox={`0 0 ${plot.w} ${plot.h}`}
            className="h-[260px] w-full"
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

            {openPoints.map((point, index) => (
              <circle
                key={`open-${point.day.key}`}
                cx={point.x}
                cy={point.y}
                r={ready ? 4 : 0}
                fill="#FFFFFF"
                stroke="#F79009"
                strokeWidth="2"
                className="motion-safe:transition-[r,opacity] motion-safe:duration-500"
                style={{ transitionDelay: `${200 + index * 35}ms` }}
              />
            ))}

            {completedPoints.map((point, index) => {
              const isActive = active === point.day.key;
              return (
                <g key={`done-${point.day.key}`}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={18}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setActive(point.day.key)}
                    onMouseLeave={() => setActive(null)}
                    onFocus={() => setActive(point.day.key)}
                    onBlur={() => setActive(null)}
                  />
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={ready ? (isActive ? 6.5 : 4.5) : 0}
                    fill="#FFFFFF"
                    stroke="#12B76A"
                    strokeWidth="2.5"
                    className="pointer-events-none motion-safe:transition-[r] motion-safe:duration-300"
                    style={{ transitionDelay: `${260 + index * 35}ms` }}
                  />
                  {(index === 0 || index === completedPoints.length - 1 || index % 2 === 0) && (
                    <text
                      x={point.x}
                      y={plot.h - 12}
                      textAnchor="middle"
                      fill="#667085"
                      fontSize="10"
                      fontWeight="500"
                    >
                      {point.day.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-[12px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-[#12B76A]" />
              Completed tasks
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-[#F79009]" />
              Open tasks
            </span>
          </div>

          {activeDay ? (
            <div className="mt-4 rounded-xl border border-[#EAECF0] bg-[#F9FAFB] p-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[13px] font-semibold text-[#111827]">{activeDay.dateLabel}</p>
                  <p className="mt-0.5 text-[12px] text-[#667085]">
                    {activeDay.completed} completed · {activeDay.open} open
                  </p>
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
                      className="rounded-lg border border-[#EAECF0] bg-white px-3 py-2 transition-colors hover:border-[#D0D5DD]"
                    >
                      <p className="truncate text-[12px] font-medium text-[#111827]">{task.title}</p>
                      <p className="mt-0.5 truncate text-[11px] text-[#667085]">{task.project}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="mt-3 text-center text-[12px] text-muted-foreground">
              Hover a point on the curve to see that calendar day’s tasks
            </p>
          )}
        </div>
      )}
    </Surface>
  );
}
