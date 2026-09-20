import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { eventSchema } from "@/lib/validations";
import { blank, jsonError, requireApiStaff } from "@/lib/api-guard";

export async function POST(request: Request) {
  try {
    const auth = await requireApiStaff();
    if ("error" in auth) return auth.error;

    const body = (await request.json()) as Record<string, unknown>;
    const parsed = eventSchema.safeParse({
      ...body,
      date: blank(body.date),
      time: blank(body.time),
      projectId: blank(body.projectId),
      clientId: blank(body.clientId),
      assigneeIds: Array.isArray(body.assigneeIds) ? body.assigneeIds.filter(Boolean) : [],
      type: body.type || "MEETING",
      priority: body.priority || "MEDIUM",
    });
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid event details.");
    }

    const data = parsed.data;
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
        createdById: auth.user.id,
        assignees: {
          create: data.assigneeIds.map((userId) => ({ userId })),
        },
      },
    });
    return NextResponse.json({ id: event.id });
  } catch (error) {
    console.error("POST /api/calendar", error);
    return jsonError(error instanceof Error ? error.message.slice(0, 280) : "Could not save event.", 500);
  }
}
