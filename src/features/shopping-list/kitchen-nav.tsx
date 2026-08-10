import Link from "next/link";

import { cn } from "@/lib/utils";

type KitchenArea = "pantry" | "leftovers" | "shopping-list" | "saved";

const areas = [
  { href: "/my-kitchen", label: "Pantry", value: "pantry" },
  { href: "/my-kitchen/leftovers", label: "Leftovers", value: "leftovers" },
  { href: "/my-kitchen/shopping-list", label: "Shopping list", value: "shopping-list" },
  { href: "/my-kitchen/saved", label: "Saved meals", value: "saved" },
] as const;

export function KitchenNav({ active }: { active: KitchenArea }) {
  return (
    <nav
      aria-label="My Kitchen sections"
      className="flex max-w-full gap-1 overflow-x-auto rounded-2xl bg-muted/70 p-1.5 sm:w-fit"
    >
      {areas.map((area) => (
        <Link
          key={area.value}
          href={area.href}
          aria-current={active === area.value ? "page" : undefined}
          className={cn(
            "shrink-0 rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            active === area.value && "bg-card font-semibold text-primary shadow-sm",
          )}
        >
          {area.label}
        </Link>
      ))}
    </nav>
  );
}
