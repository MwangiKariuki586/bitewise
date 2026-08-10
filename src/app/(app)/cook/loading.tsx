import { Skeleton } from "@/components/ui/skeleton";

export default function CookLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-7" role="status" aria-label="Loading Cook Mode">
      <Skeleton className="h-56 rounded-[2rem]" />
      <div className="grid gap-5 lg:grid-cols-2"><Skeleton className="h-64 rounded-[1.5rem]" /><Skeleton className="h-64 rounded-[1.5rem]" /></div>
      <span className="sr-only">Loading Cook Mode...</span>
    </div>
  );
}
