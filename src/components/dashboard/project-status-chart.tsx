"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CircleCheckBig, Clock3, FolderKanban, PauseCircle, PlayCircle } from "lucide-react";
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
  { key: "notStarted" as const, label: "Not started", color: "#98A2B3", Icon: FolderKanban },
  { key: "inProgress" as const, label: "In progress", color: "#B7FF00", Icon: PlayCircle },
  { key: "onHold" as const, label: "On hold", color: "#FDB022", Icon: PauseCircle },
  { key: "completed" as const, label: "Completed", color: "#32D583", Icon: CircleCheckBig },
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
    const timer = window.setTimeout(() => setReady(true), 40);
    return () => window.clearTimeout(timer);
  }, []);

  const plot = { left: 44, right: 28, top: 36, bottom: 44, w: 760, h: 300 };
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
    <Surface className="overflow-hidden p-0">
      <div className="border-b border-[#EAECF0] bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FAFC_100%)] px-5 py-4 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <SectionTitle
            title="Project delivery"
            description="Live curve of completed vs open work across the last 14 days."
          />
          <div className="rounded-xl border border-[#EAECF0] bg-white px-3.5 py-2 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <p className="text-[10px] font-semibold tracking-[0.14em] text-[#98A2B3] uppercase">Delivery rate</p>
            <p className="mt-0.5 text-[22px] font-semibold tabular-nums text-[#111827]">
              {deliveryRate}
              <span className="ml-0.5 text-[13px] font-medium text-[#667085]">%</span>
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          {statusBlocks.map((block, index) => (
            <div
              key={block.key}
              className="group relative overflow-hidden rounded-2xl border border-[#EAECF0] bg-white px-3.5 py-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-transform duration-300 hover:-translate-y-0.5"
              style={{
                animation: ready ? `project-kpi-in 520ms cubic-bezier(0.22,1,0.36,1) ${index * 70}ms both` : undefined,
              }}
            >
              <div
                className="absolute inset-x-0 top-0 h-0.5 opacity-90"
                style={{ background: block.color }}
              />
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-medium text-[#667085]">{block.label}</p>
                <span
                  className="grid size-7 place-items-center rounded-lg"
                  style={{ background: `${block.color}22`, color: block.key === "inProgress" ? "#111111" : block.color }}
                >
                  <block.Icon className="size-3.5" />
                </span>
              </div>
              <p className="mt-2 text-[26px] font-semibold leading-none tabular-nums text-[#111827]">
                {String(data.status[block.key]).padStart(2, "0")}
              </p>
            </div>
          ))}
        </div>
      </div>

      {data.projectCount === 0 ? (
        <div className="p-6">
          <EmptyState title="No projects yet." description="Create a project to track delivery progress." icon={FolderKanban} />
        </div>
      ) : (
        <div className="space-y-4 p-5 md:p-6">
          <div
            className="relative overflow-hidden rounded-2xl border border-[#1F242D] bg-[radial-gradient(120%_90%_at_10%_0%,rgba(183,255,0,0.10),transparent_42%),radial-gradient(90%_80%_at_90%_100%,rgba(50,213,131,0.12),transparent_45%),linear-gradient(180deg,#12151C_0%,#0C0E13_100%)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-4"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.16em] text-[#B7FF00] uppercase">Momentum</p>
                <p className="mt-0.5 text-[13px] text-[#98A2B3]">Hover an avatar to inspect that calendar day</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#D0D5DD]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-0.5 w-4 rounded-full bg-[#32D583]" />
                  Completed
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-0.5 w-4 rounded-full bg-[#FDB022]" />
                  Open
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="size-3 text-[#98A2B3]" />
                  14 days
                </span>
              </div>
            </div>

            <div className="relative w-full" style={{ aspectRatio: `${plot.w} / ${plot.h}` }}>
              <svg
                viewBox={`0 0 ${plot.w} ${plot.h}`}
                className="absolute inset-0 size-full"
                role="img"
                aria-label="Project progress curve for the last 14 days"
              >
                <defs>
                  <linearGradient id="project-area-dark" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#32D583" stopOpacity="0.28" />
                    <stop offset="55%" stopColor="#32D583" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#32D583" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="project-line-done" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="#86EFAC" />
                    <stop offset="100%" stopColor="#32D583" />
                  </linearGradient>
                  <linearGradient id="project-line-open" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="#FDB022" />
                    <stop offset="100%" stopColor="#F79009" />
                  </linearGradient>
                  <filter id="project-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
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
                        stroke="rgba(255,255,255,0.06)"
                      />
                      <text x={plot.left - 10} y={y + 3} textAnchor="end" fill="#667085" fontSize="10">
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
                    strokeWidth="1.25"
                    strokeDasharray="4 5"
                    opacity="0.7"
                  />
                ) : null}

                {areaPath ? (
                  <path
                    d={areaPath}
                    fill="url(#project-area-dark)"
                    style={{
                      opacity: ready ? 1 : 0,
                      transition: "opacity 800ms ease",
                    }}
                  />
                ) : null}

                <path
                  d={openPath}
                  fill="none"
                  stroke="url(#project-line-open)"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={1}
                  opacity="0.9"
                  style={{
                    strokeDasharray: 1,
                    strokeDashoffset: ready ? 0 : 1,
                    transition: "stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)",
                  }}
                />
                <path
                  d={completedPath}
                  fill="none"
                  stroke="url(#project-line-done)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#project-glow)"
                  pathLength={1}
                  style={{
                    strokeDasharray: 1,
                    strokeDashoffset: ready ? 0 : 1,
                    transition: "stroke-dashoffset 1.15s cubic-bezier(0.22,1,0.36,1) 80ms",
                  }}
                />

                {openPoints.map((point, index) =>
                  point.day.people.length === 0 ? (
                    <circle
                      key={`open-dot-${point.day.key}`}
                      cx={point.x}
                      cy={point.y}
                      r={ready ? 3.5 : 0}
                      fill="#0C0E13"
                      stroke="#FDB022"
                      strokeWidth="2"
                      style={{ transition: `r 420ms ease ${180 + index * 30}ms` }}
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
                        r={ready ? (active === point.day.key ? 5.5 : 4) : 0}
                        fill="#0C0E13"
                        stroke="#32D583"
                        strokeWidth="2.4"
                        style={{ transition: `r 300ms ease ${220 + index * 30}ms` }}
                      />
                    </g>
                  ) : null,
                )}

                {completedPoints.map((point, index) =>
                  index === 0 || index === completedPoints.length - 1 || index % 2 === 0 ? (
                    <text
                      key={`label-${point.day.key}`}
                      x={point.x}
                      y={plot.h - 14}
                      textAnchor="middle"
                      fill="#98A2B3"
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
                        "project-avatar-mark pointer-events-auto absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full outline-none",
                        isActive && "z-20",
                      )}
                      style={{
                        left: `${(point.x / plot.w) * 100}%`,
                        top: `${(point.y / plot.h) * 100}%`,
                        animation: ready
                          ? `project-mark-in 560ms cubic-bezier(0.22,1,0.36,1) ${260 + index * 45}ms both`
                          : undefined,
                        transform: isActive
                          ? "translate(-50%, -50%) scale(1.14)"
                          : "translate(-50%, -50%) scale(1)",
                        transition: "transform 220ms cubic-bezier(0.22,1,0.36,1)",
                      }}
                    >
                      <span
                        className={cn(
                          "relative rounded-full bg-[#0C0E13] p-[3px] shadow-[0_8px_24px_rgba(0,0,0,0.45)]",
                          lead.done
                            ? "ring-2 ring-[#32D583] ring-offset-2 ring-offset-[#0C0E13]"
                            : "ring-2 ring-[#FDB022] ring-offset-2 ring-offset-[#0C0E13]",
                          isActive && "ring-[#B7FF00]",
                        )}
                      >
                        <UserAvatar name={lead.name} src={lead.avatarUrl} className="size-8" />
                        {extra > 0 ? (
                          <span className="absolute -right-1 -bottom-1 grid size-[18px] place-items-center rounded-full bg-[#B7FF00] text-[9px] font-bold text-[#111111] ring-2 ring-[#0C0E13]">
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
              className="overflow-hidden rounded-2xl border border-[#EAECF0] bg-white shadow-[0_10px_30px_rgba(16,24,40,0.06)]"
              style={{ animation: "project-panel-in 320ms cubic-bezier(0.22,1,0.36,1) both" }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAECF0] bg-[#F8FAFC] px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold tracking-[0.14em] text-[#667085] uppercase">Calendar day</p>
                  <p className="mt-0.5 text-[15px] font-semibold text-[#111827]">{activeDay.dateLabel}</p>
                </div>
                <div className="flex items-center gap-2">
                  {activeDay.people.slice(0, 4).map((person) => (
                    <UserAvatar
                      key={person.id}
                      name={person.name}
                      src={person.avatarUrl}
                      className="size-8 border-2 border-white shadow-sm"
                    />
                  ))}
                  <div className="ml-1 flex gap-1.5">
                    <span className="rounded-lg bg-[#ECFDF3] px-2.5 py-1 text-[12px] font-semibold tabular-nums text-[#027A48]">
                      {activeDay.completed} done
                    </span>
                    <span className="rounded-lg bg-[#FFFAEB] px-2.5 py-1 text-[12px] font-semibold tabular-nums text-[#B54708]">
                      {activeDay.open} open
                    </span>
                  </div>
                </div>
              </div>

              {activeDay.tasks.length === 0 ? (
                <p className="px-4 py-5 text-[13px] text-[#98A2B3]">No tasks tied to this day yet.</p>
              ) : (
                <div className="grid gap-0 sm:grid-cols-2">
                  {activeDay.tasks.map((task, index) => (
                    <Link
                      key={task.id}
                      href={`/tasks/${task.id}`}
                      className={cn(
                        "flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-[#F8FAFC]",
                        index % 2 === 0 && "sm:border-r sm:border-[#EAECF0]",
                        index < activeDay.tasks.length - (activeDay.tasks.length % 2 === 0 ? 2 : 1) &&
                          "border-b border-[#EAECF0]",
                      )}
                    >
                      <UserAvatar
                        name={task.assignee.name}
                        src={task.assignee.avatarUrl}
                        className="mt-0.5 size-9 shrink-0"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-medium text-[#111827]">{task.title}</span>
                        <span className="mt-1 block truncate text-[12px] text-[#667085]">
                          {task.assignee.name} · {task.project}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-[12px] text-[#98A2B3]">
              Hover an employee avatar on the curve to inspect that day’s work
            </p>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes project-kpi-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes project-mark-in {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.55);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
        @keyframes project-panel-in {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Surface>
  );
}
