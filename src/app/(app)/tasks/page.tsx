import { prisma } from "@/lib/prisma";
import { isStaff, requireUser } from "@/lib/permissions";
import { taskInclude, taskScope } from "@/server/queries";
import { TasksWorkspace } from "./tasks-workspace";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const scope = await taskScope(user);

  const [tasks, projects, clients, employees] = await Promise.all([
    prisma.task.findMany({
      where: scope,
      include: taskInclude,
      orderBy: [{ deadline: "asc" }, { createdAt: "desc" }],
    }),
    prisma.project.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.user.findMany({
      where: { status: "ACTIVE", role: { not: "ADMIN" } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]).catch((error) => {
    console.error("tasks.page", error);
    return [[], [], [], []];
  });

  return (
    <TasksWorkspace
      tasks={tasks}
      projects={projects}
      clients={clients}
      employees={employees}
      canCreate={isStaff(user.role)}
      openCreate={params.new === "1" && isStaff(user.role)}
    />
  );
}
