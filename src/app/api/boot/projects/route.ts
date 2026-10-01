import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requireApiUser } from "@/lib/api-guard";
import { isStaff } from "@/lib/permissions";
import type { AuthUser } from "@/lib/auth";
import { projectProgress, projectScope } from "@/server/queries";

export async function GET() {
  try {
    const auth = await requireApiUser();
    if ("error" in auth) return auth.error;
    const user = auth.user as AuthUser;
    const canCreate = isStaff(user.role);
    const scope = await projectScope(user);

    const [projects, clients, managers, employees] = await Promise.all([
      prisma.project.findMany({
        where: scope,
        select: {
          id: true,
          name: true,
          clientId: true,
          managerId: true,
          status: true,
          priority: true,
          deadline: true,
          client: { select: { id: true, name: true, companyName: true } },
          members: {
            select: {
              id: true,
              userId: true,
              user: { select: { name: true, avatarUrl: true } },
            },
          },
          tasks: { select: { status: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 200,
      }),
      canCreate
        ? prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true }, take: 200 })
        : Promise.resolve([] as { id: string; name: string }[]),
      canCreate
        ? prisma.user.findMany({
            where: { status: "ACTIVE", role: { in: ["ADMIN", "MANAGER"] } },
            select: { id: true, name: true },
            take: 100,
          })
        : Promise.resolve([] as { id: string; name: string }[]),
      canCreate
        ? prisma.user.findMany({
            where: { status: "ACTIVE", role: { not: "ADMIN" } },
            select: { id: true, name: true },
            take: 200,
          })
        : Promise.resolve([] as { id: string; name: string }[]),
    ]);

    return NextResponse.json(
      {
        projects: projects.map((project) => ({
          ...project,
          progress: projectProgress(project.tasks),
        })),
        clients,
        managers,
        employees,
        canCreate,
      },
      { headers: { "Cache-Control": "private, max-age=5" } },
    );
  } catch (error) {
    console.error("GET /api/boot/projects", error);
    return jsonError("Could not load projects.", 500);
  }
}
