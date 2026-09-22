"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, ExternalLink, MoreHorizontal } from "lucide-react";
import type { Priority, ProjectStatus, TaskStatus } from "@prisma/client";
import { PriorityBadge, StatusBadge } from "@/components/shared/status-badge";
import { TaskCard } from "@/components/tasks/task-card";
import { EmptyState } from "@/components/shared/empty-state";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Surface, SectionTitle } from "@/components/shared/surface";
import { StatCard } from "@/components/shared/stat-card";
import { ActivityTimeline } from "@/components/shared/activity-timeline";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { formatDate, isOverdue } from "@/lib/dates";
import { ProjectActions } from "./project-actions";
import { useCreateDialogs } from "@/components/forms/create-dialogs";
import { NewProjectDialog } from "@/components/forms/entity-forms";
import { DeleteMenuItem } from "@/components/shared/delete-menu-item";
import { apiJson } from "@/lib/client-api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CircleCheckBig, Clock3, FolderKanban } from "lucide-react";

type Project = {
  id: string;
  name: string;
  description: string | null;
  clientId: string;
  managerId: string;
  startDate: Date | null;
  deadline: Date | null;
  priority: Priority;
  status: ProjectStatus;
  driveFolderUrl: string | null;
  notes: string | null;
  client: { id: string; name: string; companyName: string | null };
  manager: { id: string; name: string; avatarUrl: string | null };
  members: {
    id: string;
    userId: string;
    user: { id: string; name: string; avatarUrl: string | null };
  }[];
  tasks: {
    id: string;
    title: string;
    status: TaskStatus;
    priority: Priority;
    deadline: Date | null;
    driveUploaded: boolean;
    project: { name: string };
    assignedTo: { name: string; avatarUrl: string | null };
  }[];
};

type ProjectActivity = {
  id: string;
  message: string;
  createdAt: Date;
  user: { name: string; avatarUrl: string | null } | null;
  task: { id: string; title: string } | null;
};

export function ProjectDetailView({
  project,
  progress,
  completed,
  activities,
  canManage,
}: {
  project: Project;
  progress: number;
  completed: number;
  activities: ProjectActivity[];
  canManage: boolean;
}) {
  const { open, options, prefetch } = useCreateDialogs();
  const [editOpen, setEditOpen] = useState(false);
  const pending = project.tasks.filter((task) => task.status !== "COMPLETED").length;
  const deadlineOverdue = isOverdue(project.deadline, project.status);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <Link href="/projects" className="mb-3 inline-flex items-center gap-2 text-[13px] text-[#667085] hover:text-[#111827]">
            <ArrowLeft className="size-4" />
            Projects
          </Link>
          <h1 className="text-[28px] font-semibold tracking-tight text-[#111827]">{project.name}</h1>
          <p className="mt-1 text-sm text-[#667085]">
            {project.client.name}
            {project.client.companyName ? ` · ${project.client.companyName}` : ""}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusBadge value={project.status} />
            <PriorityBadge value={project.priority} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canManage ? (
            <Button
              variant="secondary"
              onClick={() => {
                prefetch();
                setEditOpen(true);
              }}
            >
              Edit Project
            </Button>
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-lg border border-[#EAECF0] bg-white p-2 text-[#667085] hover:bg-[#F4F4F5]">
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => open("task")}>Add task</DropdownMenuItem>
              {canManage ? (
                <DeleteMenuItem
                  label="project"
                  onDelete={() => apiJson(`/api/projects/${project.id}`, { method: "DELETE" }).then(() => undefined)}
                  redirectTo="/projects"
                />
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {canManage ? (
        <NewProjectDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          clients={options.clients}
          managers={options.managers}
          employees={options.employees}
          project={{
            id: project.id,
            name: project.name,
            clientId: project.clientId,
            managerId: project.managerId,
            description: project.description,
            startDate: project.startDate,
            deadline: project.deadline,
            priority: project.priority,
            status: project.status,
            driveFolderUrl: project.driveFolderUrl,
            notes: project.notes,
            memberIds: project.members.map((member) => member.userId),
          }}
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={FolderKanban}
          label="Progress"
          value={`${progress}%`}
          hint={`${completed} of ${project.tasks.length} tasks`}
          tone="green"
        />
        <StatCard
          icon={CircleCheckBig}
          label="Completed Tasks"
          value={completed}
          hint="Finished work"
          tone="green"
        />
        <StatCard
          icon={Clock3}
          label="Pending Tasks"
          value={pending}
          hint="Still open"
          tone="orange"
        />
        <StatCard
          icon={CalendarDays}
          label="Deadline"
          value={formatDate(project.deadline)}
          hint="Project due date"
          tone={deadlineOverdue ? "red" : "charcoal"}
          danger={deadlineOverdue}
        />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="drive">Drive</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-5 space-y-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
            <Surface>
              <SectionTitle title="Project Summary" />
              {project.description ? (
                <p className="text-sm leading-7 text-[#344054]">{project.description}</p>
              ) : (
                <p className="text-sm text-[#667085]">No project description yet.</p>
              )}
              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between text-[13px]">
                  <span className="text-[#667085]">Progress</span>
                  <span className="font-semibold text-[#027A48]">{progress}%</span>
                </div>
                <Progress value={progress} className="h-1.5" />
                <p className="mt-2 text-[13px] text-[#667085]">
                  <span className="font-medium text-[#027A48]">{completed}</span>
                  {" of "}
                  <span className="font-medium text-[#111827]">{project.tasks.length}</span>
                  {" tasks completed"}
                </p>
              </div>
            </Surface>
            <Surface>
              <SectionTitle title="Project Information" />
              <div className="space-y-4 text-sm">
                <Info label="Client Name">
                  <Link
                    href={`/clients/${project.clientId}`}
                    className="font-medium text-[#111827] hover:text-[#111111]"
                  >
                    {project.client.name}
                  </Link>
                </Info>
                <Info label="Company Name">{project.client.companyName || "—"}</Info>
                <Info label="Manager">{project.manager.name}</Info>
                <Info label="Start Date">{formatDate(project.startDate)}</Info>
                <Info label="Deadline">
                  <span className={deadlineOverdue ? "font-medium text-[#B42318]" : undefined}>
                    {formatDate(project.deadline)}
                  </span>
                </Info>
                <Info label="Priority"><PriorityBadge value={project.priority} /></Info>
                <Info label="Team">
                  <div className="flex flex-wrap justify-end gap-2">
                    {project.members.map((member) => (
                      <span key={member.id} className="inline-flex items-center gap-1.5 text-[#111827]">
                        <UserAvatar name={member.user.name} src={member.user.avatarUrl} className="size-5" />
                        <span>{member.user.name.split(" ")[0]}</span>
                      </span>
                    ))}
                  </div>
                </Info>
              </div>
            </Surface>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="mt-5">
          {project.tasks.length === 0 ? (
            <EmptyState title="No tasks assigned yet." description="Create a task to start this project." />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {project.tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity" className="mt-5">
          <Surface>
            <SectionTitle
              title="Project activity"
              description="All comments, status changes, and updates across this project’s tasks."
            />
            <ActivityTimeline items={activities} />
          </Surface>
        </TabsContent>

        <TabsContent value="notes" className="mt-5">
          {canManage ? (
            <ProjectActions project={project} />
          ) : (
            <Surface>
              <p className="text-sm text-[#667085]">{project.notes || "No notes yet."}</p>
            </Surface>
          )}
        </TabsContent>

        <TabsContent value="drive" className="mt-5">
          <Surface>
            <SectionTitle title="Main project Drive" />
            {project.driveFolderUrl ? (
              <div className="space-y-3">
                <p className="text-sm text-[#111827]">Main Drive folder is connected.</p>
                <Button asChild>
                  <a href={project.driveFolderUrl} target="_blank">
                    <ExternalLink className="size-4" />
                    Open Drive Folder
                  </a>
                </Button>
              </div>
            ) : (
              <p className="text-sm text-[#667085]">No project Drive folder yet.</p>
            )}
          </Surface>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <p className="text-[13px] text-[#667085]">{label}</p>
      <div className="text-right text-[13px] font-medium text-[#111827]">{children}</div>
    </div>
  );
}
