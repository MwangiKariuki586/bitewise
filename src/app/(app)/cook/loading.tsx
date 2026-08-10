import { Skeleton } from "@/components/ui/skeleton";

export default function CookLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-5" role="status" aria-label="Loading Cook Mode">
      <Skeleton className="h-28 rounded-2xl" />
      <Skeleton className="h-16 rounded-xl" />
      <div className="grid gap-3 lg:grid-cols-2"><Skeleton className="h-[9.5rem] rounded-[1.5rem]" /><Skeleton className="h-[9.5rem] rounded-[1.5rem]" /></div>
      <span className="sr-only">Loading Cook Mode...</span>
    </div>
  );
}
