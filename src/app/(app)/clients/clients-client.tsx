"use client";

import { useSearchParams } from "next/navigation";
import { useInstantData } from "@/lib/instant-data";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { ClientsWorkspace } from "./clients-workspace";

type BootClients = {
  clients: Parameters<typeof ClientsWorkspace>[0]["clients"];
};

export function ClientsClient() {
  const params = useSearchParams();
  const { data } = useInstantData<BootClients>("clients", "/api/boot/clients");

  if (!data) {
    return <PageSkeleton stats={0} panels={1} />;
  }

  return <ClientsWorkspace clients={data.clients} openCreate={params.get("new") === "1"} />;
}
