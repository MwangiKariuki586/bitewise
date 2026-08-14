import Link from "next/link";

import { AccountMenu } from "@/components/navigation/account-menu";
import { buttonVariants } from "@/components/ui/button";
import { getSessionIdentity } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function ProfileMenu() {
  const identity = await getSessionIdentity();
  if (!identity) {
    return (
      <Link href="/auth/sign-in" className={buttonVariants({ variant: "outline", size: "sm" })}>
        Sign in
      </Link>
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("user_id", identity.sub)
    .maybeSingle();
  if (error) throw new Error("Your account menu could not be loaded.");

  return <AccountMenu displayName={data?.display_name ?? null} email={identity.email ?? null} />;
}
