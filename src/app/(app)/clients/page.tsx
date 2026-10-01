import { Suspense } from "react";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { ClientsClient } from "./clients-client";

export default function ClientsPage() {
  return (
    <Suspense fallback={<PageSkeleton stats={0} panels={1} />}>
      <ClientsClient />
    </Suspense>
  );
}
