import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requireApiStaff } from "@/lib/api-guard";
import { monthRange, startOfToday } from "@/lib/dates";

type TaskSlice = {
  id: string;
  status: string;
  completedAt: Date | null;
  deadline: Date | null;
};

function tasksForWorkload(role: string, assignedTasks: TaskSlice[], createdTasks: TaskSlice[]) {
  if (role === "MANAGER" || role === "ADMIN") {
    const map = new Map(createdTasks.map((task) => [task.id, task]));
    for (const task of assignedTasks) map.set(task.id, task);
    return [...map.values()];
  }
  return assignedTasks;
}

export async function GET() {
  try {
    const auth = await requireApiStaff();
    if ("error" in auth) return auth.error;
    const month = monthRange(new Date().getFullYear(), new Date().getMonth() + 1);
    const today = startOfToday();
    const taskWhere = {
      OR: [{ status: { not: "COMPLETED" as const } }, { completedAt: { gte: month.start, lte: month.end } }],
    };

    const rows = await prisma.user.findMany({
      orderBy: { name: "asc" },
      take: 200,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        designation: true,
        avatarUrl: true,
        status: true,
        assignedTasks: {
          where: taskWhere,
          select: { id: true, status: true, completedAt: true, deadline: true },
        },
        createdTasks: {
          where: taskWhere,
          select: { id: true, status: true, completedAt: true, deadline: true },
        },
      },
    });

    const employees = rows.map((employee) => {
      const tasks = tasksForWorkload(employee.role, employee.assignedTasks, employee.createdTasks);
      return {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        designation: employee.designation,
        avatarUrl: employee.avatarUrl,
        status: employee.status,
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
        overdue: tasks.filter((task) => task.status !== "COMPLETED" && task.deadline && task.deadline < today)
          .length,
      };
    });

    return NextResponse.json(
      { employees, canCreate: auth.user.role === "ADMIN" },
      { headers: { "Cache-Control": "private, max-age=5" } },
    );
  } catch (error) {
    console.error("GET /api/boot/employees", error);
    return jsonError("Could not load employees.", 500);
  }
}
