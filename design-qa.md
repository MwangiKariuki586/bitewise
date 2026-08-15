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

---

# Recipe hero image blend — design QA

**Source visual truth**

- User-provided recipe-detail mockup in the current conversation, showing a borderless right-side photograph with a long white dissolve into the recipe copy.
- The source attachment is conversation-hosted and has no local filesystem path.

**Implementation evidence**

- Route: `http://localhost:3000/recipes/maize-porridge-milk`
- Browser: connected Chrome
- State: signed-in recipe detail at desktop, tablet, and phone geometry.
- Desktop screenshot: captured inline during this review; Chrome repeatedly timed out when saving a local screenshot artifact.
- Verified geometry: desktop image uses 52% of the hero and the blend covers 44% of the image; phone image is 375 × 240 CSS px with a 112 px bottom dissolve.
- Primary interactions: route rendering and responsive viewport changes.

**Findings and comparison history**

- [P1, fixed] The explicit desktop column divider touched the image's right edge and visually framed it. Removed the divider; Chrome reports a `0px` right border.
- [P1, fixed] The 80–96 px fade exposed the image's rectangular left edge. The image now overlaps the copy and uses a 44%-wide, more opaque dissolve.
- [P2, fixed] The mobile 64 px fade ended abruptly. It is now 112 px tall with a softer midpoint.
- [P2, fixed] The hero bottom rule and sharp image cutoff remained visible. The rule was removed and a shallow desktop/tablet bottom dissolve was added.
- [P2, remaining] The catalogue photograph and source mockup use different subject composition and cannot be normalized for image-fidelity comparison without the original mockup asset.

**Required fidelity surfaces**

- Fonts and typography: unchanged and visually consistent with the existing BiteWise system.
- Spacing and layout rhythm: image/content overlap now follows the source composition; surrounding recipe spacing is unchanged.
- Colors and visual tokens: fade uses the existing card token and avoids a mismatched overlay color.
- Image quality and asset fidelity: optimized catalogue photography remains sharp, but subject-level fidelity is blocked by the different source asset.
- Copy and content: recipe content is intentionally data-driven and differs between catalogue records.

**Implementation checklist**

- Obtain the original mockup image as a local attachment if exact normalized comparison is required.
- Re-run a single combined source/implementation comparison at matching content and viewport.

final result: blocked
