import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isStaff } from "@/lib/permissions";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function blank(value: unknown) {
  return typeof value === "string" && !value.trim() ? undefined : value;
}

export async function requireApiUser() {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE") {
    return { error: jsonError("Sign in again.", 401) };
  }
  return { user };
}

export async function requireApiStaff() {
  const result = await requireApiUser();
  if ("error" in result) return result;
  if (!isStaff(result.user.role)) {
    return { error: jsonError("You do not have permission to do that.", 403) };
  }
  return result;
}
