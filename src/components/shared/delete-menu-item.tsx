"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { actionAsk, actionCatch, actionOk } from "@/components/shared/action-popup";
import { reloadList, softRefresh } from "@/lib/client-api";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

async function runDelete({
  label,
  onDelete,
  redirectTo,
  router,
}: {
  label: string;
  onDelete: () => Promise<void>;
  redirectTo?: string;
  router: { push: (href: string) => void };
}) {
  const ok = await actionAsk(`Delete this ${label}?`, "This cannot be undone.");
  if (!ok) return;
  await onDelete();
  actionOk(`${label[0]!.toUpperCase()}${label.slice(1)} deleted successfully.`);
  if (redirectTo) {
    softRefresh();
    window.setTimeout(() => router.push(redirectTo), 1200);
  } else {
    reloadList();
  }
}

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
        setPending(true);
        void runDelete({ label, onDelete, redirectTo, router })
          .catch((error) => actionCatch(error, "Could not delete."))
          .finally(() => setPending(false));
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
        setPending(true);
        void runDelete({ label, onDelete, redirectTo, router })
          .catch((error) => actionCatch(error, "Could not delete."))
          .finally(() => setPending(false));
      }}
    >
      Delete
    </Button>
  );
}
