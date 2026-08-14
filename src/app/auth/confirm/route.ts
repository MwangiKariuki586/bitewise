import { NextResponse } from "next/server";
import { z } from "zod";

import { safeLocalPath } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/server";

const otpTypeSchema = z.enum([
  "email",
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
]);

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const code = requestUrl.searchParams.get("code");
  const type = otpTypeSchema.safeParse(requestUrl.searchParams.get("type"));
  const next = safeLocalPath(requestUrl.searchParams.get("next")) ?? "/onboarding";
  const supabase = await createClient();

  if (tokenHash && type.success) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type.data,
    });
    if (!error) return NextResponse.redirect(new URL(next, requestUrl.origin));
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, requestUrl.origin));
  }

  return NextResponse.redirect(new URL("/auth/error", requestUrl.origin));
}
