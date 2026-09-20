"use client";

import Link from "next/link";
import { ArrowLeft, CalendarDays, ExternalLink, MoreHorizontal } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { PriorityBadge, StatusBadge } from "@/components/shared/status-badge";
import { TaskCard } from "@/components/tasks/task-card";
import { EmptyState } from "@/components/shared/empty-state";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Surface, SectionTitle } from "@/components/shared/surface";
import { StatCard } from "@/components/shared/stat-card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/dates";
import { ProjectActions } from "./project-actions";
import { DeleteMenuItem } from "@/components/shared/delete-menu-item";
import { deleteProject } from "@/server/actions/projects";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CircleCheckBig, Clock3, FolderKanban, TriangleAlert } from "lucide-react";

type Project = Prisma.ProjectGetPayload<{
  include: {
    client: true;
    manager: true;
    members: { include: { user: true } };
    tasks: { include: { project: true; assignedTo: true } };
  };
}>;

export function ProjectDetailView({
  project,
  progress,
  completed,
  canManage,
}: {
  project: Project;
  progress: number;
  completed: number;
  canManage: boolean;
}) {
  const pending = project.tasks.filter((task) => task.status !== "COMPLETED").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <Link href="/projects" className="mb-3 inline-flex items-center gap-2 text-[13px] text-[#667085] hover:text-[#111827]">
            <ArrowLeft className="size-4" />
            Projects
          </Link>
          <h1 className="text-[28px] font-semibold tracking-tight text-[#111827]">{project.name}</h1>
          <p className="mt-1 text-sm text-[#667085]">{project.client.name}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusBadge value={project.status} />
            <PriorityBadge value={project.priority} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canManage ? (
            <Button asChild variant="secondary">
              <Link href={`/projects/${project.id}`}>Edit Project</Link>
            </Button>
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-lg border border-[#EAECF0] bg-white p-2 text-[#667085] hover:bg-[#F4F4F5]">
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/tasks?new=1`}>Add task</Link>
              </DropdownMenuItem>
              {canManage ? (
                <DeleteMenuItem
                  label="project"
                  onDelete={() => deleteProject(project.id)}
                  redirectTo="/projects"
                />
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FolderKanban} label="Progress" value={`${progress}%`} hint={`${completed} of ${project.tasks.length} tasks`} />
        <StatCard icon={CircleCheckBig} label="Completed Tasks" value={completed} hint="Finished work" />
        <StatCard icon={Clock3} label="Pending Tasks" value={pending} hint="Still open" />
        <StatCard icon={CalendarDays} label="Deadline" value={formatDate(project.deadline)} hint="Project due date" />
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
                  <span className="font-semibold text-[#111827]">{progress}%</span>
                </div>
                <Progress value={progress} className="h-1.5" />
                <p className="mt-2 text-[13px] text-[#98A2B3]">
                  {completed} of {project.tasks.length} tasks completed
                </p>
              </div>
            </Surface>
            <Surface>
              <SectionTitle title="Project Information" />
              <div className="space-y-4 text-sm">
                <Info label="Client">
                  <Link href={`/clients/${project.clientId}`} className="font-medium hover:text-[#111111]">
                    {project.client.name}
                  </Link>
                </Info>
                <Info label="Manager">{project.manager.name}</Info>
                <Info label="Start Date">{formatDate(project.startDate)}</Info>
                <Info label="Deadline">{formatDate(project.deadline)}</Info>
                <Info label="Priority"><PriorityBadge value={project.priority} /></Info>
                <Info label="Team">
                  <div className="flex flex-wrap justify-end gap-2">
                    {project.members.map((member) => (
                      <span key={member.id} className="inline-flex items-center gap-1.5">
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
            <EmptyState
              title="Activity lives on each task"
              description="Open a task to see comments, reviews, and status changes."
              icon={TriangleAlert}
            />
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
      <div className="text-right">{children}</div>
    </div>
  );
}
