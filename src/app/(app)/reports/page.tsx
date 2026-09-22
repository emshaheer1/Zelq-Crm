import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/permissions";
import { monthRange, startOfToday } from "@/lib/dates";
import { projectProgress } from "@/server/queries";
import { ReportsWorkspace } from "./reports-workspace";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ employee?: string; month?: string; year?: string; project?: string }>;
}) {
  await requireStaff();
  const query = await searchParams;
  const now = new Date();
  const year = Number(query.year) || now.getFullYear();
  const month = Number(query.month) || now.getMonth() + 1;
  const range = monthRange(year, month);

  const [employees, projects, monthTasks, allProjects] = await Promise.all([
    prisma.user.findMany({
      where: { role: { not: "ADMIN" } },
      orderBy: { name: "asc" },
    }),
    prisma.project.findMany({
      include: {
        client: true,
        manager: true,
        members: { include: { user: true } },
        tasks: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.task.findMany({
      where: {
        OR: [
          { createdAt: { gte: range.start, lte: range.end } },
          { completedAt: { gte: range.start, lte: range.end } },
          { deadline: { gte: range.start, lte: range.end } },
        ],
      },
      include: { project: true, assignedTo: true },
    }),
    prisma.project.findMany({ include: { tasks: true } }),
  ]);

  const selectedEmployee = employees.find((employee) => employee.id === query.employee) ?? employees[0];
  const selectedProject = projects.find((project) => project.id === query.project) ?? projects[0];
  const employeeTasks = monthTasks.filter((task) => {
    if (!selectedEmployee) return false;
    if (selectedEmployee.role === "MANAGER" || selectedEmployee.role === "ADMIN") {
      return task.assignedById === selectedEmployee.id || task.assignedToId === selectedEmployee.id;
    }
    return task.assignedToId === selectedEmployee.id;
  });
  const companyCompleted = monthTasks.filter((task) => task.status === "COMPLETED").length;
  const companyPending = monthTasks.filter((task) => task.status !== "COMPLETED").length;
  const companyOverdue = monthTasks.filter(
    (task) => task.status !== "COMPLETED" && task.deadline && task.deadline < startOfToday(),
  ).length;

  const companyEmployees = employees.map((employee) => {
    const tasks = monthTasks.filter((task) => {
      if (employee.role === "MANAGER" || employee.role === "ADMIN") {
        return task.assignedById === employee.id || task.assignedToId === employee.id;
      }
      return task.assignedToId === employee.id;
    });
    return {
      id: employee.id,
      name: employee.name,
      completed: tasks.filter((task) => task.status === "COMPLETED").length,
      assigned: tasks.length,
    };
  });

  return (
    <ReportsWorkspace
      year={year}
      month={month}
      employees={employees.map((employee) => ({ id: employee.id, name: employee.name }))}
      projects={projects.map((project) => ({ id: project.id, name: project.name }))}
      selectedEmployeeId={selectedEmployee?.id ?? ""}
      selectedProjectId={selectedProject?.id ?? ""}
      employeeReport={
        selectedEmployee
          ? {
              name: selectedEmployee.name,
              assigned: employeeTasks.length,
              completed: employeeTasks.filter((task) => task.status === "COMPLETED").length,
              pending: employeeTasks.filter((task) => task.status !== "COMPLETED").length,
              overdue: employeeTasks.filter(
                (task) => task.status !== "COMPLETED" && task.deadline && task.deadline < startOfToday(),
              ).length,
              projects: new Set(employeeTasks.map((task) => task.projectId)).size,
              completion:
                employeeTasks.length === 0
                  ? 0
                  : Math.round(
                      (employeeTasks.filter((task) => task.status === "COMPLETED").length /
                        employeeTasks.length) *
                        100,
                    ),
              tasks: employeeTasks.map((task) => ({
                id: task.id,
                title: task.title,
                project: task.project.name,
                status: task.status,
              })),
            }
          : null
      }
      projectReport={
        selectedProject
          ? {
              name: selectedProject.name,
              progress: projectProgress(selectedProject.tasks),
              total: selectedProject.tasks.length,
              completed: selectedProject.tasks.filter((task) => task.status === "COMPLETED").length,
              pending: selectedProject.tasks.filter((task) =>
                ["PENDING", "IN_PROGRESS", "ON_HOLD"].includes(task.status),
              ).length,
              revision: selectedProject.tasks.filter((task) => task.status === "REVISION_REQUIRED").length,
              overdue: selectedProject.tasks.filter(
                (task) => task.status !== "COMPLETED" && task.deadline && task.deadline < startOfToday(),
              ).length,
              team: selectedProject.members.map((member) => member.user.name),
            }
          : null
      }
      companyReport={{
        total: monthTasks.length,
        completed: companyCompleted,
        pending: companyPending,
        overdue: companyOverdue,
        activeProjects: allProjects.filter((project) =>
          ["NOT_STARTED", "IN_PROGRESS"].includes(project.status),
        ).length,
        completedProjects: allProjects.filter((project) => project.status === "COMPLETED").length,
        employees: companyEmployees,
      }}
    />
  );
}
