# Landing page design QA

**Source visual truth**

- User-provided BiteWise desktop landing-page reference image in the current conversation.
- Source pixel dimensions: 1086 × 1448 px.
- Intended source viewport: desktop, inferred from the supplied full-page composition.

**Implementation evidence**

- Route: `/`
- Intended comparison viewport: 1086 × 1448 CSS px at device scale factor 1.
- Browser-rendered screenshot: unavailable.
- Implementation pixel dimensions: unavailable.
- State: signed-out public landing page.
- Density normalization: not possible because the implementation could not be captured.

**Findings**

- [P1] Required visual comparison is unavailable.
  Location: full landing page.
  Evidence: the source reference is available, but the in-app browser reported no available browser surfaces, so no browser-rendered implementation screenshot could be placed beside it.
  Impact: desktop fidelity, tablet/mobile layout resilience, image crop, typography, spacing, colors, copy, icon alignment, interaction states, and polish cannot receive screenshot-backed sign-off.
  Fix: reconnect the in-app browser, capture the signed-out page at desktop, tablet, and mobile widths, compare the desktop capture with the supplied reference in one combined visual, and address all P0/P1/P2 differences.

**Required fidelity surfaces**

- Fonts and typography: implemented with the existing self-hosted Newsreader and Manrope brand fonts; browser fidelity remains unverified.
- Spacing and layout rhythm: responsive desktop, tablet, and mobile rules are implemented; browser layout and overflow remain unverified.
- Colors and visual tokens: the reference's warm ivory, aubergine, saffron, leaf, and terracotta palette is mapped to the existing BiteWise system; rendered values remain unverified.
- Image quality and asset fidelity: existing optimized local githeri photography is used for both food-image slots with responsive `next/image` sizing; live crop and sharpness remain unverified.
- Copy and content: reference-inspired BiteWise copy and all primary journey actions are implemented; wrapping remains unverified.
- Icons: the installed line-icon family is used consistently; rendered optical alignment remains unverified.

**Full-view comparison evidence**

- Blocked: no browser-rendered implementation screenshot is available.

**Focused region comparison evidence**

- Blocked: without a full-view implementation capture, valid same-state focused crops cannot be produced.

**Primary interactions tested**

- Source-level and unit coverage confirms the two Find my next meal actions, recipe links, landing navigation, and section anchors render with semantic links.
- Browser clicking, keyboard focus, responsive controls, and console errors were not tested because no browser surface was available.

**Comparison history**

- Pass 1: blocked before visual comparison. Browser runtime setup succeeded, but browser discovery returned no available surfaces. No visual fixes were made from screenshot evidence.

**Implementation checklist**

- Reconnect the in-app browser.
- Capture desktop at the reference width and inspect the primary links and console.
- Capture tablet and mobile views and check overflow, wrapping, image crop, and touch targets.
- Run the combined source/implementation visual comparison and fix all P0/P1/P2 findings.

**Follow-up polish**

- Defer P3 polish until screenshot-backed comparison is available.

final result: blocked
