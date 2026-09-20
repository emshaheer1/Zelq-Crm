"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { ClientAvatar } from "@/components/shared/user-avatar";
import { formatDate } from "@/lib/dates";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
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

type ClientRow = Prisma.ClientGetPayload<{
  include: { _count: { select: { projects: true } } };
}>;

export function ClientsWorkspace({
  clients,
  openCreate,
}: {
  clients: ClientRow[];
  openCreate: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const [rows, setRows] = useState(clients);

  useEffect(() => {
    if (openCreate) setOpen(true);
  }, [openCreate]);

  useEffect(() => {
    setRows(clients);
  }, [clients]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(false), 1600);
    return () => clearTimeout(timer);
  }, [success]);

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
                    <Link href={`/clients/${client.id}`} className="flex items-center gap-3">
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
                            await deleteClient(client.id);
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
      <NewClientDialog
        open={open}
        onOpenChange={setOpen}
        onCreated={(client) => {
          setRows((current) => [client as ClientRow, ...current.filter((row) => row.id !== client.id)]);
          setSuccess(true);
          router.refresh();
        }}
      />
      <Dialog open={success} onOpenChange={setSuccess}>
        <DialogContent className="max-w-sm text-center sm:max-w-sm" showCloseButton={false}>
          <div className="login-check-pop login-motion flex flex-col items-center gap-3 py-4">
            <span className="grid size-14 place-items-center rounded-full bg-[#22c55e]">
              <svg viewBox="0 0 24 24" className="size-8" fill="none" aria-hidden>
                <path
                  className="login-check-draw login-motion"
                  d="M6 12.5L10.2 16.5L18 8"
                  stroke="white"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <DialogTitle className="text-base font-semibold text-[#111827]">
              Client created successfully
            </DialogTitle>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
