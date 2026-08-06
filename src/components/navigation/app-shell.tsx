"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf } from "lucide-react";

import { productAreas } from "@/features/navigation/product-areas";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh border-r border-border/60 bg-card/75 p-5 backdrop-blur-xl lg:flex lg:flex-col">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-2xl px-2 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Leaf className="size-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block font-display text-xl font-semibold leading-none">
              BiteWise
            </span>
            <span className="mt-1 block text-xs text-muted-foreground">
              Eat well, wisely
            </span>
          </span>
        </Link>

        <nav aria-label="Main navigation" className="mt-10 space-y-1.5">
          {productAreas.map((area) => {
            const active = pathname.startsWith(area.href);
            const Icon = area.icon;
            return (
              <Link
                key={area.href}
                href={area.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex min-h-12 items-center gap-3 rounded-2xl px-3.5 text-sm font-medium text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
                {area.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-2xl bg-secondary/65 p-4 text-sm leading-6 text-secondary-foreground">
          <p className="font-semibold">Made for real kitchens</p>
          <p className="mt-1 text-muted-foreground">
            Budget-aware ideas for everyday Kenyan meals.
          </p>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/60 bg-background/85 px-4 backdrop-blur-xl lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 font-display text-lg font-semibold lg:hidden"
          >
            <span className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Leaf className="size-4" aria-hidden="true" />
            </span>
            BiteWise
          </Link>
          <p className="hidden text-sm text-muted-foreground lg:block">
            Practical food decisions, shaped around your day.
          </p>
          <Link
            href="/profile"
            className="grid size-10 place-items-center rounded-full bg-accent font-semibold text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Open profile"
          >
            BW
          </Link>
        </header>

        <main className="mx-auto w-full max-w-[92rem] px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
          {children}
        </main>
      </div>

      <nav
        aria-label="Main navigation"
        className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-[1.4rem] border border-border/60 bg-card/95 p-1.5 shadow-[0_16px_48px_-16px_rgba(45,39,27,0.4)] backdrop-blur-xl lg:hidden"
      >
        {productAreas.map((area) => {
          const active = pathname.startsWith(area.href);
          const Icon = area.icon;
          return (
            <Link
              key={area.href}
              href={area.href}
              aria-label={area.label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[0.66rem] font-semibold text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active && "bg-primary text-primary-foreground",
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
              <span className="max-w-full truncate">{area.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
