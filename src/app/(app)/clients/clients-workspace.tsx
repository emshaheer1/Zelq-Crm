"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, MoreHorizontal } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { CreateButton } from "@/components/forms/create-dialogs";
import { DeleteMenuItem } from "@/components/shared/delete-menu-item";
import { apiJson } from "@/lib/client-api";
import { Surface } from "@/components/shared/surface";
import { ClientAvatar } from "@/components/shared/user-avatar";
import { formatDate } from "@/lib/dates";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ClientRow = {
  id: string;
  name: string;
  companyName: string | null;
  email: string | null;
  status: "ACTIVE" | "INACTIVE";
  logoUrl: string | null;
  updatedAt: Date | string;
  _count: { projects: number };
};

export function ClientsWorkspace({
  clients,
}: {
  clients: ClientRow[];
  openCreate: boolean;
}) {
  const [rows, setRows] = useState(clients);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description="Internal records only. Clients do not log in."
        actions={<CreateButton kind="client">New Client</CreateButton>}
      />
      {rows.length === 0 ? (
        <EmptyState title="No clients yet." description="Add a client record to attach projects." icon={Building2} />
      ) : (
        <Surface padded={false}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Projects</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((client) => (
                <TableRow key={client.id} className="h-16">
                  <TableCell>
                    <Link href={`/clients/${client.id}`} prefetch className="flex items-center gap-3">
                      <ClientAvatar name={client.name} src={client.logoUrl} />
                      <span>
                        <span className="block text-sm font-medium text-[#111827]">{client.name}</span>
                        <span className="block text-xs text-[#667085]">{client.email || "No email"}</span>
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-[#667085]">{client.companyName || "—"}</TableCell>
                  <TableCell className="text-[#667085]">{client._count.projects}</TableCell>
                  <TableCell><StatusBadge value={client.status} /></TableCell>
                  <TableCell className="text-[#667085]">{formatDate(client.updatedAt)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="rounded-lg p-1.5 text-[#98A2B3] hover:bg-[#F4F4F5]">
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/clients/${client.id}`}>View client</Link>
                        </DropdownMenuItem>
                        <DeleteMenuItem
                          label="client"
                          onDelete={async () => {
                            await apiJson(`/api/clients/${client.id}`, { method: "DELETE" });
                            setRows((current) => current.filter((row) => row.id !== client.id));
                          }}
                        />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Surface>
      )}
    </div>
  );
}
