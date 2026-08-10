import "server-only";

import { headers } from "next/headers";

import { getSessionIdentity } from "@/lib/auth/session";
import { consumeRateLimit } from "@/lib/rate-limit";

export async function enforceDiscoverSearchRateLimit() {
  const [identity, requestHeaders] = await Promise.all([
    getSessionIdentity(),
    headers(),
  ]);
  const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwardedFor || requestHeaders.get("x-real-ip") || "unknown";
  const authenticated = Boolean(identity);
  const allowed = await consumeRateLimit({
    action: authenticated ? "discover_search_authenticated" : "discover_search_guest",
    identifier: authenticated ? `user:${identity?.sub}` : `guest:${ip}`,
    limit: authenticated ? 60 : 30,
    windowSeconds: 60,
  });

  return { allowed, authenticated };
}
