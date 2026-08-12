"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Heart, LogOut, Settings2, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { signOutAction } from "@/features/auth/actions";

export interface AccountSummary {
  displayName: string | null;
  email: string | null;
}

export function accountInitials({ displayName, email }: AccountSummary) {
  const nameParts = displayName?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (nameParts.length) {
    const selected = nameParts.length === 1
      ? nameParts[0].slice(0, 2)
      : `${nameParts[0][0]}${nameParts.at(-1)?.[0] ?? ""}`;
    return selected.toLocaleUpperCase("en-KE");
  }

  const emailName = email?.split("@")[0]?.replace(/[^a-zA-Z0-9]+/g, " ").trim();
  const emailParts = emailName?.split(/\s+/).filter(Boolean) ?? [];
  if (!emailParts.length) return "BW";
  return (emailParts.length === 1
    ? emailParts[0].slice(0, 2)
    : `${emailParts[0][0]}${emailParts.at(-1)?.[0] ?? ""}`
  ).toLocaleUpperCase("en-KE");
}

export function AccountMenu({ displayName, email }: AccountSummary) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const initials = accountInitials({ displayName, email });
  const accessibleName = displayName?.trim() || email || "your account";

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={`Open account menu for ${accessibleName}`}
        aria-expanded={open}
        aria-controls="account-menu-card"
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-11 items-center gap-1.5 rounded-full p-0.5 pr-2 text-sm font-semibold outline-none transition-colors hover:bg-secondary/70 focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="grid size-10 place-items-center rounded-full bg-accent font-bold text-accent-foreground shadow-sm">
          {initials}
        </span>
        <ChevronDown
          className={`size-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <section
          id="account-menu-card"
          aria-label="Account menu"
          className="absolute right-0 top-[calc(100%+0.65rem)] z-50 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl bg-card shadow-[0_22px_55px_-24px_rgba(45,39,27,0.65)] ring-1 ring-border"
        >
          <div className="flex items-center gap-3 border-b border-border/70 p-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary font-display text-lg font-semibold text-primary-foreground">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold">{displayName || "Your BiteWise account"}</p>
              {email ? <p className="truncate text-xs text-muted-foreground">{email}</p> : null}
            </div>
          </div>

          <nav aria-label="Profile options" className="space-y-1 p-2">
            {[
              { href: "/profile", label: "Profile", icon: UserRound },
              { href: "/onboarding?returnTo=/profile", label: "Edit preferences", icon: Settings2 },
              { href: "/my-kitchen/saved", label: "Saved meals", icon: Heart },
            ].map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium outline-none transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Icon className="size-4 text-primary" aria-hidden="true" />
                {label}
              </Link>
            ))}
          </nav>

          <form action={signOutAction} className="border-t border-border/70 p-2">
            <Button type="submit" variant="ghost" className="w-full justify-start text-destructive hover:bg-destructive/8 hover:text-destructive">
              <LogOut className="size-4" aria-hidden="true" />
              Sign out
            </Button>
          </form>
        </section>
      ) : null}
    </div>
  );
}
