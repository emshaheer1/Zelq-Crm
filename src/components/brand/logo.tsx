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
    <div className={cn("flex items-center gap-3", className)}>
      <ZelqMark className="size-10" />
      <div className="min-w-0 font-[family-name:var(--font-poppins)] leading-tight">
        <p
          className={cn(
            "truncate text-[15px] font-semibold tracking-tight",
            inverted ? "text-white" : "text-foreground",
          )}
        >
          ZelQ Solutions
        </p>
        <p
          className={cn(
            "truncate text-[11px] font-medium tracking-wide",
            inverted ? "text-white/55" : "text-muted-foreground",
          )}
        >
          Build. Automate. Scale.
        </p>
      </div>
    </div>
  );
}
