import Link from "next/link";
import { Clock3, CookingPot, Heart, Pencil, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/features/auth/actions";
import { getCurrentProfile } from "@/features/profile/data";
import {
  cuisineOptions,
  dietaryOptions,
  equipmentOptions,
  healthGoalOptions,
} from "@/features/profile/options";

function labels(values: string[], options: readonly { value: string; label: string }[]) {
  const labelMap = new Map(options.map(({ value, label }) => [value, label]));
  return values.map((value) => labelMap.get(value) ?? value);
}

function PreferenceGroup({ title, values }: { title: string; values: string[] }) {
  return (
    <div>
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {values.length ? values.map((value) => <Badge key={value}>{value}</Badge>) : <span className="text-sm text-muted-foreground">No preferences selected</span>}
      </div>
    </div>
  );
}

export default async function ProfilePage() {
  const { profile } = await getCurrentProfile("/profile");

  if (!profile) {
    return (
      <section className="mx-auto max-w-2xl rounded-[1.75rem] bg-card p-7 text-center shadow-sm sm:p-10">
        <h1 className="font-display text-4xl font-semibold">Make BiteWise yours.</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">Set your budget, household, kitchen, and food preferences to unlock practical recommendations.</p>
        <Button asChild size="lg" className="mt-7"><Link href="/onboarding">Start setup</Link></Button>
      </section>
    );
  }

  const budget = profile.budget_minor ? `KES ${(profile.budget_minor / 100).toLocaleString("en-KE")} / ${profile.budget_period}` : "Not set";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Your preferences</p>
          <h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">Meals shaped around {profile.display_name ?? "you"}.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">These defaults guide recommendations and plans. You can still adjust them for a particular meal.</p>
        </div>
        <Button asChild><Link href="/profile/edit"><Pencil className="size-4" aria-hidden="true" />Edit preferences</Link></Button>
      </header>

      <section aria-label="Practical defaults" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Heart, label: "Food budget", value: budget },
          { icon: Users, label: "People to serve", value: String(profile.household_size) },
          { icon: Clock3, label: "Cooking time", value: `${profile.available_minutes} minutes` },
          { icon: CookingPot, label: "Equipment", value: `${profile.equipment.length} selected` },
        ].map(({ icon: Icon, label, value }) => (
          <article key={label} className="rounded-2xl bg-card p-5 shadow-[0_12px_35px_-28px_rgba(45,39,27,0.75)]">
            <Icon className="size-5 text-primary" aria-hidden="true" />
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-1 font-semibold">{value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 rounded-[1.75rem] bg-card p-6 shadow-sm sm:p-8 lg:grid-cols-2">
        <PreferenceGroup title="Kitchen equipment" values={labels(profile.equipment, equipmentOptions)} />
        <PreferenceGroup title="Dietary needs" values={labels(profile.dietary_preferences, dietaryOptions)} />
        <PreferenceGroup title="Health goals" values={labels(profile.health_goals, healthGoalOptions)} />
        <PreferenceGroup title="Cuisines" values={labels(profile.preferred_cuisines, cuisineOptions)} />
        <PreferenceGroup title="Favourite dishes" values={profile.preferred_dishes} />
      </section>

      <form action={signOutAction}>
        <Button type="submit" variant="outline">Sign out</Button>
      </form>
    </div>
  );
}
