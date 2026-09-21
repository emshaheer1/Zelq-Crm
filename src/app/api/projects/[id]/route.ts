import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidDriveUrl } from "@/lib/drive";
import { projectSchema } from "@/lib/validations";
import { blank, jsonError, requireApiStaff } from "@/lib/api-guard";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireApiStaff();
    if ("error" in auth) return auth.error;
    const { id } = await params;
    const body = ((await request.json()) ?? {}) as Record<string, unknown>;

    if (body.action === "notes") {
      await prisma.project.update({
        where: { id },
        data: { notes: typeof body.notes === "string" ? body.notes || null : null },
      });
      return NextResponse.json({ ok: true });
    }

    if (body.action === "archive") {
      await prisma.project.update({
        where: { id },
        data: { status: "COMPLETED" },
      });
      return NextResponse.json({ ok: true });
    }

    const parsed = projectSchema.safeParse({
      ...body,
      clientId: blank(body.clientId),
      managerId: blank(body.managerId),
      startDate: blank(body.startDate),
      deadline: blank(body.deadline),
      driveFolderUrl: blank(body.driveFolderUrl),
      memberIds: Array.isArray(body.memberIds) ? body.memberIds.filter(Boolean) : [],
      priority: body.priority || "MEDIUM",
      status: body.status || "NOT_STARTED",
    });
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid project details.");
    }

    const data = parsed.data;
    if (data.driveFolderUrl && !isValidDriveUrl(data.driveFolderUrl)) {
      return jsonError("Enter a valid Google Drive folder link.");
    }

    await prisma.$transaction([
      prisma.projectMember.deleteMany({ where: { projectId: id } }),
      prisma.project.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description || null,
          clientId: data.clientId,
          managerId: data.managerId,
          startDate: data.startDate ? new Date(data.startDate) : null,
          deadline: data.deadline ? new Date(data.deadline) : null,
          priority: data.priority,
          status: data.status,
          driveFolderUrl: data.driveFolderUrl || null,
          notes: data.notes || null,
          updatedAt: new Date(),
          members: {
            create: data.memberIds.map((userId) => ({ userId })),
          },
        },
      }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PATCH /api/projects/[id]", error);
    return jsonError(error instanceof Error ? error.message.slice(0, 280) : "Could not update project.", 500);
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
    const tasks = await prisma.task.findMany({
      where: { projectId: id },
      select: { id: true },
    });
    await prisma.notification.deleteMany({
      where: {
        OR: [{ projectId: id }, { taskId: { in: tasks.map((task) => task.id) } }],
      },
    });
    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/projects/[id]", error);
    return jsonError(error instanceof Error ? error.message.slice(0, 280) : "Could not delete project.", 500);
  }
}
