"use client";

import { useEffect, useState } from "react";
import { FolderKanban } from "lucide-react";
import { Surface, SectionTitle } from "@/components/shared/surface";
import { EmptyState } from "@/components/shared/empty-state";

export type ClientWork = {
  id: string;
  name: string;
  assigned: number;
  done: number;
  left: number;
  next: number;
};

const series = [
  { key: "assigned" as const, label: "Assigned", color: "#175CD3" },
  { key: "done" as const, label: "Done", color: "#12B76A" },
  { key: "left" as const, label: "Left", color: "#98A2B3" },
  { key: "next" as const, label: "Coming next", color: "#DC6803" },
];

export function WorkChart({ rows }: { rows: ClientWork[] }) {
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const totals = rows.reduce(
    (acc, row) => ({
      assigned: acc.assigned + row.assigned,
      done: acc.done + row.done,
      left: acc.left + row.left,
      next: acc.next + row.next,
    }),
    { assigned: 0, done: 0, left: 0, next: 0 },
  );
  const complete = totals.assigned === 0 ? 0 : Math.round((totals.done / totals.assigned) * 100);
  const max = Math.max(...rows.flatMap((row) => [row.assigned, row.done, row.left, row.next]), 1);
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  const plot = { left: 36, right: 16, top: 12, bottom: 40, w: 640, h: 248 };
  const innerW = plot.w - plot.left - plot.right;
  const innerH = plot.h - plot.top - plot.bottom;
  const groupW = rows.length ? innerW / rows.length : innerW;
  const barW = 14;
  const barGap = 6;
  const cluster = series.length * barW + (series.length - 1) * barGap;
  const radius = 58;
  const ring = 2 * Math.PI * radius;

  return (
    <Surface>
      <SectionTitle
        title="Work by client"
        description="Assigned, finished, remaining, and what’s coming next."
      />
      {rows.length === 0 ? (
        <EmptyState title="No client work yet." icon={FolderKanban} />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center">
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
                  strokeDashoffset={ready ? ring * (1 - complete / 100) : ring}
                  className="motion-safe:transition-[stroke-dashoffset] motion-safe:duration-700 motion-safe:ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-[28px] font-semibold leading-none tabular-nums text-foreground">{complete}%</p>
                <p className="mt-1 text-[11px] font-medium text-muted-foreground">Complete</p>
              </div>
            </div>
            <div className="mt-5 grid w-full grid-cols-2 gap-2">
              {series.map((item) => (
                <div key={item.key} className="rounded-lg bg-muted/60 px-2.5 py-2">
                  <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">{item.label}</p>
                  <p className="mt-0.5 text-[16px] font-semibold tabular-nums" style={{ color: item.color }}>
                    {String(totals[item.key]).padStart(2, "0")}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="min-w-0">
            <svg
              viewBox={`0 0 ${plot.w} ${plot.h}`}
              className="h-[248px] w-full"
              role="img"
              aria-label="Work assigned, done, left, and coming next by client"
            >
              <defs>
                {series.map((item) => (
                  <linearGradient key={item.key} id={`bar-${item.key}`} x1="0" x2="0" y1="1" y2="0">
                    <stop offset="0%" stopColor={item.color} stopOpacity="0.75" />
                    <stop offset="100%" stopColor={item.color} />
                  </linearGradient>
                ))}
              </defs>
              {ticks.map((tick) => {
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
              {rows.map((row, index) => {
                const gx = plot.left + index * groupW + (groupW - cluster) / 2;
                const dimmed = active !== null && active !== row.id;
                return (
                  <g
                    key={row.id}
                    onMouseEnter={() => setActive(row.id)}
                    onMouseLeave={() => setActive(null)}
                    className="cursor-pointer"
                  >
                    {series.map((item, barIndex) => {
                      const value = row[item.key];
                      const h = value === 0 ? 0 : Math.max(6, (value / max) * innerH);
                      const x = gx + barIndex * (barW + barGap);
                      return (
                        <rect
                          key={item.key}
                          x={x}
                          y={plot.top + innerH - h}
                          width={barW}
                          height={h}
                          rx="4"
                          fill={`url(#bar-${item.key})`}
                          className="motion-safe:origin-bottom motion-safe:transition-[transform,opacity] motion-safe:duration-700 motion-safe:ease-out"
                          style={{
                            transformBox: "fill-box",
                            transform: ready ? "scaleY(1)" : "scaleY(0)",
                            transitionDelay: `${index * 80 + barIndex * 55}ms`,
                            opacity: dimmed ? 0.28 : 1,
                          }}
                        >
                          <title>{`${row.name}: ${item.label} ${value}`}</title>
                        </rect>
                      );
                    })}
                    <text
                      x={gx + cluster / 2}
                      y={plot.h - 16}
                      textAnchor="middle"
                      fill="#344054"
                      fontSize="12"
                      fontWeight="600"
                    >
                      {row.name.length > 18 ? `${row.name.slice(0, 17)}…` : row.name}
                    </text>
                  </g>
                );
              })}
            </svg>
            {active ? (
              <p className="mt-1 text-center text-[12px] text-muted-foreground">
                {(() => {
                  const row = rows.find((item) => item.id === active);
                  if (!row) return null;
                  return (
                    <>
                      <span className="font-medium text-foreground">{row.name}</span>
                      {" · "}
                      {row.assigned} assigned · {row.done} done · {row.left} left · {row.next} next
                    </>
                  );
                })()}
              </p>
            ) : (
              <p className="mt-1 text-center text-[12px] text-muted-foreground">Hover a client to see the breakdown</p>
            )}
          </div>
        </div>
      )}
    </Surface>
  );
}
