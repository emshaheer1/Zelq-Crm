"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Client, Priority, Project, User } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DateField } from "@/components/ui/date-field";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createProject } from "@/server/actions/projects";
import { createTask } from "@/server/actions/tasks";
import { createCalendarEvent } from "@/server/actions/calendar";
import { createEmployee } from "@/server/actions/employees";
import { fieldSelectClass } from "@/lib/styles";
import { AppSelect } from "@/components/ui/app-select";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[13px] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

const selectClass = fieldSelectClass;

export function NewTaskDialog({
  open,
  onOpenChange,
  projects,
  employees,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Pick<Project, "id" | "name">[];
  employees: Pick<User, "id" | "name">[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        <form
          className="grid gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            startTransition(async () => {
              try {
                const result = await createTask({
                  title: form.get("title"),
                  projectId: form.get("projectId"),
                  assignedToId: form.get("assignedToId"),
                  description: form.get("description"),
                  priority: form.get("priority"),
                  startDate: form.get("startDate"),
                  deadline: form.get("deadline"),
                  status: form.get("status"),
                  referenceUrl: form.get("referenceUrl"),
                  notes: form.get("notes"),
                });
                toast.success("Task created successfully.");
                onOpenChange(false);
                router.push(`/tasks/${result.id}`);
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Something went wrong. Please try again.");
              }
            });
          }}
        >
          <div>
            <p className="mb-3 text-[13px] font-semibold text-[#111827]">Basic Information</p>
            <div className="grid gap-4">
              <Field label="Task Title">
                <Input name="title" required placeholder="Homepage Design" />
              </Field>
              <Field label="Project">
                <AppSelect name="projectId" required className={selectClass}>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </AppSelect>
              </Field>
              <Field label="Description">
                <Textarea name="description" rows={3} />
              </Field>
            </div>
          </div>
          <div>
            <p className="mb-3 text-[13px] font-semibold text-[#111827]">Assignment</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Employee">
                <AppSelect name="assignedToId" required className={selectClass}>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
                </AppSelect>
              </Field>
              <Field label="Priority">
                <AppSelect name="priority" defaultValue="MEDIUM" className={selectClass}>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </AppSelect>
              </Field>
            </div>
          </div>
          <div>
            <p className="mb-3 text-[13px] font-semibold text-[#111827]">Timeline</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Start Date">
                <DateField name="startDate" />
              </Field>
              <Field label="Deadline">
                <DateField name="deadline" />
              </Field>
            </div>
          </div>
          <Field label="Status">
            <AppSelect name="status" defaultValue="PENDING" className={selectClass}>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="ON_HOLD">On Hold</option>
            </AppSelect>
          </Field>
          <div>
            <p className="mb-3 text-[13px] font-semibold text-[#111827]">References</p>
            <Field label="Reference Link">
              <Input name="referenceUrl" placeholder="https://" />
            </Field>
          </div>
          <Field label="Notes">
            <Textarea name="notes" rows={2} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function NewProjectDialog({
  open,
  onOpenChange,
  clients,
  managers,
  employees,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Pick<Client, "id" | "name">[];
  managers: Pick<User, "id" | "name">[];
  employees: Pick<User, "id" | "name">[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [memberIds, setMemberIds] = useState<string[]>([]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            startTransition(async () => {
              try {
                const result = await createProject({
                  name: form.get("name"),
                  clientId: form.get("clientId"),
                  description: form.get("description"),
                  managerId: form.get("managerId"),
                  memberIds,
                  startDate: form.get("startDate"),
                  deadline: form.get("deadline"),
                  priority: form.get("priority"),
                  status: form.get("status"),
                  driveFolderUrl: form.get("driveFolderUrl"),
                  notes: form.get("notes"),
                });
                toast.success("Project saved.");
                onOpenChange(false);
                router.push(`/projects/${result.id}`);
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Something went wrong. Please try again.");
              }
            });
          }}
        >
          <Field label="Project Name">
            <Input name="name" required />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Client">
              <AppSelect name="clientId" required className={selectClass}>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </AppSelect>
            </Field>
            <Field label="Manager">
              <AppSelect name="managerId" required className={selectClass}>
                {managers.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.name}
                  </option>
                ))}
              </AppSelect>
            </Field>
          </div>
          <Field label="Project Description">
            <Textarea name="description" rows={3} />
          </Field>
          <Field label="Assigned Employees">
            <div className="grid gap-1.5 rounded-lg border border-border p-2">
              {employees.map((employee) => (
                <label key={employee.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={memberIds.includes(employee.id)}
                    onChange={(event) => {
                      setMemberIds((current) =>
                        event.target.checked
                          ? [...current, employee.id]
                          : current.filter((id) => id !== employee.id),
                      );
                    }}
                  />
                  {employee.name}
                </label>
              ))}
            </div>
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Start Date">
              <DateField name="startDate" />
            </Field>
            <Field label="Deadline">
              <DateField name="deadline" />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Priority">
              <AppSelect name="priority" defaultValue="MEDIUM" className={selectClass}>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </AppSelect>
            </Field>
            <Field label="Status">
              <AppSelect name="status" defaultValue="NOT_STARTED" className={selectClass}>
                <option value="NOT_STARTED">Not Started</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
              </AppSelect>
            </Field>
          </div>
          <Field label="Main Google Drive Folder Link">
            <Input name="driveFolderUrl" placeholder="https://drive.google.com/..." />
          </Field>
          <Field label="Notes">
            <Textarea name="notes" rows={2} />
          </Field>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Create Project"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function NewClientDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Client</DialogTitle>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            setFormError("");
            setPending(true);
            const response = await fetch("/api/clients", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: String(form.get("name") ?? ""),
                companyName: String(form.get("companyName") ?? ""),
                email: String(form.get("email") ?? ""),
                phone: String(form.get("phone") ?? ""),
                country: String(form.get("country") ?? ""),
                status: String(form.get("status") ?? "ACTIVE"),
                notes: String(form.get("notes") ?? ""),
              }),
            }).catch(() => null);
            setPending(false);
            const result = response ? ((await response.json().catch(() => ({}))) as { id?: string; error?: string }) : {};
            if (!response?.ok || !result.id) {
              const message = result.error || "Could not save client.";
              setFormError(message);
              toast.error(message);
              return;
            }
            toast.success("Client created.");
            onOpenChange(false);
            router.push(`/clients/${result.id}`);
          }}
        >
          {formError ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>
          ) : null}
          <Field label="Client Name">
            <Input name="name" required />
          </Field>
          <Field label="Company Name">
            <Input name="companyName" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Email">
              <Input name="email" type="email" />
            </Field>
            <Field label="Phone">
              <Input name="phone" />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Country">
              <Input name="country" />
            </Field>
            <Field label="Status">
              <AppSelect name="status" defaultValue="ACTIVE" className={selectClass}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </AppSelect>
            </Field>
          </div>
          <Field label="Notes">
            <Textarea name="notes" rows={3} />
          </Field>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Create Client"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function NewEventDialog({
  open,
  onOpenChange,
  projects,
  clients,
  employees,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Pick<Project, "id" | "name">[];
  clients: Pick<Client, "id" | "name">[];
  employees: Pick<User, "id" | "name">[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Calendar Event</DialogTitle>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            startTransition(async () => {
              try {
                await createCalendarEvent({
                  title: form.get("title"),
                  type: form.get("type"),
                  date: form.get("date"),
                  time: form.get("time"),
                  projectId: form.get("projectId") || undefined,
                  clientId: form.get("clientId") || undefined,
                  assigneeIds,
                  description: form.get("description"),
                  priority: form.get("priority") as Priority,
                });
                toast.success("Event created.");
                onOpenChange(false);
                router.push("/calendar");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Something went wrong. Please try again.");
              }
            });
          }}
        >
          <Field label="Event Title">
            <Input name="title" required />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Event Type">
              <AppSelect name="type" className={selectClass}>
                <option value="MEETING">Meeting</option>
                <option value="FOLLOW_UP">Follow-up</option>
                <option value="PROJECT_REVIEW">Project Review</option>
                <option value="INTERNAL_MEETING">Internal Meeting</option>
                <option value="IMPORTANT_DEADLINE">Important Deadline</option>
                <option value="OTHER">Other</option>
              </AppSelect>
            </Field>
            <Field label="Priority">
              <AppSelect name="priority" defaultValue="MEDIUM" className={selectClass}>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </AppSelect>
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Date">
              <DateField name="date" required />
            </Field>
            <Field label="Time">
              <Input name="time" type="time" />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Related Project">
              <AppSelect name="projectId" className={selectClass}>
                <option value="">None</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </AppSelect>
            </Field>
            <Field label="Related Client">
              <AppSelect name="clientId" className={selectClass}>
                <option value="">None</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </AppSelect>
            </Field>
          </div>
          <Field label="Assigned Employee(s)">
            <div className="grid gap-1.5 rounded-lg border border-border p-2">
              {employees.map((employee) => (
                <label key={employee.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={assigneeIds.includes(employee.id)}
                    onChange={(event) => {
                      setAssigneeIds((current) =>
                        event.target.checked
                          ? [...current, employee.id]
                          : current.filter((id) => id !== employee.id),
                      );
                    }}
                  />
                  {employee.name}
                </label>
              ))}
            </div>
          </Field>
          <Field label="Description">
            <Textarea name="description" rows={3} />
          </Field>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Create Event"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function NewEmployeeDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Employee</DialogTitle>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            startTransition(async () => {
              try {
                const result = await createEmployee({
                  name: form.get("name"),
                  email: form.get("email"),
                  phone: form.get("phone"),
                  role: form.get("role"),
                  designation: form.get("designation"),
                  joiningDate: form.get("joiningDate"),
                  status: "ACTIVE",
                  password: form.get("password"),
                });
                toast.success("Employee created.");
                onOpenChange(false);
                router.push(`/employees/${result.id}`);
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Something went wrong. Please try again.");
              }
            });
          }}
        >
          <Field label="Name">
            <Input name="name" required />
          </Field>
          <Field label="Email">
            <Input name="email" type="text" required />
          </Field>
          <Field label="Password">
            <Input name="password" type="password" required minLength={8} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Role">
              <AppSelect name="role" defaultValue="EMPLOYEE" className={selectClass}>
                <option value="EMPLOYEE">Employee</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </AppSelect>
            </Field>
            <Field label="Designation">
              <Input name="designation" />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Phone">
              <Input name="phone" />
            </Field>
            <Field label="Joining Date">
              <DateField name="joiningDate" />
            </Field>
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Create Employee"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
