"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/permissions";

export async function getNotifications() {
  const user = await requireUser();
  const [unread, notifications] = await Promise.all([
    prisma.notification.count({ where: { userId: user.id, read: false } }).catch(() => 0),
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        title: true,
        body: true,
        href: true,
        read: true,
        createdAt: true,
      },
    }).catch(() => []),
  ]);
  return { unread, notifications };
}

export async function markNotificationRead(id: string) {
  const user = await requireUser();
  await prisma.notification.updateMany({
    where: { id, userId: user.id },
    data: { read: true },
  });
  revalidatePath("/notifications");
  revalidatePath("/dashboard");
}

export async function markAllNotificationsRead() {
  const user = await requireUser();
  await prisma.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  });
  revalidatePath("/notifications");
  revalidatePath("/dashboard");
}
