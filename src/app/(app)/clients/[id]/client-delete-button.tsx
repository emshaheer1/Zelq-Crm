"use client";

import { DeleteButton } from "@/components/shared/delete-menu-item";
import { apiJson } from "@/lib/client-api";

export function ClientDeleteButton({ id }: { id: string }) {
  return (
    <DeleteButton
      label="client"
      onDelete={() => apiJson(`/api/clients/${id}`, { method: "DELETE" }).then(() => undefined)}
      redirectTo="/clients"
    />
  );
}
