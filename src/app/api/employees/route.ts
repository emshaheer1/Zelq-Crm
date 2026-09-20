import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { employeeSchema } from "@/lib/validations";
import { blank, jsonError, requireApiUser } from "@/lib/api-guard";

export async function POST(request: Request) {
  try {
    const auth = await requireApiUser();
    if ("error" in auth) return auth.error;
    if (auth.user.role !== "ADMIN") {
      return jsonError("Only an admin can do that.", 403);
    }

    const body = (await request.json()) as Record<string, unknown>;
    const parsed = employeeSchema.safeParse({
      ...body,
      email: blank(body.email),
      joiningDate: blank(body.joiningDate),
      role: body.role || "EMPLOYEE",
      status: body.status || "ACTIVE",
    });
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid employee details.");
    }

    const data = parsed.data;
    if (!data.password) return jsonError("Password is required.");

    const employee = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash: await hashPassword(data.password),
        phone: data.phone || null,
        role: data.role,
        designation: data.designation || null,
        joiningDate: data.joiningDate ? new Date(data.joiningDate) : null,
        status: data.status,
        updatedAt: new Date(),
      },
    });
    return NextResponse.json({ id: employee.id });
  } catch (error) {
    console.error("POST /api/employees", error);
    return jsonError(error instanceof Error ? error.message.slice(0, 280) : "Could not save employee.", 500);
  }
}
