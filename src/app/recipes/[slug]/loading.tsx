import { AppShell } from "@/components/navigation/app-shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function RecipeDetailLoading() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-7" aria-label="Loading recipe" role="status">
        <Skeleton className="h-[32rem] rounded-[2rem]" />
        <div className="grid gap-6 lg:grid-cols-2"><Skeleton className="h-96 rounded-[1.5rem]" /><Skeleton className="h-96 rounded-[1.5rem]" /></div>
        <span className="sr-only">Loading recipe...</span>
      </div>
    </AppShell>
  );
}
