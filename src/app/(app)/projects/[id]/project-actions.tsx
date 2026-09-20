"use client";

import { useTransition } from "react";
import { actionCatch, actionOk } from "@/components/shared/action-popup";
import type { Prisma } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Surface, SectionTitle } from "@/components/shared/surface";
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
import { archiveProject, deleteProject, updateProjectNotes } from "@/server/actions/projects";
import { DeleteButton } from "@/components/shared/delete-menu-item";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ProjectActions({
  project,
}: {
  project: Prisma.ProjectGetPayload<object>;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(project.notes ?? "");
  const [pending, startTransition] = useTransition();

  return (
    <Surface>
      <SectionTitle title="Notes" />
      <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              try {
                await updateProjectNotes(project.id, notes);
                actionOk("Project saved successfully.");
                window.setTimeout(() => router.refresh(), 1800);
              } catch (error) {
                actionCatch(error);
              }
            })
          }
        >
          Save notes
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" disabled={pending}>
              Archive Project
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Archive Project?</AlertDialogTitle>
              <AlertDialogDescription>
                The project will be marked completed. Task history stays available.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  startTransition(async () => {
                    try {
                      await archiveProject(project.id);
                      actionOk("Project archived successfully.");
                      window.setTimeout(() => router.refresh(), 1800);
                    } catch (error) {
                      actionCatch(error);
                    }
                  })
                }
              >
                Archive
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <DeleteButton
          label="project"
          onDelete={() => deleteProject(project.id)}
          redirectTo="/projects"
        />
      </div>
    </Surface>
  );
}
