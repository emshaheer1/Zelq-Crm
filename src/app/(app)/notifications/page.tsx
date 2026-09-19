import Link from "next/link";
import { Bell, Eye } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/permissions";
import { formatDateTime } from "@/lib/dates";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Surface } from "@/components/shared/surface";
import { MarkAllButton } from "./mark-all-button";
import { cn } from "@/lib/utils";

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Assignments, reviews, and deadlines."
        actions={notifications.some((item) => !item.read) ? <MarkAllButton /> : null}
      />
      {notifications.length === 0 ? (
        <EmptyState title="You're all caught up." description="New assignments and reviews will appear here." icon={Bell} />
      ) : (
        <Surface padded={false}>
          <div className="divide-y divide-border">
            {notifications.map((item) => (
              <Link
                key={item.id}
                href={item.href || "/notifications"}
                className="flex items-start gap-3 px-5 py-4 transition-colors duration-150 hover:bg-muted/50"
              >
                <span className="mt-0.5 flex size-10 items-center justify-center rounded-lg bg-primary/15 text-foreground">
                  <Eye className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <p className={cn("text-sm", item.read ? "text-muted-foreground" : "font-semibold text-foreground")}>
                    {item.title}
                  </p>
                  {item.body ? <p className="mt-1 text-sm text-muted-foreground">{item.body}</p> : null}
                  <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</p>
                </span>
                {!item.read ? <span className="mt-2 size-1.5 rounded-full bg-primary" /> : null}
              </Link>
            ))}
          </div>
        </Surface>
      )}
    </div>
  );
}
