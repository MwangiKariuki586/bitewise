import "server-only";

import { createHmac } from "node:crypto";

import { getServerEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

interface RateLimitInput {
  action: string;
  identifier: string;
  limit: number;
  windowSeconds: number;
}

export async function consumeRateLimit({
  action,
  identifier,
  limit,
  windowSeconds,
}: RateLimitInput) {
  const env = getServerEnv();
  const keyHash = createHmac("sha256", env.RATE_LIMIT_HASH_KEY)
    .update(identifier.trim().toLowerCase())
    .digest("hex");
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("consume_rate_limit", {
    p_key_hash: keyHash,
    p_action: action,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    throw new Error("Rate limiting is temporarily unavailable.");
  }

  return data;
}
