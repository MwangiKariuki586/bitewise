# Core Rules – BiteWise

You are building **BiteWise**, a production-quality personal food decision and meal-planning assistant focused on affordable Kenyan meals.

## Stack (do not change)

Next.js App Router, TypeScript (strict), Tailwind + shadcn/ui, Supabase, Zod, Playwright.

## After Every Feature (mandatory)

1. Implement the feature following all rules.
2. Write or update tests (unit/integration + relevant e2e).
3. Run the tests and fix until green.
4. Run typecheck + lint + build.
5. Only mark the feature complete when everything passes.
6. Update STATUS.md.

## General Standards

- TypeScript strict. No `any`.
- Prefer interfaces for object shapes.
- Named exports preferred.
- Use path alias `@/`.
- Mobile-first with Tailwind + shadcn/ui.

01-nextjs-best-practices.mdc

# Next.js + React Best Practices – BiteWise

- Default to React Server Components.
- Use `'use client'` only when truly required.
- Never fetch data in Client Components if it can be done on the server.
- Prefer Server Actions over API routes for mutations.
- Use proper `loading.tsx`, `error.tsx` and Suspense.
- Use `next/image` correctly.
- Dynamic import heavy client components.

02-supabase-security.mdc

# Supabase & Security – BiteWise

- RLS must be enabled on every table.
- Use the server Supabase client for privileged operations.
- Prefer `supabase.auth.getUser()` over `getSession()`.
- Validate every input with Zod on the server.
- Never trust client-side data for authorization.
- Never hard-code secrets.
- Follow least-privilege principle.

03-ui-and-testing.mdc

# UI & Testing – BiteWise

## UI

- Use shadcn/ui + Radix exclusively for interactive components.
- Tailwind only. Mobile-first.
- Forms use Zod + React Hook Form or Server Actions with proper validation.

## Testing

- Every feature must have tests before it is marked complete.
- Vitest + React Testing Library for unit/integration.
- Playwright for critical journeys (especially Eat Now and Meal Plan flows).
- Tests must pass before moving to the next feature.

04-performance-caching-rate-limiting.mdc

# Performance, Caching, Rate Limiting & Efficient Data Access – BiteWise

These rules are mandatory.

## Efficient Querying

- Select only needed columns.
- Use proper indexes.
- Filter, order and limit on the database side.
- No N+1 queries.
- Always paginate lists that can grow.
- Use `.maybeSingle()` or limit(1) for existence checks.

## Efficient Mutations

- Prefer single round-trips.
- Use RPC / database functions for complex multi-table work.
- Keep Server Actions thin.

## Smart Caching

- Use Next.js cache correctly (`revalidateTag`, `revalidatePath`, appropriate `cache` / `revalidate` options).
- Use TanStack Query for client-side data with sensible `staleTime`.
- Do not over-cache sensitive user data.

## Rate Limiting

- Protect auth, Eat Now recommendations, search, and any expensive Server Actions.
- Stricter limits for unauthenticated users.
- Return clear 429 responses when possible.

## General

- Minimize client components.
- Prioritise mobile performance (many Kenyan users are on mobile data).

After any data-related feature, briefly note the caching and rate-limiting approach used.
