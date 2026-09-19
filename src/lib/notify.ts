import type { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function notify(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  taskId?: string;
  projectId?: string;
  href?: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { notifyInApp: true, status: true },
  });
  if (!user || !user.notifyInApp || user.status !== "ACTIVE") return;

  await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      taskId: input.taskId,
      projectId: input.projectId,
      href: input.href,
    },
  });
}

export async function logActivity(
  taskId: string,
  message: string,
  userId?: string,
) {
  await prisma.taskActivity.create({
    data: { taskId, message, userId },
  });
}
