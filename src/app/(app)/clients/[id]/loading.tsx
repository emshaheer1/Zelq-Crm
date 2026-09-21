import { Skeleton } from "@/components/ui/skeleton";

export default function ClientProfileLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Skeleton className="size-14 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <Skeleton className="h-28 rounded-xl" />
      <Skeleton className="h-32 rounded-xl" />
      <Skeleton className="h-40 rounded-xl" />
    </div>
  );
}
