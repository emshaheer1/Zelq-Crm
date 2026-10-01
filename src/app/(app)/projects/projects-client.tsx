"use client";

import { useSearchParams } from "next/navigation";
import { useInstantData } from "@/lib/instant-data";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { ProjectsWorkspace } from "./projects-workspace";

type BootProjects = {
  projects: Parameters<typeof ProjectsWorkspace>[0]["projects"];
  clients: { id: string; name: string }[];
  managers: { id: string; name: string }[];
  employees: { id: string; name: string }[];
  canCreate: boolean;
};

export function ProjectsClient() {
  const params = useSearchParams();
  const { data } = useInstantData<BootProjects>("projects", "/api/boot/projects");

  if (!data) {
    return <PageSkeleton stats={0} panels={1} />;
  }

  return (
    <ProjectsWorkspace
      projects={data.projects}
      clients={data.clients}
      managers={data.managers}
      employees={data.employees}
      canCreate={data.canCreate}
      openCreate={params.get("new") === "1" && data.canCreate}
    />
  );
}
