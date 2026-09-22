"use client";

import { useEffect, useState } from "react";
import { actionCatch, actionErr, actionOk } from "@/components/shared/action-popup";
import { apiJson, reloadList } from "@/lib/client-api";
import { compressLogo } from "@/lib/client-logo";
import { toDateInput } from "@/lib/dates";
import { ClientAvatar } from "@/components/shared/user-avatar";
import type { Client, Project, User } from "@prisma/client";
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
import { fieldSelectClass } from "@/lib/styles";
import { AppSelect } from "@/components/ui/app-select";

function field(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
}

async function postJson(url: string, body: unknown) {
  const result = await apiJson<{ id?: string; error?: string }>(url, { method: "POST", json: body });
  if (!result.id) throw new Error(result.error || "Could not save.");
  return result;
}

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
  const [pending, setPending] = useState(false);

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
            void (async () => {
              setPending(true);
              try {
                await postJson("/api/tasks", {
                  title: field(form, "title"),
                  projectId: field(form, "projectId"),
                  assignedToId: field(form, "assignedToId"),
                  description: field(form, "description"),
                  priority: field(form, "priority"),
                  startDate: field(form, "startDate"),
                  deadline: field(form, "deadline"),
                  status: field(form, "status"),
                  referenceUrl: field(form, "referenceUrl"),
                  notes: field(form, "notes"),
                });
                actionOk("Task created successfully.");
                onOpenChange(false);
                reloadList();
              } catch (error) {
                actionCatch(error);
              } finally {
                setPending(false);
              }
            })();
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
  project,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: { id: string; name: string; companyName?: string | null }[];
  managers: Pick<User, "id" | "name">[];
  employees: Pick<User, "id" | "name">[];
  project?: {
    id: string;
    name: string;
    clientId: string;
    managerId: string;
    description: string | null;
    startDate: Date | string | null;
    deadline: Date | string | null;
    priority: "HIGH" | "MEDIUM" | "LOW";
    status: "NOT_STARTED" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED";
    driveFolderUrl: string | null;
    notes: string | null;
    memberIds: string[];
  };
}) {
  const [pending, setPending] = useState(false);
  const [memberIds, setMemberIds] = useState<string[]>(project?.memberIds ?? []);
  const [clientId, setClientId] = useState(project?.clientId ?? clients[0]?.id ?? "");

  useEffect(() => {
    if (!open) return;
    if (project) {
      setClientId(project.clientId);
      setMemberIds(project.memberIds);
      return;
    }
    setMemberIds([]);
    setClientId((current) =>
      current && clients.some((client) => client.id === current) ? current : (clients[0]?.id ?? ""),
    );
  }, [open, project, clients]);

  const selectedClient = clients.find((client) => client.id === clientId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{project ? "Edit Project" : "New Project"}</DialogTitle>
        </DialogHeader>
        {open ? (
        <form
          key={`${project?.id ?? "new"}-${managers.length}`}
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const payload = {
              name: field(form, "name"),
              clientId: field(form, "clientId"),
              description: field(form, "description"),
              managerId: field(form, "managerId"),
              memberIds,
              startDate: field(form, "startDate"),
              deadline: field(form, "deadline"),
              priority: field(form, "priority"),
              status: field(form, "status"),
              driveFolderUrl: field(form, "driveFolderUrl"),
              notes: field(form, "notes"),
            };
            void (async () => {
              setPending(true);
              try {
                if (project) {
                  await apiJson(`/api/projects/${project.id}`, { method: "PATCH", json: payload });
                  actionOk("Project saved successfully.");
                } else {
                  await postJson("/api/projects", payload);
                  actionOk("Project created successfully.");
                }
                onOpenChange(false);
                reloadList();
              } catch (error) {
                actionCatch(error);
              } finally {
                setPending(false);
              }
            })();
          }}
        >
          <Field label="Project Name">
            <Input name="name" required defaultValue={project?.name ?? ""} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Client Name">
              <AppSelect
                name="clientId"
                required
                className={selectClass}
                value={clientId}
                onChange={(event) => setClientId(event.target.value)}
              >
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </AppSelect>
            </Field>
            <Field label="Company Name">
              <Input value={selectedClient?.companyName || "—"} readOnly />
            </Field>
          </div>
          <Field label="Manager">
            <AppSelect name="managerId" required className={selectClass} defaultValue={project?.managerId}>
              {managers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.name}
                </option>
              ))}
            </AppSelect>
          </Field>
          <Field label="Project Description">
            <Textarea name="description" rows={3} defaultValue={project?.description ?? ""} />
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
              <DateField name="startDate" defaultValue={toDateInput(project?.startDate)} />
            </Field>
            <Field label="Deadline">
              <DateField name="deadline" defaultValue={toDateInput(project?.deadline)} />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Priority">
              <AppSelect name="priority" defaultValue={project?.priority ?? "MEDIUM"} className={selectClass}>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </AppSelect>
            </Field>
            <Field label="Status">
              <AppSelect name="status" defaultValue={project?.status ?? "NOT_STARTED"} className={selectClass}>
                <option value="NOT_STARTED">Not Started</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
              </AppSelect>
            </Field>
          </div>
          <Field label="Main Google Drive Folder Link">
            <Input name="driveFolderUrl" placeholder="https://drive.google.com/..." defaultValue={project?.driveFolderUrl ?? ""} />
          </Field>
          <Field label="Notes">
            <Textarea name="notes" rows={2} defaultValue={project?.notes ?? ""} />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : project ? "Save Project" : "Create Project"}
            </Button>
          </div>
        </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function NewClientDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (client: {
    id: string;
    name: string;
    companyName: string | null;
    email: string | null;
    status: "ACTIVE" | "INACTIVE";
    updatedAt: string;
    _count: { projects: number };
  }) => void;
}) {
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  function close(next: boolean) {
    if (!next) {
      setFormError("");
      setLogoUrl("");
    }
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={close}>
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
                logoUrl,
              }),
            }).catch(() => null);
            setPending(false);
            const result = response
              ? ((await response.json().catch(() => ({}))) as {
                  id?: string;
                  error?: string;
                  name?: string;
                  companyName?: string | null;
                  email?: string | null;
                  status?: "ACTIVE" | "INACTIVE";
                  updatedAt?: string;
                })
              : {};
            if (!response?.ok || !result.id) {
              const message = result.error || "Could not save client.";
              setFormError(message);
              actionErr(message);
              return;
            }
            close(false);
            actionOk("Client created successfully.");
            if (onCreated) {
              onCreated({
                id: result.id,
                name: result.name || String(form.get("name") ?? ""),
                companyName: result.companyName ?? null,
                email: result.email ?? null,
                status: result.status || "ACTIVE",
                updatedAt: result.updatedAt || new Date().toISOString(),
                _count: { projects: 0 },
              });
            } else {
              reloadList();
            }
          }}
        >
          {formError ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>
          ) : null}
          <Field label="Client Logo">
            <div className="flex items-center gap-3 rounded-lg border border-border bg-[#F9FAFB] px-3 py-2.5">
              <ClientAvatar name="Client logo" src={logoUrl || null} className="size-10" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-[#111827]">
                  {logoUrl ? "Logo selected" : "Optional logo"}
                </p>
                <p className="text-[12px] text-[#667085]">PNG or JPG, shown on the client profile</p>
              </div>
              <label className="inline-flex shrink-0">
                <span className="inline-flex h-9 cursor-pointer items-center rounded-lg border border-border bg-white px-3 text-[13px] font-medium text-foreground hover:bg-muted">
                  {logoUrl ? "Change" : "Upload"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (!file) return;
                    try {
                      setLogoUrl(await compressLogo(file));
                    } catch (error) {
                      actionCatch(error);
                    }
                  }}
                />
              </label>
            </div>
          </Field>
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
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => close(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Create Client"}
            </Button>
          </div>
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
  const [pending, setPending] = useState(false);
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
            void (async () => {
              setPending(true);
              try {
                await postJson("/api/calendar", {
                  title: field(form, "title"),
                  type: field(form, "type"),
                  date: field(form, "date"),
                  time: field(form, "time"),
                  projectId: field(form, "projectId"),
                  clientId: field(form, "clientId"),
                  assigneeIds,
                  description: field(form, "description"),
                  priority: field(form, "priority"),
                });
                actionOk("Event created successfully.");
                onOpenChange(false);
                reloadList();
              } catch (error) {
                actionCatch(error);
              } finally {
                setPending(false);
              }
            })();
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
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Create Event"}
            </Button>
          </div>
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
  const [pending, setPending] = useState(false);

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
            void (async () => {
              setPending(true);
              try {
                await postJson("/api/employees", {
                  name: field(form, "name"),
                  email: field(form, "email"),
                  phone: field(form, "phone"),
                  role: field(form, "role"),
                  designation: field(form, "designation"),
                  joiningDate: field(form, "joiningDate"),
                  status: "ACTIVE",
                  password: field(form, "password"),
                });
                actionOk("Employee created successfully.");
                onOpenChange(false);
                reloadList();
              } catch (error) {
                actionCatch(error);
              } finally {
                setPending(false);
              }
            })();
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
