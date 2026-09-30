import { Suspense } from "react";
import { TasksClient } from "./tasks-client";

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="text-[13px] text-muted-foreground">Loading tasks…</div>}>
      <TasksClient />
    </Suspense>
  );
}
