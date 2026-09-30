import { prisma } from "@/lib/prisma";
import { isStaff, requireUser } from "@/lib/permissions";
import { projectScope, taskScope } from "@/server/queries";
import { CalendarWorkspace } from "./calendar-workspace";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const staff = isStaff(user.role);
  const [projectWhere, taskWhere] = await Promise.all([projectScope(user), taskScope(user)]);

  const [projects, tasks] = await Promise.all([
    prisma.project.findMany({
      where: projectWhere,
      select: {
        id: true,
        name: true,
        status: true,
        deadline: true,
        client: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.task.findMany({
      where: {
        AND: [
          taskWhere,
          {
            OR: [{ deadline: { not: null } }, { startDate: { not: null } }],
          },
        ],
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        startDate: true,
        deadline: true,
        projectId: true,
        assignedTo: { select: { id: true, name: true, avatarUrl: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: [{ deadline: "asc" }, { startDate: "asc" }],
    }),
  ]);

  const selectedProjectId =
    params.project && projects.some((project) => project.id === params.project)
      ? params.project
      : projects[0]?.id ?? "";

  return (
    <CalendarWorkspace
      projects={projects}
      tasks={tasks}
      selectedProjectId={selectedProjectId}
      canCreate={staff}
    />
  );
}
