import type { Role } from "@prisma/client";
import { forbidden, redirect } from "next/navigation";
import { getCurrentUser, type AuthUser } from "@/lib/auth";

export function isStaff(role: Role) {
  return role === "ADMIN" || role === "MANAGER";
}

export function canManageUsers(role: Role) {
  return role === "ADMIN";
}

export function canManageSettings(role: Role) {
  return role === "ADMIN";
}

export function canCreateClients(role: Role) {
  return isStaff(role);
}

export function canCreateProjects(role: Role) {
  return isStaff(role);
}

export function canCreateTasks(role: Role) {
  return isStaff(role);
}

export function canReviewTasks(role: Role) {
  return isStaff(role);
}

export function canManageCalendar(role: Role) {
  return isStaff(role);
}

export function canViewAllEmployees(role: Role) {
  return isStaff(role);
}

export function canViewReports(role: Role) {
  return isStaff(role);
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.status !== "ACTIVE") redirect("/login");
  return user;
}

export async function requireStaff() {
  const user = await requireUser();
  if (!isStaff(user.role)) forbidden();
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") forbidden();
  return user;
}

export function canAccessTask(user: AuthUser, assignedToId: string) {
  return isStaff(user.role) || user.id === assignedToId;
}

export function canAccessProject(
  user: AuthUser,
  project: { managerId: string; memberIds: string[] },
) {
  if (isStaff(user.role)) return true;
  return (
    project.managerId === user.id || project.memberIds.includes(user.id)
  );
}

export function assertStaff(user: AuthUser) {
  if (!isStaff(user.role)) {
    throw new Error("You do not have permission to do that.");
  }
}

export function assertAdmin(user: AuthUser) {
  if (user.role !== "ADMIN") {
    throw new Error("Only an admin can do that.");
  }
}
