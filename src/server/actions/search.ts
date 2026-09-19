"use server";

import { prisma } from "@/lib/prisma";
import { isStaff, requireUser } from "@/lib/permissions";

export type SearchResult = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  type: "Task" | "Project" | "Client" | "Employee";
};

export async function globalSearch(query: string): Promise<SearchResult[]> {
  const user = await requireUser();
  const q = query.trim();
  if (q.length < 2) return [];

  const employeeFilter = isStaff(user.role)
    ? {}
    : { assignedToId: user.id };

  const [tasks, projects, clients, employees] = await Promise.all([
    prisma.task.findMany({
      where: {
        AND: [
          employeeFilter,
          {
            OR: [
              { title: { contains: q } },
              { description: { contains: q } },
            ],
          },
        ],
      },
      include: { project: true },
      take: 6,
    }),
    prisma.project.findMany({
      where: {
        AND: [
          isStaff(user.role)
            ? {}
            : { members: { some: { userId: user.id } } },
          {
            OR: [
              { name: { contains: q } },
              { description: { contains: q } },
            ],
          },
        ],
      },
      include: { client: true },
      take: 6,
    }),
    isStaff(user.role)
      ? prisma.client.findMany({
          where: {
            OR: [
              { name: { contains: q } },
              { companyName: { contains: q } },
            ],
          },
          take: 6,
        })
      : Promise.resolve([]),
    isStaff(user.role)
      ? prisma.user.findMany({
          where: {
            OR: [{ name: { contains: q } }, { email: { contains: q } }],
          },
          take: 6,
        })
      : Promise.resolve([]),
  ]);

  return [
    ...tasks.map((task) => ({
      id: task.id,
      title: task.title,
      subtitle: `${task.project.name} — Task`,
      href: `/tasks/${task.id}`,
      type: "Task" as const,
    })),
    ...projects.map((project) => ({
      id: project.id,
      title: project.name,
      subtitle: `${project.client.name} — Project`,
      href: `/projects/${project.id}`,
      type: "Project" as const,
    })),
    ...clients.map((client) => ({
      id: client.id,
      title: client.name,
      subtitle: `${client.companyName || "Client"} — Client`,
      href: `/clients/${client.id}`,
      type: "Client" as const,
    })),
    ...employees.map((employee) => ({
      id: employee.id,
      title: employee.name,
      subtitle: `${employee.designation || employee.role} — Employee`,
      href: `/employees/${employee.id}`,
      type: "Employee" as const,
    })),
  ].slice(0, 12);
}
