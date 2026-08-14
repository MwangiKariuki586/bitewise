import "server-only";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const profileColumns =
  "display_name,budget_period,budget_minor,household_size,available_minutes,eat_now_minutes,breakfast_minutes,lunch_minutes,dinner_minutes,equipment,dietary_preferences,health_goals,preferred_cuisines,preferred_dishes,onboarding_completed";

export async function getCurrentProfile(returnTo?: string) {
  const identity = await requireUser(returnTo);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(profileColumns)
    .eq("user_id", identity.sub)
    .maybeSingle();

  if (error) throw new Error("Your profile could not be loaded.");
  return { identity, profile: data };
}

export async function requireCompletedProfile(returnTo?: string) {
  const result = await getCurrentProfile(returnTo);
  const profile = result.profile;
  if (!profile?.onboarding_completed) {
    const params = returnTo && returnTo !== "/onboarding"
      ? `?${new URLSearchParams({ returnTo })}`
      : "";
    redirect(`/onboarding${params}`);
  }
  return { ...result, profile };
}
