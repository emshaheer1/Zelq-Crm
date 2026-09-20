"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function DeleteMenuItem({
  label,
  onDelete,
  redirectTo,
}: {
  label: string;
  onDelete: () => Promise<void>;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenuItem
      disabled={pending}
      className="text-destructive focus:text-destructive"
      onSelect={(event) => {
        event.preventDefault();
        if (!window.confirm(`Delete this ${label}? This cannot be undone.`)) return;
        startTransition(async () => {
          try {
            await onDelete();
            toast.success(`${label} deleted.`);
            if (redirectTo) router.push(redirectTo);
            else router.refresh();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not delete.");
          }
        });
      }}
    >
      Delete
    </DropdownMenuItem>
  );
}

export function DeleteButton({
  label,
  onDelete,
  redirectTo,
}: {
  label: string;
  onDelete: () => Promise<void>;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      disabled={pending}
      className="text-destructive"
      onClick={() => {
        if (!window.confirm(`Delete this ${label}? This cannot be undone.`)) return;
        startTransition(async () => {
          try {
            await onDelete();
            toast.success(`${label} deleted.`);
            if (redirectTo) router.push(redirectTo);
            else router.refresh();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not delete.");
          }
        });
      }}
    >
      Delete
    </Button>
  );
}
