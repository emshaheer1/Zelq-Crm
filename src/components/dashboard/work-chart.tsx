"use client";

import { useEffect, useState } from "react";
import { UsersRound } from "lucide-react";
import { Surface, SectionTitle } from "@/components/shared/surface";
import { EmptyState } from "@/components/shared/empty-state";
import { UserAvatar } from "@/components/shared/user-avatar";
import { cn } from "@/lib/utils";

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
] as const;

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
  const max = Math.max(...rows.flatMap((row) => [row.completed, row.pending]), 1);
  const activeRow = rows.find((row) => row.id === active) ?? null;

  return (
    <Surface>
      <SectionTitle
        title="Team work"
        description="Completed and pending tasks by person this month. Managers also get credit for tasks they assign."
      />

      {rows.length === 0 ? (
        <EmptyState title="No employee work yet." icon={UsersRound} />
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            {series.map((item) => (
              <div
                key={item.key}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5"
              >
                <span className="size-2 rounded-full" style={{ background: item.color }} />
                <span className="text-[12px] text-muted-foreground">{item.label}</span>
                <span className="text-[13px] font-semibold tabular-nums text-foreground">
                  {String(totals[item.key]).padStart(2, "0")}
                </span>
              </div>
            ))}
          </div>

          <div className="flex min-h-[260px] items-end gap-2 overflow-x-auto pb-1 sm:gap-3">
            {rows.map((row, index) => {
              const dimmed = active !== null && active !== row.id;
              const firstName = row.name.split(" ")[0] || row.name;
              const isActive = active === row.id;

              return (
                <button
                  key={row.id}
                  type="button"
                  onMouseEnter={() => setActive(row.id)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(row.id)}
                  onBlur={() => setActive(null)}
                  className={cn(
                    "flex min-w-[92px] flex-1 flex-col items-center gap-2.5 rounded-2xl px-1.5 py-2 text-left outline-none transition-all duration-200",
                    isActive && "bg-muted/70",
                    ready && "work-row-in",
                  )}
                  style={{
                    opacity: dimmed ? 0.35 : 1,
                    animationDelay: `${index * 60}ms`,
                    transform: isActive ? "translateY(-2px)" : undefined,
                  }}
                >
                  <div className="flex h-[168px] w-full items-end justify-center gap-1.5">
                    {series.map((item, barIndex) => {
                      const value = row[item.key];
                      const height = value === 0 ? 0 : Math.max(12, Math.round((value / max) * 156));
                      return (
                        <div
                          key={item.key}
                          title={`${row.name}: ${item.label} ${value}`}
                          className="w-[18px] rounded-t-lg motion-safe:origin-bottom motion-safe:transition-[height,box-shadow] motion-safe:duration-700 motion-safe:ease-out sm:w-5"
                          style={{
                            height: ready ? height : 0,
                            background: `linear-gradient(180deg, ${item.color} 0%, ${item.color}b8 100%)`,
                            boxShadow: isActive ? `0 8px 18px ${item.color}44` : "none",
                            transitionDelay: `${index * 55 + barIndex * 40}ms`,
                          }}
                        />
                      );
                    })}
                  </div>

                  <UserAvatar
                    name={row.name}
                    src={row.avatarUrl}
                    className={cn(
                      "size-11 shrink-0 border-2 border-white shadow-sm transition-transform duration-200",
                      isActive && "scale-105 ring-2 ring-primary ring-offset-2 ring-offset-card",
                    )}
                  />

                  <div className="w-full text-center">
                    <p className="truncate text-[12px] font-semibold text-foreground">{firstName}</p>
                    <p className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
                      <span className="text-[#12B76A]">{row.completed}</span>
                      <span className="mx-0.5 text-[#D0D5DD]">/</span>
                      <span className="text-[#F79009]">{row.pending}</span>
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-center text-[12px] text-muted-foreground">
            {activeRow ? (
              <span className="work-panel-in">
                <span className="font-medium text-foreground">{activeRow.name}</span>
                {" · "}
                {activeRow.completed} completed · {activeRow.pending} pending
              </span>
            ) : (
              "Hover an employee to focus their completed and pending work"
            )}
          </p>
        </div>
      )}
    </Surface>
  );
}
