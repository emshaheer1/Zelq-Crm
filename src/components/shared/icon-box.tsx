import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const tones = {
  lime: "bg-primary/15 text-foreground",
  charcoal: "bg-secondary text-secondary-foreground",
  blue: "bg-[#EFF8FF] text-[#175CD3]",
  purple: "bg-[#F4F3FF] text-[#6941C6]",
  orange: "bg-[#FFF6ED] text-[#C4320A]",
  green: "bg-[#ECFDF3] text-[#027A48]",
  red: "bg-[#FEF3F2] text-[#B42318]",
  muted: "bg-muted text-muted-foreground",
} as const;

export type IconTone = keyof typeof tones;

export function IconBox({
  icon: Icon,
  tone = "lime",
  className,
  iconClassName,
}: {
  icon: LucideIcon;
  tone?: keyof typeof tones;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-lg",
        tones[tone],
        className,
      )}
    >
      <Icon className={cn("size-5", iconClassName)} aria-hidden="true" />
    </span>
  );
}
