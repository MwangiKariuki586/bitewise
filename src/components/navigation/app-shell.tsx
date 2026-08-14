"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf } from "lucide-react";

import { productAreas } from "@/features/navigation/product-areas";
import { cn } from "@/lib/utils";

interface AppShellProps {
  accountMenu: React.ReactNode;
  children: React.ReactNode;
}

export function AppShell({ accountMenu, children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-50 -translate-y-24 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-transform focus:translate-y-0 motion-reduce:transition-none"
      >
        Skip to main content
      </a>
      <aside
        aria-label="BiteWise navigation"
        className="sticky top-0 hidden h-dvh border-r border-border/60 bg-card/75 p-5 backdrop-blur-xl lg:flex lg:flex-col"
      >
        <Link href="/" className="flex items-center gap-3 rounded-2xl px-2 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Leaf className="size-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block font-display text-xl font-semibold leading-none">BiteWise</span>
            <span className="mt-1 block text-xs text-muted-foreground">Eat well, wisely</span>
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
                  active ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted hover:text-foreground",
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
          <p className="mt-1 text-muted-foreground">Budget-aware ideas for everyday Kenyan meals.</p>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-[4.5rem] items-center justify-between border-b border-border/45 bg-card/82 px-4 backdrop-blur-xl lg:h-16 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 font-display text-xl font-semibold lg:hidden">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Leaf className="size-4" aria-hidden="true" />
            </span>
            BiteWise
          </Link>
          <p className="hidden text-sm text-muted-foreground lg:block">Practical food decisions, shaped around your day.</p>
          {accountMenu}
        </header>

        <main id="main-content" className="mx-auto w-full max-w-[92rem] px-4 pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pb-10 lg:pt-8">
          {children}
        </main>
      </div>

      <nav
        aria-label="Main navigation"
        data-slot="bottom-navigation"
        className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 grid grid-cols-5 rounded-[1.35rem] border border-border/55 bg-card/96 p-1.5 shadow-[0_14px_40px_-18px_rgba(91,23,51,0.38)] backdrop-blur-xl lg:hidden"
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
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[0.64rem] font-semibold text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active && "bg-primary text-primary-foreground shadow-sm",
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
