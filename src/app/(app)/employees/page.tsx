import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/permissions";
import { monthRange, startOfToday } from "@/lib/dates";
import { EmployeesWorkspace } from "./employees-workspace";

export default async function EmployeesPage() {
  const user = await requireStaff();
  const month = monthRange(new Date().getFullYear(), new Date().getMonth() + 1);
  const employees = await prisma.user.findMany({
    orderBy: { name: "asc" },
    include: { assignedTasks: true },
  });

  return (
    <EmployeesWorkspace
      canCreate={user.role === "ADMIN"}
      employees={employees.map((employee) => ({
        id: employee.id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        designation: employee.designation,
        avatarUrl: employee.avatarUrl,
        status: employee.status,
        active: employee.assignedTasks.filter((task) =>
          ["IN_PROGRESS", "READY_FOR_REVIEW", "REVISION_REQUIRED"].includes(task.status),
        ).length,
        pending: employee.assignedTasks.filter((task) => task.status === "PENDING").length,
        completed: employee.assignedTasks.filter(
          (task) =>
            task.status === "COMPLETED" &&
            task.completedAt &&
            task.completedAt >= month.start &&
            task.completedAt <= month.end,
        ).length,
        overdue: employee.assignedTasks.filter(
          (task) =>
            task.status !== "COMPLETED" &&
            task.deadline &&
            task.deadline < startOfToday(),
        ).length,
      }))}
    />
  );
}
