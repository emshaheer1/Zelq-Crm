"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { actionCatch, actionOk } from "@/components/shared/action-popup";
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
            actionOk(`${label[0]!.toUpperCase()}${label.slice(1)} deleted successfully.`);
            if (redirectTo) router.push(redirectTo);
            else router.refresh();
          } catch (error) {
            actionCatch(error, "Could not delete.");
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
            actionOk(`${label[0]!.toUpperCase()}${label.slice(1)} deleted successfully.`);
            if (redirectTo) router.push(redirectTo);
            else router.refresh();
          } catch (error) {
            actionCatch(error, "Could not delete.");
          }
        });
      }}
    >
      Delete
    </Button>
  );
}
