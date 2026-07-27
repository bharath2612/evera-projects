# Key-plan tracing playbook

How the Merdan podium key plan (`src/lib/keyplan.ts`) was built, written
down so every future plate (Merdan floors 1/7/tower, Olivo, Galleria)
comes out just as exact. The golden rule: **measure, never eyeball** —
"looks about right" polygons read as sloppy next to the brochure.

## 0. What a plate is

A `KeyPlanPlate` is the brochure's "which unit is where on this floor"
diagram redrawn as data: a `viewBox` in the artwork's native pixel space,
an `outline` polygon (filled with the corridor hatch), optional `voids`
(white shafts), and one polygon + label anchor per residence `pos` (the
last two digits of the unit number: 703 → "03"). `KeyPlan` renders it with the
brochure treatment — white residences, bronze fill + white label on
hover/selection — and shows live status subtly: a small legend-colored
dot under each numeral (green available / orange reserved / grey sold)
with sold shapes lightly greyed. Status fills were tried and rejected as
too loud; keep it to the dots.

## 1. Get the artwork at max resolution

- Ask for the source image (PNG > JPG; a clean screenshot is fine).
- If it was only pasted into a Claude session and the temp file is gone,
  recover it from the session transcript
  (`~/.claude/projects/<project>/<session>.jsonl` — image blocks carry
  base64 in `source.data`; decode with a small script).
- Keep the artwork's pixel size as the plate's `width`/`height` and trace
  in that coordinate space — no rescaling, no rounding into "nice"
  numbers. Strokes and font sizes derive from `plate.width` factors, so
  any native size works.

## 2. Measure the geometry programmatically (PIL + numpy)

Work through these probes, in order:

1. **Wall mask** — walls are the saturated bronze pixels. A mask like
   `(r - b > 30) & (r > 120) & (r < 215) & (b < 170)` isolates them;
   sample actual pixels first to calibrate (`a[y, x]`, note numpy indexes
   row-major).
2. **Filled/highlighted regions** (a pre-highlighted unit in the artwork
   fills with the same bronze as walls): detect per-row runs *wider than
   ~25px* — walls are ~7px, so wide runs = fill. Print the run extents
   per row to read off the region's exact polygon (bars, stems, notches
   fall straight out of the numbers).
3. **Thin wall segments** — knock the fill out of the mask, then extract
   horizontal segments (per-row runs ≥ ~18px, merged across adjacent
   rows) and vertical segments (same on the transpose). The output is a
   list of `y≈N x A..B` / `x≈N y A..B` centerlines — that IS the floor
   plan.
4. **Slanted edges** — scan the first wall pixel per row over the full
   height; fit the line from two distant rows. Don't assume corners are
   where a linear extrapolation says: verify the actual corner rows.
5. **Ambiguous junctions** — print a tiny ASCII map
   (`"#" if wall[y,x] else "."` over a window) around any joint you're
   unsure of. This is how the non-obvious details were caught: a genuine
   gap in a wall (08's room connects to its leg), a wall the segment
   detector missed (the x≈127 leg wall), and which pockets belong to the
   corridor.
6. **Hatch** — track one hatch line's x-drift down several rows to get
   the angle (Merdan: ~23° off vertical, leaning down-right → SVG pattern
   `rotate(-23)` on vertical lines) and the spacing between adjacent
   lines (~36px). Faint-pixel masks also tell you whether a small pocket
   is hatched, tinted, or plain white — sample density against a known
   hatch band before deciding.

## 3. Author the plate

- Polygons go on **wall centerlines**; shared walls appear once in each
  neighbor's polygon (they overlap under the stroke, which is correct).
- Preserve every jog, notch, leg and step the measurements show — those
  details are exactly what makes it read as the real plan. For Merdan:
  08's shaft cut-out + slant leg, 01's entry foot, 02's staircase steps,
  05's T with the door notch, 06/04 wrapping under the bar, 03's edge
  notch, the corridor wedge by 07.
- Render trick: fill the whole outline with the hatch pattern and draw
  the unit shapes on top — everything not covered by a unit is corridor
  automatically. White shafts go in `voids`, drawn last.
- Scale-relative styling: `wallStroke = plate.width * 0.0055`,
  `fontSize = plate.width * 0.055`, hatch tile `plate.width * 0.0285`.
  Give the `<svg>` explicit `width`/`height` attributes so CSS max-height
  caps scale it like an `<img>`.
- Colors: brand tokens only (`var(--brand)` + `color-mix`) for walls,
  hatch and the hover fill; Tailwind palette vars
  (`var(--color-emerald-500)` etc.) for the status dots. Never hardcode
  hex.
- Labels: measured centers from the artwork, weight 300, wide tracking —
  matches the brochure's numerals.

## 4. Verify like a reviewer

- Screenshot the rendered SVG element alone (Playwright
  `locator("[data-keyplan]").screenshot()`) and compare it against the
  artwork zoomed side by side; crop-zoom suspicious areas with PIL.
- Watch for the **font-loading race**: a screenshot taken before Geist
  loads renders some labels in the fallback font and they look bold.
  Wait ~800ms after `networkidle` before judging typography.
- Run the E2E suite — the plate feeds hover/click interactions the tests
  cover (`data-keyplan-unit` count, hover sync with rows, click → unit
  dialog).

## 5. Register it

Add the plate to `PLATES` in `src/lib/keyplan.ts` with its floor range.
Everything else (placeholder replacement, interactivity, status colors)
is automatic.
