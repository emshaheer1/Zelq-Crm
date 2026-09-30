import { prisma } from "@/lib/prisma";
import { isStaff, requireUser } from "@/lib/permissions";
import { CalendarWorkspace } from "./calendar-workspace";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const staff = isStaff(user.role);

  const [tasks, projects, events, clients, employees] = await Promise.all([
    prisma.task.findMany({
      where: staff
        ? { deadline: { not: null } }
        : { assignedToId: user.id, deadline: { not: null } },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        deadline: true,
        assignedTo: { select: { id: true, name: true, avatarUrl: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { deadline: "asc" },
    }),
    prisma.project.findMany({
      where: { deadline: { not: null } },
      select: {
        id: true,
        name: true,
        status: true,
        deadline: true,
        client: { select: { id: true, name: true } },
      },
      orderBy: { deadline: "asc" },
    }),
    prisma.calendarEvent.findMany({
      select: {
        id: true,
        title: true,
        type: true,
        date: true,
        time: true,
        description: true,
        priority: true,
        projectId: true,
        clientId: true,
        project: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
        assignees: {
          select: {
            userId: true,
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { date: "asc" },
    }),
    prisma.client.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.user.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const visibleEvents = staff
    ? events
    : events.filter((event) => event.assignees.some((assignee) => assignee.userId === user.id));

  return (
    <CalendarWorkspace
      tasks={tasks}
      projects={projects}
      events={visibleEvents}
      clients={clients}
      employees={employees}
      projectOptions={projects.map((project) => ({ id: project.id, name: project.name }))}
      canCreate={staff}
      openCreate={params.new === "1" && staff}
    />
  );
}
