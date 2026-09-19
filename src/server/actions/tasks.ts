"use server";

import { revalidatePath } from "next/cache";
import { TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireDriveUrl } from "@/lib/drive";
import { logActivity, notify } from "@/lib/notify";
import { assertStaff, canAccessTask, requireUser } from "@/lib/permissions";
import { taskSchema } from "@/lib/validations";
import { taskStatusLabel } from "@/lib/labels";

function revalidateTask(id: string) {
  revalidatePath("/tasks");
  revalidatePath(`/tasks/${id}`);
  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath("/calendar");
  revalidatePath("/reports");
  revalidatePath("/employees");
}

export async function createTask(input: unknown) {
  const user = await requireUser();
  assertStaff(user);

  const data = taskSchema.parse(input);
  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description || null,
      projectId: data.projectId,
      assignedToId: data.assignedToId,
      assignedById: user.id,
      priority: data.priority,
      status: data.status === "COMPLETED" ? "PENDING" : data.status,
      startDate: data.startDate ? new Date(data.startDate) : null,
      deadline: data.deadline ? new Date(data.deadline) : null,
      referenceUrl: data.referenceUrl || null,
      notes: data.notes || null,
    },
    include: { assignedTo: true },
  });

  await logActivity(
    task.id,
    `${user.name} assigned task to ${task.assignedTo.name}.`,
    user.id,
  );
  await notify({
    userId: task.assignedToId,
    type: "TASK_ASSIGNED",
    title: "New task assigned to you.",
    body: task.title,
    taskId: task.id,
    href: `/tasks/${task.id}`,
  });

  revalidateTask(task.id);
  return { id: task.id };
}

export async function updateTask(id: string, input: unknown) {
  const user = await requireUser();
  assertStaff(user);
  const data = taskSchema.parse(input);
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) throw new Error("Task not found.");

  const assignedChanged = existing.assignedToId !== data.assignedToId;
  const task = await prisma.task.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description || null,
      projectId: data.projectId,
      assignedToId: data.assignedToId,
      priority: data.priority,
      startDate: data.startDate ? new Date(data.startDate) : null,
      deadline: data.deadline ? new Date(data.deadline) : null,
      referenceUrl: data.referenceUrl || null,
      notes: data.notes || null,
    },
    include: { assignedTo: true },
  });

  if (assignedChanged) {
    await logActivity(
      id,
      `${user.name} reassigned the task to ${task.assignedTo.name}.`,
      user.id,
    );
    await notify({
      userId: task.assignedToId,
      type: "TASK_ASSIGNED",
      title: "A task was reassigned to you.",
      body: task.title,
      taskId: task.id,
      href: `/tasks/${task.id}`,
    });
  }

  revalidateTask(id);
}

export async function deleteTask(id: string) {
  const user = await requireUser();
  assertStaff(user);
  await prisma.task.delete({ where: { id } });
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function startTask(id: string) {
  const user = await requireUser();
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) throw new Error("Task not found.");
  if (!canAccessTask(user, task.assignedToId)) {
    throw new Error("You cannot update this task.");
  }
  if (task.status !== "PENDING" && task.status !== "ON_HOLD") {
    throw new Error("This task cannot be started from its current status.");
  }

  await prisma.task.update({
    where: { id },
    data: { status: "IN_PROGRESS" },
  });
  await logActivity(id, `${user.name} changed status to In Progress.`, user.id);
  revalidateTask(id);
}

export async function setTaskOnHold(id: string) {
  const user = await requireUser();
  assertStaff(user);
  await prisma.task.update({
    where: { id },
    data: { status: "ON_HOLD" },
  });
  await logActivity(id, `${user.name} placed the task on hold.`, user.id);
  revalidateTask(id);
}

export async function updateDriveInfo(
  id: string,
  input: { uploaded: boolean; url?: string; note?: string },
) {
  const user = await requireUser();
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) throw new Error("Task not found.");
  if (!canAccessTask(user, task.assignedToId)) {
    throw new Error("You cannot update this task.");
  }

  if (input.uploaded) {
    if (!input.url) throw new Error("Google Drive link is required.");
    requireDriveUrl(input.url);
  }

  await prisma.task.update({
    where: { id },
    data: {
      driveUploaded: input.uploaded,
      driveUrl: input.uploaded ? input.url : null,
      driveNote: input.note || null,
      driveUploadedAt: input.uploaded ? new Date() : null,
      driveUploadedById: input.uploaded ? user.id : null,
    },
  });

  if (input.uploaded) {
    await logActivity(id, `${user.name} added a Google Drive link.`, user.id);
  }

  revalidateTask(id);
}

export async function submitForReview(id: string) {
  const user = await requireUser();
  const task = await prisma.task.findUnique({
    where: { id },
    include: { project: { include: { manager: true } } },
  });
  if (!task) throw new Error("Task not found.");
  if (!canAccessTask(user, task.assignedToId)) {
    throw new Error("You cannot submit this task.");
  }
  if (!task.driveUploaded || !task.driveUrl) {
    throw new Error("Upload the work to Google Drive and add the link first.");
  }
  if (
    task.status !== "IN_PROGRESS" &&
    task.status !== "REVISION_REQUIRED" &&
    task.status !== "PENDING"
  ) {
    throw new Error("This task is not ready to submit.");
  }

  await prisma.task.update({
    where: { id },
    data: { status: TaskStatus.READY_FOR_REVIEW },
  });
  await logActivity(id, `${user.name} submitted work for review.`, user.id);
  await notify({
    userId: task.project.managerId,
    type: "REVIEW_SUBMITTED",
    title: "Employee submitted work for review.",
    body: `${user.name} submitted ${task.title}.`,
    taskId: task.id,
    href: `/tasks/${task.id}`,
  });
  revalidateTask(id);
}

export async function approveTask(id: string, notes?: string) {
  const user = await requireUser();
  assertStaff(user);
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) throw new Error("Task not found.");

  await prisma.$transaction([
    prisma.task.update({
      where: { id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    }),
    prisma.taskReview.create({
      data: {
        taskId: id,
        reviewerId: user.id,
        action: "APPROVE",
        notes: notes || null,
      },
    }),
  ]);

  await logActivity(id, `${user.name} approved the task.`, user.id);
  await notify({
    userId: task.assignedToId,
    type: "TASK_APPROVED",
    title: "Task has been approved.",
    body: task.title,
    taskId: task.id,
    href: `/tasks/${task.id}`,
  });
  revalidateTask(id);
}

export async function requestRevision(id: string, notes: string) {
  const user = await requireUser();
  assertStaff(user);
  if (!notes.trim()) throw new Error("Add revision instructions.");

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) throw new Error("Task not found.");

  await prisma.$transaction([
    prisma.task.update({
      where: { id },
      data: { status: "REVISION_REQUIRED" },
    }),
    prisma.taskReview.create({
      data: {
        taskId: id,
        reviewerId: user.id,
        action: "REQUEST_REVISION",
        notes,
      },
    }),
  ]);

  await logActivity(id, `${user.name} requested revision.`, user.id);
  await notify({
    userId: task.assignedToId,
    type: "REVISION_REQUESTED",
    title: "Manager requested revision.",
    body: notes,
    taskId: task.id,
    href: `/tasks/${task.id}`,
  });
  revalidateTask(id);
}

export async function addTaskComment(id: string, body: string) {
  const user = await requireUser();
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) throw new Error("Task not found.");
  if (!canAccessTask(user, task.assignedToId)) {
    throw new Error("You cannot comment on this task.");
  }
  if (!body.trim()) throw new Error("Comment cannot be empty.");

  await prisma.taskComment.create({
    data: { taskId: id, userId: user.id, body: body.trim() },
  });
  revalidateTask(id);
}

export async function changeTaskPriority(id: string, priority: "HIGH" | "MEDIUM" | "LOW") {
  const user = await requireUser();
  assertStaff(user);
  await prisma.task.update({ where: { id }, data: { priority } });
  await logActivity(id, `${user.name} changed priority to ${priority.toLowerCase()}.`, user.id);
  revalidateTask(id);
}

export { taskStatusLabel };
