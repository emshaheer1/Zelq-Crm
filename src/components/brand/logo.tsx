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
}: {
  compact?: boolean;
  inverted?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <ZelqMark className="size-10" />
      {!compact && (
        <div className="min-w-0 leading-tight">
          <p
            className={cn(
              "truncate text-[15px] font-semibold tracking-tight",
              inverted ? "text-white" : "text-foreground",
            )}
          >
            ZelQ
          </p>
          <p className={cn("truncate text-[11px]", inverted ? "text-white/50" : "text-muted-foreground")}>
            Build. Automate. Scale.
          </p>
        </div>
      )}
    </div>
  );
}
