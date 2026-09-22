"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Priority, ProjectStatus, TaskStatus } from "@prisma/client";
import { CalendarDays, MoreHorizontal, Search, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PriorityBadge, StatusBadge } from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { CreateButton } from "@/components/forms/create-dialogs";
import { DeleteMenuItem } from "@/components/shared/delete-menu-item";
import { apiJson } from "@/lib/client-api";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Surface } from "@/components/shared/surface";
import { formatDate } from "@/lib/dates";
import { fieldSelectClass } from "@/lib/styles";
import { AppSelect } from "@/components/ui/app-select";
import { projectStatusLabel } from "@/lib/labels";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ProjectItem = {
  id: string;
  name: string;
  clientId: string;
  managerId: string;
  status: ProjectStatus;
  priority: Priority;
  deadline: Date | null;
  client: { id: string; name: string; companyName: string | null };
  members: {
    id: string;
    userId: string;
    user: { name: string; avatarUrl: string | null };
  }[];
  tasks: { status: TaskStatus }[];
  progress: number;
};

export function ProjectsWorkspace({
  projects,
  clients,
  managers,
  employees,
  canCreate,
  openCreate,
}: {
  projects: ProjectItem[];
  clients: { id: string; name: string }[];
  managers: { id: string; name: string }[];
  employees: { id: string; name: string }[];
  canCreate: boolean;
  openCreate: boolean;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [client, setClient] = useState("");
  const [priority, setPriority] = useState("");
  const [employee, setEmployee] = useState("");

  const filtered = useMemo(() => {
    return projects.filter((project) => {
      if (query && !project.name.toLowerCase().includes(query.toLowerCase())) return false;
      if (status && project.status !== status) return false;
      if (client && project.clientId !== client) return false;
      if (priority && project.priority !== priority) return false;
      if (employee && !project.members.some((member) => member.userId === employee) && project.managerId !== employee) return false;
      return true;
    });
  }, [projects, query, status, client, priority, employee]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Organize employee work by client and deadline."
        actions={
          canCreate ? <CreateButton kind="project">New Project</CreateButton> : null
        }
      />

      <Surface className="p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <div className="relative xl:col-span-2">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#98A2B3]" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects" className="pl-9" />
          </div>
          <AppSelect className={fieldSelectClass} value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Status</option>
            {Object.entries(projectStatusLabel).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </AppSelect>
          <AppSelect className={fieldSelectClass} value={employee} onChange={(event) => setEmployee(event.target.value)}>
            <option value="">Employee</option>
            {employees.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </AppSelect>
          <AppSelect className={fieldSelectClass} value={client} onChange={(event) => setClient(event.target.value)}>
            <option value="">Client</option>
            {clients.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </AppSelect>
          <AppSelect className={fieldSelectClass} value={priority} onChange={(event) => setPriority(event.target.value)}>
            <option value="">Priority</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </AppSelect>
        </div>
      </Surface>

      {filtered.length === 0 ? (
        <EmptyState title="No active projects." description="Create a project or adjust filters." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((project) => (
            <div
              key={project.id}
              className="rounded-xl border border-border bg-card p-5 transition-colors duration-150 hover:border-[#d0d5dd]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/projects/${project.id}`} className="block truncate text-sm font-semibold text-[#111827] hover:text-[#111111]">
                    {project.name}
                  </Link>
                  <p className="mt-1 truncate text-[13px] text-[#667085]">
                    {project.client.name}
                    {project.client.companyName ? ` · ${project.client.companyName}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <StatusBadge value={project.status} />
                  <DropdownMenu>
                    <DropdownMenuTrigger className="rounded-lg p-1.5 text-[#98A2B3] hover:bg-[#F4F4F5]">
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/projects/${project.id}`}>Open project</Link>
                      </DropdownMenuItem>
                      {canCreate ? (
                        <DeleteMenuItem
                          label="project"
                          onDelete={() => apiJson(`/api/projects/${project.id}`, { method: "DELETE" }).then(() => undefined)}
                        />
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-[13px]">
                  <span className="text-[#667085]">Progress</span>
                  <span className="font-semibold text-[#027A48]">{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="h-1.5" />
              </div>
              <div className="mt-5 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[13px] font-medium text-[#111827]">
                  <CalendarDays className="size-4 text-[#667085]" />
                  Due {formatDate(project.deadline)}
                </div>
                <div className="flex items-center gap-1.5">
                  <UsersRound className="size-4 text-[#98A2B3]" />
                  <div className="flex -space-x-2">
                    {project.members.slice(0, 3).map((member) => (
                      <UserAvatar
                        key={member.id}
                        name={member.user.name}
                        src={member.user.avatarUrl}
                        className="size-6 border-white"
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <PriorityBadge value={project.priority} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
