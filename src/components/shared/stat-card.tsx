import type { LucideIcon } from "lucide-react";
import { IconBox, type IconTone } from "@/components/shared/icon-box";
import { cn } from "@/lib/utils";

const valueTone: Record<IconTone, string> = {
  lime: "text-[#111111]",
  charcoal: "text-[#111111]",
  blue: "text-[#175CD3]",
  purple: "text-[#6941C6]",
  orange: "text-[#C4320A]",
  green: "text-[#027A48]",
  red: "text-[#B42318]",
  muted: "text-foreground",
};

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "muted",
  danger = false,
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon?: LucideIcon;
  tone?: IconTone;
  danger?: boolean;
}) {
  const palette = danger ? "red" : tone;
  const display =
    typeof value === "number" ? String(value).padStart(2, "0") : value;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p
            className={cn(
              "mt-2.5 text-[26px] leading-none font-semibold tracking-tight tabular-nums",
              valueTone[palette],
            )}
          >
            {display}
          </p>
          {hint ? <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        {icon ? (
          <IconBox icon={icon} tone={palette} className="size-9" iconClassName="size-4" />
        ) : null}
      </div>
    </div>
  );
}
