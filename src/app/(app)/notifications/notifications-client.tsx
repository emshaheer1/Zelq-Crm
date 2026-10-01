"use client";

import { PageHeader } from "@/components/shared/page-header";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { useInstantData } from "@/lib/instant-data";
import { MarkAllButton } from "./mark-all-button";
import { NotificationsWorkspace, type NotificationListItem } from "./notifications-workspace";

type BootNotifications = {
  items: NotificationListItem[];
  unread: number;
};

export function NotificationsClient() {
  const { data } = useInstantData<BootNotifications>("notifications", "/api/boot/notifications");

  if (!data) {
    return <PageSkeleton stats={0} panels={1} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description={
          data.unread > 0
            ? `${data.unread} unread · Assignments, reviews, and deadlines.`
            : "Assignments, reviews, and deadlines."
        }
        actions={data.unread > 0 ? <MarkAllButton /> : null}
      />
      <NotificationsWorkspace items={data.items} />
    </div>
  );
}
