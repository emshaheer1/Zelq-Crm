import { cn } from "@/lib/utils";

export function ZelqMark({ className }: { className?: string }) {
  return (
    <img
      src="/z-logo.png"
      alt="ZelQ"
      className={cn("size-8 shrink-0 rounded-lg object-cover", className)}
    />
  );
}

export function ZelqLogo({
  compact = false,
  inverted = false,
  className,
}: {
  compact?: boolean;
  inverted?: boolean;
  className?: string;
}) {
  if (compact) {
    return <ZelqMark className={cn("size-10", className)} />;
  }

  return (
    <img
      src="/logo-full.png"
      alt="ZelQ Solutions"
      className={cn(
        "h-12 w-auto max-w-[200px] object-contain object-left",
        inverted && "mix-blend-screen",
        className,
      )}
    />
  );
}
