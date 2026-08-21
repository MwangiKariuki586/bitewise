# BiteWise – Project Status

## Milestones

- [x] Project setup & authentication
- [x] User profile & constraints
- [x] My Kitchen (pantry + leftovers)
- [x] Eat Now (core recommendation engine)
- [x] Meal Plan + Shopping List
- [x] Discover + Watch & Cook
- [x] Cook Mode
- [x] Personalisation (likes / dislikes / recently eaten)
- [x] Final polish, caching review & full e2e coverage

## Current Feature

Milestone 9 – Final polish, caching review & full e2e coverage

Active feature: BiteWise MVP

Status: Complete

Responsive pagination is now shared across Discover, Pantry, Leftovers, Saved
Meals, and Shopping List. It uses numbered ranges with ellipses on tablet and
desktop, larger circular tablet targets, compact desktop controls, a subtle
container-free treatment, and an `x of y` mobile summary. Current,
previous/next, disabled, focus, and accessible-label states are covered by
component tests. Querying, caching, invalidation, and rate limiting are
unchanged because this is a presentation-only refactor of existing page links.

Eat Now responsive refinement completed from the supplied desktop, tablet, and
mobile mockups. The page now uses a branded food hero, exposes the complete
constraints form before generation, collapses only after a successful response,
retains submitted budget, servings, time, meal type, equipment, and dietary
values, and reopens through Edit. Failed generation remains expanded. Results
use compact responsive cards with pantry and missing-item summaries; detailed
meal content stays on the existing dedicated recipe route. Best-fit, cost, time,
and pantry sorting plus recommendation state and scroll position are preserved
in session storage across the recipe-details round trip. Regeneration collapses
again only after success, and the existing mobile safe-area clearance remains in
place.

The recommendation query, public catalogue cache, private request-scoped data,
invalidation, and the existing authenticated limit of 20 recommendation lists
per 10 minutes are unchanged. Verified with 89 unit/integration tests, all 58
mobile/desktop Playwright journeys (57 passed and one intentional desktop skip
for the mobile-only density check), strict typecheck, warning-free lint,
production build, and `git diff --check`. The connected browser session was
signed out and could not render the authenticated Eat Now state, so fresh
screenshot-to-mockup visual sign-off remains blocked; see `design-qa.md`.

Eat Now session restoration follow-up: persisted recommendation state now carries
an explicit schema version and is shape-checked before rendering. Legacy or
malformed session data is removed automatically and falls back to the full
constraints form, preventing the route-level error boundary seen after the
constraint-state shape changed. This client-only recovery does not change
queries, caching, invalidation, or rate limiting. Regression coverage reproduces
the incompatible legacy payload. The follow-up passed all 89 unit/integration
tests, the seven affected mobile/desktop catalogue journeys with one intentional
desktop skip, strict typecheck, lint, production build, and `git diff --check`.

Eat Now result transition follow-up: after a successful initial generation or
regeneration, the collapsed form now smoothly scrolls the shortlist heading
directly beneath the sticky application header. Failed generation does not move
the viewport, and reduced-motion preferences replace the animation with an
immediate aligned jump. The result section uses responsive scroll margin so the
header does not cover its heading. This client-only interaction does not change
queries, caching, invalidation, or rate limiting. Verified with all 89
unit/integration tests, all 58 mobile/desktop Playwright journeys (57 passed and
one intentional desktop skip), strict typecheck, lint, production build, and
`git diff --check`.

Eat Now desktop-density follow-up: at 1280 px and wider, the successful state
now follows the supplied desktop reference with a sticky 19rem constraint rail
beside a bordered shortlist panel. Meal cards use one aligned row for the image,
cuisine and pantry badges, summary, four key metrics, pantry/missing status, and
details/save/overflow actions. Like, dislike, and recently-eaten actions remain
available inside the overflow menu. Desktop keeps the full editable constraint
rail visible while the existing mobile success summary still collapses. This is
a presentation-only refinement with no query, cache, invalidation, or
rate-limiting changes. Verified with all 90 unit/integration tests, all 58
mobile/desktop Playwright journeys (57 passed and one intentional desktop skip),
including a 1600px compact-card geometry check, strict typecheck, lint,
production build, and `git diff --check`.

Eat Now card-action follow-up: Like and Dislike are now always visible in the
desktop card action column between View details and the Save row, using space
that was previously empty. Recently eaten remains in the overflow menu. The
same controls remain keyboard accessible and preserve their selected state and
existing personalisation mutations. Verified with all 90 unit/integration
tests, all 58 mobile/desktop Playwright journeys (57 passed and one intentional
desktop skip), strict typecheck, lint, production build, and `git diff --check`.

Eat Now card-spacing follow-up: the desktop card action column now uses one
centered vertical stack with the same spacing token between View details, the
Like/Dislike row, and the Save/overflow row. This removes the flexible middle
spacer and keeps the top and bottom breathing room visually balanced.
Verified with all 90 unit/integration tests, all 58 mobile/desktop Playwright
journeys (57 passed and one intentional desktop skip), strict typecheck, lint,
production build, and `git diff --check`.

The public landing page has been rebuilt around the approved editorial desktop
reference and intentionally adapted for tablet and mobile rather than merely
scaled down. It now presents the complete BiteWise decision journey: budget,
pantry and time benefits; situational entry points; decide-to-cook steps; and
clear onboarding and recipe-discovery actions. Existing server-verified session
routing is preserved. The change is presentation-only: it introduces no data
query, cache, invalidation, mutation, or rate-limit changes. Verified with 77
unit/integration tests, strict typecheck, lint, production build, and
`git diff --check`. Browser-backed desktop/tablet/mobile comparison and the
affected Playwright journey remain outstanding because no in-app browser was
available in this session; `design-qa.md` records the blocked visual gate.
The closing banner actions now use the platform's ivory, aubergine, and soft
rose palette instead of the reference's yellow accent, with matching hover and
focus behavior. This is a styling-only refinement with no data-access impact.
The large-screen hero recipe card now has a more deliberate top-left and
bottom-right frame, with smoother nested corner radii and enough inset space to
keep the rotated white edge from appearing clipped. Tablet and mobile framing
remain unchanged.
Chrome inspection clarified that the requested treatment belongs to the food
image, not the surrounding recipe card. The outer-card experiment was reverted;
the desktop-only image now uses a consistent, restrained corner radius without
an additional border or edge outline. Tablet and mobile remain unchanged.
The desktop hero photo no longer counter-rotates inside its rotated recipe card,
removing the skewed, over-zoomed crop while preserving the established tablet
and mobile treatment. This styling-only fix introduces no data-access, caching,
invalidation, mutation, or rate-limit changes. Verified with all 77
unit/integration tests, strict typecheck, lint, production build, and
`git diff --check`; fresh desktop screenshot confirmation remains a manual check.
The nonessential public footer has been removed until it has useful implemented
destinations and active social accounts to represent.
The public landing page styling has been brought back into the locked Tailwind
architecture. Its page-specific `.landing-*` global CSS layer was removed and
the existing desktop, tablet, and mobile presentation was translated to scoped
Tailwind utilities in the page component, while retaining shadcn buttons and the
current content, navigation, image treatment, and responsive behavior. The
landing Playwright selector was scoped to the hero now that the primary action
also appears in the closing banner. Verified with 77 unit/integration tests,
four affected mobile/desktop Playwright tests including accessibility and
horizontal-overflow checks, strict typecheck, lint, production build, and
`git diff --check`.
Authenticated-action handoffs now preserve a validated local destination across
protected-route redirects, sign-in, sign-up and email confirmation, resend
confirmation, and password recovery. Completed profiles resume the exact
requested page and query string; incomplete profiles finish onboarding first and
then continue to that destination. Public recipe personalisation now returns a
guest to the same recipe after signing in. Return paths are restricted to known
local product and recipe routes to prevent external or auth-loop redirects. The
existing proxy claim refresh remains in place, and protected pages also supply
their destination to the server-side authentication guard as a reliable fallback.
The onboarding route is now a server-enforced incomplete-profile gate: completed
profiles requesting `/onboarding`, including by manually editing the URL, are
sent to Eat Now. Public meal actions target Eat Now so the auth handoff only uses
onboarding when the profile actually requires it. Existing preference editing is
preserved on the dedicated authenticated `/profile/edit` route, including all
three steps and the original return destination; incomplete profiles cannot use
that edit route to bypass onboarding.
This changes no database schema, catalogue caching, mutation invalidation, or
rate-limit policy. Verified with 86 unit/integration tests, 10 mobile/desktop auth
Playwright tests, two hosted mobile/desktop recipe-to-auth-to-save journey tests,
two hosted mobile/desktop onboarding-gate and preference-edit journey tests,
strict typecheck, warning-free lint, production build, and `git diff --check`.

Authentication form refinement completed with independently accessible show/hide
controls for every password entry and password confirmation on sign-up and
password update. Password mismatches are rejected by server-side Zod
validation before Supabase Auth is called, and the controls expose clear labels,
pressed state, keyboard focus, and appropriate password-manager autocomplete
hints. This presentation and validation change does not alter authentication data
access, caching, invalidation, or rate limiting. Verified with 70 unit/integration
tests, all 10 authentication Playwright tests across mobile and desktop, strict
typecheck, lint, and production build.

Authentication failure recovery now maps common Supabase Auth codes to specific,
safe next steps for incorrect credentials, unconfirmed email, duplicate accounts,
weak passwords, delivery restrictions, request limits, and timeouts. Client-held
form values preserve name, email, password, and confirmation entries when server
validation or Supabase returns an error; successful non-redirect responses still
clear sensitive values. Authentication querying, caching, invalidation, and rate
limits are unchanged.

Latest verification for the combined authentication form refinements: 72
unit/integration tests, all 10 authentication Playwright tests across mobile and
desktop, strict typecheck, lint, production build, and `git diff --check`.

The landing route now verifies server-side Supabase claims before rendering.
Signed-in users with a completed profile are redirected to Eat Now, while users
with incomplete or missing profile setup resume onboarding; only signed-out
visitors see the public landing page. The profile lookup selects only the
onboarding completion flag, remains request-scoped and uncached, and introduces
no mutation, invalidation, or rate-limit requirement.

Latest verification including the landing-route guard: 75 unit/integration
tests, 14 affected authentication/foundation Playwright tests across mobile and
desktop, strict typecheck, lint, production build, and `git diff --check`.

The shared product header now derives a signed-in user's initials from their
profile name with an email fallback and exposes an accessible account card for
Profile, Edit preferences, Saved meals, and Sign out. The menu supports keyboard
focus, Escape and outside-click dismissal, and clear expanded state; signed-out
public visitors receive a Sign in action instead. The request-scoped account
summary selects only `display_name`, is uncached, and adds no mutation, cache
invalidation, or rate-limit requirement beyond the existing sign-out action.

Latest verification including the account menu: 77 unit/integration tests, all
8 affected profile/foundation Playwright tests across mobile and desktop, strict
typecheck, lint, production build, and `git diff --check`.

Verified: 2026-08-10 – BiteWise MVP passed 67 unit/integration tests, the complete 56-test mobile/desktop Playwright suite (55 passed and one intentional desktop skip for the mobile-only compact-layout check), 163 hosted pgTAP assertions across all seven database suites, strict typecheck, lint, production build, and `git diff --check`. Hosted Supabase has 20 public tables with RLS enabled on every table, 55 policies, no anonymous table-write grants, no public `SECURITY DEFINER` functions, no function execution inherited by `PUBLIC`, and least-privilege RPC grants. Security and performance advisors report no actionable database findings; only the owner-controlled leaked-password setting and expected unused-index information remain.

Foundation and design system completed and verified.

Mobile app-page density refinement completed with reusable compact, standard, and promotional intro patterns while preserving the aubergine / rose-stone palette, Newsreader + Manrope typography, rounded visual language, and existing navigation. The final mockup-fidelity pass adds the compact Eat Now location context and 2 × 2 essential-constraint treatment, a segmented Meal Plan day selector with concise slots, Discover quick-filter chips and denser bookmark-ready result rows, Cook's guided-mode entry and compact starter controls, lighter text-led page intros, and a tightened shared mobile shell. Equipment, dietary choices, manual meal selection, complete-week planning, saved-meal access, and immersive active Cook Mode remain available. Bottom-navigation clearance includes safe-area spacing, and the mobile regression verifies complete primary controls above navigation at 360 px and 390 px plus compact browse/cook cards. This presentation-only change does not alter querying, caching, invalidation, rate limiting, or product capabilities. Latest verification: 67 unit/integration tests; 11 affected mobile Playwright tests; 10 affected desktop Playwright tests plus one intentional mobile-only skip; strict typecheck; lint; and production build. Mandatory screenshot-to-mockup comparison remains blocked because the in-app browser was unavailable; see `design-qa.md`.

Supabase foundation completed and verified against the hosted development project.

Authentication completed with email/password registration, confirmation, sign-in, sign-out, forgotten-password and password-update flows. Authentication actions use server-side Zod validation, independent identity checks, neutral recovery responses, and database-backed limits of 5 attempts per 10 minutes for sign-in/sign-up and 3 reset requests per hour. Personalized data remains request-scoped and uncached.

Owner manual checks: confirm real registration and recovery email delivery, email template token links, and hosted redirect allow-list entries before release.

Authentication follow-up: Supabase email-send rate limits now produce a specific recoverable message instead of a generic credential error, and users can request a fresh confirmation through `/auth/resend-confirmation`. Verified with auth error-classification tests, mobile/desktop Playwright coverage, typecheck, lint, and production build. The owner must configure custom SMTP before release to replace the hosted development mailer's restrictive shared limit.

User profile and constraints completed with resumable three-step onboarding and editable settings for integer KES budget, household size, available time, canonical equipment, dietary restrictions, health goals, cuisines, and preferred dishes. Eat Now and Meal Plan require completed onboarding. Profile reads select only required columns; private data is request-scoped and uncached; writes revalidate only Profile, Eat Now, and Meal Plan. No additional rate limit is required for these inexpensive authenticated preference writes.

Pantry completed with ingredient-linked CRUD, canonical quantities and units, optional expiry dates and notes, database-side search, 20-item pagination, and expired/soon-to-expire/usable grouping. The single paginated query selects only displayed columns and joins ingredient names without N+1 reads. User expiry, ingredient lookup, trigram search, and foreign-key indexes are present. Private pantry data is request-scoped and uncached; writes invalidate My Kitchen, Eat Now, and Meal Plan. No extra rate limit is required for inexpensive authenticated pantry mutations.

Supabase performance advisor currently reports only expected informational notices for newly created indexes that have not accumulated production usage; the actionable missing foreign-key index finding was fixed.

Leftovers completed with user-owned CRUD, fractional servings, prepared/use-by dates, optional notes, custom names or validated canonical recipe references, database-side search, 20-item pagination with page controls, and expired/expiring/usable grouping. Expired leftovers are explicitly excluded from recommendation inventory. The public recipe selector reuses the tagged catalogue cache, while private leftover reads select only displayed columns and remain request-scoped and uncached. Writes invalidate My Kitchen and Eat Now. No extra rate limit is required for inexpensive authenticated leftover mutations.

Curated recipe and cost catalogue completed with 30 representative Kenyan meals, including 8 breakfast, 25 lunch, and 23 dinner options; 202 canonical ingredient quantities; 120 ordered original steps; 36 dated Nairobi price references; 6 approved substitutions; and local optimized WebP photography with separate source, creator, and licence attribution. Public catalogue tables use published-row RLS and explicit read-only anonymous/authenticated grants. The catalogue loads through three bounded parallel reads with selected columns and no N+1 queries, then uses a tagged 24-hour shared cache because it contains no user data. Catalogue reads do not require an additional rate limit; the active recommendation action will use the required authenticated limit of 20 requests per 10 minutes. Composite foreign-key indexes were added and the Supabase performance advisor now reports only expected unused-index notices for the new data set.

Eat Now deterministic recommendations completed with editable per-meal budget, servings, time, meal type, equipment, and additive dietary overrides. Daily budgets default to one third and weekly budgets to one twenty-first. A security-invoker RPC applies published state, dietary safety, equipment, heat source, time, meal type, price availability, base/approved-substitution affordability, input bounds, and a 50-candidate cap in Postgres. Request-scoped ranking applies pantry coverage (30%), three-day expiry use (20%), budget headroom (15%), cuisine/dish/health match (15%), time headroom (10%), and a neutral variety baseline (10%) until meal history is available. Results are deterministically tie-broken by score, lower cost, shorter time, then name and expose total/per-serving estimates, pantry use, missing quantities, cheaper substitutions, and the three strongest reasons. No-match states provide budget, time, equipment, and pantry adjustments without relaxing dietary requirements. Profile and pantry reads remain uncached and user-scoped; only the public catalogue is shared-cached. Generation is limited atomically to 20 requests per authenticated user per 10 minutes.

Weekly planning completed with a seven-day breakfast/lunch/dinner grid, deterministic complete-week generation, manual meal selection, removal, serving changes, and constrained individual swaps. Generated plans use the saved weekly budget or daily budget multiplied by seven, avoid duplicate recipes when enough eligible meals fit, and are priced and replaced atomically by one validated security-invoker RPC. Private plan reads select only required columns, are user-scoped and uncached, and mutations revalidate only Meal Plan. Complete generation is limited to 10 requests per authenticated user per 10 minutes and individual edits to 30. Ownership RLS, explicit grants, supporting indexes, signed-out/user-A/user-B/privileged checks, and hosted security/performance advisors are verified. The full feature gate also fixed a Pantry edit regression by remounting the form when its target changes so an ingredient cannot silently retain the previous add-form selection.

Shopping lists completed with one active list per user, atomic plan aggregation, canonical unit conversion, subtraction of usable pantry inventory, exclusion of expired inventory, database-calculated indicative KES totals, and preservation of manual items and checked generated ingredients across regeneration. Users can generate from Meal Plan, view the active list in My Kitchen, and check, add, edit, paginate, and delete items. Reads select only displayed columns, use a bounded 50-item page plus a checked-count query after one owned-list lookup, remain user-scoped and uncached, and avoid N+1 access. Generation is limited to 20 requests per authenticated user per 10 minutes; inexpensive item mutations do not need an additional limiter. Mutations revalidate only Meal Plan, My Kitchen, and Shopping List. Composite ownership constraints, foreign-key indexes, least-privilege grants, RLS, signed-out/user-A/user-B/privileged checks, and hosted advisors are verified.

Discover completed with publicly readable browsing and recipe details, database-side name and ingredient-alias search, filters for time, equipment, diet, per-serving cost, cuisine, and skill, deterministic ordering, bounded 12-item pagination, and a database-provided total count. Search result cards and detail pages surface time, servings, indicative KES cost, price update date, ingredients, written steps, image attribution, loading, error, empty, and not-found states. The public search RPC is security-invoker, granted read execution only, and remains constrained by catalogue RLS. Search results use the public `recipe-catalogue` tag with a one-hour shared cache; recipe details reuse the tagged 24-hour public catalogue cache. No user-owned data is cached. Searches are atomically limited to 30 requests per minute for guests by hashed IP and 60 for authenticated users by user ID. Personal planning links hand signed-out visitors into the protected authentication flow.

Watch & Cook completed with a focused external YouTube search link generated locally from the recipe name plus selected English or Swahili tutorial language, maximum video time, skill level, equipment, and dietary terms. It uses no YouTube API, embeds no search results, sends no data until the user opens the link, clearly marks the new-tab behavior, and states that BiteWise has not reviewed or endorsed individual results. This inexpensive client-only URL generation does not require caching, invalidation, or rate limiting.

Cook Mode completed with a protected landing page for starting and resuming sessions, recipe-specific serving selection, linearly scaled ingredients, one accessible written step at a time, previous/next controls, persistent completed-step and current-position state, progress announcements, large kitchen-friendly controls, optional Screen Wake Lock, and a Watch & Cook search link. Finishing requires every step and records a completed session timestamp for later personalisation. Private session reads select only required columns, fetch at most 10 active sessions, and use one bounded step-progress read per opened session; public recipe content reuses the shared tagged catalogue cache without mixing in private state. Session data remains request-scoped and uncached. One security-invoker RPC writes each start, navigation, step, undo, or completion atomically; mutations revalidate only Cook routes. These inexpensive authenticated actions do not need an additional limiter. RLS, least-privilege grants, ownership constraints, indexes, signed-out/user-A/user-B/privileged checks, and hosted advisors are verified.

Feedback and saved meals completed with one current like/dislike state per user and recipe, undo, idempotent save/favourite toggles, append-only recently-eaten timestamps, and automatic Cook completion history linked to its source session. The same accessible controls are available from Eat Now, public recipe details in Discover, guided Cook, and the paginated Saved Meals section in My Kitchen; signed-out visitors receive an authentication handoff instead of a mutation. Private state is loaded in three bounded parallel ownership-scoped reads for at most 50 recipe IDs, remains uncached, and is never mixed into the shared catalogue cache. Saved Meals uses six-item database pagination plus cached public recipe enrichment. One security-invoker RPC performs each mutation atomically; writes revalidate only affected product routes. These inexpensive authenticated actions do not need a separate rate limiter. RLS, least-privilege grants, indexes, signed-out/user-A/user-B/privileged checks, and hosted advisors are verified.

Ranking integration completed with explicit dislike exclusion, a +6 liked boost, a +8 saved/favourite boost, a -20 penalty for meals eaten within seven days, and a -10 penalty for meals eaten 8-14 days ago. Eat Now and weekly-plan generation use the same deterministic signals after the database has applied the unchanged dietary, equipment, time, published-state, and affordability hard filters. Pantry-expiry, saved/liked preference, and recent-variety effects produce concise explanations while cost, time, and name tie-breaks remain deterministic. One bounded three-query private-state read covers the at-most-30 catalogue recipes and remains request-scoped and uncached; the public catalogue cache is unchanged. No new mutation, cache invalidation, or rate limit was introduced. Verified with 63 unit/integration tests, six focused mobile/desktop Playwright tests including live dislike-to-rerank behaviour and cross-user isolation, typecheck, lint, and production build. The final milestone will rerun the complete Playwright and hosted database suites.

Owner manual security check: enable Supabase leaked-password protection before release if the selected hosted plan supports it; the security advisor currently reports that Auth setting as disabled.

Final quality audit completed with a keyboard-first skip link, labelled search controls, a root-layout failure fallback, unique Discover metadata, WCAG AA contrast correction, reduced-motion handling, minimum touch targets, responsive overflow checks, and security headers for CSP, framing, MIME sniffing, referrers, and browser permissions. Supabase dependencies are exact-version pinned with the verified lockfile. Public catalogue caching remains tagged and bounded; user-owned data remains request-scoped and uncached with narrow path invalidation. Local recipe images total under 0.8 MB across all 30 meals and are delivered through `next/image`. Production-like traces recorded 156 ms LCP and 0.00 CLS on the home page, plus 2.19 s LCP and 0.00 CLS on Discover at 360 px under Slow 4G and 4x CPU throttling, with no actionable render-blocking savings.

Owner-only release checks still required: verify real registration, confirmation, resend-confirmation, and recovery email delivery; verify hosted email-template token links and redirect allow-list entries; configure custom SMTP; and enable leaked-password protection if the hosted plan supports it. Deployment was not performed, as required.

## Notes

Eat Now collapsed-constraints follow-up replaces the cramped successful-results 19rem sidebar with a balanced 22rem desktop rail beside the shortlist. Its summary chips use a two-column grid instead of a tall one-chip-per-row stack. Tablets use a compact full-width row above the shortlist, while phones retain a two-column wrap. Chip height, typography, and padding are reduced only for this summary state while the editable form and result cards keep their established touch targets. No recommendation, persistence, query, cache, invalidation, or rate-limit behavior changed.

Eat Now pre-results refinement implemented from the supplied desktop, tablet, and mobile mockups. A follow-up removes the oversized, non-essential meal photograph so Eat Now now uses the same compact text-only `PageIntro` header as Meal Plan, Discover, and Cook. Before generation, the full essential-constraints form stays visible; More constraints starts collapsed; saved equipment and dietary preferences appear as soft filled chips; and the shortlist uses a text-led empty state, four comparison metrics, and light illustrative rows without fake meals or idle skeleton animation. Illustrative rows animate only during a real request. Successful generation transitions to the existing result cards, scrolls to the shortlist, and collapses constraints at every breakpoint; failed generation leaves the form open and preserves all entered values. A profile-derived budget may be any whole KES value even though keyboard/spinner increments remain KES 5, so submission bypasses mismatched native step validation and continues through the existing server-side Zod bounds. Existing recommendation queries, public catalogue caching, private request-scoped reads, narrow invalidation, and the 20-per-10-minute generation rate limit are unchanged. Verified with 118 unit/integration tests, the focused hosted Eat Now journey on mobile and desktop, strict typecheck, warning-free lint, production build, and `git diff --check`. The complete 64-test Playwright run reached 30 passes, 14 failures from stale Discover, Meal Plan, onboarding, personalisation, Watch & Cook, and the now-corrected Eat Now desktop-collapse expectation, with 20 tests not run before the command timeout; the focused Eat Now rerun passed after correcting its expectation. Screenshot-backed three-viewport comparison remains blocked because the in-app browser is unavailable; see `design-qa.md`. This feature is not marked visually complete.

Meal-specific planning durations completed. Profile Kitchen settings now keep Eat Now's quick-meal duration separate and expose strict breakfast, lunch, and dinner maximums. Existing profiles are backfilled from their current duration. Weekly candidate queries and ranking use the matching meal-specific limit, Recommendation Health links directly to the constrained meal field, and the profile summary displays all three planning values. The migration preserves the existing weekly RPC's internal upper-bound compatibility while adding a database trigger that rejects any inserted or updated plan item exceeding its own meal-type limit, including direct authenticated RPC use. Profile writes update all four preferences atomically and invalidate Profile, Eat Now, and Meal Plan through the existing workflow. Reads add four scalar profile columns and remain request-scoped and uncached; candidate query count, recommendation generation rate limits, and mutation invalidation remain unchanged. Verified locally with 100 unit/integration tests, strict typecheck, warning-free lint, production build, and `git diff --check`; a pgTAP migration regression covers column and trigger presence plus database rejection. Hosted migration `20260814174031_add_meal_specific_planning_minutes.sql` is applied to project `ksxnlsncisnllkfwrtkr`. Live verification confirmed all four columns, all five constraints, the enforcement trigger, and zero invalid profiles across the 17 existing rows. Post-migration advisors introduced no new findings; leaked-password protection remains the existing owner-controlled security warning and unused-index notices remain informational. The hosted pgTAP suite and authenticated browser journey were not rerun in this session.

Meal Plan constraint diagnostics completed. When any breakfast, lunch, or dinner pool has fewer than seven eligible recipes, the page now shows a Recommendation Health panel that preserves the user's hard constraints, states the current matching count, and runs bounded comparison probes to quantify whether 15 additional cooking minutes or a 20% weekly-budget increase would unlock more choices. It links directly to the relevant available-time or budget field; when neither adjustment helps, it explains that combined dietary, kitchen, and catalogue constraints are limiting variety and links to preferences without encouraging unsafe dietary relaxation. Diagnostics never mutate settings or the plan, and users must explicitly save changes and regenerate. Normal plans make no diagnostic reads; constrained plans make at most six parallel calls to the existing security-invoker recommendation RPC, select no additional private rows, remain request-scoped and uncached, and need no new rate limit because they are bounded read-only checks behind authenticated Meal Plan access. Existing Meal Plan invalidation is unchanged. Verified with 99 unit/integration tests, strict typecheck, warning-free lint, production build, and `git diff --check`. Authenticated browser validation remains unavailable in the connected signed-out browser.

Weekly regeneration variety regression fixed. The previous fallback jumped directly from an unaffordable fully unique 21-meal set to repeating the single cheapest breakfast, lunch, and dinner across all seven days. The fallback now deterministically maximizes affordable recipe variety before allowing repeats, while preserving the weekly budget and all hard profile constraints. Regenerating an existing week also deprioritizes recipes already in that plan, so it produces a different valid mix when eligible alternatives fit; it remains deterministic for the same candidates and prior-plan state. Candidate reads remain bounded, user-scoped, and uncached; the action adds one parallel owned-plan read and keeps the existing narrow Meal Plan invalidation and 10-per-10-minute limit. Regression coverage verifies affordable partial diversity, prior-week avoidance, unique-plan generation, forced cheapest repeats, and over-budget failure. Verified with 98 unit/integration tests, strict typecheck, warning-free lint, production build, and `git diff --check`.

Whole Week refinement implemented from the supplied desktop/tablet and mobile mockup. Whole Week now expands to a full-width state with a horizontal weekly summary and two-column detailed day cards on larger screens; mobile uses one expanded day with meal photography and concise collapsed summaries for the remaining days. The summary follow-up matches the mockup's text-led hierarchy with a completion icon, meal and budget status copy, shared green progress bar, separated estimated-cost block, and compact action column instead of badge-led metrics. Viewing a day returns to the editable selected-day plan, and regeneration, shopping-list, budget, serving, swap, remove, and day-selection behavior remain intact. A follow-up clarification restored BiteWise's established desktop sidebar and existing mobile shell; the mockup informs the Meal Plan content alignment but does not replace the product navigation. No data-access, caching, invalidation, database, or rate-limit behavior changed. Verified with 96 unit/integration tests for the full refinement; the summary follow-up passed its focused component test, strict typecheck, warning-free lint, production build, and `git diff --check`. Screenshot-backed desktop/mobile Whole Week comparison remains blocked because the connected browser is signed out and the protected route redirects to sign-in; see `design-qa.md`.

Meal Plan responsive revamp implemented from the supplied desktop, tablet, and mobile mockups. The route now uses one responsive selected-day experience across all widths, with a seven-day segmented selector, a desktop weekly-budget side panel, compact mobile summary, catalogue photography, dense three-up tablet/desktop meal cards, stacked mobile meals, and preserved add, swap, remove, serving, whole-week, regeneration, and shopping-list actions. The desktop follow-up replaces absolute positioning with an explicit content-and-summary grid, restoring the outer gutter and a consistent 1.5–2rem margin between the planner and budget rail without overlap. The plan query now includes only each planned recipe's primary local image path; private plan data remains request-scoped and uncached, and mutation invalidation and rate limits are unchanged. Verified with 96 unit/integration tests for the main revamp; the margin follow-up passed its focused component test, strict typecheck, warning-free lint, production build, and `git diff --check`. Screenshot-backed three-viewport QA and focused Playwright verification remain blocked because the connected browser is signed out and the protected route redirects to sign-in; see `design-qa.md`. This feature is not marked visually complete.

Recipe details now provides a real Add to meal plan workflow instead of navigating without saving. Signed-in users receive a lazy-loaded responsive slot picker for this week or next week, compatible meal types, today-or-later day selection, household-size serving defaults, occupied-slot visibility, and explicit replacement confirmation. The server re-reads the owned plan immediately before saving and rejects stale-slot replacements, past dates, incompatible meal types, profile-constraint failures, or weekly-budget overflow before reusing the existing atomic `replace_weekly_meal_plan` RPC. Signed-out users retain the sign-in handoff and incomplete profiles resume onboarding. Success keeps the recipe page open, identifies the saved day and meal, and offers a direct Meal Plan link. Private context remains request-scoped and uncached; only the two selected weeks and required slot fields are loaded on demand. No schema, RLS, grant, shared-cache, shopping-list, or rate-limit changes were required. Verified with 96 unit/integration tests, the complete six-test hosted Meal Plan mobile/desktop spec across the implementation and focused rerun, strict typecheck, warning-free lint, production build, and `git diff --check`.

Recipe details responsive revamp implemented from the supplied mobile and desktop mockups. The route now uses an image-led mobile hero, compact recipe facts and actions, recommendation-fit cards, expandable kitchen readiness, live serving scaling, ingredients/nutrition tabs, tutorial access, and a clearer preparation timeline. Desktop uses a persistent ingredient/preparation rail while tablet intentionally keeps the richer two-column kitchen cards but returns the recipe body to one readable column. The follow-up visual refinement removes the duplicated shell/page gutter and framed-card border, adds a responsive image-to-details fade, keeps Add to meal plan, Start cooking, and the overflow trigger on one row at every breakpoint, and moves Save, Like, Dislike, and Mark as eaten/Mark as eaten again into that overflow menu. Selected feedback now has visible filled styling and toggles to Unlike or Remove dislike instead of changing only its screen-reader state. Successful personalisation mutations now synchronize every mounted control for the same recipe, update the stored Eat Now card snapshot, and refresh server-rendered route data so detail, recommendation, Cook, and Saved Meals surfaces do not retain stale states. Existing catalogue querying and tagged caching, database ownership rules, personalisation mutation semantics, Cook Mode, Meal Plan, and YouTube search behavior are preserved; no database, rate-limit, or shared-cache changes were introduced. Verified with 93 unit/integration tests, strict typecheck, warning-free lint, production build, and `git diff --check`. Browser DOM inspection confirmed the route renders without console errors, but screenshot-backed visual QA remains blocked because the connected Chrome capture timed out; see `design-qa.md`. The focused updated Playwright journey remains to be verified before this feature is marked complete.

Recipe hero positioning follow-up implemented and reviewed in Chrome. Phones retain a stacked, image-first hero with a centred cover crop and a taller bottom dissolve. Tablet and desktop images now occupy 52% of the hero, begin behind the content, and use a long 44%-wide opaque-to-transparent blend instead of a narrow edge fade. The explicit desktop divider and hero bottom rule were removed, while a shallow lower dissolve softens the photograph's remaining exposed edge, so the image reads as part of the content rather than a bordered panel. The responsive image `sizes` hint matches those regions and the deprecated Next.js image priority prop was replaced with preload. The current landscape catalogue photograph cannot reproduce the mockup's different portrait-friendly meal composition. No data access, caching, invalidation, database, or rate-limit behavior changed. Verified with 101 unit/integration tests, strict typecheck, warning-free lint, and production build. Chrome confirmed the desktop blend and computed phone/tablet geometry; final normalized side-by-side design QA remains blocked because the conversation mockup and browser capture are not available as a single saved comparison artifact.

Recipe guest overflow refinement completed. The detail-page kebab trigger and its grid track now use the shared 44 px button height and radius, matching Add to meal plan and Start cooking. Signed-out users no longer see the narrow "Sign in to save" control: they can open the same Save, Like, Dislike, and Mark as eaten menu as authenticated users, and selecting any action redirects to sign-in with the current recipe preserved as the safe return path before any personalisation mutation can run. Other non-detail personalisation surfaces retain their existing sign-in handoff. No database, RLS, caching, invalidation, or rate-limit behavior changed. Verified in Chrome with the signed-out menu open and a Save-to-sign-in redirect, plus 102 unit/integration tests, strict typecheck, warning-free lint, production build, and `git diff --check`.

Personalisation overflow dismissal completed. Recipe-detail and recommendation-card overflow menus now use controlled accessible triggers with `aria-expanded` and close on outside click, Escape, or action selection while keeping clicks inside the menu usable. Chrome confirmed the detail menu transitions from open to closed after a blank-page click without changing the route. No data access, authentication, mutation, caching, invalidation, database, or rate-limit behavior changed. Verified with 104 unit/integration tests, strict typecheck, warning-free lint, production build, and `git diff --check`.

Recipe-detail Cook Mode setup completed. Start cooking now opens an accessible responsive serving picker in place: a bottom sheet on phones and a centred dialog on larger screens. It defaults to the authenticated household size and keeps the recipe URL unchanged until Begin cooking creates the session and enters the immersive `/cook/[recipeId]` experience. An existing active session resumes directly, signed-out visitors retain the recipe route through authentication, and direct Cook Mode URLs keep the original full-page setup as a refresh/deep-link fallback. The private setup context is loaded only after interaction, selects only one owned active-session ID, remains request-scoped and uncached, and continues to use the existing validated atomic cook-session RPC, Cook-route invalidation, ownership policies, and inexpensive-mutation rate-limit decision. No schema, RLS, grant, shared-cache, or new rate-limit changes were required. Verified with 107 unit/integration tests, strict typecheck, warning-free lint, production build, `git diff --check`, two hosted mobile/desktop recipe-page dialog journeys, and two hosted mobile/desktop guided-session start, scale, persistence, resume, and completion journeys.

Eat Now purchase-cost affordability completed and corrected after full-pack rounding proved too aggressive for single meals. Meal budgets now apply after user-owned pantry quantities are deducted; remaining staples round to practical 100 g or 100 ml buying increments, cups to quarter-cup increments, and produce, eggs, bunches, and packets to whole units. The shortlist displays this result as `Cash needed` and sorts budget results by the same value. The one-serving Sweet Potato with Boiled Eggs regression fixture now calculates KES 88 instead of charging KES 240 to restock full packages. The prorated amount remains a separately labelled `Ingredient value` on catalogue and recipe-detail surfaces instead of being presented as checkout spend. Price location, source, and capture date are visible, stale session snapshots were versioned out, and the recipe detail no longer fabricates an 80% pantry match or classify required ingredients as already owned. The hosted security-invoker candidate RPC returns a bounded 50-row non-budget hard-constraint pool so request-scoped application ranking can apply pantry-aware purchase affordability without relaxing dietary, equipment, time, serving, or meal-type rules. Public catalogue prices remain in the existing tagged 24-hour cache; private pantry reads remain request-scoped and uncached; the existing 20-per-10-minute generation limit and invalidation behavior are unchanged. Hosted migration `20260815175803_use_purchase_cost_for_recommendation_budget.sql` is applied to project `ksxnlsncisnllkfwrtkr`; live SQL confirmed a valid KES 100 request returns 16 hard-constraint candidates, including 16 above the old prorated cutoff, for application filtering. Security and performance advisors introduced no new findings; leaked-password protection remains the existing owner-controlled warning and unused-index notices remain informational. Verified after the correction with 111 unit/integration tests, strict typecheck, warning-free lint, production build, `git diff --check`, and the focused hosted low-versus-high-budget journey on mobile and desktop. The earlier broader 62-test Playwright run reached 39 passes, one skip, 12 unrelated failures in stale Discover, Meal Plan, onboarding, personalisation, and removed Watch & Cook expectations, and 10 tests not run after those failures; this feature is not claiming a green full-suite gate until that existing E2E debt is repaired.

Discover price semantics clarified after comparing the seeded basket with current primary Kenyan sources. June 2026 KNBS national averages report packeted milk at KES 57.33/500 ml, eggs at KES 20.53 each, maize flour at KES 83.43/kg loose or KES 178.27/2 kg fortified, while current Carrefour Nairobi listings show common 2 kg maize flour around KES 149-196 and rice around KES 373/2 kg; these broadly support the catalogue's underlying milk, egg, flour, and rice references. The unexpectedly small Discover figures are therefore explicitly labelled as raw `ingredients/serving`, not a purchased basket, cash needed today, takeaway price, or cooked-meal selling price. The cost filter and KES 150 quick filter use the same `ingredient value/serving` wording. No query, cache, database, invalidation, or rate-limit behavior changed. Verified with 111 unit/integration tests, strict typecheck, and warning-free lint.

Recipe-detail origin and serving continuity completed. Discover, Eat Now, and Saved Meals links now carry a validated source and serving count into the recipe route; invalid or direct URLs safely start at one serving instead of the catalogue's four-serving recipe base. Discover, Saved Meals, and direct views show the prorated raw `Ingredient value`, while Eat Now reuses the same purchase-cost calculation as its shortlist and deducts only the authenticated user's usable pantry quantities before showing `Cash needed`. Serving controls scale ingredients and price together, replace the URL in place for refresh/new-tab continuity, and preserve that contextual URL through sign-in, personalisation, Add to meal plan, and Start cooking handoffs. Back navigation returns to the originating product area. Public recipe data continues to use the existing tagged catalogue cache; the Eat Now-only pantry read selects only required ingredient quantities and expiry dates, is user-scoped, bounded, request-scoped, and uncached. No schema, mutation invalidation, or rate-limit change was required. Verified with 118 unit/integration tests, two focused hosted journeys on both mobile and desktop, strict typecheck, warning-free lint, production build, and `git diff --check`.

Eat Now's arbitrary KES 100 meal-budget floor removed. Any non-negative whole-KES amount is now accepted through matching HTML, Zod, ranking, and hosted RPC bounds, so values such as KES 65 no longer trigger browser or server validation. The number-input spinner and keyboard increment/decrement behavior use KES 5 steps, while the existing KES 1,000,000 safety ceiling remains. Zero-budget ranking explicitly avoids division by zero and can still return fully pantry-covered meals. Hosted migration `20260815184640_allow_zero_meal_budget.sql` is applied; live SQL confirmed KES 0 and KES 65 return the 16 valid hard-constraint candidates for pantry-aware application filtering, while a negative budget returns none. No caching, invalidation, query-count, or rate-limit behavior changed. Security and performance advisors introduced no new findings beyond the existing owner-controlled leaked-password warning and informational unused-index notices. Verified with 118 unit/integration tests, the focused hosted affordability journey on mobile and desktop, strict typecheck, warning-free lint, production build, and `git diff --check`.

Cook details responsive refinement implemented from the supplied desktop and compact/tablet mockups. Active sessions now use a mockup-aligned Cook intro, recipe progress summary, responsive focused-step card, concise data-derived step headings, time and heat context, next-step preview, source recipe imagery, scaled fractional ingredient quantities, working screen-wake control, tutorial and recipe-overview links, contextual mobile Cook navigation, and desktop search. Desktop places ingredients and tools beside the cooking step with persistent actions; compact/tablet layouts prioritize the step before ingredients and tools; the additional 390 px check keeps actions in document flow so persistent navigation cannot cover cooking content. The final-step action now atomically sequences the existing validated step-save and completion mutations from the UI, so users are not stranded on an incomplete last step. The active Cook page no longer performs the unrelated personalisation read; public recipe and owned cook-session access remain request-scoped and uncached, with no schema, RLS, shared-cache, invalidation, or rate-limit changes. The highlighted outer gutter follow-up removes only the shared `main` max-width and horizontal/top padding on Cook details rather than offsetting it with negative margins. The sidebar was restored to its original 272 px width, BiteWise tagline, product-area order, active styling, and kitchen footer after the user clarified it was outside scope. Browser geometry at 1592 x 900 confirms the Cook surface now runs directly from the unchanged sidebar to the scrollbar with zero horizontal page padding. Verified with 123 unit/integration tests, four hosted mobile/desktop Cook journeys, strict typecheck, production build, `git diff --check`, and fresh browser captures at 1450 x 1085, 942 x 1670, and 390 x 845 CSS viewports. Lint has no errors; three pre-existing warnings remain in the user's unrelated dirty `src/app/(app)/my-kitchen/page.tsx`. Formal Product Design sign-off remains blocked because the conversation mockups are not available as local image files for the required normalized same-input comparison; see `design-qa.md`.

- Agent must update this file after every completed feature.
- Every feature must pass its tests + typecheck + lint + build before being marked done.
- Caching, rate limiting and efficient querying rules must be followed on all data features.

Pantry responsive refinement implemented from the supplied desktop, tablet,
mobile, and filter mockups. Inventory now leads the route; Add Ingredient opens
as a full-screen phone sheet and a right-side tablet/desktop drawer; search,
filtering, and sorting are distinct; and the filter sheet supports status,
category, expiry, zero-quantity, and archived controls with an active count.
Closest-expiry items remain prominent without KPI-style cards, while the main
inventory groups same-ingredient batches and keeps batch-level edit, archive,
restore, and delete actions available. The existing Pantry, Leftovers, Shopping
list, and Saved meals tabs are unchanged. Form controls use restrained
rose-stone/aubergine gradient surfaces with preserved focus, error, disabled,
and contrast states; page hierarchy relies primarily on spacing, surface
contrast, and soft elevation.

Migration `20260815203718_refine_pantry_inventory_controls.sql` is applied to
the hosted project. It adds ingredient categories, soft pantry archival,
zero-quantity support, an active-batch uniqueness rule, and partial indexes for
active-expiry and archived reads. Pantry reads remain owner-scoped and
request-scoped; the default query excludes archived and zero-quantity rows,
selects only the displayed columns, filters/orders in Postgres, and keeps the
existing 20-row pagination. A separate bounded four-row highlight query keeps
Use soon ordered by expiry. Recommendation, recipe-detail, Meal Plan, and
shopping-list consumers now ignore archived and zero-quantity stock. Mutations
retain narrow Pantry/Eat Now/Meal Plan invalidation. No shared cache or new rate
limit was introduced because these are authenticated, inexpensive inventory
reads and mutations.

Verified with 124 unit/integration tests, four hosted Pantry journeys on mobile
and four on desktop, strict typecheck, warning-free lint, production build, and
`git diff --check`. Hosted schema inspection confirmed the new columns;
security/performance advisors introduced no new actionable findings beyond the
existing owner-controlled leaked-password warning and informational unused-index
notices. Browser geometry and interaction checks confirmed no horizontal
overflow, tablet two-column inventory, compact desktop rows, adaptive form
surfaces, working filter count, and no console errors. Formal normalized
screenshot-to-mockup sign-off remains blocked because the conversation source
images have no readable local path and populated-page Chrome captures repeatedly
timed out; see `design-qa.md`. This feature is not marked visually complete.

Landing-page final CTA spacing follow-up: the closing banner now keeps a 20 px
desktop and 24 px tablet bottom gutter instead of touching the viewport edge,
while the existing edge-to-edge mobile treatment remains unchanged. This is a
presentation-only fix with no data access, caching, invalidation, database, or
rate-limit changes. Verified with all 124 unit/integration tests, the four
mobile/desktop foundation journeys, strict typecheck, warning-free lint,
production build, and `git diff --check`. Browser inspection confirmed the
20 px desktop margin and no horizontal overflow.

Pantry quantity validation regression fixed. New pantry items now require an
explicit quantity greater than zero in both native browser validation and the
server-side Zod schema; blank form values are no longer coerced to zero and can
no longer reach the database or surface a misleading duplicate-batch error.
Editing an existing item to zero remains supported so users can mark stock as
depleted and reveal it with the existing zero-quantity filter. No query,
database, cache, invalidation, or rate-limit behavior changed. Verified with
125 unit/integration tests, all eight hosted Pantry Playwright journeys on
mobile and desktop, strict typecheck, warning-free lint, production build, and
`git diff --check`. The repository-wide 66-test Playwright run reached 39
passes, one skip, 14 unrelated failures across Discover, Meal Plan, Cook,
Personalisation, Profile, and Watch & Cook, and 12 tests did not run; the
focused Pantry suite remained green.

Pantry internal inventory filters are now development-only. The Filter panel
continues to expose status, category, and expiry in every environment, while
`Show zero quantity` and `Show archived` render only under `next dev`.
Production requests also normalize both developer-only query parameters to
false before building the owner-scoped Pantry query, so manually adding them to
the URL cannot silently expose depleted or archived rows or inflate the active
filter count. No database, cache, invalidation, or rate-limit behavior changed.
Verified with 126 unit/integration tests, all eight hosted Pantry Playwright
journeys in the development environment, strict typecheck, warning-free lint,
production build, and `git diff --check`. The previously recorded unrelated
repository-wide Playwright failures remain outstanding.

Pantry filter consistency regression fixed after direct Chrome reproduction.
The same active search, status, category, expiry, zero-quantity, and archived
constraints now drive the alert counts, bounded four-row Use soon query, and
paginated All ingredients query, so a filtered page no longer mixes matching
inventory with unrelated highlights. The form treats No expiry and dated
expiry windows as mutually exclusive, with server-side normalization for
manually constructed contradictory URLs. Applying or clearing filters also
dismisses stale add/edit success feedback. Query count remains three bounded,
parallel, owner-scoped highlight reads plus the existing paginated inventory
read; data remains request-scoped and uncached, with no mutation, invalidation,
database, or rate-limit changes. Verified with 127 unit/integration tests, all
eight hosted Pantry Playwright journeys on mobile and desktop, strict
typecheck, warning-free lint, production build, `git diff --check`, and Chrome
against the signed-in Pantry data. Chrome confirmed Dairy + Next 7 days shows
only Milk in both inventory sections, reduces the attention count from five to
one, clears stale save feedback, and emits no console warnings or errors.

Pantry status and expiry semantics are now unambiguous. Selecting `Use soon`
makes status authoritative, displays a disabled `Next 7 days` expiry value with
an explanatory hint, submits only `status=use-soon`, and counts it as one active
filter. `No expiry` similarly derives and locks `No expiry date`; choosing `All`
or `In stock` restores the independent expiry control. Server-side query
normalization also removes expiry windows from conflicting manually constructed
status URLs. `Use soon` reads now apply both lower and upper date bounds (today
through seven days), so already-expired stock remains available only through
the explicit Expired expiry filter and cannot contradict the Use soon results.
The existing owner-scoped, request-scoped query shape, parallel bounded
highlight reads, pagination, cache behavior, invalidation, database schema, and
rate-limit behavior are unchanged. Verified with 127 unit/integration tests,
all eight hosted Pantry Playwright journeys on mobile and desktop, strict
typecheck, warning-free lint, production build, and `git diff --check`. Direct
Chrome verification confirmed the derived disabled states, canonical
`?status=use-soon` URL, `Filter (1)` count, and exclusion of an existing expired
item; the browser was restored to the unfiltered Pantry afterward.

Pantry alert banners now render only when their count is greater than zero and
act as real filter controls instead of decorative cards. The attention banner
links to the authoritative `Use soon` status, while the no-expiry banner links
to `No expiry`; both retain compatible active search/category/sort controls,
clear conflicting expiry state, reset pagination, expose native link semantics,
and retain visible keyboard focus. A single remaining banner spans the alert
row rather than leaving an empty column. The attention count now uses the same
inclusive today-through-seven-days bounds as the Use soon inventory, so expired
items no longer inflate wording that says "this week." Existing owner scoping,
query count, bounded reads, partial-index-compatible predicates, caching,
invalidation, schema, and rate-limit behavior are unchanged. Verified with 127
unit/integration tests, all eight hosted Pantry Playwright journeys on mobile
and desktop (including both alert destinations and zero-count suppression),
strict typecheck, warning-free lint, production build, and `git diff --check`.

Pantry add/update success feedback now follows the shared BiteWise Sonner toast
convention. The Pantry view no longer stores or renders a persistent page-level
success strip; successful server-action results close the adaptive form and
call `toast.success(...)` through the existing global toaster. Server validation
and persistence errors remain inline within the open form so they stay adjacent
to the controls requiring correction. This presentation-only correction does
not change mutations, validation, queries, caching, invalidation, database
schema, or rate limits. Verified with 127 unit/integration tests, all eight
hosted Pantry Playwright journeys on mobile and desktop (including assertions
that add/update feedback renders in a Sonner toast and not in `<main>`), strict
typecheck, warning-free lint, production build, and `git diff --check`.

Native date inputs now open their calendar picker when the user clicks anywhere
on the field, rather than requiring a precise click on the browser's calendar
icon. A shared client-side `DateInput` preserves native date entry, keyboard
focus, consumer click handlers, and disabled/read-only behavior while invoking
`showPicker()` only when supported. It is applied consistently to Pantry expiry
and the Leftovers Prepared and Use by fields. This interaction-only refinement
does not change form values, server validation, mutations, queries, caching,
invalidation, database schema, or rate limits. Verified with 129 unit/integration
tests, all eight hosted Pantry/Leftovers Playwright journeys on mobile and
desktop (including whole-field picker activation), strict typecheck,
warning-free lint, production build, and `git diff --check`.
