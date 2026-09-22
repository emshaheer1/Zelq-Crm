"use client";

import { actionCatch, actionOk } from "@/components/shared/action-popup";
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
import { DeleteButton } from "@/components/shared/delete-menu-item";
import { apiJson } from "@/lib/client-api";
import { useState } from "react";

export function ProjectActions({
  project,
}: {
  project: {
    id: string;
    notes: string | null;
    status: string;
  };
}) {
  const [notes, setNotes] = useState(project.notes ?? "");
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState(project.status);

  return (
    <Surface>
      <SectionTitle title="Notes" />
      <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          disabled={pending}
          onClick={async () => {
            setPending(true);
            try {
              await apiJson(`/api/projects/${project.id}`, {
                method: "PATCH",
                json: { action: "notes", notes },
              });
              actionOk("Project saved successfully.");
            } catch (error) {
              actionCatch(error);
            } finally {
              setPending(false);
            }
          }}
        >
          Save notes
        </Button>
        {status !== "COMPLETED" ? (
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
                  onClick={async () => {
                    setPending(true);
                    try {
                      await apiJson(`/api/projects/${project.id}`, {
                        method: "PATCH",
                        json: { action: "archive" },
                      });
                      actionOk("Project archived successfully.");
                      setStatus("COMPLETED");
                    } catch (error) {
                      actionCatch(error);
                    } finally {
                      setPending(false);
                    }
                  }}
                >
                  Archive
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : null}
        <DeleteButton
          label="project"
          onDelete={() => apiJson(`/api/projects/${project.id}`, { method: "DELETE" }).then(() => undefined)}
          redirectTo="/projects"
        />
      </div>
    </Surface>
  );
}
