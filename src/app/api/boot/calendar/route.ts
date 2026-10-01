import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requireApiUser } from "@/lib/api-guard";
import { isStaff } from "@/lib/permissions";
import type { AuthUser } from "@/lib/auth";
import { projectScope, taskScope } from "@/server/queries";

export async function GET(request: Request) {
  try {
    const auth = await requireApiUser();
    if ("error" in auth) return auth.error;
    const user = auth.user as AuthUser;
    const staff = isStaff(user.role);
    const [projectWhere, taskWhere] = await Promise.all([projectScope(user), taskScope(user)]);
    const requested = new URL(request.url).searchParams.get("project") ?? "";

    const projects = await prisma.project.findMany({
      where: projectWhere,
      select: {
        id: true,
        name: true,
        status: true,
        deadline: true,
        client: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
      take: 200,
    });

    const selectedProjectId = projects.some((project) => project.id === requested)
      ? requested
      : (projects[0]?.id ?? "");

    const tasks = selectedProjectId
      ? await prisma.task.findMany({
          where: {
            AND: [
              taskWhere,
              { projectId: selectedProjectId },
              { OR: [{ deadline: { not: null } }, { startDate: { not: null } }] },
            ],
          },
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            startDate: true,
            deadline: true,
            projectId: true,
            assignedTo: { select: { id: true, name: true, avatarUrl: true } },
            project: { select: { id: true, name: true } },
          },
          orderBy: [{ deadline: "asc" }, { startDate: "asc" }],
          take: 400,
        })
      : [];

    return NextResponse.json(
      { projects, tasks, selectedProjectId, canCreate: staff },
      { headers: { "Cache-Control": "private, max-age=5" } },
    );
  } catch (error) {
    console.error("GET /api/boot/calendar", error);
    return jsonError("Could not load calendar.", 500);
  }
}
