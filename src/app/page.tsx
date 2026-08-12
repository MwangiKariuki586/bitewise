import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Check, Leaf, ShoppingBasket, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { productAreas } from "@/features/navigation/product-areas";
import { getSessionIdentity } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const identity = await getSessionIdentity();

  if (identity) {
    const supabase = await createClient();
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("user_id", identity.sub)
      .maybeSingle();

    if (error) throw new Error("Your profile could not be loaded.");
    redirect(profile?.onboarding_completed ? "/eat-now" : "/onboarding");
  }

  return (
    <main className="min-h-dvh overflow-hidden">
      <header className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 font-display text-xl font-semibold">
          <span className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <Leaf className="size-5" aria-hidden="true" />
          </span>
          BiteWise
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="/auth/sign-in">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/onboarding">Get started</Link>
          </Button>
        </div>
      </header>

      <section className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 pb-16 pt-10 sm:px-6 sm:pt-16 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:px-8 lg:pb-24">
        <div className="relative z-10">
          <Badge className="bg-secondary text-secondary-foreground">
            <Sparkles className="mr-1.5 size-3.5" aria-hidden="true" />
            Built for everyday Kenyan kitchens
          </Badge>
          <h1 className="mt-6 max-w-3xl font-display text-[clamp(3rem,8vw,6.8rem)] font-semibold leading-[0.9] tracking-[-0.055em] text-balance">
            A better answer to
            <span className="text-primary"> “what should we eat?”</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground">
            Meals that make sense for your budget, ingredients, health needs, cooking time, and the people around your table.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/onboarding">
                Find my next meal
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/discover">Explore local recipes</Link>
            </Button>
          </div>
          <ul className="mt-8 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
            {["KES-first budgets", "Pantry-aware ideas", "Practical cook times"].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="grid size-5 place-items-center rounded-full bg-secondary text-primary">
                  <Check className="size-3" aria-hidden="true" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
          <div className="absolute -inset-16 -z-10 rounded-full bg-accent/12 blur-3xl" />
          <Card className="rotate-[1.5deg] overflow-hidden bg-primary text-primary-foreground ring-0">
            <div className="relative h-52 overflow-hidden bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.22),transparent_34%),linear-gradient(135deg,#d39054_0%,#8d4f32_48%,#1a4936_100%)] sm:h-64">
              <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(12,34,25,0.58),transparent_60%)]" />
              <div className="absolute bottom-5 left-5 right-5">
                <Badge className="bg-white/15 text-white ring-1 ring-white/20">Tonight’s smart pick</Badge>
                <p className="mt-3 font-display text-3xl font-semibold">Githeri with avocado</p>
              </div>
            </div>
            <CardContent className="grid grid-cols-3 gap-3 py-5">
              <div><p className="text-xs text-white/60">Estimated</p><p className="mt-1 font-semibold">KES 320</p></div>
              <div><p className="text-xs text-white/60">Ready in</p><p className="mt-1 font-semibold">35 min</p></div>
              <div><p className="text-xs text-white/60">Serves</p><p className="mt-1 font-semibold">4 people</p></div>
            </CardContent>
          </Card>
          <div className="absolute -bottom-5 -left-2 flex items-center gap-3 rounded-2xl bg-card p-4 shadow-xl ring-1 ring-border sm:-left-8">
            <span className="grid size-11 place-items-center rounded-xl bg-secondary text-primary"><ShoppingBasket className="size-5" aria-hidden="true" /></span>
            <div><p className="text-sm font-semibold">You already have 6 items</p><p className="text-xs text-muted-foreground">Only 3 ingredients to buy</p></div>
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 bg-card/50">
        <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-5 lg:px-8">
          {productAreas.map((area) => {
            const Icon = area.icon;
            return (
              <Link key={area.href} href={area.href} className="group rounded-2xl p-4 transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Icon className="size-5 text-primary" aria-hidden="true" />
                <h2 className="mt-5 font-display text-xl font-semibold">{area.label}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{area.description}</p>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
