"use client";

import { useEffect, useMemo, useState } from "react";
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

export function WorkChart({ rows }: { rows: EmployeeWork[] }) {
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const ranked = useMemo(
    () =>
      [...rows].sort((a, b) => {
        const scoreA = a.completed * 2 + a.pending;
        const scoreB = b.completed * 2 + b.pending;
        return scoreB - scoreA || b.completed - a.completed;
      }),
    [rows],
  );

  const totals = ranked.reduce(
    (acc, row) => ({
      completed: acc.completed + row.completed,
      pending: acc.pending + row.pending,
    }),
    { completed: 0, pending: 0 },
  );
  const workload = totals.completed + totals.pending;
  const completeRate = workload === 0 ? 0 : Math.round((totals.completed / workload) * 100);
  const maxLoad = Math.max(...ranked.map((row) => row.completed + row.pending), 1);
  const activeRow = ranked.find((row) => row.id === active) ?? null;

  return (
    <Surface>
      <SectionTitle
        title="Team work"
        description="Who is carrying the load this month. Managers also get credit for tasks they assign."
        action={
          workload > 0 ? (
            <div className="flex items-center gap-2 text-[12px]">
              <span className="rounded-md bg-[#ECFDF3] px-2 py-1 font-semibold tabular-nums text-[#027A48]">
                {totals.completed} done
              </span>
              <span className="rounded-md bg-[#FFFAEB] px-2 py-1 font-semibold tabular-nums text-[#B54708]">
                {totals.pending} pending
              </span>
            </div>
          ) : null
        }
      />

      {ranked.length === 0 ? (
        <EmptyState title="No employee work yet." icon={UsersRound} />
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
            <div>
              <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Team completion</p>
              <p className="mt-1 text-[28px] font-semibold leading-none tabular-nums text-foreground">
                {completeRate}
                <span className="ml-0.5 text-[14px] font-medium text-muted-foreground">%</span>
              </p>
            </div>
            <div className="h-2 w-full max-w-[220px] overflow-hidden rounded-full bg-[#EEF1F4] sm:w-[220px]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#B7FF00_0%,#12B76A_100%)] motion-safe:transition-[width] motion-safe:duration-700 motion-safe:ease-out"
                style={{ width: ready ? `${completeRate}%` : "0%" }}
              />
            </div>
          </div>

          <div className="space-y-2">
            {ranked.map((row, index) => {
              const load = row.completed + row.pending;
              const donePct = load === 0 ? 0 : (row.completed / maxLoad) * 100;
              const pendingPct = load === 0 ? 0 : (row.pending / maxLoad) * 100;
              const isActive = active === row.id;
              const dimmed = active !== null && !isActive;

              return (
                <button
                  key={row.id}
                  type="button"
                  onMouseEnter={() => setActive(row.id)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(row.id)}
                  onBlur={() => setActive(null)}
                  className={cn(
                    "grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left outline-none transition-all duration-200",
                    isActive && "border-border bg-card shadow-[0_8px_24px_rgba(16,24,40,0.06)]",
                    !isActive && "hover:bg-muted/50",
                    ready && "work-row-in",
                  )}
                  style={{
                    opacity: dimmed ? 0.4 : 1,
                    animationDelay: `${index * 55}ms`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 text-center text-[11px] font-semibold tabular-nums text-muted-foreground">
                      {index + 1}
                    </span>
                    <UserAvatar
                      name={row.name}
                      src={row.avatarUrl}
                      className={cn(
                        "size-10 transition-transform duration-200",
                        isActive && "scale-105 ring-2 ring-primary ring-offset-2 ring-offset-card",
                      )}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-foreground">{row.name}</p>
                      <p className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
                        <span className="text-[#12B76A]">{row.completed} done</span>
                        {" · "}
                        <span className="text-[#F79009]">{row.pending} pending</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex h-3 min-w-0 overflow-hidden rounded-full bg-[#EEF1F4]">
                    <div
                      className="h-full bg-[#12B76A] motion-safe:transition-[width] motion-safe:duration-700 motion-safe:ease-out"
                      style={{
                        width: ready ? `${donePct}%` : "0%",
                        transitionDelay: `${90 + index * 45}ms`,
                        borderTopLeftRadius: 999,
                        borderBottomLeftRadius: 999,
                        borderTopRightRadius: pendingPct === 0 ? 999 : 0,
                        borderBottomRightRadius: pendingPct === 0 ? 999 : 0,
                      }}
                    />
                    <div
                      className="h-full bg-[#F79009] motion-safe:transition-[width] motion-safe:duration-700 motion-safe:ease-out"
                      style={{
                        width: ready ? `${pendingPct}%` : "0%",
                        transitionDelay: `${120 + index * 45}ms`,
                        borderTopRightRadius: 999,
                        borderBottomRightRadius: 999,
                        borderTopLeftRadius: donePct === 0 ? 999 : 0,
                        borderBottomLeftRadius: donePct === 0 ? 999 : 0,
                      }}
                    />
                  </div>

                  <div className="text-right">
                    <p className="text-[15px] font-semibold tabular-nums text-foreground">{load}</p>
                    <p className="text-[10px] text-muted-foreground">tasks</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-[12px] text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-[#12B76A]" />
                Completed
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-[#F79009]" />
                Pending
              </span>
            </div>
            {activeRow ? (
              <p className="work-panel-in">
                <span className="font-medium text-foreground">{activeRow.name}</span>
                {" · "}
                {activeRow.completed} completed · {activeRow.pending} pending
              </p>
            ) : (
              <p>Hover a teammate to focus their workload</p>
            )}
          </div>
        </div>
      )}
    </Surface>
  );
}
