import { notFound } from "next/navigation";
import Link from "next/link";
import {
  CalendarDays,
  ExternalLink,
  Flag,
  FolderKanban,
  UserRound,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { canAccessTask, isStaff, requireUser } from "@/lib/permissions";
import { formatDate, formatDateTime, isOverdue } from "@/lib/dates";
import { DriveBadge, OverdueBadge, PriorityBadge, StatusBadge } from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Surface, SectionTitle } from "@/components/shared/surface";
import { ActivityTimeline } from "@/components/shared/activity-timeline";
import { Button } from "@/components/ui/button";
import { TaskActions } from "./task-actions";
import { roleLabel } from "@/lib/labels";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      project: { include: { client: true, manager: true } },
      assignedTo: true,
      assignedBy: true,
      driveUploadedBy: true,
      comments: { include: { user: true }, orderBy: { createdAt: "asc" } },
      activities: { include: { user: true }, orderBy: { createdAt: "desc" } },
      reviews: { include: { reviewer: true }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!task || !canAccessTask(user, task.assignedToId)) notFound();
  const staff = isStaff(user.role);
  const overdue = isOverdue(task.deadline, task.status);
  const latestRevision = task.reviews.find((review) => review.action !== "APPROVE");

  return (
    <div className="space-y-6">
      <p className="text-[13px] text-[#667085]">
        <Link href="/projects" className="hover:text-[#111827]">Projects</Link>
        <span className="mx-2 text-[#98A2B3]">/</span>
        <Link href={`/projects/${task.projectId}`} className="hover:text-[#111827]">{task.project.name}</Link>
        <span className="mx-2 text-[#98A2B3]">/</span>
        <span className="text-[#111827]">{task.title}</span>
      </p>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.8fr)]">
        <div className="space-y-6">
          <div>
            <h1 className="text-[28px] font-semibold tracking-tight text-[#111827]">{task.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge value={task.status} />
              <PriorityBadge value={task.priority} />
              {overdue ? <OverdueBadge /> : null}
            </div>
          </div>

          {task.status === "REVISION_REQUIRED" && latestRevision ? (
            <div className="rounded-xl border border-[#F7B27A] bg-[#FFF6ED] p-5">
              <div className="flex items-start gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-white text-[#C4320A]">
                  <Flag className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#C4320A]">Revision Required</p>
                  <p className="mt-1 text-[13px] font-medium text-[#111827]">Manager feedback</p>
                  <p className="mt-2 text-sm leading-6 text-[#344054]">
                    {latestRevision.notes || "Please review the requested changes and resubmit."}
                  </p>
                  <p className="mt-3 text-xs text-[#98A2B3]">
                    Requested {formatDateTime(latestRevision.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <Surface>
            <SectionTitle title="Description" />
            {task.description ? (
              <p className="text-sm leading-7 text-[#344054]">{task.description}</p>
            ) : (
              <p className="text-sm text-[#667085]">No description added.</p>
            )}
          </Surface>

          <Surface>
            <SectionTitle title="Reference" />
            {task.referenceUrl ? (
              <a href={task.referenceUrl} target="_blank" className="inline-flex items-center gap-2 text-sm font-medium text-[#111827]">
                <ExternalLink className="size-4" />
                Open reference
              </a>
            ) : (
              <p className="text-sm text-[#667085]">No reference link added.</p>
            )}
            {task.notes ? <p className="mt-4 text-sm text-[#667085]">{task.notes}</p> : null}
          </Surface>

          <Surface>
            <SectionTitle title="Comments" description="Keep discussion on this task in one place." />
            <div className="space-y-5">
              {task.comments.length === 0 ? (
                <p className="text-sm text-[#667085]">No comments yet.</p>
              ) : (
                task.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <UserAvatar name={comment.user.name} src={comment.user.avatarUrl} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-[#111827]">{comment.user.name}</p>
                        <span className="text-xs text-[#98A2B3]">{roleLabel[comment.user.role]}</span>
                        <span className="text-xs text-[#98A2B3]">{formatDateTime(comment.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-[#344054]">{comment.body}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <TaskActions task={task} canReview={staff} commentsOnly />
          </Surface>

          <Surface>
            <SectionTitle title="Activity" />
            <ActivityTimeline items={task.activities} />
          </Surface>
        </div>

        <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <Surface>
            <SectionTitle title="Task Details" />
            <div className="space-y-4 text-sm">
              <Meta icon={<FolderKanban className="size-4" />} label="Project">
                <Link href={`/projects/${task.projectId}`} className="font-medium hover:text-[#111111]">
                  {task.project.name}
                </Link>
              </Meta>
              <Meta icon={<UserRound className="size-4" />} label="Assigned To">
                <span className="flex items-center gap-2">
                  <UserAvatar name={task.assignedTo.name} src={task.assignedTo.avatarUrl} className="size-5" />
                  {task.assignedTo.name}
                </span>
              </Meta>
              <Meta label="Assigned By">{task.assignedBy.name}</Meta>
              <Meta label="Priority"><PriorityBadge value={task.priority} /></Meta>
              <Meta label="Status"><StatusBadge value={task.status} /></Meta>
              <Meta icon={<CalendarDays className="size-4" />} label="Start Date">
                {formatDate(task.startDate)}
              </Meta>
              <Meta icon={<CalendarDays className="size-4" />} label="Deadline">
                <span className={overdue ? "text-[#B42318]" : ""}>{formatDate(task.deadline)}</span>
              </Meta>
            </div>
          </Surface>

          <Surface>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">Work Files</h2>
              <DriveBadge uploaded={task.driveUploaded} />
            </div>
            {task.driveUploaded && task.driveUrl ? (
              <div className="space-y-3">
                <p className="text-sm text-[#111827]">Uploaded to Drive: Yes</p>
                <Button asChild>
                  <a href={task.driveUrl} target="_blank">
                    <ExternalLink className="size-4" />
                    Open in Drive
                  </a>
                </Button>
                <p className="text-xs text-[#98A2B3]">
                  Updated {formatDateTime(task.driveUploadedAt)}
                </p>
                {task.driveNote ? <p className="text-sm text-[#667085]">{task.driveNote}</p> : null}
              </div>
            ) : (
              <p className="text-sm text-[#667085]">No work link added yet.</p>
            )}
          </Surface>

          <TaskActions task={task} canReview={staff} />

          <Surface>
            <SectionTitle title="Review history" />
            {task.reviews.length === 0 ? (
              <p className="text-sm text-[#667085]">No reviews yet.</p>
            ) : (
              <div className="space-y-3">
                {task.reviews.map((review) => (
                  <div key={review.id} className="text-sm">
                    <p className="font-medium text-[#111827]">
                      {review.action === "APPROVE" ? "Approved" : "Revision requested"}
                    </p>
                    <p className="text-xs text-[#98A2B3]">
                      {review.reviewer.name} · {formatDateTime(review.createdAt)}
                    </p>
                    {review.notes ? <p className="mt-1 text-[#667085]">{review.notes}</p> : null}
                  </div>
                ))}
              </div>
            )}
          </Surface>
        </div>
      </div>
    </div>
  );
}

function Meta({
  label,
  children,
  icon,
}: {
  label: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <p className="flex items-center gap-2 text-[13px] text-[#667085]">
        {icon}
        {label}
      </p>
      <div className="text-right">{children}</div>
    </div>
  );
}
