import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requireApiStaff } from "@/lib/api-guard";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireApiStaff();
    if ("error" in auth) return auth.error;
    const { id } = await params;
    const body = ((await request.json()) ?? {}) as { action?: string; notes?: string };

    if (body.action === "notes") {
      await prisma.project.update({
        where: { id },
        data: { notes: body.notes || null },
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

    return jsonError("Unknown action.");
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
