# Mobile navigation design QA

- Source visual truth: the user-provided floating mobile navigation reference attached in this conversation; the attachment is 1328 x 568 pixels but has no readable local source path
- Browser-rendered implementation evidence: `artifacts/mobile-navbar-discover-browser.png`
- Intended CSS viewport: 390 x 845
- Browser capture: 855 x 1902 pixels; Chrome's viewport override rendered 585 x 1268 CSS pixels because of host display scaling
- State: signed-out Discover route with Discover selected

## Full-view comparison evidence

The browser-rendered implementation uses the reference's defining composition: a floating rounded outer surface, one wide filled active capsule with an icon and label, and four icon-only inactive destinations. The treatment is adapted to BiteWise's existing aubergine, warm card, border, shadow, Manrope, and Lucide tokens rather than copying the reference's dark and electric-blue palette.

Browser geometry measured a 74 px-high navigation surface, a 56 px-high active target, four 44 px-wide inactive targets, a 480 px maximum outer width at the scaled browser viewport, 120 px of main-content bottom clearance, and no horizontal overflow. At the 390 x 845 CSS geometry check, the floating surface measured 351 x 74 px after Chrome's persistent scrollbar allowance, and only `Discover` was visually exposed as a label.

A normalized same-input comparison could not be completed because the source reference is a conversation attachment without a readable local file. The reference is also an isolated, angled component render rather than a full app screen in the same viewport and state. Formal screenshot-backed fidelity approval is therefore blocked.

## Focused region comparison evidence

- Active state: aubergine fill, high-contrast foreground, horizontal icon-and-label arrangement, rounded inner capsule, and subtle elevation match the reference's hierarchy.
- Inactive state: each destination retains a 44 x 56 px touch target while its label is visually hidden with `sr-only`; accessible names remain available to assistive technology.
- Container: the navigation remains centered, floating, safe-area-aware, and capped at 30 rem so it does not stretch excessively on compact tablets.
- Interaction: a live click on `Meal Plan` followed the link to the expected protected-route sign-in handoff. A live click on `Eat Now` likewise followed its protected-route sign-in handoff in the signed-out browser session.
- Console: no navigation-specific error was observed. Chrome reported an unrelated stale local Supabase refresh-token warning.

## Findings

- No browser-DOM P0/P1/P2 navigation layout or accessibility defect remains.
- Formal visual-fidelity approval remains blocked by the unavailable local source-image file and inability to create the required normalized combined comparison artifact.
- P3: the Next.js development-tools trigger overlaps the far-left edge in development captures only; it is framework tooling and is absent from production builds.

## Fidelity surfaces

- Fonts and typography: the active label retains BiteWise's Manrope UI font, semibold weight, compact responsive size, and single-line truncation protection.
- Spacing and layout rhythm: the outer 1.75 rem radius, inner 1.25 rem radius, 8 px shell padding, 4 px item gap, and 56 px targets reproduce the reference's pill-within-pill rhythm.
- Colors and visual tokens: existing `card`, `border`, `primary`, `primary-foreground`, `muted`, and `muted-foreground` tokens replace the reference palette without introducing a parallel design system.
- Image quality and asset fidelity: the reference contains only standard navigation icons; the implementation reuses the project's existing Lucide icon library and requires no raster assets.
- Copy and content: all five existing BiteWise destinations and their accessible names remain unchanged; only the selected destination is visually labelled.

## Comparison history

- Initial implementation: the current route was already filled, but every destination stacked an icon above a visible label and Cook detail used a separate flat edge-to-edge bar.
- Fixes: converted the mobile surface to a centered flex pill; expanded only the current route; visually hid inactive labels without removing their accessible names; retained 44 px-wide inactive targets; applied the same treatment to Cook detail; reduced compact active-state padding for longer labels.
- Post-fix evidence: five component regressions pass; browser geometry confirms the intended active/inactive proportions, safe content clearance, single visible label, and no horizontal overflow; live link activation reaches the expected protected-route handoff.

final result: blocked
