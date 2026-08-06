import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
});

const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  RATE_LIMIT_HASH_KEY: z.string().min(32),
});

export function hasSupabaseEnv() {
  return publicEnvSchema.safeParse(process.env).success;
}

export function getPublicEnv() {
  const parsed = publicEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    throw new Error(
      "Supabase is not configured. Add the required values from .env.example.",
    );
  }

  return parsed.data;
}

export function getServerEnv() {
  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    throw new Error(
      "Server-side Supabase and rate limiting are not configured. Add the required values from .env.example.",
    );
  }

  return parsed.data;
}
