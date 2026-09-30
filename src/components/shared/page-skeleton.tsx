import { Skeleton } from "@/components/ui/skeleton";

export function PageSkeleton({
  stats = 4,
  panels = 2,
}: {
  stats?: number;
  panels?: number;
}) {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading page">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      {stats > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: stats }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : null}
      <div className={`grid gap-6 ${panels > 1 ? "xl:grid-cols-[1.65fr_0.85fr]" : ""}`}>
        {Array.from({ length: panels }).map((_, index) => (
          <Skeleton key={index} className="h-80 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading details">
      <div className="space-y-2">
        <Skeleton className="h-7 w-64 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <Skeleton className="h-[420px] rounded-xl" />
        <Skeleton className="h-[420px] rounded-xl" />
      </div>
    </div>
  );
}
