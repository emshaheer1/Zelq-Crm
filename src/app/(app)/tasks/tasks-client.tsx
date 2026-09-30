"use client";

import { useSearchParams } from "next/navigation";
import { useInstantData } from "@/lib/instant-data";
import { TasksWorkspace } from "./tasks-workspace";
import { PageHeader } from "@/components/shared/page-header";

type BootTasks = {
  tasks: Parameters<typeof TasksWorkspace>[0]["tasks"];
  projects: { id: string; name: string }[];
  clients: { id: string; name: string }[];
  employees: { id: string; name: string }[];
  canCreate: boolean;
};

export function TasksClient() {
  const params = useSearchParams();
  const { data, loading } = useInstantData<BootTasks>("tasks", "/api/boot/tasks");

  if (!data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Tasks" description={loading ? "Loading tasks…" : "Could not load tasks."} />
      </div>
    );
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
