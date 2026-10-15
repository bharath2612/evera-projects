# Galleria Residences facade — 2026-10-15

Enabled the existing `FloorExplorer` on the project details view by setting
Galleria's previously null `facade_config`. The project is
`galleria-residences` (`18f71e2e-e519-4a4e-b86b-02be38efa7ec`). The inventory
contains 64 units: 16 on each residential floor, 1–4. Rooftop structures and
ground-floor parking/lobby are not additional inventory floors.

## Artwork

- Supplied source: `/Users/bharathchippa/Downloads/galleria residence.jpg`.
- Source dimensions: 7705 × 4300; SHA-256:
  `71269179b3a24e1e166347ef11e86e9f165fbf1b9628cc2fe8a3107111f8dbb5`.
- Web copy: 2400 × 1340 JPEG, quality 90, 792,908 bytes. Same full composition;
  no crop, generated artwork or changes to the building.
- Public marketing bucket: `public-media`.
- Immutable object path:
  `projects/galleria-residences/facade/front-8560fd75a3f2.jpg`.
- Web-copy SHA-256:
  `8560fd75a3f2864a0767c7c24da670b68dd225970ed69fa7da1e5afb27932150`.

The configured image is the absolute public storage URL under
`https://lvobvhznrpeimafoansz.supabase.co/storage/v1/object/public/public-media/`.
Using the established public marketing bucket makes the image available to the
already deployed facade component without an application deployment. A fresh
versioned object avoids overwriting any existing gallery or facade image.

## Measured floor bands

Slab-edge luminance measurements used a 2048 × 1143 analysis copy. The left
guide sits at x=254 and the right at x=1907. The top residential boundary is
y=290 on the left and y=301 on the right; the bottom is y=709 at both ends.
Intermediate bands use the existing four-floor linear interpolation. Local
curves/setbacks in the slab edges remain within the existing guide model.

```json
{
  "width": 2400,
  "height": 1340,
  "floors": { "min": 1, "max": 4 },
  "guides": {
    "bottom": [[0.1240234375, 0.6202974628171478], [0.93115234375, 0.6202974628171478]],
    "top": [[0.1240234375, 0.2537182852143482], [0.93115234375, 0.26334208223972005]]
  }
}
```

The update checked the exact project ID, the current 64-unit/four-floor
inventory and the previous null configuration. A compare-and-swap update
prevented replacing a concurrently added configuration. No gallery, cover,
unit data, pricing, publication setting or other project was changed.

## Live validation

The public project view returns the configuration and its original 64 units.
Downloaded artwork matched the uploaded SHA-256. On the live page at
`https://project.evera.dev/projects/galleria-residences`:

- Desktop 1366 × 768: image decoded at 2400 px; exactly four floor options;
  top/bottom hover overlays visually reviewed against the residential floors.
- Floors 4 and 1 opened their correct 16-residence sheets using keyboard
  Enter; Escape dismissed them.
- Mobile 390 × 650: no horizontal overflow; tapping floor 2 opened its
  16-residence sheet, and the close button dismissed it.
- Mobile artwork and sheet screenshots visually reviewed.

No frontend source or schema change was required. Reverting this addition
means restoring only this project's `facade_config` to its previous null value;
the uploaded marketing object can remain available for future reuse.
