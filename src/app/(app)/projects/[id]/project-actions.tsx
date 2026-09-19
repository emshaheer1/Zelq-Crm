"use client";

import { useTransition } from "react";
import { toast } from "sonner";
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
import { archiveProject, updateProjectNotes } from "@/server/actions/projects";
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
                toast.success("Project saved.");
                router.refresh();
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Something went wrong. Please try again.");
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
                      toast.success("Project archived.");
                      router.refresh();
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Something went wrong. Please try again.");
                    }
                  })
                }
              >
                Archive
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Surface>
  );
}
