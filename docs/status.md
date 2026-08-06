# BiteWise – Project Status

## Milestones

- [x] Project setup & authentication
- [x] User profile & constraints
- [x] My Kitchen (pantry + leftovers)
- [ ] Eat Now (core recommendation engine)
- [ ] Meal Plan + Shopping List
- [ ] Discover + Watch & Cook
- [ ] Cook Mode
- [ ] Personalisation (likes / dislikes / recently eaten)
- [ ] Final polish, caching review & full e2e coverage

## Current Feature

Milestone 4 – Eat Now

Active feature: Curated recipe and cost catalogue

Status: In progress

Verified: 2026-08-06 – My Kitchen validator tests, hosted Pantry and Leftovers CRUD journeys on mobile and desktop, two-user live RLS isolation for both data sets, temporary fixture cleanup, typecheck, lint, production build, zero Supabase security findings, and no actionable performance findings passed.

Foundation and design system completed and verified.

Supabase foundation completed and verified against the hosted development project.

Authentication completed with email/password registration, confirmation, sign-in, sign-out, forgotten-password and password-update flows. Authentication actions use server-side Zod validation, independent identity checks, neutral recovery responses, and database-backed limits of 5 attempts per 10 minutes for sign-in/sign-up and 3 reset requests per hour. Personalized data remains request-scoped and uncached.

Owner manual checks: confirm real registration and recovery email delivery, email template token links, and hosted redirect allow-list entries before release.

User profile and constraints completed with resumable three-step onboarding and editable settings for integer KES budget, household size, available time, canonical equipment, dietary restrictions, health goals, cuisines, and preferred dishes. Eat Now and Meal Plan require completed onboarding. Profile reads select only required columns; private data is request-scoped and uncached; writes revalidate only Profile, Eat Now, and Meal Plan. No additional rate limit is required for these inexpensive authenticated preference writes.

Pantry completed with ingredient-linked CRUD, canonical quantities and units, optional expiry dates and notes, database-side search, 20-item pagination, and expired/soon-to-expire/usable grouping. The single paginated query selects only displayed columns and joins ingredient names without N+1 reads. User expiry, ingredient lookup, trigram search, and foreign-key indexes are present. Private pantry data is request-scoped and uncached; writes invalidate My Kitchen, Eat Now, and Meal Plan. No extra rate limit is required for inexpensive authenticated pantry mutations.

Supabase performance advisor currently reports only expected informational notices for newly created indexes that have not accumulated production usage; the actionable missing foreign-key index finding was fixed.

Leftovers completed with user-owned CRUD, fractional servings, prepared/use-by dates, optional notes, database-side search, pagination-ready queries, and expired/expiring/usable grouping. Expired leftovers are explicitly excluded from recommendation inventory. Reads select only displayed columns, remain request-scoped and uncached, and writes invalidate My Kitchen and Eat Now. No extra rate limit is required for inexpensive authenticated leftover mutations.

Next feature: Eat Now deterministic recommendation engine

## Notes

- Agent must update this file after every completed feature.
- Every feature must pass its tests + typecheck + lint + build before being marked done.
- Caching, rate limiting and efficient querying rules must be followed on all data features.
