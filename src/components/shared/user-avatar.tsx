import { UserRound, Building2 } from "lucide-react";
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

export function ClientAvatar({
  name,
  src,
  className,
}: {
  name: string;
  src?: string | null;
  className?: string;
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");

  return (
    <Avatar className={cn("size-9 rounded-full bg-[#F2F4F7]", className)}>
      {src ? <AvatarImage src={src} alt={name} /> : null}
      <AvatarFallback className="rounded-full bg-[#F2F4F7] text-[11px] font-semibold text-[#344054]">
        {initials || <Building2 className="size-[52%]" aria-hidden="true" />}
        <span className="sr-only">{name}</span>
      </AvatarFallback>
    </Avatar>
  );
}
