"use client";

import { Button } from "@/components/ui/button";
import { markAllNotificationsRead } from "@/server/actions/notifications";

export function MarkAllButton() {
  return (
    <Button variant="outline" onClick={() => markAllNotificationsRead()}>
      Mark all as read
    </Button>
  );
}
