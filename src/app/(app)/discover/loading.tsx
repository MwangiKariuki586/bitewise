import { Skeleton } from "@/components/ui/skeleton";

export default function DiscoverLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-7" aria-label="Loading recipes" role="status">
      <Skeleton className="h-56 rounded-[2rem]" />
      <Skeleton className="h-32 rounded-[1.75rem]" />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="aspect-[4/5] rounded-[1.5rem]" />)}
      </div>
      <span className="sr-only">Loading recipes...</span>
    </div>
  );
}
