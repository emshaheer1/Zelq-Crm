"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { apiJson, softRefresh, refreshNotifications } from "@/lib/client-api";
import { actionCatch, actionOk } from "@/components/shared/action-popup";

export function MarkAllButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          await apiJson("/api/notifications", { method: "PATCH", json: { all: true } });
          actionOk("Notifications marked as read.");
          refreshNotifications();
          softRefresh();
          router.refresh();
        } catch (error) {
          actionCatch(error);
        } finally {
          setPending(false);
        }
      }}
    >
      Mark all as read
    </Button>
  );
}
