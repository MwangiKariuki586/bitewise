import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { z } from "zod";

import { authPath, safeReturnPath } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/server";

const claimsSchema = z.object({
  sub: z.string().uuid(),
  email: z.string().email().optional(),
});

export const getSessionIdentity = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    return null;
  }

  const parsed = claimsSchema.safeParse(data.claims);
  return parsed.success ? parsed.data : null;
});

export async function requireUser(returnTo?: string) {
  const identity = await getSessionIdentity();

  if (!identity) {
    redirect(authPath("/auth/sign-in", safeReturnPath(returnTo)));
  }

  return identity;
}
