# Meal Plan and application-shell responsive revamp — design QA

**Source visual truth**

- User-provided Whole Week and shell composite mockup in the latest 2026-08-14 request.
- Target states: BiteWise's established desktop sidebar with a two-column Whole Week grid; mobile with the established compact header and bottom navigation plus the new weekly summary and accordion day cards. The mockup's top navigation is not part of the requested shell change.
- Source composite dimensions: 1676 × 909 px. The device frames and surrounding canvas prevent exact CSS viewport recovery.

**Implementation evidence**

- Route: `http://127.0.0.1:3000/meal-plan`
- Browser: connected Chrome
- State reached: signed-out redirect to `/auth/sign-in?next=%2Fmeal-plan`
- Browser console errors: none
- Primary interactions tested: route navigation and protected-route redirect only
- Implementation screenshot: unavailable because the protected Meal Plan UI was not rendered in the connected browser
- Viewport and density comparison: unavailable; no authenticated implementation capture exists to normalize against the source

**Findings**

- [P0] Authenticated implementation cannot be captured
  Location: `/meal-plan`
  Evidence: the browser redirected to the sign-in route before the Meal Plan screen rendered.
  Impact: desktop, tablet, and mobile visual fidelity cannot be assessed from browser evidence.
  Fix: sign in to the connected browser with a completed BiteWise profile, then capture the same selected-day state at the three target widths.

**Required fidelity surfaces**

- Fonts and typography: blocked pending authenticated captures.
- Spacing and layout rhythm: blocked pending authenticated captures.
- Colors and visual tokens: blocked pending authenticated captures.
- Image quality and asset fidelity: code uses the catalogue's optimized local WebP photography, but visual crop and sharpness remain blocked pending authenticated captures.
- Copy and content: source-level review confirms the target heading, revised description, budget summary, day selector, meal metadata, Whole Week cards, preserved BiteWise sidebar navigation, and actions are represented; browser confirmation is blocked.

**Comparison history**

- Initial pass: blocked before visual comparison because the protected route redirected to sign-in.
- No visual fixes were made from screenshot evidence, because no authenticated implementation screenshot was available.

**Implementation checklist**

- Authenticate the connected browser with a completed BiteWise profile.
- Capture desktop and mobile Whole Week states plus the selected-day state.
- Compare each capture together with the source mockup and fix all P0/P1/P2 differences.
- Verify day selection, whole-week toggle, meal edit disclosure, shopping-list generation, and week regeneration.

final result: blocked
