"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Plus } from "lucide-react";
import type { Role, UserStatus } from "@prisma/client";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { NewEmployeeDialog } from "@/components/forms/entity-forms";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/shared/surface";
import { roleLabel } from "@/lib/labels";
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

export function EmployeesWorkspace({
  employees,
  canCreate,
}: {
  canCreate: boolean;
  employees: {
    id: string;
    name: string;
    email: string;
    role: Role;
    designation: string | null;
    avatarUrl: string | null;
    status: UserStatus;
    active: number;
    pending: number;
    completed: number;
    overdue: number;
  }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        description="Workload and monthly work history."
        actions={
          canCreate ? (
            <Button onClick={() => setOpen(true)}>
              <Plus className="size-4" />
              Create Employee
            </Button>
          ) : null
        }
      />
      {employees.length === 0 ? (
        <EmptyState title="No employees yet." description="Create an employee to start assigning work." />
      ) : (
        <Surface padded={false}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Active Tasks</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Overdue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id} className="h-16">
                  <TableCell>
                    <Link href={`/employees/${employee.id}`} className="flex items-center gap-3">
                      <UserAvatar name={employee.name} src={employee.avatarUrl} className="size-9" />
                      <span>
                        <span className="block text-sm font-medium text-[#111827]">{employee.name}</span>
                        <span className="block text-xs text-[#667085]">{employee.email}</span>
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-[#667085]">
                    {employee.designation || roleLabel[employee.role]}
                  </TableCell>
                  <TableCell className="text-[#667085]">{employee.active + employee.pending}</TableCell>
                  <TableCell className="text-[#667085]">{employee.completed}</TableCell>
                  <TableCell className={employee.overdue ? "text-[#B42318]" : "text-[#667085]"}>
                    {employee.overdue}
                  </TableCell>
                  <TableCell><StatusBadge value={employee.status} /></TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="rounded-lg p-1.5 text-[#98A2B3] hover:bg-[#F4F4F5]">
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/employees/${employee.id}`}>View profile</Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Surface>
      )}
      <NewEmployeeDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
