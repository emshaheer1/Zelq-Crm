import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/permissions";
import { monthRange, startOfToday } from "@/lib/dates";
import { EmployeesWorkspace } from "./employees-workspace";

type TaskSlice = {
  id: string;
  status: string;
  completedAt: Date | null;
  deadline: Date | null;
};

function tasksForWorkload(
  role: string,
  assignedTasks: TaskSlice[],
  createdTasks: TaskSlice[],
) {
  if (role === "MANAGER" || role === "ADMIN") {
    const map = new Map(createdTasks.map((task) => [task.id, task]));
    for (const task of assignedTasks) map.set(task.id, task);
    return [...map.values()];
  }
  return assignedTasks;
}

export default async function EmployeesPage() {
  const user = await requireStaff();
  const month = monthRange(new Date().getFullYear(), new Date().getMonth() + 1);
  const employees = await prisma.user.findMany({
    orderBy: { name: "asc" },
    include: {
      assignedTasks: { select: { id: true, status: true, completedAt: true, deadline: true } },
      createdTasks: { select: { id: true, status: true, completedAt: true, deadline: true } },
    },
  });

  return (
    <EmployeesWorkspace
      canCreate={user.role === "ADMIN"}
      employees={employees.map((employee) => {
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
          overdue: tasks.filter(
            (task) =>
              task.status !== "COMPLETED" &&
              task.deadline &&
              task.deadline < startOfToday(),
          ).length,
        };
      })}
    />
  );
}
