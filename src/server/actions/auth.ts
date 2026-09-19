"use server";

import { redirect } from "next/navigation";
import {
  createSession,
  destroySession,
  getCurrentUser,
  verifyPassword,
} from "@/lib/auth";
import { AUTH_HOLD_COOKIE } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";
import { cookies } from "next/headers";

export async function loginAction(_: unknown, formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });

  if (!user || user.status !== "ACTIVE") {
    return { error: "Invalid email or password." };
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    return { error: "Invalid email or password." };
  }

  await createSession(user.id);
  const cookieStore = await cookies();
  cookieStore.set(AUTH_HOLD_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 12,
  });
  return { ok: true };
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function getAuthUser() {
  return getCurrentUser();
}
