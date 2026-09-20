"use client";

import { useTransition } from "react";
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
import { activateEmployee, deactivateEmployee } from "@/server/actions/employees";
import { useRouter } from "next/navigation";

export function EmployeeAdminActions({ employee }: { employee: User }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex gap-2">
      {employee.status === "ACTIVE" ? (
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
                onClick={() =>
                  startTransition(async () => {
                    try {
                      await deactivateEmployee(employee.id);
                      actionOk("Employee deactivated successfully.");
                      window.setTimeout(() => router.refresh(), 1800);
                    } catch (error) {
                      actionCatch(error);
                    }
                  })
                }
              >
                Deactivate
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
        <Button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await activateEmployee(employee.id);
              actionOk("Employee activated successfully.");
              window.setTimeout(() => router.refresh(), 1800);
            })
          }
        >
          Activate Employee
        </Button>
      )}
    </div>
  );
}
