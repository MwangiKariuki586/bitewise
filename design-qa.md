# Eat Now design QA

**Source visual truth**

- Four user-provided BiteWise Eat Now mockups in the current conversation.
- States: expanded constraints before generation and collapsed constraints with results.
- Target viewports: mobile, tablet, and desktop.
- Source pixel dimensions: 863 × 1822, 1086 × 1448, 1456 × 1086, and 942 × 1675 px.

**Implementation evidence**

- Route: `/eat-now`.
- Browser-rendered authenticated screenshot: unavailable.
- Implementation pixel dimensions and density normalization: unavailable.
- Connected-browser state: signed-out redirect to `/auth/sign-in?next=%2Feat-now`.
- Automated browser states verified separately: mobile and desktop expanded form, successful collapsed summary/results, no-match result, Edit/regeneration, recipe details/back restoration, sorting, 360/390 px navigation clearance, and accessibility.

**Findings**

- [P1] Screenshot-backed comparison is blocked.
  Location: complete Eat Now page at mobile, tablet, and desktop widths.
  Evidence: the supplied mockups are available, but the connected browser session was signed out and redirected before the protected page rendered. The in-app browser surface was unavailable.
  Impact: typography, spacing, image crop, color, responsive card density, and exact visual alignment cannot receive the required same-state screenshot sign-off.
  Fix: open an authenticated Eat Now session in the in-app browser, capture expanded and successful-result states at matching viewports, combine each capture with its source mockup, and fix any remaining P0/P1/P2 drift.

**Required fidelity surfaces**

- Fonts and typography: existing Newsreader and Manrope brand typography is preserved; exact rendered wrapping remains unverified.
- Spacing and layout rhythm: mockup-led hero, constraints, shortlist, and responsive card grids are implemented; screenshot comparison remains blocked.
- Colors and visual tokens: existing BiteWise ivory, aubergine, rose-stone, green, and orange semantic surfaces are retained; rendered sampling remains unverified.
- Image quality and asset fidelity: the existing optimized Githeri WebP is used for the hero and catalogue assets remain served through `next/image`; live crop and sharpness remain unverified.
- Copy and content: mockup hierarchy and interaction labels are implemented; exact line wrapping remains unverified.

**Full-view comparison evidence**

- Blocked: no authenticated browser-rendered implementation screenshot could be captured.

**Focused region comparison evidence**

- Blocked: no valid same-state full-view capture exists from which to produce constraints and card-region comparisons.

**Primary interactions tested**

- Full constraints render before generation.
- Success collapses; Edit expands; regeneration collapses again.
- Error/no-match behavior preserves hard constraints and editable values.
- Dedicated recipe details navigation restores constraints, results, sort, and scroll state on back navigation.
- Mobile navigation clearance is verified at 360 px and 390 px.
- The complete 58-test mobile/desktop Playwright suite passes with one intentional mobile-only skip; the Eat Now result state also passes an automated accessibility scan.
- Connected browser console errors for the authenticated state could not be checked because the session redirected to sign-in.

**Comparison history**

- Pass 1: blocked before visual comparison. The connected browser loaded the protected route but redirected to sign-in; the in-app browser was unavailable. No screenshot-derived fixes were made.

**Implementation checklist**

- Open a signed-in Eat Now session in the in-app browser.
- Capture expanded and collapsed/result states at matching mobile, tablet, and desktop viewports.
- Compare source and implementation in combined images and resolve any P0/P1/P2 findings.

**Follow-up polish**

- Defer P3 visual polish until screenshot-backed comparison is available.

final result: blocked
