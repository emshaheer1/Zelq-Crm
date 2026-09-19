import { UserRound } from "lucide-react";
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
