import { Suspense } from "react";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { CalendarClient } from "./calendar-client";

export default function CalendarPage() {
  return (
    <Suspense fallback={<PageSkeleton stats={0} panels={2} />}>
      <CalendarClient />
    </Suspense>
  );
}
