"use client";

import { DeleteButton } from "@/components/shared/delete-menu-item";
import { deleteClient } from "@/server/actions/clients";

export function ClientDeleteButton({ id }: { id: string }) {
  return <DeleteButton label="client" onDelete={() => deleteClient(id)} redirectTo="/clients" />;
}
