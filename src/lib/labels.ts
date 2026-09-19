import type {
  ClientStatus,
  EventType,
  Priority,
  ProjectStatus,
  Role,
  TaskStatus,
  UserStatus,
} from "@prisma/client";

export const roleLabel: Record<Role, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  EMPLOYEE: "Employee",
};

export const userStatusLabel: Record<UserStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
};

export const clientStatusLabel: Record<ClientStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
};

export const projectStatusLabel: Record<ProjectStatus, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
};

export const taskStatusLabel: Record<TaskStatus, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  READY_FOR_REVIEW: "Ready for Review",
  REVISION_REQUIRED: "Revision Required",
  COMPLETED: "Completed",
  ON_HOLD: "On Hold",
};

export const priorityLabel: Record<Priority, string> = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

export const eventTypeLabel: Record<EventType, string> = {
  MEETING: "Meeting",
  FOLLOW_UP: "Follow-up",
  PROJECT_REVIEW: "Project Review",
  INTERNAL_MEETING: "Internal Meeting",
  IMPORTANT_DEADLINE: "Important Deadline",
  OTHER: "Other",
};

export const kanbanColumns: TaskStatus[] = [
  "PENDING",
  "IN_PROGRESS",
  "READY_FOR_REVIEW",
  "REVISION_REQUIRED",
  "COMPLETED",
];
