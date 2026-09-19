"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleCheckBig, Clock3, Download, FolderKanban, TriangleAlert } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Surface, SectionTitle } from "@/components/shared/surface";
import { Button } from "@/components/ui/button";
import { monthLabel } from "@/lib/dates";
import { fieldSelectClass } from "@/lib/styles";
import { AppSelect } from "@/components/ui/app-select";
import type { TaskStatus } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function ReportsWorkspace({
  year,
  month,
  employees,
  projects,
  selectedEmployeeId,
  selectedProjectId,
  employeeReport,
  projectReport,
  companyReport,
}: {
  year: number;
  month: number;
  employees: { id: string; name: string }[];
  projects: { id: string; name: string }[];
  selectedEmployeeId: string;
  selectedProjectId: string;
  employeeReport: {
    name: string;
    assigned: number;
    completed: number;
    pending: number;
    overdue: number;
    projects: number;
    completion: number;
    tasks: { id: string; title: string; project: string; status: TaskStatus }[];
  } | null;
  projectReport: {
    name: string;
    progress: number;
    total: number;
    completed: number;
    pending: number;
    revision: number;
    overdue: number;
    team: string[];
  } | null;
  companyReport: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    activeProjects: number;
    completedProjects: number;
    employees: { id: string; name: string; completed: number; assigned: number }[];
  };
}) {
  const router = useRouter();

  const push = (key: string, value: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set(key, value);
    router.push(`/reports?${params.toString()}`);
  };

  const maxCompleted = Math.max(...companyReport.employees.map((item) => item.completed), 1);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description={`Work reports for ${monthLabel(year, month)}.`}
        actions={
          <div className="flex flex-wrap gap-2">
            <AppSelect className={fieldSelectClass} value={month} onChange={(event) => push("month", event.target.value)}>
              {Array.from({ length: 12 }, (_, index) => (
                <option key={index + 1} value={index + 1}>
                  {new Date(2026, index, 1).toLocaleString("en", { month: "long" })}
                </option>
              ))}
            </AppSelect>
            <AppSelect className={fieldSelectClass} value={year} onChange={(event) => push("year", event.target.value)}>
              {[2025, 2026, 2027].map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </AppSelect>
            <AppSelect className={fieldSelectClass} value={selectedEmployeeId} onChange={(event) => push("employee", event.target.value)}>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>{employee.name}</option>
              ))}
            </AppSelect>
            <Button variant="outline">
              <Download className="size-4" />
              Export
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FolderKanban} label="Total Tasks" value={companyReport.total} hint="This month" />
        <StatCard icon={CircleCheckBig} label="Completed" value={companyReport.completed} hint="Finished work" />
        <StatCard icon={Clock3} label="Pending" value={companyReport.pending} hint="Still open" />
        <StatCard icon={TriangleAlert} label="Overdue" value={companyReport.overdue} hint="Requires attention" danger={companyReport.overdue > 0} />
      </div>

      <Surface padded={false}>
        <div className="border-b border-[#EAECF0] px-6 py-5">
          <SectionTitle title="Employee Performance" description="Completion against assigned work this month." />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead>Completed</TableHead>
              <TableHead>Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companyReport.employees.map((employee) => {
              const rate = employee.assigned === 0 ? 0 : Math.round((employee.completed / employee.assigned) * 100);
              return (
                <TableRow key={employee.id} className="h-16">
                  <TableCell>
                    <Link href={`/employees/${employee.id}`} className="font-medium text-[#111827]">{employee.name}</Link>
                  </TableCell>
                  <TableCell className="text-[#667085]">{employee.assigned}</TableCell>
                  <TableCell className="text-[#667085]">{employee.completed}</TableCell>
                  <TableCell className="min-w-40">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-[#12B76A]" style={{ width: `${rate}%` }} />
                      </div>
                      <span className="text-xs text-[#98A2B3]">{rate}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Surface>

      <Surface>
        <SectionTitle title="Task Completion" description="Completed tasks by employee this month." />
        <div className="space-y-3">
          {companyReport.employees.map((employee) => (
            <div key={employee.id} className="grid grid-cols-[140px_1fr_40px] items-center gap-3">
              <p className="truncate text-[13px] text-[#667085]">{employee.name.split(" ")[0]}</p>
              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-[#12B76A]"
                  style={{ width: `${Math.max(8, (employee.completed / maxCompleted) * 100)}%` }}
                />
              </div>
              <p className="text-right text-xs font-semibold text-[#111827]">{employee.completed}</p>
            </div>
          ))}
        </div>
      </Surface>

      <div className="grid gap-6 xl:grid-cols-2">
        <Surface>
          <SectionTitle title="Selected Employee" />
          <AppSelect className={fieldSelectClass} value={selectedEmployeeId} onChange={(event) => push("employee", event.target.value)}>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>{employee.name}</option>
            ))}
          </AppSelect>
          {employeeReport ? (
            <div className="mt-5 space-y-3">
              <Perf label="Assigned" value={employeeReport.assigned} />
              <Perf label="Completed" value={employeeReport.completed} />
              <Perf label="Overdue" value={employeeReport.overdue} danger={employeeReport.overdue > 0} />
              {employeeReport.tasks.slice(0, 5).map((task) => (
                <Link key={task.id} href={`/tasks/${task.id}`} className="flex items-center justify-between rounded-lg px-1 py-2 hover:bg-[#FAFAFA]">
                  <div>
                    <p className="text-sm font-medium text-[#111827]">{task.title}</p>
                    <p className="text-xs text-[#98A2B3]">{task.project}</p>
                  </div>
                  <StatusBadge value={task.status} />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="No employee selected." />
          )}
        </Surface>
        <Surface>
          <SectionTitle title="Project Status Overview" />
          <AppSelect className={fieldSelectClass} value={selectedProjectId} onChange={(event) => push("project", event.target.value)}>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </AppSelect>
          {projectReport ? (
            <div className="mt-5 space-y-3">
              <Perf label="Progress" value={`${projectReport.progress}%`} />
              <Perf label="Completed" value={projectReport.completed} />
              <Perf label="Pending" value={projectReport.pending} />
              <Perf label="Revision" value={projectReport.revision} />
              <p className="pt-2 text-[13px] text-[#667085]">
                Team: {projectReport.team.join(", ") || "—"}
              </p>
            </div>
          ) : (
            <EmptyState title="No project selected." />
          )}
        </Surface>
      </div>
    </div>
  );
}

function Perf({ label, value, danger = false }: { label: string; value: number | string; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-[#F8F9FA] px-4 py-3">
      <p className="text-[13px] text-[#667085]">{label}</p>
      <p className={`text-sm font-semibold ${danger ? "text-[#B42318]" : "text-[#111827]"}`}>{value}</p>
    </div>
  );
}
