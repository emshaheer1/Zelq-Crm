"use client";

import { useState } from "react";
import { actionCatch, actionOk } from "@/components/shared/action-popup";
import type { Role, User } from "@prisma/client";
import { PageHeader } from "@/components/shared/page-header";
import { NewEmployeeDialog } from "@/components/forms/entity-forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Surface, SectionTitle } from "@/components/shared/surface";
import { apiJson } from "@/lib/client-api";
import { roleLabel } from "@/lib/labels";
import { AppSelect } from "@/components/ui/app-select";
import { Plus } from "lucide-react";
import type { AuthUser } from "@/lib/auth";

export function SettingsForm({
  user,
  company,
  users,
}: {
  user: AuthUser;
  company: {
    id: string;
    name: string;
    tagline: string;
    logoUrl: string | null;
    email: string | null;
    phone: string | null;
  };
  users: User[];
}) {
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);
  const isAdmin = user.role === "ADMIN";

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Account and company preferences." />

      {isAdmin ? (
        <Surface>
          <SectionTitle title="Company information" />
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              void (async () => {
                setPending(true);
                try {
                  await apiJson("/api/settings", {
                    method: "POST",
                    json: {
                      action: "company",
                      name: form.get("name"),
                      tagline: form.get("tagline"),
                      email: form.get("email"),
                      phone: form.get("phone"),
                      logoUrl: form.get("logoUrl"),
                    },
                  });
                  actionOk("Company saved successfully.");
                } catch (error) {
                  actionCatch(error);
                } finally {
                  setPending(false);
                }
              })();
            }}
          >
            <Field label="Company name"><Input name="name" defaultValue={company.name} /></Field>
            <Field label="Tagline"><Input name="tagline" defaultValue={company.tagline} /></Field>
            <Field label="Email"><Input name="email" defaultValue={company.email ?? ""} /></Field>
            <Field label="Phone"><Input name="phone" defaultValue={company.phone ?? ""} /></Field>
            <Field label="Logo URL"><Input name="logoUrl" defaultValue={company.logoUrl ?? ""} /></Field>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={pending}>Save company</Button>
            </div>
          </form>
        </Surface>
      ) : null}

      <Surface>
        <SectionTitle title="Password / Security" />
        <form
          className="grid max-w-md gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const data = new FormData(form);
              void (async () => {
                setPending(true);
                try {
                  await apiJson("/api/settings", {
                    method: "POST",
                    json: {
                      action: "password",
                      currentPassword: data.get("currentPassword"),
                      newPassword: data.get("newPassword"),
                      confirmPassword: data.get("confirmPassword"),
                    },
                  });
                  actionOk("Password updated successfully.");
                  form.reset();
                } catch (error) {
                  actionCatch(error);
                } finally {
                  setPending(false);
                }
              })();
            }}
        >
          <Field label="Current password"><Input name="currentPassword" type="password" required /></Field>
          <Field label="New password"><Input name="newPassword" type="password" required minLength={8} /></Field>
          <Field label="Confirm password"><Input name="confirmPassword" type="password" required /></Field>
          <Button type="submit" disabled={pending}>Update password</Button>
        </form>
      </Surface>

      <Surface>
        <SectionTitle title="Notification preferences" />
        <label className="flex items-center gap-2 text-sm text-[#111827]">
          <input
            type="checkbox"
            defaultChecked
            onChange={(event) => {
              void apiJson("/api/settings", {
                method: "POST",
                json: { action: "notify", notifyInApp: event.target.checked },
              }).catch(actionCatch);
            }}
          />
          In-app notifications
        </label>
      </Surface>

      {isAdmin ? (
        <Surface>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-[13px] font-semibold tracking-tight text-foreground">User management</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Roles and access for everyone on the team.</p>
            </div>
            <Button onClick={() => setOpen(true)}>
              <Plus className="size-3.5" />
              Create Employee
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {users.map((record) => (
              <div
                key={record.id}
                className={`rounded-xl border border-border bg-[#FCFCFD] p-4 ${record.status === "INACTIVE" ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <UserAvatar name={record.name} src={record.avatarUrl} className="size-12" />
                  <StatusBadge value={record.status} />
                </div>
                <div className="mt-3 flex items-center gap-1.5">
                  <p className="truncate text-[14px] font-semibold text-foreground">{record.name}</p>
                  {record.id === user.id ? (
                    <span className="rounded-full bg-[#EEF1F4] px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      You
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                  {record.designation || roleLabel[record.role]}
                </p>
                <p className="mt-0.5 truncate text-[12px] text-[#98A2B3]">{record.email}</p>
                <div className="mt-4 space-y-2">
                  <p className="text-[11px] font-medium text-muted-foreground">Role</p>
                  <AppSelect
                    className="h-8"
                    defaultValue={record.role}
                    disabled={record.id === user.id}
                    onChange={(event) => {
                      const raw = record.joiningDate as Date | string | null;
                      const joining =
                        typeof raw === "string"
                          ? raw.slice(0, 10)
                          : raw
                            ? raw.toISOString().slice(0, 10)
                            : "";
                      void (async () => {
                        setPending(true);
                        try {
                          await apiJson(`/api/employees/${record.id}`, {
                            method: "PATCH",
                            json: {
                              name: record.name,
                              email: record.email,
                              phone: record.phone ?? "",
                              role: event.target.value as Role,
                              designation: record.designation ?? "",
                              joiningDate: joining,
                              status: record.status,
                            },
                          });
                          actionOk("Role updated successfully.");
                        } catch (error) {
                          actionCatch(error);
                        } finally {
                          setPending(false);
                        }
                      })();
                    }}
                  >
                    {Object.entries(roleLabel).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </AppSelect>
                  {record.status === "ACTIVE" && record.id !== user.id ? (
                    <button
                      type="button"
                      className="text-[12px] font-medium text-destructive hover:underline"
                      onClick={() => {
                        void (async () => {
                          setPending(true);
                          try {
                            await apiJson(`/api/employees/${record.id}`, {
                              method: "PATCH",
                              json: { action: "deactivate" },
                            });
                            actionOk("Employee deactivated successfully.");
                          } catch (error) {
                            actionCatch(error);
                          } finally {
                            setPending(false);
                          }
                        })();
                      }}
                    >
                      Deactivate
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </Surface>
      ) : null}

      <NewEmployeeDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[13px] text-[#667085]">{label}</Label>
      {children}
    </div>
  );
}
