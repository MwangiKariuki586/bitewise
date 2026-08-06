<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:bitewise-project-rules -->

# BiteWise Project Rules

You are building **BiteWise**, a production-quality personal food decision and
meal-planning assistant focused on affordable Kenyan meals.

## Locked Stack

Do not change the stack without explicit user approval:

- Next.js App Router
- TypeScript in strict mode
- Tailwind CSS with shadcn/ui and Radix UI
- Supabase
- Zod
- Vitest and React Testing Library
- Playwright

## Mandatory Feature Workflow

After every feature:

1. Implement the feature following all repository rules.
2. Write or update unit, integration, and relevant end-to-end tests.
3. Run the tests and fix failures until they pass.
4. Run type checking, linting, and the production build.
5. Mark the feature complete only after every required check passes.
6. Update `docs/status.md` with verified progress and any outstanding manual
   checks.

## TypeScript and General Standards

- Keep TypeScript strict and do not use `any`.
- Prefer interfaces for object shapes.
- Prefer named exports, except where Next.js requires a default export.
- Use the `@/` path alias.
- Build mobile-first with Tailwind CSS and shadcn/ui.

## Next.js and React

- Before writing Next.js code, read the relevant installed guide under
  `node_modules/next/dist/docs/` and follow its current APIs and deprecations.
- Default to React Server Components.
- Use `'use client'` only when client-side state, effects, event handlers, or
  browser APIs require it.
- Fetch data on the server when it can be fetched there.
- Prefer Server Actions for mutations initiated by the application UI; use
  Route Handlers when an HTTP endpoint is required.
- Keep Server Actions thin.
- Use appropriate `loading.tsx`, `error.tsx`, and Suspense boundaries.
- Use `next/image` correctly.
- Dynamically import heavy client components when it provides a real bundle or
  loading benefit.

## Supabase and Security

- Enable Row Level Security on every exposed table and add least-privilege
  policies for the supported operations.
- Use a server-side Supabase client for privileged operations.
- Never expose a secret or `service_role` key to the browser.
- Verify the authenticated user on the server; do not trust the user object
  returned by `getSession()` for authorization decisions.
- Validate every untrusted input with Zod on the server.
- Never trust client-side data for authentication, authorization, ownership, or
  other security decisions.
- Never hard-code secrets.
- Follow least privilege throughout the database, Storage, and application.

## UI and Forms

- Use shadcn/ui and Radix UI for interactive component patterns.
- Use Tailwind CSS for styling and design mobile-first.
- Build forms with Zod and either React Hook Form or Server Actions, with proper
  server-side validation.
- Preserve semantic HTML, keyboard access, visible focus, accessible labels,
  useful error messages, and sufficient colour contrast.

## Testing

- Every feature must have tests before it is marked complete.
- Use Vitest and React Testing Library for unit and integration coverage.
- Use Playwright for critical journeys, especially Eat Now and Meal Plan.
- Add regression coverage for bug fixes when the behavior is testable.
- Do not proceed past a feature with failing required tests.

## Efficient Data Access

- Select only the columns needed by the use case.
- Add appropriate indexes.
- Filter, order, aggregate, and limit in the database.
- Avoid N+1 queries.
- Paginate lists that can grow.
- Use `.maybeSingle()` or an explicit one-row limit for optional existence
  checks.
- Prefer a single round trip for related mutations.
- Use a database function/RPC for atomic complex multi-table operations.

## Caching

- Follow the installed Next.js caching documentation; do not assume behavior
  from a different framework version.
- Choose caching deliberately and invalidate affected data after mutations.
- Use appropriate path or tag invalidation for the installed Next.js version.
- Use TanStack Query only for justified client-side server state, with a
  sensible `staleTime` and mutation invalidation.
- Do not put sensitive or user-specific data in a shared cache.

## Rate Limiting and Performance

- Protect authentication, Eat Now recommendations, search, and expensive
  Server Actions or Route Handlers with rate limits.
- Apply stricter limits to unauthenticated users.
- Return a clear HTTP 429 response from HTTP endpoints when appropriate.
- Minimise Client Components and prioritise performance for users on mobile
  data.
- After every data-related feature, briefly document its querying, caching,
  invalidation, and rate-limiting approach.

<!-- END:bitewise-project-rules -->
