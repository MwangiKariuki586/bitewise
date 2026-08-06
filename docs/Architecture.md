# Architecture & Tech Decisions – BiteWise

**App Name:** BiteWise

## Stack (locked)

- **Framework**: Next.js (App Router) + TypeScript (strict)
- **Styling**: Tailwind CSS + shadcn/ui + Radix
- **Backend / Auth / DB**: Supabase (Postgres + Auth + RLS + Storage)
- **Validation**: Zod
- **Testing**: Playwright (e2e) + Vitest + React Testing Library
- **Deployment**: Handled by the user

## High-Level Architecture

- Next.js App Router with React Server Components by default
- Supabase for data, auth and storage
- Server Actions for mutations
- Zod as single source of truth for validation + types
- Feature-based structure inside `src/`

## Recommended Folder Structure
