# Recipe details design QA

**Source visual truth**

- User-provided BiteWise recipe-detail mobile and desktop mockups in the current conversation.
- Source dimensions: mobile 945 x 1679 px; desktop 1456 x 1086 px.
- Intended states: default ingredients tab, serving count 4, kitchen inventory expanded.

**Implementation evidence**

- Route: `/recipes/githeri-avocado-bowl`.
- Browser-rendered route and responsive DOM were inspected at the recipe detail page.
- Implementation screenshots: unavailable because the connected Chrome capture command timed out.
- Browser viewport capture dimensions and density normalization: unavailable.
- Browser state: recipe title and preparation content visible; no console errors; responsive DOM had no horizontal overflow at the browser's enforced minimum width.

**Findings**

- [P1] Same-state screenshot comparison is blocked.
  Location: full recipe page at mobile, tablet, and desktop widths.
  Evidence: both source mockups are available and the implementation renders in the browser, but the browser could not capture an implementation screenshot.
  Impact: exact image crop, line wrapping, spacing, visual density, and breakpoint fidelity cannot receive the required visual sign-off.
  Fix: capture the rendered route at 390 px, 820 px, and 1440 px, combine the mobile and desktop captures with their corresponding source images, then correct any remaining P0/P1/P2 drift.

**Required fidelity surfaces**

- Fonts and typography: BiteWise's existing Newsreader and Manrope hierarchy is retained; exact wrapping and optical weight remain visually unverified.
- Spacing and layout rhythm: the mobile image-first flow, tablet single-column midpoint, and desktop content-plus-rail composition are implemented; screenshot comparison remains blocked.
- Colors and visual tokens: the existing aubergine, ivory, green, orange, red, violet, and blue semantic palette is used; rendered color comparison remains blocked.
- Image quality and asset fidelity: the existing optimized recipe WebP is rendered through `next/image`; exact crop and sharpness remain visually unverified.
- Copy and content: hero facts, rationale cards, kitchen readiness, serving control, ingredients, tutorial link, and preparation are present and readable in the browser DOM.

**Full-view comparison evidence**

- Blocked: browser-rendered implementation screenshots could not be captured.

**Focused region comparison evidence**

- Blocked: no valid full-view implementation capture exists from which to create hero, kitchen, and recipe-body comparisons.

**Primary interactions tested**

- Ingredients and Nutrition tabs render as controls.
- Serving decrement/increment controls are present and the serving-scaled ingredient behavior is covered by the updated Discover journey.
- Meal-plan and Cook Mode links preserve the existing routes.
- Browser rendered the recipe title and Preparation section with no console errors.

**Comparison history**

- Pass 1: blocked before combined-image comparison because Chrome screenshot capture timed out. No screenshot-derived fixes were claimed.

**Implementation checklist**

- Capture matching mobile, tablet, and desktop implementation screenshots.
- Compare source and implementation together.
- Resolve any P0/P1/P2 visual differences before visual sign-off.

**Follow-up polish**

- Defer P3 polish until screenshot evidence is available.

final result: blocked
