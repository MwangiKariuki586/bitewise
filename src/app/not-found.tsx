import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <section className="max-w-lg text-center">
        <p className="font-display text-7xl font-semibold text-primary">404</p>
        <h1 className="mt-4 font-display text-4xl font-semibold">This plate is empty.</h1>
        <p className="mt-4 leading-7 text-muted-foreground">The page may have moved, but there are plenty of useful meal ideas waiting.</p>
        <Button asChild className="mt-7"><Link href="/">Back to BiteWise</Link></Button>
      </section>
    </main>
  );
}
