import { Suspense } from "react";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { ProjectsClient } from "./projects-client";

export default function ProjectsPage() {
  return (
    <Suspense fallback={<PageSkeleton stats={0} panels={1} />}>
      <ProjectsClient />
    </Suspense>
  );
}
