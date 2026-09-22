import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { canAccessProject, isStaff, requireUser } from "@/lib/permissions";
import { projectProgress } from "@/server/queries";
import { ProjectDetailView } from "./project-detail-view";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const [project, activities] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        clientId: true,
        managerId: true,
        startDate: true,
        deadline: true,
        priority: true,
        status: true,
        driveFolderUrl: true,
        notes: true,
        client: { select: { id: true, name: true, companyName: true } },
        manager: { select: { id: true, name: true, avatarUrl: true } },
        members: {
          select: {
            id: true,
            userId: true,
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            deadline: true,
            driveUploaded: true,
            project: { select: { name: true } },
            assignedTo: { select: { name: true, avatarUrl: true } },
          },
          orderBy: { deadline: "asc" },
        },
      },
    }),
    prisma.taskActivity.findMany({
      where: { task: { projectId: id } },
      select: {
        id: true,
        message: true,
        createdAt: true,
        user: { select: { name: true, avatarUrl: true } },
        task: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
  ]);

  if (!project) notFound();
  if (
    !canAccessProject(user, {
      managerId: project.managerId,
      memberIds: project.members.map((member) => member.userId),
    })
  ) {
    notFound();
  }

  const progress = projectProgress(project.tasks);
  const completed = project.tasks.filter((task) => task.status === "COMPLETED").length;

  return (
    <ProjectDetailView
      project={project}
      progress={progress}
      completed={completed}
      activities={activities}
      canManage={isStaff(user.role)}
    />
  );
}
