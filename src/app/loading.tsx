import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8" aria-label="Loading BiteWise">
      <Skeleton className="h-10 w-40" />
      <div className="mt-12 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <Skeleton className="h-[28rem] rounded-[2rem]" />
        <Skeleton className="h-[28rem] rounded-[2rem]" />
      </div>
    </main>
  );
}
