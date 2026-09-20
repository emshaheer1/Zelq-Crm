import { NextResponse } from "next/server";
import { TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireDriveUrl } from "@/lib/drive";
import { logActivity, notify } from "@/lib/notify";
import { isStaff, canAccessTask } from "@/lib/permissions";
import { jsonError, requireApiStaff, requireApiUser } from "@/lib/api-guard";

type Body = {
  action?: string;
  uploaded?: boolean;
  url?: string;
  note?: string;
  comment?: string;
  notes?: string;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireApiUser();
    if ("error" in auth) return auth.error;
    const user = auth.user;
    const { id } = await params;
    const body = ((await request.json()) ?? {}) as Body;
    const action = body.action;

    const task = await prisma.task.findUnique({
      where: { id },
      include: { project: true, assignedTo: true },
    });
    if (!task) return jsonError("Task not found.", 404);
    if (!canAccessTask(user, task.assignedToId)) {
      return jsonError("You cannot update this task.", 403);
    }

    if (action === "start") {
      if (!["PENDING", "ON_HOLD", "REVISION_REQUIRED"].includes(task.status)) {
        return jsonError("This task cannot be started from its current status.");
      }
      await prisma.task.update({
        where: { id },
        data: { status: "IN_PROGRESS", updatedAt: new Date() },
      });
      await logActivity(id, `${user.name} changed status to In Progress.`, user.id).catch(() => {});
      return NextResponse.json({ ok: true });
    }

    if (action === "drive") {
      if (body.uploaded) {
        if (!body.url) return jsonError("Google Drive link is required.");
        requireDriveUrl(body.url);
      }
      await prisma.task.update({
        where: { id },
        data: {
          driveUploaded: Boolean(body.uploaded),
          driveUrl: body.uploaded ? body.url : null,
          driveNote: body.note || null,
          driveUploadedAt: body.uploaded ? new Date() : null,
          driveUploadedById: body.uploaded ? user.id : null,
          updatedAt: new Date(),
        },
      });
      if (body.uploaded) {
        await logActivity(id, `${user.name} added a Google Drive link.`, user.id).catch(() => {});
      }
      return NextResponse.json({ ok: true });
    }

    if (action === "submit") {
      if (!task.driveUploaded || !task.driveUrl) {
        return jsonError("Upload the work to Google Drive and add the link first.");
      }
      if (!["IN_PROGRESS", "REVISION_REQUIRED", "PENDING"].includes(task.status)) {
        return jsonError("This task is not ready to submit.");
      }
      await prisma.task.update({
        where: { id },
        data: { status: TaskStatus.READY_FOR_REVIEW, updatedAt: new Date() },
      });
      await logActivity(id, `${user.name} submitted work for review.`, user.id).catch(() => {});
      await notify({
        userId: task.project.managerId,
        type: "REVIEW_SUBMITTED",
        title: "Employee submitted work for review.",
        body: `${user.name} submitted ${task.title}.`,
        taskId: task.id,
        href: `/tasks/${task.id}`,
      }).catch(() => {});
      return NextResponse.json({ ok: true });
    }

    if (action === "comment") {
      const text = (body.comment ?? "").trim();
      if (!text) return jsonError("Comment cannot be empty.");
      await prisma.taskComment.create({
        data: { taskId: id, userId: user.id, body: text },
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "approve" || action === "revision") {
      if (!isStaff(user.role)) return jsonError("You do not have permission to do that.", 403);
      if (action === "revision") {
        const notes = (body.notes ?? "").trim();
        if (!notes) return jsonError("Add revision instructions.");
        await prisma.$transaction([
          prisma.task.update({
            where: { id },
            data: { status: "REVISION_REQUIRED", updatedAt: new Date() },
          }),
          prisma.taskReview.create({
            data: { taskId: id, reviewerId: user.id, action: "REQUEST_REVISION", notes },
          }),
        ]);
        await logActivity(id, `${user.name} requested revision.`, user.id).catch(() => {});
        await notify({
          userId: task.assignedToId,
          type: "REVISION_REQUESTED",
          title: "Manager requested revision.",
          body: notes,
          taskId: task.id,
          href: `/tasks/${task.id}`,
        }).catch(() => {});
        return NextResponse.json({ ok: true });
      }
      await prisma.$transaction([
        prisma.task.update({
          where: { id },
          data: { status: "COMPLETED", completedAt: new Date(), updatedAt: new Date() },
        }),
        prisma.taskReview.create({
          data: {
            taskId: id,
            reviewerId: user.id,
            action: "APPROVE",
            notes: body.notes || null,
          },
        }),
      ]);
      await logActivity(id, `${user.name} approved the task.`, user.id).catch(() => {});
      await notify({
        userId: task.assignedToId,
        type: "TASK_APPROVED",
        title: "Task has been approved.",
        body: task.title,
        taskId: task.id,
        href: `/tasks/${task.id}`,
      }).catch(() => {});
      return NextResponse.json({ ok: true });
    }

    return jsonError("Unknown action.");
  } catch (error) {
    console.error("POST /api/tasks/[id]", error);
    return jsonError(error instanceof Error ? error.message.slice(0, 280) : "Could not update task.", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireApiStaff();
    if ("error" in auth) return auth.error;
    const { id } = await params;
    await prisma.notification.deleteMany({
      where: { OR: [{ taskId: id }, { href: `/tasks/${id}` }] },
    });
    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/tasks/[id]", error);
    return jsonError(error instanceof Error ? error.message.slice(0, 280) : "Could not delete task.", 500);
  }
}
