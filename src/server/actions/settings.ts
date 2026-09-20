"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { assertAdmin, requireUser } from "@/lib/permissions";
import { companySchema, passwordSchema } from "@/lib/validations";

export async function updateCompany(input: unknown) {
  const user = await requireUser();
  assertAdmin(user);
  const data = companySchema.parse(input);
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
}

export async function changePassword(input: unknown) {
  const user = await requireUser();
  const data = passwordSchema.parse(input);
  const record = await prisma.user.findUnique({ where: { id: user.id } });
  if (!record) throw new Error("User not found.");
  const valid = await verifyPassword(data.currentPassword, record.passwordHash);
  if (!valid) throw new Error("Current password is incorrect.");
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(data.newPassword) },
  });
}

export async function updateNotificationPref(notifyInApp: boolean) {
  const user = await requireUser();
  await prisma.user.update({
    where: { id: user.id },
    data: { notifyInApp },
  });
}
