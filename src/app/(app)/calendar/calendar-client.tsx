"use client";

import { useSearchParams } from "next/navigation";
import { useInstantData } from "@/lib/instant-data";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { CalendarWorkspace } from "./calendar-workspace";

type BootCalendar = {
  projects: Parameters<typeof CalendarWorkspace>[0]["projects"];
  tasks: Parameters<typeof CalendarWorkspace>[0]["tasks"];
  selectedProjectId: string;
  canCreate: boolean;
};

export function CalendarClient() {
  const params = useSearchParams();
  const project = params.get("project") ?? "";
  const query = project ? `?project=${encodeURIComponent(project)}` : "";
  const { data } = useInstantData<BootCalendar>(`calendar:${project || "default"}`, `/api/boot/calendar${query}`);

  if (!data || (project && data.selectedProjectId !== project)) {
    return <PageSkeleton stats={0} panels={2} />;
  }

  return (
    <CalendarWorkspace
      projects={data.projects}
      tasks={data.tasks}
      selectedProjectId={data.selectedProjectId}
      canCreate={data.canCreate}
    />
  );
}
