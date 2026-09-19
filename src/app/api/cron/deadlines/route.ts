import { NextResponse } from "next/server";
import { addDays, startOfDay, endOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";

export async function GET(request: Request) {
  const secret = request.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tomorrowStart = startOfDay(addDays(new Date(), 1));
  const tomorrowEnd = endOfDay(addDays(new Date(), 1));
  const today = startOfDay(new Date());
  const soon = endOfDay(addDays(new Date(), 3));

  const [dueTomorrow, overdue, projects] = await Promise.all([
    prisma.task.findMany({
      where: {
        status: { not: "COMPLETED" },
        deadline: { gte: tomorrowStart, lte: tomorrowEnd },
      },
    }),
    prisma.task.findMany({
      where: {
        status: { not: "COMPLETED" },
        deadline: { lt: today },
      },
    }),
    prisma.project.findMany({
      where: {
        status: { not: "COMPLETED" },
        deadline: { gte: today, lte: soon },
      },
      include: { members: true, manager: true },
    }),
  ]);

  for (const task of dueTomorrow) {
    await notify({
      userId: task.assignedToId,
      type: "DEADLINE_TOMORROW",
      title: "Task deadline is tomorrow.",
      body: task.title,
      taskId: task.id,
      href: `/tasks/${task.id}`,
    });
  }

  for (const task of overdue) {
    await notify({
      userId: task.assignedToId,
      type: "TASK_OVERDUE",
      title: "Task is overdue.",
      body: task.title,
      taskId: task.id,
      href: `/tasks/${task.id}`,
    });
  }

  for (const project of projects) {
    const recipientIds = [
      project.managerId,
      ...project.members.map((member) => member.userId),
    ];
    for (const userId of new Set(recipientIds)) {
      await notify({
        userId,
        type: "PROJECT_DEADLINE_APPROACHING",
        title: "Project deadline is approaching.",
        body: project.name,
        projectId: project.id,
        href: `/projects/${project.id}`,
      });
    }
  }

  return NextResponse.json({
    dueTomorrow: dueTomorrow.length,
    overdue: overdue.length,
    projects: projects.length,
  });
}
