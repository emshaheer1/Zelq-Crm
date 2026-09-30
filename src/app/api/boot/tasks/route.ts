import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requireApiUser } from "@/lib/api-guard";
import { isStaff } from "@/lib/permissions";
import type { AuthUser } from "@/lib/auth";
import { taskScope } from "@/server/queries";

export async function GET() {
  try {
    const auth = await requireApiUser();
    if ("error" in auth) return auth.error;
    const user = auth.user as AuthUser;
    const staff = isStaff(user.role);
    const scope = await taskScope(user);

    const [tasks, projects, clients, employees] = await Promise.all([
      prisma.task.findMany({
        where: scope,
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          deadline: true,
          startDate: true,
          driveUploaded: true,
          projectId: true,
          assignedToId: true,
          project: { select: { id: true, name: true, clientId: true } },
          assignedTo: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: [{ deadline: "asc" }, { createdAt: "desc" }],
        take: 300,
      }),
      staff
        ? prisma.project.findMany({
            orderBy: { name: "asc" },
            select: { id: true, name: true },
            take: 200,
          })
        : Promise.resolve([] as { id: string; name: string }[]),
      staff
        ? prisma.client.findMany({
            orderBy: { name: "asc" },
            select: { id: true, name: true },
            take: 200,
          })
        : Promise.resolve([] as { id: string; name: string }[]),
      staff
        ? prisma.user.findMany({
            where: { status: "ACTIVE", role: { not: "ADMIN" } },
            orderBy: { name: "asc" },
            select: { id: true, name: true },
            take: 200,
          })
        : Promise.resolve([] as { id: string; name: string }[]),
    ]);

    return NextResponse.json(
      { tasks, projects, clients, employees, canCreate: staff },
      { headers: { "Cache-Control": "private, max-age=5" } },
    );
  } catch (error) {
    console.error("GET /api/boot/tasks", error);
    return jsonError("Could not load tasks.", 500);
  }
}
