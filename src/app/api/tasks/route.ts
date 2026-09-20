import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity, notify } from "@/lib/notify";
import { taskSchema } from "@/lib/validations";
import { blank, jsonError, requireApiStaff } from "@/lib/api-guard";

export async function POST(request: Request) {
  try {
    const auth = await requireApiStaff();
    if ("error" in auth) return auth.error;
    const user = auth.user;

    const body = (await request.json()) as Record<string, unknown>;
    const parsed = taskSchema.safeParse({
      ...body,
      projectId: blank(body.projectId),
      assignedToId: blank(body.assignedToId),
      startDate: blank(body.startDate),
      deadline: blank(body.deadline),
      referenceUrl: blank(body.referenceUrl),
      priority: body.priority || "MEDIUM",
      status: body.status || "PENDING",
    });
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid task details.");
    }

    const data = parsed.data;
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
        updatedAt: new Date(),
      },
      include: { assignedTo: true },
    });

    await logActivity(
      task.id,
      `${user.name} assigned task to ${task.assignedTo.name}.`,
      user.id,
    ).catch(() => {});
    await notify({
      userId: task.assignedToId,
      type: "TASK_ASSIGNED",
      title: "New task assigned to you.",
      body: task.title,
      taskId: task.id,
      href: `/tasks/${task.id}`,
    }).catch(() => {});

    return NextResponse.json({ id: task.id });
  } catch (error) {
    console.error("POST /api/tasks", error);
    return jsonError(error instanceof Error ? error.message.slice(0, 280) : "Could not save task.", 500);
  }
}
