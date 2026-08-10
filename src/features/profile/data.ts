import "server-only";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const profileColumns =
  "display_name,budget_period,budget_minor,household_size,available_minutes,equipment,dietary_preferences,health_goals,preferred_cuisines,preferred_dishes,onboarding_completed";

export async function getCurrentProfile() {
  const identity = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(profileColumns)
    .eq("user_id", identity.sub)
    .maybeSingle();

  if (error) throw new Error("Your profile could not be loaded.");
  return { identity, profile: data };
}

export async function requireCompletedProfile() {
  const result = await getCurrentProfile();
  const profile = result.profile;
  if (!profile?.onboarding_completed) redirect("/onboarding");
  return { ...result, profile };
}
