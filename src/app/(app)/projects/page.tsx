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
  const canCreate = isStaff(user.role);

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
    canCreate
      ? prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })
      : Promise.resolve([] as { id: string; name: string }[]),
    canCreate
      ? prisma.user.findMany({
          where: { status: "ACTIVE", role: { in: ["ADMIN", "MANAGER"] } },
          select: { id: true, name: true },
        })
      : Promise.resolve([] as { id: string; name: string }[]),
    canCreate
      ? prisma.user.findMany({
          where: { status: "ACTIVE", role: { not: "ADMIN" } },
          select: { id: true, name: true },
        })
      : Promise.resolve([] as { id: string; name: string }[]),
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
      canCreate={canCreate}
      openCreate={params.new === "1" && canCreate}
    />
  );
}
