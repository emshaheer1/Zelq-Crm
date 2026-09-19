"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isValidDriveUrl } from "@/lib/drive";
import { assertStaff, requireUser } from "@/lib/permissions";
import { projectSchema } from "@/lib/validations";

function revalidateProjects(id?: string) {
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  if (id) revalidatePath(`/projects/${id}`);
}

export async function createProject(input: unknown) {
  const user = await requireUser();
  assertStaff(user);
  const data = projectSchema.parse(input);

  if (data.driveFolderUrl && !isValidDriveUrl(data.driveFolderUrl)) {
    throw new Error("Enter a valid Google Drive folder link.");
  }

  const project = await prisma.project.create({
    data: {
      name: data.name,
      description: data.description || null,
      clientId: data.clientId,
      managerId: data.managerId,
      startDate: data.startDate ? new Date(data.startDate) : null,
      deadline: data.deadline ? new Date(data.deadline) : null,
      priority: data.priority,
      status: data.status,
      driveFolderUrl: data.driveFolderUrl || null,
      notes: data.notes || null,
      members: {
        create: data.memberIds.map((userId) => ({ userId })),
      },
    },
  });

  revalidateProjects(project.id);
  return { id: project.id };
}

export async function updateProject(id: string, input: unknown) {
  const user = await requireUser();
  assertStaff(user);
  const data = projectSchema.parse(input);

  if (data.driveFolderUrl && !isValidDriveUrl(data.driveFolderUrl)) {
    throw new Error("Enter a valid Google Drive folder link.");
  }

  await prisma.$transaction([
    prisma.projectMember.deleteMany({ where: { projectId: id } }),
    prisma.project.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description || null,
        clientId: data.clientId,
        managerId: data.managerId,
        startDate: data.startDate ? new Date(data.startDate) : null,
        deadline: data.deadline ? new Date(data.deadline) : null,
        priority: data.priority,
        status: data.status,
        driveFolderUrl: data.driveFolderUrl || null,
        notes: data.notes || null,
        members: {
          create: data.memberIds.map((userId) => ({ userId })),
        },
      },
    }),
  ]);

  revalidateProjects(id);
}

export async function archiveProject(id: string) {
  const user = await requireUser();
  assertStaff(user);
  await prisma.project.update({
    where: { id },
    data: { status: "COMPLETED" },
  });
  revalidateProjects(id);
}

export async function updateProjectNotes(id: string, notes: string) {
  const user = await requireUser();
  assertStaff(user);
  await prisma.project.update({ where: { id }, data: { notes } });
  revalidateProjects(id);
}
