"use client";

import { useState } from "react";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Building2, MoreHorizontal, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { NewClientDialog } from "@/components/forms/entity-forms";
import { DeleteMenuItem } from "@/components/shared/delete-menu-item";
import { deleteClient } from "@/server/actions/clients";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/shared/surface";
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

export function ClientsWorkspace({
  clients,
  openCreate,
}: {
  clients: Prisma.ClientGetPayload<{ include: { projects: true } }>[];
  openCreate: boolean;
}) {
  const [open, setOpen] = useState(openCreate);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description="Internal records only. Clients do not log in."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            New Client
          </Button>
        }
      />
      {clients.length === 0 ? (
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
              {clients.map((client) => (
                <TableRow key={client.id} className="h-16">
                  <TableCell>
                    <Link href={`/clients/${client.id}`} className="flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-lg bg-[#F2F4F7] text-[#111827]">
                        <Building2 className="size-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-medium text-[#111827]">{client.name}</span>
                        <span className="block text-xs text-[#667085]">{client.email || "No email"}</span>
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-[#667085]">{client.companyName || "—"}</TableCell>
                  <TableCell className="text-[#667085]">{client.projects.length}</TableCell>
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
                        <DeleteMenuItem label="client" onDelete={() => deleteClient(client.id)} />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Surface>
      )}
      <NewClientDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
