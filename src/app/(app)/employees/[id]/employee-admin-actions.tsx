"use client";

import { useState } from "react";
import { actionCatch, actionOk } from "@/components/shared/action-popup";
import type { User } from "@prisma/client";
import { Button } from "@/components/ui/button";
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
import { apiJson } from "@/lib/client-api";

export function EmployeeAdminActions({ employee }: { employee: User }) {
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState(employee.status);

  return (
    <div className="flex gap-2">
      {status === "ACTIVE" ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" disabled={pending}>
              Deactivate Employee
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Deactivate Employee?</AlertDialogTitle>
              <AlertDialogDescription>
                Their previous work history will remain available.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  setPending(true);
                  try {
                    await apiJson(`/api/employees/${employee.id}`, {
                      method: "PATCH",
                      json: { action: "deactivate" },
                    });
                    actionOk("Employee deactivated successfully.");
                    setStatus("INACTIVE");
                  } catch (error) {
                    actionCatch(error);
                  } finally {
                    setPending(false);
                  }
                }}
              >
                Deactivate
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
        <Button
          disabled={pending}
          onClick={async () => {
            setPending(true);
            try {
              await apiJson(`/api/employees/${employee.id}`, {
                method: "PATCH",
                json: { action: "activate" },
              });
              actionOk("Employee activated successfully.");
              setStatus("ACTIVE");
            } catch (error) {
              actionCatch(error);
            } finally {
              setPending(false);
            }
          }}
        >
          Activate Employee
        </Button>
      )}
    </div>
  );
}
