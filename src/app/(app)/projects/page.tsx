import { prisma } from "@/lib/prisma";
import { isStaff, requireUser } from "@/lib/permissions";
import { projectProgress, projectScope } from "@/server/queries";
import { ProjectsWorkspace } from "./projects-workspace";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const scope = await projectScope(user);

  const [projects, clients, managers, employees] = await Promise.all([
    prisma.project.findMany({
      where: scope,
      select: {
        id: true,
        name: true,
        clientId: true,
        managerId: true,
        status: true,
        priority: true,
        deadline: true,
        client: { select: { id: true, name: true, companyName: true } },
        members: {
          select: {
            id: true,
            userId: true,
            user: { select: { name: true, avatarUrl: true } },
          },
        },
        tasks: { select: { status: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.user.findMany({
      where: { status: "ACTIVE", role: { in: ["ADMIN", "MANAGER"] } },
      select: { id: true, name: true },
    }),
    prisma.user.findMany({
      where: { status: "ACTIVE", role: { not: "ADMIN" } },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <ProjectsWorkspace
      projects={projects.map((project) => ({
        ...project,
        progress: projectProgress(project.tasks),
      }))}
      clients={clients}
      managers={managers}
      employees={employees}
      canCreate={isStaff(user.role)}
      openCreate={params.new === "1" && isStaff(user.role)}
    />
  );
}
