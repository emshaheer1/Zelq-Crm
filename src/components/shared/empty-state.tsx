import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { IconBox } from "@/components/shared/icon-box";

export function EmptyState({
  title,
  description,
  action,
  icon = Inbox,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 px-6 py-10 text-center">
      <IconBox icon={icon} tone="muted" />
      <p className="mt-3 text-[13px] font-semibold text-foreground">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
