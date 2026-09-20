"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { apiJson } from "@/lib/client-api";
import { actionCatch, actionOk } from "@/components/shared/action-popup";

export function MarkAllButton() {
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
          window.location.replace("/notifications");
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
