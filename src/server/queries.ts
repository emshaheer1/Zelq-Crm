import { addDays, format } from "date-fns";
import { Prisma, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { endOfToday, endOfTomorrow, monthRange, startOfToday, startOfTomorrow } from "@/lib/dates";
import type { AuthUser } from "@/lib/auth";
import { isStaff } from "@/lib/permissions";

export const taskInclude = {
  project: { select: { id: true, name: true, clientId: true } },
  assignedTo: { select: { id: true, name: true, avatarUrl: true } },
} satisfies Prisma.TaskInclude;

export async function taskScope(user: AuthUser): Promise<Prisma.TaskWhereInput> {
  if (isStaff(user.role)) return {};
  return { assignedToId: user.id };
}

export async function projectScope(user: AuthUser): Promise<Prisma.ProjectWhereInput> {
  if (isStaff(user.role)) return {};
  return {
    OR: [
      { managerId: user.id },
      { members: { some: { userId: user.id } } },
    ],
  };
}

export function projectProgress(tasks: { status: TaskStatus }[]) {
  if (!tasks.length) return 0;
  const completed = tasks.filter((task) => task.status === "COMPLETED").length;
  return Math.round((completed / tasks.length) * 100);
}

export async function getDashboardStats(user: AuthUser) {
  const scope = await taskScope(user);
  const projectWhere = await projectScope(user);
  const now = new Date();
  const { start, end } = monthRange(now.getFullYear(), now.getMonth() + 1);

  const [
    activeProjects,
    tasksToday,
    pendingTasks,
    completedThisMonth,
    overdueTasks,
    waitingForReview,
    completedToday,
    projectsDueThisWeek,
  ] = await Promise.all([
    prisma.project.count({
      where: { ...projectWhere, status: { in: ["NOT_STARTED", "IN_PROGRESS"] } },
    }),
    prisma.task.count({
      where: {
        ...scope,
        status: { not: "COMPLETED" },
        deadline: { gte: startOfToday(), lte: endOfToday() },
      },
    }),
    prisma.task.count({
      where: { ...scope, status: { in: ["PENDING", "IN_PROGRESS", "ON_HOLD"] } },
    }),
    prisma.task.count({
      where: { ...scope, status: "COMPLETED", completedAt: { gte: start, lte: end } },
    }),
    prisma.task.count({
      where: {
        ...scope,
        status: { not: "COMPLETED" },
        deadline: { lt: startOfToday() },
      },
    }),
    prisma.task.count({
      where: { ...scope, status: "READY_FOR_REVIEW" },
    }),
    prisma.task.count({
      where: {
        ...scope,
        status: "COMPLETED",
        completedAt: { gte: startOfToday(), lte: endOfToday() },
      },
    }),
    prisma.project.count({
      where: {
        ...projectWhere,
        status: { in: ["NOT_STARTED", "IN_PROGRESS"] },
        deadline: { gte: startOfToday(), lte: addDays(endOfToday(), 6) },
      },
    }),
  ]);

  return {
    activeProjects,
    tasksToday,
    pendingTasks,
    completedThisMonth,
    overdueTasks,
    waitingForReview,
    completedToday,
    projectsDueThisWeek,
  };
}

export async function getTeamWorkload() {
  const users = await prisma.user.findMany({
    where: { status: "ACTIVE", role: { not: "ADMIN" } },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      role: true,
      designation: true,
      avatarUrl: true,
      assignedTasks: { select: { id: true, status: true, completedAt: true, deadline: true } },
      createdTasks: { select: { id: true, status: true, completedAt: true, deadline: true } },
    },
  });

  const month = monthRange(new Date().getFullYear(), new Date().getMonth() + 1);

  return users.map((user) => {
    const tasks = workloadTasks(user);
    return {
      id: user.id,
      name: user.name,
      designation: user.designation,
      avatarUrl: user.avatarUrl,
      active: tasks.filter((task) =>
        ["IN_PROGRESS", "READY_FOR_REVIEW", "REVISION_REQUIRED"].includes(task.status),
      ).length,
      pending: tasks.filter((task) => task.status === "PENDING").length,
      completed: tasks.filter(
        (task) =>
          task.status === "COMPLETED" &&
          task.completedAt &&
          task.completedAt >= month.start &&
          task.completedAt <= month.end,
      ).length,
      overdue: tasks.filter(
        (task) =>
          task.status !== "COMPLETED" &&
          task.deadline &&
          task.deadline < startOfToday(),
      ).length,
    };
  });
}

type WorkloadTask = {
  id: string;
  status: string;
  completedAt: Date | null;
  deadline: Date | null;
};

/** Managers get credit for tasks they assign; employees for tasks assigned to them. */
function workloadTasks(user: {
  role: string;
  assignedTasks: WorkloadTask[];
  createdTasks: WorkloadTask[];
}) {
  if (user.role === "MANAGER" || user.role === "ADMIN") {
    const map = new Map(user.createdTasks.map((task) => [task.id, task]));
    for (const task of user.assignedTasks) map.set(task.id, task);
    return [...map.values()];
  }
  return user.assignedTasks;
}

export async function getUpcomingWork(user: AuthUser) {
  const scope = await taskScope(user);
  const include = taskInclude;

  const [today, tomorrow, upcoming] = await Promise.all([
    prisma.task.findMany({
      where: {
        ...scope,
        status: { not: "COMPLETED" },
        deadline: { gte: startOfToday(), lte: endOfToday() },
      },
      include,
      orderBy: { deadline: "asc" },
    }),
    prisma.task.findMany({
      where: {
        ...scope,
        status: { not: "COMPLETED" },
        deadline: { gte: startOfTomorrow(), lte: endOfTomorrow() },
      },
      include,
      orderBy: { deadline: "asc" },
    }),
    prisma.task.findMany({
      where: {
        ...scope,
        status: { not: "COMPLETED" },
        deadline: { gt: endOfTomorrow() },
      },
      include,
      orderBy: { deadline: "asc" },
      take: 8,
    }),
  ]);

  return { today, tomorrow, upcoming };
}

export async function getEmployeeDashboard(user: AuthUser) {
  const include = taskInclude;
  const month = monthRange(new Date().getFullYear(), new Date().getMonth() + 1);
  const where = { assignedToId: user.id };

  const [stats, today, upcoming, review, revision, completed] = await Promise.all([
    getDashboardStats(user),
    prisma.task.findMany({
      where: {
        ...where,
        status: { not: "COMPLETED" },
        deadline: { gte: startOfToday(), lte: endOfToday() },
      },
      include,
      orderBy: { deadline: "asc" },
    }),
    prisma.task.findMany({
      where: {
        ...where,
        status: { not: "COMPLETED" },
        OR: [{ deadline: { gt: endOfToday() } }, { deadline: null }],
      },
      include,
      orderBy: { deadline: "asc" },
      take: 8,
    }),
    prisma.task.findMany({
      where: { ...where, status: "READY_FOR_REVIEW" },
      include,
    }),
    prisma.task.findMany({
      where: { ...where, status: "REVISION_REQUIRED" },
      include,
    }),
    prisma.task.findMany({
      where: {
        ...where,
        status: "COMPLETED",
        completedAt: { gte: month.start },
      },
      include,
      orderBy: { completedAt: "desc" },
      take: 6,
    }),
  ]);

  return { stats, today, upcoming, review, revision, completed };
}

export async function getDashboardExtras(user: AuthUser) {
  const projectWhere = await projectScope(user);
  const scope = await taskScope(user);

  const [projects, activities] = await Promise.all([
    prisma.project.findMany({
      where: { ...projectWhere, status: { in: ["NOT_STARTED", "IN_PROGRESS"] } },
      select: {
        id: true,
        name: true,
        status: true,
        deadline: true,
        client: { select: { id: true, name: true } },
        members: {
          select: {
            id: true,
            user: { select: { name: true, avatarUrl: true } },
          },
        },
        tasks: { select: { status: true } },
      },
      orderBy: { deadline: "asc" },
      take: 4,
    }),
    prisma.taskActivity.findMany({
      where: { task: scope },
      select: {
        id: true,
        message: true,
        createdAt: true,
        user: { select: { name: true, avatarUrl: true } },
        task: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  return {
    projects: projects.map((project) => ({
      ...project,
      progress: projectProgress(project.tasks),
    })),
    activities,
  };
}

export async function getWorkByClient(user: AuthUser) {
  const scope = await taskScope(user);
  const upcomingFrom = startOfTomorrow();
  const tasks = await prisma.task.findMany({
    where: scope,
    select: {
      status: true,
      deadline: true,
      project: { select: { client: { select: { id: true, name: true } } } },
    },
  });

  const map = new Map<
    string,
    { id: string; name: string; assigned: number; done: number; left: number; next: number }
  >();

  for (const task of tasks) {
    const client = task.project.client;
    const row = map.get(client.id) ?? {
      id: client.id,
      name: client.name,
      assigned: 0,
      done: 0,
      left: 0,
      next: 0,
    };
    row.assigned += 1;
    if (task.status === "COMPLETED") {
      row.done += 1;
    } else {
      row.left += 1;
      if (task.deadline && task.deadline >= upcomingFrom) row.next += 1;
    }
    map.set(client.id, row);
  }

  return [...map.values()].sort((a, b) => b.assigned - a.assigned).slice(0, 6);
}

export type InsightPerson = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

export type DashboardInsights = {
  pipeline: {
    key: TaskStatus;
    label: string;
    count: number;
    people: InsightPerson[];
  }[];
  priorities: {
    key: "HIGH" | "MEDIUM" | "LOW";
    label: string;
    count: number;
    overdue: number;
    people: InsightPerson[];
  }[];
  clients: {
    id: string;
    name: string;
    assigned: number;
    done: number;
    left: number;
    people: InsightPerson[];
  }[];
};

const PIPELINE_ORDER: TaskStatus[] = [
  "PENDING",
  "IN_PROGRESS",
  "READY_FOR_REVIEW",
  "REVISION_REQUIRED",
  "COMPLETED",
];

function pushPerson(
  map: Map<string, InsightPerson>,
  person: { id: string; name: string; avatarUrl: string | null },
  limit = 4,
) {
  if (map.has(person.id) || map.size >= limit) return;
  map.set(person.id, {
    id: person.id,
    name: person.name,
    avatarUrl: person.avatarUrl,
  });
}

export async function getDashboardInsights(user: AuthUser): Promise<DashboardInsights> {
  const scope = await taskScope(user);
  const today = startOfToday();

  const tasks = await prisma.task.findMany({
    where: scope,
    select: {
      status: true,
      priority: true,
      deadline: true,
      project: { select: { client: { select: { id: true, name: true } } } },
      assignedTo: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  const statusPeople = new Map<TaskStatus, Map<string, InsightPerson>>();
  const statusCounts = new Map<TaskStatus, number>();
  for (const key of PIPELINE_ORDER) {
    statusPeople.set(key, new Map());
    statusCounts.set(key, 0);
  }

  const priorityPeople = {
    HIGH: new Map<string, InsightPerson>(),
    MEDIUM: new Map<string, InsightPerson>(),
    LOW: new Map<string, InsightPerson>(),
  };
  const priorityCounts = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  const priorityOverdue = { HIGH: 0, MEDIUM: 0, LOW: 0 };

  const clientMap = new Map<
    string,
    {
      id: string;
      name: string;
      assigned: number;
      done: number;
      left: number;
      people: Map<string, InsightPerson>;
    }
  >();

  for (const task of tasks) {
    if (PIPELINE_ORDER.includes(task.status)) {
      statusCounts.set(task.status, (statusCounts.get(task.status) ?? 0) + 1);
      pushPerson(statusPeople.get(task.status)!, task.assignedTo);
    }

    if (task.status !== "COMPLETED") {
      priorityCounts[task.priority] += 1;
      pushPerson(priorityPeople[task.priority], task.assignedTo);
      if (task.deadline && task.deadline < today) {
        priorityOverdue[task.priority] += 1;
      }
    }

    const client = task.project.client;
    let row = clientMap.get(client.id);
    if (!row) {
      row = {
        id: client.id,
        name: client.name,
        assigned: 0,
        done: 0,
        left: 0,
        people: new Map(),
      };
      clientMap.set(client.id, row);
    }
    row.assigned += 1;
    if (task.status === "COMPLETED") row.done += 1;
    else {
      row.left += 1;
      pushPerson(row.people, task.assignedTo);
    }
  }

  const labels: Record<TaskStatus, string> = {
    PENDING: "Pending",
    IN_PROGRESS: "In progress",
    READY_FOR_REVIEW: "Review",
    REVISION_REQUIRED: "Revision",
    COMPLETED: "Completed",
    ON_HOLD: "On hold",
  };

  return {
    pipeline: PIPELINE_ORDER.map((key) => ({
      key,
      label: labels[key],
      count: statusCounts.get(key) ?? 0,
      people: [...(statusPeople.get(key)?.values() ?? [])],
    })),
    priorities: (
      [
        { key: "HIGH" as const, label: "High" },
        { key: "MEDIUM" as const, label: "Medium" },
        { key: "LOW" as const, label: "Low" },
      ] as const
    ).map((item) => ({
      key: item.key,
      label: item.label,
      count: priorityCounts[item.key],
      overdue: priorityOverdue[item.key],
      people: [...priorityPeople[item.key].values()],
    })),
    clients: [...clientMap.values()]
      .sort((a, b) => b.assigned - a.assigned)
      .slice(0, 5)
      .map((row) => ({
        id: row.id,
        name: row.name,
        assigned: row.assigned,
        done: row.done,
        left: row.left,
        people: [...row.people.values()],
      })),
  };
}

export async function getProjectStatusChart(user: AuthUser) {
  const [projectWhere, taskWhere] = await Promise.all([projectScope(user), taskScope(user)]);
  const today = startOfToday();
  const from = addDays(today, -13);
  const to = endOfToday();

  const [projects, tasks] = await Promise.all([
    prisma.project.findMany({
      where: projectWhere,
      select: { id: true, name: true, status: true },
    }),
    prisma.task.findMany({
      where: {
        ...taskWhere,
        OR: [
          { deadline: { gte: from, lte: to } },
          { completedAt: { gte: from, lte: to } },
          { createdAt: { gte: from, lte: to } },
        ],
      },
      select: {
        id: true,
        title: true,
        status: true,
        deadline: true,
        completedAt: true,
        createdAt: true,
        project: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { deadline: "asc" },
    }),
  ]);

  const status = {
    notStarted: projects.filter((project) => project.status === "NOT_STARTED").length,
    inProgress: projects.filter((project) => project.status === "IN_PROGRESS").length,
    onHold: projects.filter((project) => project.status === "ON_HOLD").length,
    completed: projects.filter((project) => project.status === "COMPLETED").length,
  };

  const days = Array.from({ length: 14 }, (_, index) => {
    const date = addDays(from, index);
    const dayKey = format(date, "yyyy-MM-dd");

    // Completed tasks belong to the day they were finished.
    const completedTasks = tasks.filter(
      (task) =>
        task.status === "COMPLETED" &&
        task.completedAt != null &&
        format(task.completedAt, "yyyy-MM-dd") === dayKey,
    );

    // Open tasks belong to the day of their deadline (or created date if none).
    const openTasks = tasks.filter((task) => {
      if (task.status === "COMPLETED") return false;
      const stamp = task.deadline ?? task.createdAt;
      return format(stamp, "yyyy-MM-dd") === dayKey;
    });

    const dayTasks = [...completedTasks, ...openTasks];
    const completed = completedTasks.length;
    const open = openTasks.length;
    const peopleMap = new Map<string, { id: string; name: string; avatarUrl: string | null; done: boolean }>();
    for (const task of dayTasks) {
      const person = task.assignedTo;
      const existing = peopleMap.get(person.id);
      const done = task.status === "COMPLETED";
      if (!existing) {
        peopleMap.set(person.id, {
          id: person.id,
          name: person.name,
          avatarUrl: person.avatarUrl,
          done,
        });
      } else if (done) {
        existing.done = true;
      }
    }
    const people = [...peopleMap.values()].sort((a, b) => Number(b.done) - Number(a.done));
    return {
      key: dayKey,
      label: format(date, "MMM d"),
      dateLabel: format(date, "EEE, MMM d yyyy"),
      completed,
      open,
      total: dayTasks.length,
      people,
      tasks: dayTasks.slice(0, 6).map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        project: task.project.name,
        assignee: {
          id: task.assignedTo.id,
          name: task.assignedTo.name,
          avatarUrl: task.assignedTo.avatarUrl,
        },
      })),
    };
  });

  return { status, days, projectCount: projects.length };
}
