"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { TaskStatus } from "@prisma/client";
import { Surface, SectionTitle } from "@/components/shared/surface";
import { UserAvatar } from "@/components/shared/user-avatar";
import { cn } from "@/lib/utils";
import type { DashboardInsights, InsightPerson } from "@/server/queries";

const PIPELINE_COLORS: Record<string, string> = {
  PENDING: "#98A2B3",
  IN_PROGRESS: "#B7FF00",
  READY_FOR_REVIEW: "#7A5AF8",
  REVISION_REQUIRED: "#F79009",
  COMPLETED: "#12B76A",
};

const PRIORITY_COLORS = {
  HIGH: "#F04438",
  MEDIUM: "#F79009",
  LOW: "#98A2B3",
} as const;

function AvatarStack({ people, size = "size-6" }: { people: InsightPerson[]; size?: string }) {
  if (people.length === 0) return null;
  return (
    <div className="flex items-center -space-x-1.5">
      {people.slice(0, 3).map((person) => (
        <UserAvatar
          key={person.id}
          name={person.name}
          src={person.avatarUrl}
          className={cn(size, "border border-card")}
        />
      ))}
      {people.length > 3 ? (
        <span className="grid size-6 place-items-center rounded-full border border-card bg-muted text-[9px] font-semibold text-muted-foreground">
          +{people.length - 3}
        </span>
      ) : null}
    </div>
  );
}

function HoverCard({
  active,
  children,
  detail,
}: {
  active: boolean;
  children: React.ReactNode;
  detail: React.ReactNode;
}) {
  return (
    <div className="relative">
      {children}
      {active ? (
        <div className="project-panel-in pointer-events-none absolute top-full left-0 z-30 mt-2 w-[220px] rounded-xl border border-border bg-card p-3 shadow-[0_12px_32px_rgba(16,24,40,0.12)]">
          {detail}
        </div>
      ) : null}
    </div>
  );
}

export function WorkInsights({
  data,
  canOpenClients = false,
}: {
  data: DashboardInsights;
  canOpenClients?: boolean;
}) {
  const [ready, setReady] = useState(false);
  const [activePipeline, setActivePipeline] = useState<TaskStatus | null>(null);
  const [activePriority, setActivePriority] = useState<string | null>(null);
  const [activeClient, setActiveClient] = useState<string | null>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const pipelineTotal = data.pipeline.reduce((sum, item) => sum + item.count, 0);
  const priorityTotal = data.priorities.reduce((sum, item) => sum + item.count, 0);
  const maxClient = Math.max(...data.clients.map((item) => item.assigned), 1);

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const pipelineSegments = (() => {
    let offset = 0;
    const gap = 3;
    return data.pipeline.map((item) => {
      const share = pipelineTotal === 0 ? 0 : item.count / pipelineTotal;
      const length = Math.max(0, share * circumference - (item.count > 0 ? gap : 0));
      const segment = { ...item, length, offset };
      offset += length + (item.count > 0 ? gap : 0);
      return segment;
    });
  })();

  return (
    <Surface className="overflow-visible p-0">
      <div className="border-b border-border px-5 py-4">
        <SectionTitle
          title="Work insights"
          description="Pipeline, priority load, and client workload in one view."
        />
      </div>

      <div className="grid divide-y divide-border lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        {/* Pipeline */}
        <div className="p-4 sm:p-5">
          <p className="text-[12px] font-semibold text-foreground">Task pipeline</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Where work sits right now</p>

          <div className="mt-4 flex items-center gap-4">
            <div className="relative size-[108px] shrink-0">
              <svg viewBox="0 0 108 108" className="size-full -rotate-90">
                <circle cx="54" cy="54" r={radius} fill="none" stroke="#EEF1F4" strokeWidth="12" />
                {pipelineSegments.map((item, index) => (
                  <circle
                    key={item.key}
                    cx="54"
                    cy="54"
                    r={radius}
                    fill="none"
                    stroke={PIPELINE_COLORS[item.key] ?? "#98A2B3"}
                    strokeWidth={activePipeline === item.key ? 14 : 12}
                    strokeDasharray={`${ready ? item.length : 0} ${circumference}`}
                    strokeDashoffset={-item.offset}
                    strokeLinecap="butt"
                    className="cursor-pointer motion-safe:transition-[stroke-dasharray,stroke-width] motion-safe:duration-700 motion-safe:ease-out"
                    style={{ transitionDelay: `${index * 60}ms` }}
                    onMouseEnter={() => setActivePipeline(item.key)}
                    onMouseLeave={() => setActivePipeline(null)}
                  />
                ))}
              </svg>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-[18px] font-semibold tabular-nums text-foreground">{pipelineTotal}</p>
                <p className="text-[10px] text-muted-foreground">tasks</p>
              </div>
            </div>

            <div className="min-w-0 flex-1 space-y-1.5">
              {data.pipeline.map((item, index) => {
                const pct = pipelineTotal === 0 ? 0 : Math.round((item.count / pipelineTotal) * 100);
                return (
                  <HoverCard
                    key={item.key}
                    active={activePipeline === item.key}
                    detail={
                      <>
                        <p className="text-[12px] font-semibold text-foreground">{item.label}</p>
                        <p className="mt-1 text-[11px] tabular-nums text-muted-foreground">
                          {item.count} tasks · {pct}%
                        </p>
                        {item.people.length > 0 ? (
                          <div className="mt-2 flex items-center gap-2">
                            <AvatarStack people={item.people} />
                            <span className="truncate text-[11px] text-muted-foreground">
                              {item.people.map((p) => p.name.split(" ")[0]).join(", ")}
                            </span>
                          </div>
                        ) : (
                          <p className="mt-2 text-[11px] text-muted-foreground">No assignees</p>
                        )}
                      </>
                    }
                  >
                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-left transition-colors",
                        activePipeline === item.key ? "bg-muted/80" : "hover:bg-muted/50",
                        ready && "project-kpi-in",
                      )}
                      style={{ animationDelay: `${index * 45}ms` }}
                      onMouseEnter={() => setActivePipeline(item.key)}
                      onMouseLeave={() => setActivePipeline(null)}
                    >
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ background: PIPELINE_COLORS[item.key] }}
                      />
                      <span className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">
                        {item.label}
                      </span>
                      <span className="text-[12px] font-semibold tabular-nums text-foreground">
                        {item.count}
                      </span>
                    </button>
                  </HoverCard>
                );
              })}
            </div>
          </div>
        </div>

        {/* Priority */}
        <div className="p-4 sm:p-5">
          <p className="text-[12px] font-semibold text-foreground">Open by priority</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Urgent vs normal load</p>

          <div className="mt-5 space-y-3">
            {data.priorities.map((item, index) => {
              const width = priorityTotal === 0 ? 0 : (item.count / Math.max(priorityTotal, 1)) * 100;
              return (
                <HoverCard
                  key={item.key}
                  active={activePriority === item.key}
                  detail={
                    <>
                      <p className="text-[12px] font-semibold text-foreground">{item.label} priority</p>
                      <p className="mt-1 text-[11px] tabular-nums text-muted-foreground">
                        {item.count} open
                        {item.overdue > 0 ? ` · ${item.overdue} overdue` : ""}
                      </p>
                      {item.people.length > 0 ? (
                        <div className="mt-2 flex items-center gap-2">
                          <AvatarStack people={item.people} />
                          <span className="truncate text-[11px] text-muted-foreground">
                            {item.people.map((p) => p.name.split(" ")[0]).join(", ")}
                          </span>
                        </div>
                      ) : null}
                    </>
                  }
                >
                  <button
                    type="button"
                    className={cn(
                      "w-full rounded-lg px-1 py-1 text-left transition-colors",
                      activePriority === item.key ? "bg-muted/80" : "hover:bg-muted/40",
                      ready && "project-kpi-in",
                    )}
                    style={{ animationDelay: `${80 + index * 50}ms` }}
                    onMouseEnter={() => setActivePriority(item.key)}
                    onMouseLeave={() => setActivePriority(null)}
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-[12px] font-medium text-foreground">
                        <span
                          className="size-2 rounded-sm"
                          style={{ background: PRIORITY_COLORS[item.key] }}
                        />
                        {item.label}
                      </span>
                      <span className="flex items-center gap-2">
                        <AvatarStack people={item.people} size="size-5" />
                        <span className="text-[12px] font-semibold tabular-nums text-foreground">
                          {item.count}
                        </span>
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#EEF1F4]">
                      <div
                        className="h-full rounded-full motion-safe:transition-[width] motion-safe:duration-700 motion-safe:ease-out"
                        style={{
                          width: ready ? `${width}%` : "0%",
                          background: PRIORITY_COLORS[item.key],
                          transitionDelay: `${120 + index * 50}ms`,
                        }}
                      />
                    </div>
                  </button>
                </HoverCard>
              );
            })}
          </div>
          {priorityTotal === 0 ? (
            <p className="mt-4 text-center text-[12px] text-muted-foreground">No open tasks</p>
          ) : null}
        </div>

        {/* Clients */}
        <div className="p-4 sm:p-5">
          <p className="text-[12px] font-semibold text-foreground">By client</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Who carries the most work</p>

          <div className="mt-4 space-y-2">
            {data.clients.length === 0 ? (
              <p className="py-6 text-center text-[12px] text-muted-foreground">No client work yet</p>
            ) : (
              data.clients.map((client, index) => {
                const doneW = (client.done / maxClient) * 100;
                const leftW = (client.left / maxClient) * 100;
                return (
                  <HoverCard
                    key={client.id}
                    active={activeClient === client.id}
                    detail={
                      <>
                        <p className="text-[12px] font-semibold text-foreground">{client.name}</p>
                        <p className="mt-1 text-[11px] tabular-nums text-muted-foreground">
                          <span className="text-[#12B76A]">{client.done} done</span>
                          {" · "}
                          <span className="text-[#F79009]">{client.left} open</span>
                          {" · "}
                          {client.assigned} total
                        </p>
                        {client.people.length > 0 ? (
                          <div className="mt-2 flex items-center gap-2">
                            <AvatarStack people={client.people} />
                            <span className="truncate text-[11px] text-muted-foreground">
                              {client.people.map((p) => p.name.split(" ")[0]).join(", ")}
                            </span>
                          </div>
                        ) : null}
                        {canOpenClients ? (
                          <Link
                            href={`/clients/${client.id}`}
                            className="pointer-events-auto mt-2 inline-block text-[11px] font-medium text-foreground underline-offset-2 hover:underline"
                          >
                            Open client
                          </Link>
                        ) : null}
                      </>
                    }
                  >
                    <button
                      type="button"
                      className={cn(
                        "w-full rounded-lg px-1.5 py-1.5 text-left transition-colors",
                        activeClient === client.id ? "bg-muted/80" : "hover:bg-muted/40",
                        ready && "work-row-in",
                      )}
                      style={{ animationDelay: `${100 + index * 40}ms` }}
                      onMouseEnter={() => setActiveClient(client.id)}
                      onMouseLeave={() => setActiveClient(null)}
                    >
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <span className="truncate text-[12px] font-medium text-foreground">
                          {client.name}
                        </span>
                        <AvatarStack people={client.people} size="size-5" />
                      </div>
                      <div className="flex h-2 overflow-hidden rounded-full bg-[#EEF1F4]">
                        <div
                          className="h-full bg-[#12B76A] motion-safe:transition-[width] motion-safe:duration-700"
                          style={{
                            width: ready ? `${doneW}%` : "0%",
                            transitionDelay: `${140 + index * 35}ms`,
                          }}
                        />
                        <div
                          className="h-full bg-[#F79009] motion-safe:transition-[width] motion-safe:duration-700"
                          style={{
                            width: ready ? `${leftW}%` : "0%",
                            transitionDelay: `${160 + index * 35}ms`,
                          }}
                        />
                      </div>
                      <p className="mt-1 text-[10px] tabular-nums text-muted-foreground">
                        {client.done}/{client.assigned}
                      </p>
                    </button>
                  </HoverCard>
                );
              })
            )}
          </div>
        </div>
      </div>
    </Surface>
  );
}
