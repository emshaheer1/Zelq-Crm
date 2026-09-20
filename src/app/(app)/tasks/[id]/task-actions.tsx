"use client";

import { useState, useTransition } from "react";
import { actionCatch, actionOk } from "@/components/shared/action-popup";
import type { Prisma } from "@prisma/client";
import { Eye, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  addTaskComment,
  approveTask,
  requestRevision,
  startTask,
  submitForReview,
  updateDriveInfo,
  deleteTask,
} from "@/server/actions/tasks";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";

type Task = Prisma.TaskGetPayload<{
  include: { assignedTo: true };
}>;

export function TaskActions({
  task,
  canReview,
  commentsOnly = false,
}: {
  task: Task;
  canReview: boolean;
  commentsOnly?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [uploaded, setUploaded] = useState(task.driveUploaded);
  const [url, setUrl] = useState(task.driveUrl ?? "");
  const [note, setNote] = useState(task.driveNote ?? "");
  const [comment, setComment] = useState("");
  const [revision, setRevision] = useState("");

  const run = (fn: () => Promise<unknown>, success: string) => {
    startTransition(async () => {
      try {
        await fn();
        actionOk(success);
        router.refresh();
      } catch (error) {
        actionCatch(error);
      }
    });
  };

  if (commentsOnly) {
    return (
      <div className="mt-6 flex items-start gap-3 border-t border-[#EAECF0] pt-5">
        <UserAvatar name={task.assignedTo.name} src={task.assignedTo.avatarUrl} />
        <div className="min-w-0 flex-1">
          <Textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Write a comment..."
            rows={3}
          />
          <Button
            className="mt-3"
            disabled={pending}
            onClick={() =>
              run(async () => {
                await addTaskComment(task.id, comment);
                setComment("");
              }, "Comment added.")
            }
          >
            Send
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {canReview && task.status === "READY_FOR_REVIEW" ? (
        <section className="rounded-xl border border-[#D6BBFB] bg-[#F4F3FF] p-5">
          <div className="flex items-start gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-white text-[#6941C6]">
              <Eye className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#6941C6]">Ready for Review</p>
              <p className="mt-1 text-sm text-[#344054]">
                {task.assignedTo.name} submitted this work for your approval.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {task.driveUrl ? (
                  <Button asChild variant="outline">
                    <a href={task.driveUrl} target="_blank">Open Drive</a>
                  </Button>
                ) : null}
                <Button
                  variant="outline"
                  className="border-[#F7B27A] text-[#C4320A] hover:bg-[#FFF6ED]"
                  disabled={pending}
                  onClick={() =>
                    run(async () => {
                      if (!revision.trim()) throw new Error("Add revision instructions.");
                      await requestRevision(task.id, revision);
                    }, "Revision requested.")
                  }
                >
                  <RotateCcw className="size-4" />
                  Request Revision
                </Button>
                <Button disabled={pending} onClick={() => run(() => approveTask(task.id), "Task approved successfully")}>
                  Approve Task
                </Button>
              </div>
              <Textarea
                className="mt-3"
                value={revision}
                onChange={(event) => setRevision(event.target.value)}
                placeholder="Revision instructions for the employee"
              />
            </div>
          </div>
        </section>
      ) : null}

      {task.status === "REVISION_REQUIRED" ? (
        <section className="rounded-xl border border-[#F7B27A] bg-[#FFF6ED] p-5">
          <p className="text-sm font-semibold text-[#C4320A]">Revision Required</p>
          <p className="mt-1 text-sm text-[#344054]">Update the work, then resubmit for review.</p>
          <Button
            className="mt-4"
            disabled={pending}
            onClick={() => run(() => startTask(task.id), "Revision started.")}
          >
            Start Revision
          </Button>
        </section>
      ) : null}

      <section className="rounded-xl border border-[#EAECF0] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <h2 className="mb-4 text-sm font-semibold text-[#111827]">Drive update</h2>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-[#667085]">Uploaded to Google Drive?</Label>
            <div className="mt-2 flex gap-2">
              <Button type="button" variant={uploaded ? "default" : "outline"} onClick={() => setUploaded(true)}>
                Yes
              </Button>
              <Button type="button" variant={!uploaded ? "secondary" : "outline"} onClick={() => setUploaded(false)}>
                No
              </Button>
            </div>
          </div>
          {uploaded ? (
            <>
              <div className="space-y-1.5">
                <Label>Google Drive Link</Label>
                <Input value={url} onChange={(event) => setUrl(event.target.value)} required placeholder="https://drive.google.com/..." />
              </div>
              <div className="space-y-1.5">
                <Label>Optional note</Label>
                <Input value={note} onChange={(event) => setNote(event.target.value)} />
              </div>
            </>
          ) : null}
          <Button
            disabled={pending}
            onClick={() =>
              run(
                () => updateDriveInfo(task.id, { uploaded, url, note }),
                "Drive link updated.",
              )
            }
          >
            Save Drive info
          </Button>
        </div>
      </section>

      <section className="flex flex-wrap gap-2">
        {task.status === "PENDING" || task.status === "ON_HOLD" ? (
          <Button disabled={pending} onClick={() => run(() => startTask(task.id), "Task started.")}>
            Start task
          </Button>
        ) : null}
        {["PENDING", "IN_PROGRESS", "REVISION_REQUIRED"].includes(task.status) ? (
          <Button
            disabled={pending}
            onClick={() => run(() => submitForReview(task.id), "Submitted for review.")}
          >
            Submit for Review
          </Button>
        ) : null}
        {canReview && task.status !== "READY_FOR_REVIEW" ? (
          <Button
            variant="outline"
            disabled={pending}
            onClick={() =>
              run(async () => {
                if (!revision.trim()) throw new Error("Add revision instructions.");
                await requestRevision(task.id, revision);
              }, "Revision requested.")
            }
          >
            Request Revision
          </Button>
        ) : null}
        {canReview ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={pending}>
                Delete Task
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Task?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes the task and its comments. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    run(async () => {
                      await deleteTask(task.id);
                      router.push("/tasks");
                    }, "Task deleted.")
                  }
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : null}
      </section>

      {canReview && task.status !== "READY_FOR_REVIEW" ? (
        <Textarea
          value={revision}
          onChange={(event) => setRevision(event.target.value)}
          placeholder="Revision instructions for the employee"
        />
      ) : null}
    </div>
  );
}
