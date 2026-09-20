"use client";

import { useState } from "react";
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
  const [pending, setPending] = useState(false);

  return (
    <DropdownMenuItem
      disabled={pending}
      className="text-destructive focus:text-destructive"
      onSelect={(event) => {
        event.preventDefault();
        if (pending) return;
        if (!window.confirm(`Delete this ${label}? This cannot be undone.`)) return;
        setPending(true);
        void (async () => {
          try {
            await onDelete();
            actionOk(`${label[0]!.toUpperCase()}${label.slice(1)} deleted successfully.`);
            if (redirectTo) router.push(redirectTo);
            else window.setTimeout(() => router.refresh(), 1800);
          } catch (error) {
            actionCatch(error, "Could not delete.");
          } finally {
            setPending(false);
          }
        })();
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
  const [pending, setPending] = useState(false);

  return (
    <Button
      variant="outline"
      disabled={pending}
      className="text-destructive"
      onClick={() => {
        if (pending) return;
        if (!window.confirm(`Delete this ${label}? This cannot be undone.`)) return;
        setPending(true);
        void (async () => {
          try {
            await onDelete();
            actionOk(`${label[0]!.toUpperCase()}${label.slice(1)} deleted successfully.`);
            if (redirectTo) router.push(redirectTo);
            else window.setTimeout(() => router.refresh(), 1800);
          } catch (error) {
            actionCatch(error, "Could not delete.");
          } finally {
            setPending(false);
          }
        })();
      }}
    >
      Delete
    </Button>
  );
}
