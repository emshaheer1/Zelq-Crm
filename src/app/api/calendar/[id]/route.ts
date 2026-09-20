import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requireApiStaff } from "@/lib/api-guard";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireApiStaff();
    if ("error" in auth) return auth.error;
    const { id } = await params;
    await prisma.calendarEvent.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/calendar/[id]", error);
    return jsonError(error instanceof Error ? error.message.slice(0, 280) : "Could not delete event.", 500);
  }
}
