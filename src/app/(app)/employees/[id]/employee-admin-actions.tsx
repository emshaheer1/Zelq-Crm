"use client";

import { useTransition } from "react";
import { toast } from "sonner";
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
                      toast.success("Employee deactivated.");
                      router.refresh();
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Something went wrong. Please try again.");
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
              toast.success("Employee activated.");
              router.refresh();
            })
          }
        >
          Activate Employee
        </Button>
      )}
    </div>
  );
}
