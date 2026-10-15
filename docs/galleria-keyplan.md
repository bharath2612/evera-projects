# Galleria SVG key plan — 2026-10-15

Galleria's floor sheets now use a native SVG plate in `src/lib/keyplan.ts`,
registered for residential floors 1–4. Each position 01–16 maps to the last
two digits of the floor's actual unit number; all four floors have those
sixteen positions. This uses the supplied single layout for those floors.

## Source and tracing

The supplied screenshot is preserved at
[`assets/galleria-keyplan-source.png`](assets/galleria-keyplan-source.png).
Its native dimensions are **159 × 238**. White-region connected components
isolated the residences and central core; a separate bronze mask recovered
the highlighted position 14. Outer contours were simplified with a maximum
0.9-source-pixel deviation and retained in the native coordinate system.
Label anchors were measured from the screenshot.

The slanted outer perimeter, recessed sides, corridor branches and interlocking
entries remain in the traced geometry. The existing `KeyPlan` component owns
styles, availability, hover, keyboard activation and navigation. Position 14
uses live status like every other position; its screenshot highlight is not
hardcoded. No Merdan or Arché geometry, shared component or public data
contract changed.

## Verification before push

Compared the supplied source and actual browser-rendered SVG side by side at
4× source size, including the top partitions, corridor notches and bottom
03/04/05/06 entries. See
[`assets/galleria-keyplan-comparison.png`](assets/galleria-keyplan-comparison.png).
Colours/dots follow the existing live-availability treatment; the comparison
is of the geometry rather than the source's fixed selected-unit appearance.

- Extracted all 16 polygons from the rendered DOM and compared their boundaries
  with the source contours: maximum deviation below 0.9 source pixels for
  every residence.
- Desktop browser: 16 SVG residences on each of floors 1–4; keyboard activation
  of position 14 on floor 1 opens `/units/114`.
- Mobile 390 × 650: 16 residences, no horizontal overflow; tapping position 03
  on floor 2 opens `/units/203`. Visually reviewed the floor sheet.
- Compared all existing Merdan/Arché plate outputs with the baseline for floors
  0–20: unchanged. Galleria floors 0 and 5 return no plate; shared-floor
  navigation correctly derives floors 1–4.
- ESLint, TypeScript and production build passed.

No database or media update is needed for this plate. Publishing the application
code enables it in the previously configured Galleria facade explorer.
