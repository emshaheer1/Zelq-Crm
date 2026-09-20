"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { assertAdmin, requireUser } from "@/lib/permissions";
import { employeeSchema } from "@/lib/validations";

export async function createEmployee(input: unknown) {
  const user = await requireUser();
  assertAdmin(user);
  const data = employeeSchema.parse(input);
  if (!data.password) throw new Error("Password is required.");

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
    },
  });

  return { id: employee.id };
}

export async function updateEmployee(id: string, input: unknown) {
  const user = await requireUser();
  assertAdmin(user);
  const data = employeeSchema.parse(input);

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
      ...(data.password
        ? { passwordHash: await hashPassword(data.password) }
        : {}),
    },
  });
}

export async function deactivateEmployee(id: string) {
  const user = await requireUser();
  assertAdmin(user);
  if (id === user.id) throw new Error("You cannot deactivate yourself.");
  await prisma.user.update({
    where: { id },
    data: { status: "INACTIVE" },
  });
  await prisma.session.deleteMany({ where: { userId: id } });
}

export async function activateEmployee(id: string) {
  const user = await requireUser();
  assertAdmin(user);
  await prisma.user.update({
    where: { id },
    data: { status: "ACTIVE" },
  });
}
