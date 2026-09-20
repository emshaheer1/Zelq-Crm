import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { companySchema, passwordSchema } from "@/lib/validations";
import { jsonError, requireApiAdmin, requireApiUser } from "@/lib/api-guard";

export async function POST(request: Request) {
  try {
    const body = ((await request.json()) ?? {}) as Record<string, unknown>;
    const action = body.action;

    if (action === "company") {
      const auth = await requireApiAdmin();
      if ("error" in auth) return auth.error;
      const parsed = companySchema.safeParse(body);
      if (!parsed.success) {
        return jsonError(parsed.error.issues[0]?.message ?? "Invalid company details.");
      }
      const data = parsed.data;
      await prisma.companySettings.upsert({
        where: { id: "default" },
        update: {
          name: data.name,
          tagline: data.tagline || "Build. Automate. Scale.",
          email: data.email || "contact@zelq.com",
          phone: data.phone || "+1 (872) 212-2691",
          logoUrl: data.logoUrl || null,
        },
        create: {
          id: "default",
          name: data.name,
          tagline: data.tagline || "Build. Automate. Scale.",
          email: data.email || "contact@zelq.com",
          phone: data.phone || "+1 (872) 212-2691",
          logoUrl: data.logoUrl || null,
        },
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "password") {
      const auth = await requireApiUser();
      if ("error" in auth) return auth.error;
      const parsed = passwordSchema.safeParse(body);
      if (!parsed.success) {
        return jsonError(parsed.error.issues[0]?.message ?? "Could not update password.");
      }
      const data = parsed.data;
      const record = await prisma.user.findUnique({ where: { id: auth.user.id } });
      if (!record) return jsonError("User not found.");
      const valid = await verifyPassword(data.currentPassword, record.passwordHash);
      if (!valid) return jsonError("Current password is incorrect.");
      await prisma.user.update({
        where: { id: auth.user.id },
        data: { passwordHash: await hashPassword(data.newPassword) },
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "notify") {
      const auth = await requireApiUser();
      if ("error" in auth) return auth.error;
      await prisma.user.update({
        where: { id: auth.user.id },
        data: { notifyInApp: Boolean(body.notifyInApp) },
      });
      return NextResponse.json({ ok: true });
    }

    return jsonError("Unknown action.");
  } catch (error) {
    console.error("POST /api/settings", error);
    return jsonError(error instanceof Error ? error.message.slice(0, 280) : "Could not save settings.", 500);
  }
}
