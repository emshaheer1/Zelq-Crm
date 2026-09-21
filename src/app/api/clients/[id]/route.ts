import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidDriveUrl } from "@/lib/drive";
import { clientSchema } from "@/lib/validations";
import { jsonError, requireApiStaff } from "@/lib/api-guard";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireApiStaff();
    if ("error" in auth) return auth.error;
    const { id } = await params;
    const body = ((await request.json()) ?? {}) as Record<string, unknown>;

    if (typeof body.driveUrl === "string" && !("name" in body)) {
      const url = body.driveUrl.trim();
      if (url && !isValidDriveUrl(url)) {
        return jsonError("Enter a valid Google Drive or Docs link.");
      }
      await prisma.client.update({
        where: { id },
        data: { driveUrl: url || null },
      });
      return NextResponse.json({ ok: true });
    }

    if (typeof body.notes === "string" && !("name" in body)) {
      await prisma.client.update({
        where: { id },
        data: { notes: body.notes || null },
      });
      return NextResponse.json({ ok: true });
    }

    const parsed = clientSchema.safeParse({
      ...body,
      email: typeof body.email === "string" && !body.email.trim() ? undefined : body.email,
      status: body.status || "ACTIVE",
    });
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid client details.");
    }
    const data = parsed.data;
    await prisma.client.update({
      where: { id },
      data: {
        name: data.name,
        companyName: data.companyName || null,
        email: data.email || null,
        phone: data.phone || null,
        country: data.country || null,
        status: data.status,
        notes: data.notes || null,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PATCH /api/clients/[id]", error);
    return jsonError(error instanceof Error ? error.message.slice(0, 280) : "Could not save client.", 500);
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
    const projects = await prisma.project.findMany({
      where: { clientId: id },
      select: { id: true, tasks: { select: { id: true } } },
    });
    const taskIds = projects.flatMap((project) => project.tasks.map((task) => task.id));
    const projectIds = projects.map((project) => project.id);
    await prisma.notification.deleteMany({
      where: {
        OR: [
          { projectId: { in: projectIds } },
          { taskId: { in: taskIds } },
        ],
      },
    });
    await prisma.project.deleteMany({ where: { clientId: id } });
    await prisma.client.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/clients/[id]", error);
    return jsonError(error instanceof Error ? error.message.slice(0, 280) : "Could not delete client.", 500);
  }
}
