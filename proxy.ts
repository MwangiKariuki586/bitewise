import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

// Refresh the session and preserve protected destinations across authentication.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)",
  ],
};
