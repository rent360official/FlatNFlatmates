The left column of the hero section (headline + subheadline + CTA buttons) currently has a lot of unused vertical/horizontal whitespace compared to the busier map column on the right. Fix the imbalance **without cramming the left side with new competing content** — the fix should feel like better use of space, not "let's add more stuff."

Do the following, in this order of priority:

### 1. Reclaim it with scale and spacing first (do this regardless of what else you add)
- Increase the headline's font size one step up in the existing type scale, and/or increase the max-width the headline text is allowed to wrap at, so it occupies more horizontal room before wrapping.
- Increase vertical spacing: more top padding before the headline, more gap between subheadline and the CTA buttons. The goal is for the content block to feel intentionally centered in the available height, not top-anchored with a void below it.
- Check that on wider desktop viewports the left column isn't fixed at a narrow max-width while a lot of empty column space sits unused beside it — let it use more of the available column width proportionally.

### 2. Then add exactly ONE lightweight trust element below the CTA buttons — pick one, don't stack multiple:

**Option A — Avatar cluster line (recommended, most compact):**
A single row: 4–5 small overlapping circular avatar images (reuse the same "Lister" avatar assets already used on the property cards) + one line of text: `"Joined by 1,200+ renters across Pune"`. This is one visual element, one line of text — low visual weight, adds social proof without re-introducing the old 3-stat row we removed earlier.

**Option B — Three inline trust badges:**
A single horizontal row (wraps to 2 lines on narrow widths) of 3 short icon+label pairs, e.g.:
`✓ Verified listings   ·   ₹0 Brokerage   ·   🔒 Safe, masked calling`
Small icons (reuse existing icon set/library already in the project), muted text color (`text.secondary` token), no borders/boxes around them — just icon + label + a middot separator. Keep it to one row of plain text, not three separate card/pill components (that would start to feel like clutter).

**Option C — Reintroduce the eyebrow tag above the headline:**
If neither A nor B feels right, at minimum restore a small eyebrow pill above the headline (e.g. `Live in Pune right now` or `New · Now live in Pune`) — it was present in an earlier version of this design and adds a bit of vertical content plus context without adding a new content block.

Implement **Option A** unless there's a strong reason in the codebase to prefer B or C (e.g. avatar assets aren't easily reusable, or icon set is limited) — the avatar cluster reads as the least "busy" addition while still filling space.

### 3. Guardrails — do not:
- Do not bring back the full 3-stat row (`5,000+ / 1,200+ / 98%`) that was removed in the previous pass — that was intentionally cut for being too dense next to the CTAs.
- Do not add a decorative illustration/graphic to the left column purely to fill space — it'll compete with the map visual on the right and double up on imagery.
- Do not change the CTA button styling/color/position — only the space above and below them.
- Do not let whatever's added push the CTA buttons below the fold on smaller desktop heights (~700–800px viewport height) — verify this after the change.

### 4. Acceptance check
- [ ] Left column visually balances against the right column's density — no large obvious empty gap.
- [ ] Only one new trust element added (not multiple).
- [ ] CTA buttons remain fully visible without scrolling at common desktop viewport heights.
- [ ] No layout regression on mobile (this change is desktop-focused since mobile already stacks the map below the CTAs).