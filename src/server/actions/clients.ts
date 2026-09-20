"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertStaff, requireUser } from "@/lib/permissions";
import { clientSchema } from "@/lib/validations";

export async function createClient(input: unknown) {
  const user = await requireUser();
  assertStaff(user);
  const raw = (input ?? {}) as Record<string, unknown>;
  const parsed = clientSchema.safeParse({
    ...raw,
    email: typeof raw.email === "string" && !raw.email.trim() ? undefined : raw.email,
    status: raw.status || "ACTIVE",
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid client details.");
  }
  const data = parsed.data;
  try {
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
    revalidatePath("/clients");
    return { id: client.id };
  } catch (error) {
    console.error("createClient", error);
    throw new Error(
      error instanceof Error ? error.message.replace(/^Invalid `.*?` invocation:\s*/s, "").slice(0, 280) : "Could not save client.",
    );
  }
}

export async function updateClient(id: string, input: unknown) {
  const user = await requireUser();
  assertStaff(user);
  const data = clientSchema.parse(input);
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
  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
}

export async function deleteClient(id: string) {
  const user = await requireUser();
  assertStaff(user);
  await prisma.project.deleteMany({ where: { clientId: id } });
  await prisma.client.delete({ where: { id } });
  revalidatePath("/clients");
  revalidatePath("/projects");
  revalidatePath("/dashboard");
}
