import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isStaff } from "@/lib/permissions";
import { clientSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json({ error: "Sign in again." }, { status: 401 });
    }
    if (!isStaff(user.role)) {
      return NextResponse.json({ error: "You do not have permission to do that." }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const parsed = clientSchema.safeParse({
      ...body,
      email: typeof body.email === "string" && !body.email.trim() ? undefined : body.email,
      status: body.status || "ACTIVE",
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid client details." },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const client = await prisma.client.create({
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
    return NextResponse.json({
      ...client,
      _count: { projects: 0 },
    });
  } catch (error) {
    console.error("POST /api/clients", error);
    const message = error instanceof Error ? error.message.slice(0, 280) : "Could not save client.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
