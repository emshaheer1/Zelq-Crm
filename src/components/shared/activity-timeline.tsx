import { CircleCheck, Clock3, Eye, RotateCcw, UserPlus } from "lucide-react";
import { formatRelativeTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/shared/user-avatar";

export function ActivityTimeline({
  items,
}: {
  items: {
    id: string;
    message: string;
    createdAt: Date;
    task?: { id: string; title: string } | null;
    user?: { name: string; avatarUrl: string | null } | null;
  }[];
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No activity yet.</p>;
  }

  return (
    <div className="space-y-0">
      {items.map((item, index) => {
        const Icon = iconFor(item.message);
        const tone = toneFor(item.message);
        return (
          <div key={item.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="relative flex size-8 items-center justify-center">
                {item.user ? (
                  <UserAvatar name={item.user.name} src={item.user.avatarUrl} className="size-8" />
                ) : (
                  <span className={cn("flex size-8 items-center justify-center rounded-full", tone)}>
                    <Icon className="size-3.5" />
                  </span>
                )}
                {item.user ? (
                  <span
                    className={cn(
                      "absolute -right-0.5 -bottom-0.5 flex size-4 items-center justify-center rounded-full ring-2 ring-white",
                      tone,
                    )}
                  >
                    <Icon className="size-2.5" />
                  </span>
                ) : null}
              </span>
              {index < items.length - 1 ? <span className="my-1 w-px flex-1 bg-border" /> : null}
            </div>
            <div className={cn("min-w-0 pb-5", index === items.length - 1 && "pb-0")}>
              <p className="text-sm font-medium text-foreground">{item.message}</p>
              {item.task?.title ? (
                <p className="mt-0.5 text-[13px] text-muted-foreground">{item.task.title}</p>
              ) : null}
              <p className="mt-1 text-xs text-muted-foreground">{formatRelativeTime(item.createdAt)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function iconFor(message: string) {
  const value = message.toLowerCase();
  if (value.includes("approved") || value.includes("completed")) return CircleCheck;
  if (value.includes("revision")) return RotateCcw;
  if (value.includes("review")) return Eye;
  if (value.includes("assigned") || value.includes("reassigned")) return UserPlus;
  return Clock3;
}

function toneFor(message: string) {
  const value = message.toLowerCase();
  if (value.includes("approved") || value.includes("completed")) return "bg-[#ECFDF3] text-[#027A48]";
  if (value.includes("revision")) return "bg-[#FFF6ED] text-[#C4320A]";
  if (value.includes("review")) return "bg-[#F4F3FF] text-[#6941C6]";
  if (value.includes("assigned") || value.includes("reassigned")) return "bg-[#EFF8FF] text-[#175CD3]";
  return "bg-[#FEFBE8] text-[#CA8A04]";
}
