# weiproduct.com — Premium polish plan

Goal: make the site read as more high-end and professional (investor-grade) **without** rewriting the solid existing structure/content. Grounded in a full read of `index.html`, `css/style.css`, `js/main.js` and a baseline render.

Current strengths (keep): clean investor narrative, dynamic agent grid + filters, ambient icon background, scroll reveals, strong SEO/JSON-LD, good responsive rules.

Weak "cheap" signals to fix:
- Icons are **text placeholders** (`@`, `CA`, `GH`, `in`, `17`, `WF`) and the Operating-model grid awkwardly shows `01 / 02 / AI / 04`.
- System font only; flat 8px cards with thin gray borders; minimal depth.
- Footer is a single bare line (brand + copyright).

## Work items (execute in order, render-check each)

1. **Real SVG icon system** — add an inline `<svg><symbol>` sprite (mail, phone, map-pin, github, linkedin, layers, spark/founder, ship, moment, ai, compound) and replace every text `.ui-icon` with `<svg><use></use></svg>`. Fixes the biggest amateur signal. Also unify the Operating-model icons.
2. **Premium typography** — load Inter (preconnect + display=swap) with system fallback; tighten heading tracking (-0.02em), enable tabular-nums on metrics/counts.
3. **Depth & material** — larger radius (8→14px), layered soft shadows, subtle gradient card surfaces, refined hover (lift + ring). Applies to hero metrics, thesis, featured, product, focus, contact cards + filter chips.
4. **Hero refinement** — animated count-up on the `17` / `5` metrics (reduced-motion safe), a refined gradient/mesh accent, gradient text on the headline keyword.
5. **Nav polish** — scroll-spy active link + a slim top scroll-progress bar; subtle nav shadow on scroll.
6. **Richer footer** — multi-column: brand + tagline, Explore links, Connect (GitHub/LinkedIn/Email with SVG icons), legal line.
7. **Final QA** — full-page render (desktop + mobile widths), reduced-motion check, verify dynamic grid/filters/ambient still work, then ship.

Constraint: keep it fast and self-contained (only Inter as an external font, with system fallback); do not break the JS-rendered product grid, filters, or ambient background; preserve accessibility (aria, focus, reduced-motion).

---

## ✅ Completed (2026-07-13) — all 7 items shipped & pushed

1. ✅ SVG icon system — inline `<symbol>` sprite; replaced every text placeholder (`@`,`CA`,`GH`,`in`,`17`,`WF`,`01/02/AI/04`) with real icons.
2. ✅ Inter font (preconnect + display=swap, system fallback), tighter heading tracking, tabular-nums.
3. ✅ Depth — 16px radius, layered shadows, gradient card surfaces, hover lift on all cards + chips, gradient primary button.
4. ✅ Hero count-up on 17 / 5 (reduced-motion safe).
5. ✅ Nav scroll-spy active link + top scroll-progress bar + shadow-on-scroll.
6. ✅ Richer footer — brand + tagline, Explore column, Connect column with SVG social buttons + email, legal row.
7. ✅ QA — verified desktop (1440) + mobile (true 520px viewport); product grid/filters/ambient intact; reduced-motion respected. Committed index.html/style.css/main.js and pushed to `WeiProduct/weiproduct.com` (main).

Notes: the local `~/Desktop/weiproduct.com` repo was synced to remote before editing. QA gotcha — headless Chrome enforces a ~500px minimum viewport, so sub-500 `--window-size` screenshots clip a 500px layout (false "overflow"); render at ≥520px for true mobile. The only real overflow is a harmless 6px from the ambient-icon drift, already clipped by `overflow-x:hidden`.
