const localOrigin = "https://bitewise.local";
const protectedRoutePrefixes = [
  "/cook",
  "/eat-now",
  "/meal-plan",
  "/my-kitchen",
  "/onboarding",
  "/profile",
] as const;
const returnRoutePrefixes = [...protectedRoutePrefixes, "/discover", "/recipes"] as const;

export function safeLocalPath(value: string | null | undefined) {
  if (!value?.startsWith("/") || value.startsWith("//")) return null;

  try {
    const url = new URL(value, localOrigin);
    if (url.origin !== localOrigin) return null;
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

export function isProtectedAppPath(pathname: string) {
  return protectedRoutePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function safeReturnPath(value: string | null | undefined) {
  const path = safeLocalPath(value);
  if (!path) return null;

  const pathname = new URL(path, localOrigin).pathname;
  return returnRoutePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
    ? path
    : null;
}

export function authPath(pathname: string, nextPath: string | null) {
  if (!nextPath) return pathname;
  const params = new URLSearchParams({ next: nextPath });
  return `${pathname}?${params}`;
}

export function postAuthenticationPath(
  requestedPath: string | null,
  onboardingCompleted: boolean,
) {
  const nextPath = safeReturnPath(requestedPath);

  if (onboardingCompleted) return nextPath ?? "/eat-now";
  if (!nextPath || nextPath === "/onboarding" || nextPath.startsWith("/onboarding?")) {
    return "/onboarding";
  }

  return `/onboarding?${new URLSearchParams({ returnTo: nextPath })}`;
}
