import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const clientSchema = z.object({
  name: z.string().min(2, "Client name is required"),
  companyName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  country: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  notes: z.string().optional(),
});

export const employeeSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]),
  designation: z.string().optional(),
  joiningDate: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  password: z.string().min(8).optional(),
});

export const projectSchema = z.object({
  name: z.string().min(2, "Project name is required"),
  clientId: z.string().min(1),
  description: z.string().optional(),
  managerId: z.string().min(1),
  memberIds: z.array(z.string()).default([]),
  startDate: z.string().optional(),
  deadline: z.string().optional(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  status: z
    .enum(["NOT_STARTED", "IN_PROGRESS", "ON_HOLD", "COMPLETED"])
    .default("NOT_STARTED"),
  driveFolderUrl: z.string().optional(),
  notes: z.string().optional(),
});

export const taskSchema = z.object({
  title: z.string().min(2, "Task title is required"),
  projectId: z.string().min(1),
  assignedToId: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  startDate: z.string().optional(),
  deadline: z.string().optional(),
  status: z
    .enum([
      "PENDING",
      "IN_PROGRESS",
      "READY_FOR_REVIEW",
      "REVISION_REQUIRED",
      "COMPLETED",
      "ON_HOLD",
    ])
    .default("PENDING"),
  referenceUrl: z.string().optional(),
  notes: z.string().optional(),
});

export const eventSchema = z.object({
  title: z.string().min(2, "Event title is required"),
  type: z.enum([
    "MEETING",
    "FOLLOW_UP",
    "PROJECT_REVIEW",
    "INTERNAL_MEETING",
    "IMPORTANT_DEADLINE",
    "OTHER",
  ]),
  date: z.string().min(1),
  time: z.string().optional(),
  projectId: z.string().optional(),
  clientId: z.string().optional(),
  assigneeIds: z.array(z.string()).default([]),
  description: z.string().optional(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
});

export const companySchema = z.object({
  name: z.string().min(2),
  tagline: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  logoUrl: z.string().optional(),
});

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
