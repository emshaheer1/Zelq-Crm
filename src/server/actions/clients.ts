"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertStaff, requireUser } from "@/lib/permissions";
import { clientSchema } from "@/lib/validations";

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
