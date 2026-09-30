"use client";

import { useSearchParams } from "next/navigation";
import { useInstantData } from "@/lib/instant-data";
import { TasksWorkspace } from "./tasks-workspace";
import { PageSkeleton } from "@/components/shared/page-skeleton";

type BootTasks = {
  tasks: Parameters<typeof TasksWorkspace>[0]["tasks"];
  projects: { id: string; name: string }[];
  clients: { id: string; name: string }[];
  employees: { id: string; name: string }[];
  canCreate: boolean;
};

export function TasksClient() {
  const params = useSearchParams();
  const { data } = useInstantData<BootTasks>("tasks", "/api/boot/tasks");

  if (!data) {
    return <PageSkeleton stats={0} panels={1} />;
  }

  return (
    <TasksWorkspace
      tasks={data.tasks}
      projects={data.projects}
      clients={data.clients}
      employees={data.employees}
      canCreate={data.canCreate}
      openCreate={params.get("new") === "1" && data.canCreate}
    />
  );
}
