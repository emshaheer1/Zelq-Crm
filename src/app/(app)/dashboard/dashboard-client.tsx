"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CircleCheckBig,
  Eye,
  FolderKanban,
  ListTodo,
  MoreHorizontal,
  TriangleAlert,
  UsersRound,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Surface, SectionTitle } from "@/components/shared/surface";
import { ActivityTimeline } from "@/components/shared/activity-timeline";
import { TaskCard } from "@/components/tasks/task-card";
import { WorkChart } from "@/components/dashboard/work-chart";
import { WorkInsights } from "@/components/dashboard/work-insights";
import { Progress } from "@/components/ui/progress";
import { PriorityBadge, StatusBadge } from "@/components/shared/status-badge";
import { CreateButton } from "@/components/forms/create-dialogs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate, formatDateBlock, formatDeadlineLabel, isOverdue } from "@/lib/dates";
import { useInstantData } from "@/lib/instant-data";
import type { DashboardInsights } from "@/server/queries";

type TaskRow = {
  id: string;
  title: string;
  status: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  deadline: string | Date | null;
  driveUploaded?: boolean;
  project: { name: string };
  assignedTo: { name: string; avatarUrl: string | null };
};

type BootPayload =
  | {
      kind: "employee";
      user: { id: string; name: string; avatarUrl: string | null };
      data: {
        today: TaskRow[];
        upcoming: TaskRow[];
        review: TaskRow[];
        revision: TaskRow[];
        stats: {
          waitingForReview: number;
          overdueTasks: number;
          completedThisMonth: number;
        };
      };
      insights: DashboardInsights;
    }
  | {
      kind: "staff";
      user: { id: string; name: string; avatarUrl: string | null };
      stats: {
        activeProjects: number;
        tasksToday: number;
        waitingForReview: number;
        completedThisMonth: number;
        overdueTasks: number;
      };
      team: {
        id: string;
        name: string;
        designation: string | null;
        avatarUrl: string | null;
        active: number;
        pending: number;
        completed: number;
        overdue: number;
      }[];
      work: { today: TaskRow[]; tomorrow: TaskRow[]; upcoming: TaskRow[] };
      extras: {
        projects: {
          id: string;
          name: string;
          status: string;
          deadline: string | Date | null;
          progress: number;
          client: { name: string };
          members: { id: string; user: { name: string; avatarUrl: string | null } }[];
        }[];
        activities: {
          id: string;
          message: string;
          createdAt: string | Date;
          task?: { id: string; title: string } | null;
          user?: { name: string; avatarUrl: string | null } | null;
        }[];
      };
      insights: DashboardInsights;
    };

export function DashboardClient() {
  const { data, loading } = useInstantData<BootPayload>("dashboard", "/api/boot/dashboard");

  if (!data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description={loading ? "Loading your workspace…" : "Could not load dashboard."} />
      </div>
    );
  }

  if (data.kind === "employee") {
    const open =
      data.data.today.length + data.data.upcoming.length + data.data.review.length + data.data.revision.length;
    const workRows = [
      {
        id: data.user.id,
        name: data.user.name,
        avatarUrl: data.user.avatarUrl,
        completed: data.data.stats.completedThisMonth,
        pending: open,
      },
    ];
    return (
      <div className="space-y-6">
        <PageHeader
          title={`Hello, ${data.user.name.split(" ")[0]}`}
          description="What do you need to work on right now?"
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={ListTodo} label="Tasks Today" value={data.data.today.length} tone="orange" />
          <StatCard icon={Eye} label="Waiting for Review" value={data.data.stats.waitingForReview} tone="purple" />
          <StatCard icon={TriangleAlert} label="Overdue" value={data.data.stats.overdueTasks} tone="red" />
          <StatCard
            icon={CircleCheckBig}
            label="Completed This Month"
            value={data.data.stats.completedThisMonth}
            tone="green"
          />
        </div>
        <WorkChart rows={workRows} />
        <WorkInsights data={data.insights} />
        <div className="grid gap-6 xl:grid-cols-[1.65fr_0.85fr]">
          <TodayList tasks={data.data.today} />
          <Section title="Upcoming" description="What's next on your list." items={data.data.upcoming} empty="Nothing upcoming." />
        </div>
        <Section title="Waiting for Review" items={data.data.review} empty="No tasks waiting for review." />
        <Section title="Revision Required" items={data.data.revision} empty="No revisions right now." />
      </div>
    );
  }

  const workRows = data.team.map((member) => ({
    id: member.id,
    name: member.name,
    avatarUrl: member.avatarUrl,
    completed: member.completed,
    pending: member.pending + member.active,
  }));
  const deadlines = Array.from(
    new Map([...data.work.today, ...data.work.tomorrow, ...data.work.upcoming].map((task) => [task.id, task])).values(),
  ).slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your team's workload and current projects."
        actions={<CreateButton kind="task">New Task</CreateButton>}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={FolderKanban} label="Active Projects" value={data.stats.activeProjects} tone="blue" />
        <StatCard icon={ListTodo} label="Tasks Today" value={data.stats.tasksToday} tone="orange" />
        <StatCard icon={Eye} label="Waiting for Review" value={data.stats.waitingForReview} tone="purple" />
        <StatCard icon={CircleCheckBig} label="Completed This Month" value={data.stats.completedThisMonth} tone="green" />
        <StatCard icon={TriangleAlert} label="Overdue" value={data.stats.overdueTasks} tone="red" />
      </div>
      <WorkChart rows={workRows} />
      <WorkInsights data={data.insights} canOpenClients />

      <div className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.85fr)]">
        <Surface padded={false} className="min-w-0">
          <div className="border-b border-border px-5 py-4">
            <SectionTitle
              title="Today's Tasks"
              description="Tasks assigned for today and who they're assigned to."
            />
          </div>
          {data.work.today.length === 0 ? (
            <div className="p-6">
              <EmptyState title="No tasks for today." description="Tasks starting or due today will appear here." icon={ListTodo} />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {data.work.today.map((task) => (
                <div key={task.id} className="flex items-start gap-3 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/tasks/${task.id}`}
                      className="block truncate text-[13px] font-medium text-foreground hover:text-secondary"
                    >
                      {task.title}
                    </Link>
                    <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{task.project.name}</p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[12px] text-foreground">
                        <UserAvatar name={task.assignedTo.name} src={task.assignedTo.avatarUrl} className="size-5" />
                        Assigned to {task.assignedTo.name.split(" ")[0]}
                      </span>
                      <PriorityBadge value={task.priority} />
                      <span
                        className={
                          isOverdue(task.deadline, task.status)
                            ? "text-[12px] text-destructive"
                            : "text-[12px] text-muted-foreground"
                        }
                      >
                        {formatDeadlineLabel(task.deadline)}
                      </span>
                      <StatusBadge value={task.status as never} />
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/tasks/${task.id}`}>View Task</Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </Surface>

        <Surface>
          <SectionTitle
            title="Upcoming Deadlines"
            action={
              <Link href="/calendar" className="inline-flex items-center gap-1 text-[13px] font-medium text-foreground">
                View Calendar <ArrowRight className="size-3.5" />
              </Link>
            }
          />
          {deadlines.length === 0 ? (
            <EmptyState title="No upcoming deadlines." description="Upcoming work will appear here." icon={CalendarDays} />
          ) : (
            <div className="space-y-4">
              {deadlines.map((task) => {
                const block = formatDateBlock(task.deadline);
                return (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className="flex gap-3 rounded-lg p-1.5 transition-colors hover:bg-muted/60"
                  >
                    <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-lg bg-muted text-center">
                      <span className="text-[10px] font-semibold tracking-wide text-muted-foreground">{block.month}</span>
                      <span className="text-sm font-semibold text-foreground">{block.day}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{task.title}</p>
                      <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                        Assigned to {task.assignedTo.name.split(" ")[0]}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatDeadlineLabel(task.deadline)}</p>
                    </div>
                    <StatusBadge value={task.status as never} />
                  </Link>
                );
              })}
            </div>
          )}
        </Surface>
      </div>

      <div>
        <SectionTitle title="Active Projects" description="Current client work and delivery progress." />
        {data.extras.projects.length === 0 ? (
          <EmptyState title="No active projects." description="Create a project to start tracking delivery." icon={FolderKanban} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {data.extras.projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="rounded-xl border border-border bg-card p-5 transition-colors duration-150 hover:border-[#d0d5dd]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{project.name}</p>
                    <p className="mt-1 truncate text-[13px] text-muted-foreground">{project.client.name}</p>
                  </div>
                  <StatusBadge value={project.status as never} />
                </div>
                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-[13px]">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold text-foreground">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-1.5" />
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                    <CalendarDays className="size-4" />
                    Due {formatDate(project.deadline)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <UsersRound className="size-4 text-muted-foreground" />
                    <div className="flex -space-x-2">
                      {project.members.slice(0, 3).map((member) => (
                        <UserAvatar
                          key={member.id}
                          name={member.user.name}
                          src={member.user.avatarUrl}
                          className="size-6 border-white"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Surface padded={false}>
          <div className="border-b border-border px-5 py-4">
            <SectionTitle title="Team Workload" description="How work is distributed across the team." />
          </div>
          {data.team.length === 0 ? (
            <div className="p-6">
              <EmptyState title="No active employees." />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {data.team.map((member) => {
                const open = member.active + member.pending;
                const load = Math.min(100, open * 12);
                const band =
                  open === 0
                    ? { label: "Available", className: "bg-[#F2F4F7] text-[#475467]" }
                    : open <= 2
                      ? { label: "Light", className: "bg-[#ECFDF3] text-[#027A48]" }
                      : open <= 5
                        ? { label: "Busy", className: "bg-[#FFFAEB] text-[#B54708]" }
                        : { label: "Full", className: "bg-[#FEF3F2] text-[#B42318]" };
                const meta = [
                  open ? `${open} open` : null,
                  member.completed ? `${member.completed} done` : null,
                  member.overdue ? `${member.overdue} overdue` : null,
                ].filter(Boolean);

                return (
                  <Link
                    key={member.id}
                    href={`/employees/${member.id}`}
                    className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted/50"
                  >
                    <UserAvatar name={member.name} src={member.avatarUrl} className="size-9 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[13px] font-medium text-foreground">{member.name}</p>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${band.className}`}>
                          {band.label}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                        {member.designation || "Team member"}
                      </p>
                      <Progress value={load} className="mt-2.5 h-1.5" />
                      <p className={`mt-1.5 text-[11px] ${member.overdue ? "text-destructive" : "text-muted-foreground"}`}>
                        {meta.length ? meta.join(" · ") : "No open work"}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Surface>
        <Surface>
          <SectionTitle title="Recent Activity" description="Latest movement across tasks and reviews." />
          <ActivityTimeline
            items={data.extras.activities.map((item) => ({
              ...item,
              createdAt: new Date(item.createdAt),
            }))}
          />
        </Surface>
      </div>
    </div>
  );
}

function TodayList({ tasks }: { tasks: TaskRow[] }) {
  return (
    <Surface padded={false}>
      <div className="border-b border-border px-5 py-4">
        <SectionTitle title="Today's Tasks" description="Work assigned for today." />
      </div>
      {tasks.length === 0 ? (
        <div className="p-6">
          <EmptyState title="No tasks for today." description="Tasks starting or due today will appear here." icon={ListTodo} />
        </div>
      ) : (
        <div className="divide-y divide-border">
          {tasks.map((task) => (
            <Link
              key={task.id}
              href={`/tasks/${task.id}`}
              className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-foreground">{task.title}</p>
                <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{task.project.name}</p>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[12px] text-foreground">
                    <UserAvatar name={task.assignedTo.name} src={task.assignedTo.avatarUrl} className="size-5" />
                    {task.assignedTo.name.split(" ")[0]}
                  </span>
                  <PriorityBadge value={task.priority} />
                  <span className="text-[12px] text-muted-foreground">{formatDeadlineLabel(task.deadline)}</span>
                  <StatusBadge value={task.status as never} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Surface>
  );
}

function Section({
  title,
  description,
  items,
  empty,
}: {
  title: string;
  description?: string;
  items: TaskRow[];
  empty: string;
}) {
  return (
    <Surface>
      <SectionTitle title={title} description={description} />
      {items.length === 0 ? (
        <EmptyState title={empty} />
      ) : (
        <div className="grid gap-3">
          {items.map((task) => (
            <TaskCard
              key={task.id}
              task={{
                id: task.id,
                title: task.title,
                status: task.status as never,
                priority: task.priority,
                deadline: task.deadline,
                driveUploaded: Boolean(task.driveUploaded),
                project: task.project,
                assignedTo: task.assignedTo,
              }}
            />
          ))}
        </div>
      )}
    </Surface>
  );
}
