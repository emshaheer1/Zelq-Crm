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
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: true,
      manager: true,
      members: { include: { user: true } },
      tasks: {
        include: { project: true, assignedTo: true },
        orderBy: { deadline: "asc" },
      },
    },
  });

  if (!project) notFound();
  if (
    !canAccessProject(user, {
      managerId: project.managerId,
      memberIds: project.members.map((member) => member.userId),
    })
  ) {
    notFound();
  }

  const activities = await prisma.taskActivity.findMany({
    where: { task: { projectId: id } },
    select: {
      id: true,
      message: true,
      createdAt: true,
      user: { select: { name: true, avatarUrl: true } },
      task: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

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
