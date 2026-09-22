import { notFound } from "next/navigation";
import Link from "next/link";
import type { UserStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isStaff, requireUser } from "@/lib/permissions";
import { formatDate, monthLabel, monthRange, startOfToday } from "@/lib/dates";
import { roleLabel } from "@/lib/labels";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { TaskCard } from "@/components/tasks/task-card";
import { EmptyState } from "@/components/shared/empty-state";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Surface, SectionTitle } from "@/components/shared/surface";
import { CircleCheckBig, Clock3, ListTodo, TriangleAlert } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmployeeAdminActions } from "./employee-admin-actions";
import { MonthPicker } from "./month-picker";

const taskCardSelect = {
  id: true,
  title: true,
  status: true,
  priority: true,
  deadline: true,
  driveUploaded: true,
  createdAt: true,
  completedAt: true,
  project: { select: { name: true } },
  assignedTo: { select: { name: true, avatarUrl: true } },
} as const;

export default async function EmployeeProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const current = await requireUser();
  const { id } = await params;
  const query = await searchParams;

  if (!isStaff(current.role) && current.id !== id) notFound();

  const now = new Date();
  const year = Number(query.year) || now.getFullYear();
  const month = Number(query.month) || now.getMonth() + 1;
  const range = monthRange(year, month);
  const today = startOfToday();

  const employee = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      designation: true,
      avatarUrl: true,
      status: true,
      joiningDate: true,
    },
  });
  if (!employee) notFound();

  const isManagerish = employee.role === "MANAGER" || employee.role === "ADMIN";
  const personScope = isManagerish
    ? { OR: [{ assignedToId: id }, { assignedById: id }] }
    : { assignedToId: id };
  const openWhere = { ...personScope, status: { not: "COMPLETED" as const } };
  const completedWhere = { ...personScope, status: "COMPLETED" as const };

  const [openCount, openTasks, completedTasks, monthTasks] = await Promise.all([
    prisma.task.count({ where: openWhere }),
    prisma.task.findMany({
      where: openWhere,
      select: taskCardSelect,
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    prisma.task.findMany({
      where: completedWhere,
      select: taskCardSelect,
      orderBy: { completedAt: "desc" },
      take: 12,
    }),
    prisma.task.findMany({
      where: {
        ...personScope,
        OR: [
          { createdAt: { gte: range.start, lte: range.end } },
          { deadline: { gte: range.start, lte: range.end } },
          { completedAt: { gte: range.start, lte: range.end } },
        ],
      },
      select: { id: true, status: true, deadline: true },
    }),
  ]);

  const monthUnique = [...new Map(monthTasks.map((task) => [task.id, task])).values()];
  const completed = monthUnique.filter((task) => task.status === "COMPLETED").length;
  const pending = monthUnique.filter((task) => task.status !== "COMPLETED").length;
  const overdue = monthUnique.filter(
    (task) => task.status !== "COMPLETED" && task.deadline && task.deadline < today,
  ).length;

  return (
    <div className="space-y-6">
      <Surface>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <UserAvatar name={employee.name} src={employee.avatarUrl} className="size-16" />
            <div>
              <h1 className="text-[28px] font-semibold tracking-tight text-[#111827]">{employee.name}</h1>
              <p className="mt-1 text-sm text-[#667085]">
                {employee.designation || roleLabel[employee.role]}
              </p>
              <p className="mt-1 text-[13px] text-[#98A2B3]">
                {employee.email} · Joined {formatDate(employee.joiningDate)}
              </p>
            </div>
          </div>
          <StatusBadge value={employee.status} />
        </div>
      </Surface>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ListTodo} label="Active Tasks" value={openCount} hint="Currently assigned" />
        <StatCard
          icon={CircleCheckBig}
          label="Completed This Month"
          value={completed}
          hint={monthLabel(year, month)}
        />
        <StatCard icon={Clock3} label="Pending" value={pending} hint="Still open this month" />
        <StatCard
          icon={TriangleAlert}
          label="Overdue"
          value={overdue}
          hint="Requires attention"
          danger={overdue > 0}
        />
      </div>

      {current.role === "ADMIN" ? (
        <EmployeeAdminActions
          employee={{
            id: employee.id,
            name: employee.name,
            status: employee.status as UserStatus,
          }}
        />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)]">
        <Surface>
          <SectionTitle title="Current Tasks" description="Work still assigned to this employee." />
          {openTasks.length === 0 ? (
            <EmptyState title="No tasks assigned yet." />
          ) : (
            <div className="grid gap-3">
              {openTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </Surface>
        <Surface>
          <SectionTitle
            title="Monthly Performance"
            description={monthLabel(year, month)}
            action={<MonthPicker year={year} month={month} />}
          />
          <div className="grid gap-3">
            <PerfRow label="Tasks assigned" value={monthUnique.length} />
            <PerfRow label="Completed" value={completed} />
            <PerfRow label="Pending" value={pending} />
            <PerfRow label="Overdue" value={overdue} danger={overdue > 0} />
          </div>
        </Surface>
      </div>

      <Surface padded={false}>
        <div className="border-b border-[#EAECF0] px-6 py-5">
          <SectionTitle title="Recent Completed Work" description="Finished tasks remain in the work record." />
        </div>
        {completedTasks.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No completed tasks yet." />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Assigned Date</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Completion Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {completedTasks.map((task) => (
                <TableRow key={task.id} className="h-16">
                  <TableCell>
                    <Link href={`/tasks/${task.id}`} className="font-medium text-[#111827] hover:text-[#111111]">
                      {task.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-[#667085]">{task.project.name}</TableCell>
                  <TableCell className="text-[#667085]">{formatDate(task.createdAt)}</TableCell>
                  <TableCell className="text-[#667085]">{formatDate(task.deadline)}</TableCell>
                  <TableCell className="text-[#667085]">{formatDate(task.completedAt)}</TableCell>
                  <TableCell>
                    <StatusBadge value={task.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Surface>
    </div>
  );
}

function PerfRow({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-[#F8F9FA] px-4 py-3">
      <p className="text-[13px] text-[#667085]">{label}</p>
      <p className={`text-sm font-semibold ${danger ? "text-[#B42318]" : "text-[#111827]"}`}>
        {String(value).padStart(2, "0")}
      </p>
    </div>
  );
}
