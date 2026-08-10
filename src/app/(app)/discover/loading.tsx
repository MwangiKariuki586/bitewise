import { Skeleton } from "@/components/ui/skeleton";

export default function DiscoverLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-5" aria-label="Loading recipes" role="status">
      <Skeleton className="h-28 rounded-2xl" />
      <Skeleton className="h-24 rounded-[1.5rem]" />
      <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-[9.25rem] rounded-[1.5rem]" />)}
      </div>
      <span className="sr-only">Loading recipes...</span>
    </div>
  );
}
