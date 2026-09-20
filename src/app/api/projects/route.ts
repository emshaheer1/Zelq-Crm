import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidDriveUrl } from "@/lib/drive";
import { projectSchema } from "@/lib/validations";
import { blank, jsonError, requireApiStaff } from "@/lib/api-guard";

export async function POST(request: Request) {
  try {
    const auth = await requireApiStaff();
    if ("error" in auth) return auth.error;

    const body = (await request.json()) as Record<string, unknown>;
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

    const project = await prisma.project.create({
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
    });
    return NextResponse.json({ id: project.id });
  } catch (error) {
    console.error("POST /api/projects", error);
    return jsonError(error instanceof Error ? error.message.slice(0, 280) : "Could not save project.", 500);
  }
}
