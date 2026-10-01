"use client";

import { useInstantData } from "@/lib/instant-data";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { EmployeesWorkspace } from "./employees-workspace";

type BootEmployees = {
  employees: Parameters<typeof EmployeesWorkspace>[0]["employees"];
  canCreate: boolean;
};

export function EmployeesClient() {
  const { data } = useInstantData<BootEmployees>("employees", "/api/boot/employees");

  if (!data) {
    return <PageSkeleton stats={0} panels={1} />;
  }

  return <EmployeesWorkspace employees={data.employees} canCreate={data.canCreate} />;
}
