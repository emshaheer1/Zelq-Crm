import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isStaff } from "@/lib/permissions";
import { jsonError, requireApiUser } from "@/lib/api-guard";

export async function GET(request: Request) {
  try {
    const auth = await requireApiUser();
    if ("error" in auth) return auth.error;
    const user = auth.user;
    const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
    if (q.length < 2) return NextResponse.json([]);

    const staff = isStaff(user.role);
    const employeeFilter = staff ? {} : { assignedToId: user.id };

    const [tasks, projects, clients, employees] = await Promise.all([
      prisma.task.findMany({
        where: {
          AND: [
            employeeFilter,
            { OR: [{ title: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] },
          ],
        },
        select: { id: true, title: true, project: { select: { name: true } } },
        take: 6,
      }),
      prisma.project.findMany({
        where: {
          AND: [
            staff ? {} : { members: { some: { userId: user.id } } },
            { OR: [{ name: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] },
          ],
        },
        select: { id: true, name: true, client: { select: { name: true } } },
        take: 6,
      }),
      staff
        ? prisma.client.findMany({
            where: {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { companyName: { contains: q, mode: "insensitive" } },
              ],
            },
            select: { id: true, name: true, companyName: true },
            take: 6,
          })
        : Promise.resolve([]),
      staff
        ? prisma.user.findMany({
            where: {
              OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }],
            },
            select: { id: true, name: true, designation: true, role: true },
            take: 6,
          })
        : Promise.resolve([]),
    ]);

    return NextResponse.json(
      [
        ...tasks.map((task) => ({
          id: task.id,
          title: task.title,
          subtitle: `${task.project.name} — Task`,
          href: `/tasks/${task.id}`,
          type: "Task",
        })),
        ...projects.map((project) => ({
          id: project.id,
          title: project.name,
          subtitle: `${project.client.name} — Project`,
          href: `/projects/${project.id}`,
          type: "Project",
        })),
        ...clients.map((client) => ({
          id: client.id,
          title: client.name,
          subtitle: `${client.companyName || "Client"} — Client`,
          href: `/clients/${client.id}`,
          type: "Client",
        })),
        ...employees.map((employee) => ({
          id: employee.id,
          title: employee.name,
          subtitle: `${employee.designation || employee.role} — Employee`,
          href: `/employees/${employee.id}`,
          type: "Employee",
        })),
      ].slice(0, 12),
    );
  } catch (error) {
    console.error("GET /api/search", error);
    return jsonError("Could not search.", 500);
  }
}
