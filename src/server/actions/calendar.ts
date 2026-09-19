"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertStaff, requireUser } from "@/lib/permissions";
import { eventSchema } from "@/lib/validations";

export async function createCalendarEvent(input: unknown) {
  const user = await requireUser();
  assertStaff(user);
  const data = eventSchema.parse(input);

  const event = await prisma.calendarEvent.create({
    data: {
      title: data.title,
      type: data.type,
      date: new Date(data.date),
      time: data.time || null,
      projectId: data.projectId || null,
      clientId: data.clientId || null,
      description: data.description || null,
      priority: data.priority,
      createdById: user.id,
      assignees: {
        create: data.assigneeIds.map((userId) => ({ userId })),
      },
    },
  });

  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  return { id: event.id };
}

export async function updateCalendarEvent(id: string, input: unknown) {
  const user = await requireUser();
  assertStaff(user);
  const data = eventSchema.parse(input);

  await prisma.$transaction([
    prisma.calendarEventAssignee.deleteMany({ where: { eventId: id } }),
    prisma.calendarEvent.update({
      where: { id },
      data: {
        title: data.title,
        type: data.type,
        date: new Date(data.date),
        time: data.time || null,
        projectId: data.projectId || null,
        clientId: data.clientId || null,
        description: data.description || null,
        priority: data.priority,
        assignees: {
          create: data.assigneeIds.map((userId) => ({ userId })),
        },
      },
    }),
  ]);

  revalidatePath("/calendar");
}

export async function deleteCalendarEvent(id: string) {
  const user = await requireUser();
  assertStaff(user);
  await prisma.calendarEvent.delete({ where: { id } });
  revalidatePath("/calendar");
}
