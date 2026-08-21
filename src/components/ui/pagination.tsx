import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  getHref: (page: number) => string;
  ariaLabel: string;
  className?: string;
}

type PaginationItem = number | "ellipsis";

export function getPaginationItems(currentPage: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  if (currentPage <= 3) return [1, 2, 3, 4, "ellipsis", totalPages];
  if (currentPage >= totalPages - 2) return [1, 2, "ellipsis", totalPages - 2, totalPages - 1, totalPages];
  return [1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages];
}

export function Pagination({ currentPage, totalPages, getHref, ariaLabel, className }: PaginationProps) {
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;
  const items = getPaginationItems(currentPage, totalPages);
  const navigationClass = "inline-flex min-h-11 items-center gap-2 rounded-xl px-1 text-sm font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:px-2";
  const disabledClass = "inline-flex min-h-11 items-center gap-2 px-1 text-sm font-semibold text-muted-foreground/45 sm:px-2";

  return (
    <nav aria-label={ariaLabel} className={cn("flex w-full items-center justify-between gap-3 py-2 sm:justify-center sm:gap-4 lg:gap-5", className)}>
      {hasPrevious ? (
        <Link href={getHref(currentPage - 1)} rel="prev" className={navigationClass}>
          <ArrowLeft className="size-4.5 text-primary" aria-hidden="true" />
          Previous
        </Link>
      ) : (
        <span className={disabledClass} aria-disabled="true">
          <ArrowLeft className="size-4.5" aria-hidden="true" />
          Previous
        </span>
      )}

      <span className="shrink-0 text-sm font-medium text-foreground sm:hidden">
        {currentPage} of {totalPages}
      </span>

      <ol className="hidden items-center gap-2 sm:flex lg:gap-1">
        {items.map((item, index) => (
          <li key={item === "ellipsis" ? `ellipsis-${index}` : item}>
            {item === "ellipsis" ? (
              <span className="grid size-12 place-items-center text-sm font-semibold text-foreground lg:size-10" aria-hidden="true">…</span>
            ) : item === currentPage ? (
              <span aria-current="page" aria-label={`Page ${item}, current page`} className="grid size-12 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-sm lg:size-10 lg:rounded-xl">
                {item}
              </span>
            ) : (
              <Link href={getHref(item)} aria-label={`Go to page ${item}`} className="grid size-12 place-items-center rounded-full border border-border/70 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:size-10 lg:rounded-xl lg:border-transparent">
                {item}
              </Link>
            )}
          </li>
        ))}
      </ol>

      {hasNext ? (
        <Link href={getHref(currentPage + 1)} rel="next" className={navigationClass}>
          Next
          <ArrowRight className="size-4.5 text-primary" aria-hidden="true" />
        </Link>
      ) : (
        <span className={disabledClass} aria-disabled="true">
          Next
          <ArrowRight className="size-4.5" aria-hidden="true" />
        </span>
      )}
    </nav>
  );
}
