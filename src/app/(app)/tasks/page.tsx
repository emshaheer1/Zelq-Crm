import { Suspense } from "react";
import { TasksClient } from "./tasks-client";
import { PageSkeleton } from "@/components/shared/page-skeleton";

export default function TasksPage() {
  return (
    <Suspense fallback={<PageSkeleton stats={0} panels={1} />}>
      <TasksClient />
    </Suspense>
  );
}
