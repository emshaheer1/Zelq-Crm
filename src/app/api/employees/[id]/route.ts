import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { employeeSchema } from "@/lib/validations";
import { jsonError, requireApiAdmin } from "@/lib/api-guard";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireApiAdmin();
    if ("error" in auth) return auth.error;
    const { id } = await params;
    const body = ((await request.json()) ?? {}) as Record<string, unknown>;
    const action = body.action;

    if (action === "deactivate") {
      if (id === auth.user.id) return jsonError("You cannot deactivate yourself.");
      await prisma.user.update({ where: { id }, data: { status: "INACTIVE" } });
      await prisma.session.deleteMany({ where: { userId: id } });
      return NextResponse.json({ ok: true });
    }

    if (action === "activate") {
      await prisma.user.update({ where: { id }, data: { status: "ACTIVE" } });
      return NextResponse.json({ ok: true });
    }

    const parsed = employeeSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid employee details.");
    }
    const data = parsed.data;
    await prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        phone: data.phone || null,
        role: data.role,
        designation: data.designation || null,
        joiningDate: data.joiningDate ? new Date(data.joiningDate) : null,
        status: data.status,
        ...(data.password ? { passwordHash: await hashPassword(data.password) } : {}),
      },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PATCH /api/employees/[id]", error);
    return jsonError(error instanceof Error ? error.message.slice(0, 280) : "Could not update employee.", 500);
  }
}
