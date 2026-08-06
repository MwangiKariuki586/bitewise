import Link from "next/link";
import { ArrowRight, Clock3, WalletCards } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface FeaturePlaceholderProps {
  eyebrow: string;
  title: string;
  description: string;
  accent: string;
}

export function FeaturePlaceholder({
  eyebrow,
  title,
  description,
  accent,
}: FeaturePlaceholderProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(20rem,0.7fr)]">
      <section className="overflow-hidden rounded-[2rem] bg-primary px-5 py-7 text-primary-foreground shadow-[0_30px_70px_-42px_rgba(22,61,45,0.9)] sm:px-8 sm:py-10">
        <Badge className="bg-white/12 text-primary-foreground ring-1 ring-white/15">
          {eyebrow}
        </Badge>
        <h1 className="mt-6 max-w-3xl font-display text-4xl font-semibold leading-[1.02] tracking-[-0.035em] sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-primary-foreground/75 sm:text-lg">
          {description}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/92">
            <Link href="/onboarding">
              Set up your preferences
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10">
            <Link href="/discover">Browse meal ideas</Link>
          </Button>
        </div>
      </section>

      <Card className="self-stretch bg-card/85">
        <CardHeader>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Designed around your day
          </p>
          <CardTitle>{accent}</CardTitle>
          <CardDescription>
            BiteWise brings cost, cooking time, and what is already in your kitchen into one clear decision.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="flex items-center gap-3 rounded-2xl bg-muted/70 p-4">
            <span className="grid size-10 place-items-center rounded-xl bg-background text-primary shadow-sm">
              <WalletCards className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold">Budget in KES</p>
              <p className="text-xs leading-5 text-muted-foreground">Clear estimated costs before you commit.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-muted/70 p-4">
            <span className="grid size-10 place-items-center rounded-xl bg-background text-primary shadow-sm">
              <Clock3 className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold">Made for the time you have</p>
              <p className="text-xs leading-5 text-muted-foreground">Practical options, from quick plates to slow weekends.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
