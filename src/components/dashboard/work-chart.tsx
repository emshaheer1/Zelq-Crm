"use client";

import { useEffect, useState } from "react";
import { UsersRound } from "lucide-react";
import { Surface, SectionTitle } from "@/components/shared/surface";
import { EmptyState } from "@/components/shared/empty-state";
import { UserAvatar } from "@/components/shared/user-avatar";

export type EmployeeWork = {
  id: string;
  name: string;
  avatarUrl: string | null;
  completed: number;
  pending: number;
};

const series = [
  { key: "completed" as const, label: "Completed", color: "#12B76A" },
  { key: "pending" as const, label: "Pending", color: "#F79009" },
];

export function WorkChart({ rows }: { rows: EmployeeWork[] }) {
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const totals = rows.reduce(
    (acc, row) => ({
      completed: acc.completed + row.completed,
      pending: acc.pending + row.pending,
    }),
    { completed: 0, pending: 0 },
  );
  const total = totals.completed + totals.pending;
  const complete = total === 0 ? 0 : Math.round((totals.completed / total) * 100);
  const max = Math.max(...rows.flatMap((row) => [row.completed, row.pending]), 1);
  const radius = 58;
  const ring = 2 * Math.PI * radius;

  return (
    <Surface>
      <SectionTitle
        title="Team work"
        description="Who has finished work this month, and who still has pending tasks."
      />
      {rows.length === 0 ? (
        <EmptyState title="No employee work yet." icon={UsersRound} />
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
            <div className="flex min-h-[248px] items-end gap-2 overflow-x-auto pb-1 sm:gap-3">
              {rows.map((row, index) => {
                const dimmed = active !== null && active !== row.id;
                const firstName = row.name.split(" ")[0] || row.name;
                return (
                  <button
                    key={row.id}
                    type="button"
                    onMouseEnter={() => setActive(row.id)}
                    onMouseLeave={() => setActive(null)}
                    onFocus={() => setActive(row.id)}
                    onBlur={() => setActive(null)}
                    className="flex min-w-[88px] flex-1 flex-col items-center gap-2 rounded-xl px-1 py-1 text-left outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-ring/20"
                    style={{ opacity: dimmed ? 0.35 : 1 }}
                  >
                    <div className="flex h-[160px] w-full items-end justify-center gap-1.5">
                      {series.map((item, barIndex) => {
                        const value = row[item.key];
                        const height = value === 0 ? 0 : Math.max(10, Math.round((value / max) * 148));
                        return (
                          <div
                            key={item.key}
                            title={`${row.name}: ${item.label} ${value}`}
                            className="w-4 rounded-t-md motion-safe:origin-bottom motion-safe:transition-[height,transform] motion-safe:duration-700 motion-safe:ease-out sm:w-[18px]"
                            style={{
                              height: ready ? height : 0,
                              background: `linear-gradient(180deg, ${item.color} 0%, ${item.color}cc 100%)`,
                              transitionDelay: `${index * 70 + barIndex * 45}ms`,
                            }}
                          />
                        );
                      })}
                    </div>
                    <UserAvatar name={row.name} src={row.avatarUrl} className="size-10 shrink-0 ring-2 ring-white" />
                    <div className="w-full text-center">
                      <p className="truncate text-[12px] font-semibold text-foreground">{firstName}</p>
                      <p className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
                        <span className="text-[#12B76A]">{row.completed}</span>
                        {" / "}
                        <span className="text-[#F79009]">{row.pending}</span>
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-[12px] text-muted-foreground">
              {series.map((item) => (
                <span key={item.key} className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                  {item.label}
                </span>
              ))}
            </div>
            {active ? (
              <p className="mt-2 text-center text-[12px] text-muted-foreground">
                {(() => {
                  const row = rows.find((item) => item.id === active);
                  if (!row) return null;
                  return (
                    <>
                      <span className="font-medium text-foreground">{row.name}</span>
                      {" · "}
                      {row.completed} completed · {row.pending} pending
                    </>
                  );
                })()}
              </p>
            ) : (
              <p className="mt-2 text-center text-[12px] text-muted-foreground">
                Hover an employee to see their completed and pending work
              </p>
            )}
          </div>
        </div>
      )}
    </Surface>
  );
}
