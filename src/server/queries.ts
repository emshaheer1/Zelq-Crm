import { addDays } from "date-fns";
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
      designation: true,
      avatarUrl: true,
      assignedTasks: { select: { status: true, completedAt: true, deadline: true } },
    },
  });

  const month = monthRange(new Date().getFullYear(), new Date().getMonth() + 1);

  return users.map((user) => {
    const tasks = user.assignedTasks;
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
