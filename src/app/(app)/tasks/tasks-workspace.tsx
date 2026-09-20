"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Prisma, TaskStatus } from "@prisma/client";
import {
  CircleCheck,
  Clock3,
  Columns3,
  Eye,
  List,
  LoaderCircle,
  MoreHorizontal,
  RotateCcw,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { DriveBadge, PriorityBadge, StatusBadge } from "@/components/shared/status-badge";
import { TaskCard } from "@/components/tasks/task-card";
import { CreateButton } from "@/components/forms/create-dialogs";
import { Input } from "@/components/ui/input";
import { DateField } from "@/components/ui/date-field";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, isOverdue } from "@/lib/dates";
import { kanbanColumns, taskStatusLabel } from "@/lib/labels";
import { fieldSelectClass } from "@/lib/styles";
import { AppSelect } from "@/components/ui/app-select";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Surface } from "@/components/shared/surface";
import { DeleteMenuItem } from "@/components/shared/delete-menu-item";
import { apiJson } from "@/lib/client-api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type TaskItem = Prisma.TaskGetPayload<{ include: typeof import("@/server/queries").taskInclude }>;

const columnIcons: Record<string, typeof Clock3> = {
  PENDING: Clock3,
  IN_PROGRESS: LoaderCircle,
  READY_FOR_REVIEW: Eye,
  REVISION_REQUIRED: RotateCcw,
  COMPLETED: CircleCheck,
};

export function TasksWorkspace({
  tasks,
  projects,
  clients,
  employees,
  canCreate,
  openCreate,
}: {
  tasks: TaskItem[];
  projects: { id: string; name: string }[];
  clients: { id: string; name: string }[];
  employees: { id: string; name: string }[];
  canCreate: boolean;
  openCreate: boolean;
}) {
  const [view, setView] = useState<"list" | "board">("list");
  const [query, setQuery] = useState("");
  const [employee, setEmployee] = useState("");
  const [project, setProject] = useState("");
  const [client, setClient] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [deadline, setDeadline] = useState("");

  const filtered = useMemo(() => {
    return tasks.filter((task) => {
      if (query && !task.title.toLowerCase().includes(query.toLowerCase())) return false;
      if (employee && task.assignedToId !== employee) return false;
      if (project && task.projectId !== project) return false;
      if (client && task.project.clientId !== client) return false;
      if (status && task.status !== status) return false;
      if (priority && task.priority !== priority) return false;
      if (deadline && task.deadline) {
        const value = task.deadline.toISOString().slice(0, 10);
        if (value !== deadline) return false;
      }
      if (deadline && !task.deadline) return false;
      return true;
    });
  }, [tasks, query, employee, project, client, status, priority, deadline]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description="Manage and track your team's work."
        actions={
          canCreate ? <CreateButton kind="task">New Task</CreateButton> : null
        }
      />

      <Surface className="p-4">
        <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-8">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tasks"
            className="md:col-span-2"
          />
          <AppSelect className={fieldSelectClass} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Status</option>
            {Object.entries(taskStatusLabel).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </AppSelect>
          <AppSelect className={fieldSelectClass} value={employee} onChange={(e) => setEmployee(e.target.value)}>
            <option value="">Employee</option>
            {employees.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </AppSelect>
          <AppSelect className={fieldSelectClass} value={project} onChange={(e) => setProject(e.target.value)}>
            <option value="">Project</option>
            {projects.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </AppSelect>
          <AppSelect className={fieldSelectClass} value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="">Priority</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </AppSelect>
          <AppSelect className={fieldSelectClass} value={client} onChange={(e) => setClient(e.target.value)}>
            <option value="">Client</option>
            {clients.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </AppSelect>
          <DateField value={deadline} onChange={(event) => setDeadline(event.target.value)} />
        </div>
      </Surface>

      <div className="flex items-center justify-between">
        <div className="inline-flex rounded-lg border border-border bg-white p-1">
          <button
            type="button"
            onClick={() => setView("list")}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-md px-3 text-[13px] font-medium transition-colors",
              view === "list" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted",
            )}
          >
            <List className="size-4" />
            List
          </button>
          <button
            type="button"
            onClick={() => setView("board")}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-md px-3 text-[13px] font-medium transition-colors",
              view === "board" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted",
            )}
          >
            <Columns3 className="size-4" />
            Board
          </button>
        </div>
        <p className="text-[13px] text-[#98A2B3]">{filtered.length} tasks</p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No tasks assigned yet." description="Create a task or adjust filters." icon={List} />
      ) : view === "list" ? (
        <Surface padded={false}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Drive</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((task) => (
                <TableRow key={task.id} className="h-16">
                  <TableCell>
                    <Link href={`/tasks/${task.id}`} className="font-medium text-[#111827] hover:text-[#111111]">
                      {task.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-[#667085]">{task.project.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <UserAvatar name={task.assignedTo.name} src={task.assignedTo.avatarUrl} className="size-6" />
                      <span>{task.assignedTo.name}</span>
                    </div>
                  </TableCell>
                  <TableCell><PriorityBadge value={task.priority} /></TableCell>
                  <TableCell className={isOverdue(task.deadline, task.status) ? "text-[#B42318]" : "text-[#667085]"}>
                    {formatDate(task.deadline)}
                  </TableCell>
                  <TableCell><StatusBadge value={task.status} /></TableCell>
                  <TableCell><DriveBadge uploaded={task.driveUploaded} /></TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="rounded-lg p-1.5 text-[#98A2B3] hover:bg-[#F4F4F5] hover:text-[#111827]">
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/tasks/${task.id}`}>View Task</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/tasks/${task.id}`}>Edit</Link>
                        </DropdownMenuItem>
                        {canCreate ? (
                          <DeleteMenuItem
                            label="task"
                            onDelete={async () => {
                              await apiJson(`/api/tasks/${task.id}`, { method: "DELETE" });
                            }}
                          />
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Surface>
      ) : (
        <div className="grid gap-4 xl:grid-cols-5">
          {kanbanColumns.map((column) => {
            const items = filtered.filter((task) => task.status === (column as TaskStatus));
            const Icon = columnIcons[column];
            return (
              <div key={column} className="rounded-xl border border-border bg-muted/50 p-3">
                <div className="mb-3 flex items-center gap-2 px-1">
                  <Icon className="size-4 text-[#667085]" />
                  <p className="flex-1 text-[13px] font-semibold text-[#111827]">
                    {taskStatusLabel[column]}
                  </p>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-[#667085]">
                    {items.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {items.map((task) => (
                    <TaskCard key={task.id} task={task} compact />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
