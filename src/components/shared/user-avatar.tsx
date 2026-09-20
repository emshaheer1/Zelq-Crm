import {
  Briefcase,
  Building2,
  Car,
  Cpu,
  Factory,
  GraduationCap,
  Hammer,
  Landmark,
  Megaphone,
  Palette,
  ShoppingBag,
  Stethoscope,
  Store,
  UserRound,
  Utensils,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function UserAvatar({
  name,
  src,
  className,
}: {
  name: string;
  src?: string | null;
  className?: string;
}) {
  return (
    <Avatar className={cn("size-8 rounded-full bg-muted", className)}>
      {src ? <AvatarImage src={src} alt={name} /> : null}
      <AvatarFallback className="rounded-full bg-muted text-muted-foreground">
        <UserRound className="size-[52%]" aria-hidden="true" />
        <span className="sr-only">{name}</span>
      </AvatarFallback>
    </Avatar>
  );
}

const businessIcons = [
  { Icon: Building2, tone: "bg-[#F2F4F7] text-[#344054]" },
  { Icon: Store, tone: "bg-[#ECFDF3] text-[#027A48]" },
  { Icon: Factory, tone: "bg-[#FFF6ED] text-[#C4320A]" },
  { Icon: Landmark, tone: "bg-[#F4F3FF] text-[#6941C6]" },
  { Icon: Briefcase, tone: "bg-[#FEFBE8] text-[#CA8A04]" },
  { Icon: ShoppingBag, tone: "bg-[#FEF3F2] text-[#B42318]" },
  { Icon: Cpu, tone: "bg-[#111827] text-[#b7ff00]" },
  { Icon: Utensils, tone: "bg-[#FFF6ED] text-[#9A3412]" },
  { Icon: Stethoscope, tone: "bg-[#ECFDF3] text-[#065F46]" },
  { Icon: GraduationCap, tone: "bg-[#F4F3FF] text-[#42389D]" },
  { Icon: Car, tone: "bg-[#F2F4F7] text-[#111827]" },
  { Icon: Hammer, tone: "bg-[#FEFBE8] text-[#854D0E]" },
  { Icon: Palette, tone: "bg-[#FEF3F2] text-[#912018]" },
  { Icon: Megaphone, tone: "bg-[#ECFDF3] text-[#05603A]" },
] as const;

function businessIndex(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % businessIcons.length;
  }
  return hash;
}

export function ClientAvatar({
  name,
  id,
  className,
}: {
  name: string;
  id?: string;
  className?: string;
}) {
  const { Icon, tone } = businessIcons[businessIndex(id || name)]!;
  return (
    <span
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-full",
        tone,
        className,
      )}
    >
      <Icon className="size-[46%]" aria-hidden="true" />
      <span className="sr-only">{name}</span>
    </span>
  );
}
