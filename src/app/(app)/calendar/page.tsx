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
      where: staff ? { deadline: { not: null } } : { assignedToId: user.id, deadline: { not: null } },
      include: { assignedTo: true, project: true },
    }),
    prisma.project.findMany({
      where: { deadline: { not: null } },
      include: { client: true },
    }),
    prisma.calendarEvent.findMany({
      include: {
        project: true,
        client: true,
        assignees: { include: { user: true } },
      },
      orderBy: { date: "asc" },
    }),
    prisma.client.findMany({ select: { id: true, name: true } }),
    prisma.user.findMany({
      where: { status: "ACTIVE" },
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
