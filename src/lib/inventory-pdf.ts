import { PDFDocument, PDFFont, PDFImage, StandardFonts, rgb } from "pdf-lib";

/**
 * Inventory List PDF — portrait A4: the sales-offer cover as page one,
 * the for-sale table under an evergreen header band with the generation
 * date/time stamped above it, then one full-bleed floor-plan page per
 * unit. Pure builder shared VERBATIM between
 * evera-one (CRM export dropdown) and evera-projects (public inventory
 * download) — keep the two copies identical; data plumbing differs on
 * each side, bytes in / bytes out here.
 */

const PAGE = { width: 595.28, height: 841.89, margin: 48 } as const; // A4 portrait
const EVERGREEN = rgb(0x2c / 255, 0x37 / 255, 0x32 / 255);
const BRONZE = rgb(0x98 / 255, 0x7f / 255, 0x6a / 255);
const MUTED = rgb(0.45, 0.48, 0.46);
const INK = rgb(0.2, 0.22, 0.21);
const HAIRLINE = rgb(0.78, 0.8, 0.79);
const WHITE = rgb(1, 1, 1);

export interface InventoryRow {
  floor: number;
  unitNumber: string;
  typeLabel: string;
  suiteSqft: number | null;
  balconySqft: number | null;
  totalSqft: number;
  priceAed: number;
}

export interface InventoryPdfInput {
  projectName: string;
  /** The project's accent hex (#rrggbb) from settings. When set, it
      themes the sheet: accent verbatim where bronze sits, a darkened
      shade where evergreen sits (table band, chips, cover, unit tags).
      null/invalid → the house evergreen/bronze palette. */
  accentColor?: string | null;
  /** Pre-formatted stamp, e.g. "August 24, 2026 · 2:58 PM". */
  generatedAt: string;
  /** Human label of the active unit-type filter ("1 Bedroom"), or null
      for the full inventory — shown as a chip in the page header. */
  typeFilterLabel: string | null;
  /** Sales-offer cover artwork (jpg/png); null → typographic cover. */
  cover: Uint8Array | null;
  rows: InventoryRow[];
  /** One entry per row, same order; null bytes → no plan page. */
  floorPlans: Array<Uint8Array | null>;
}

const NUM = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const PRICE = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function floorLabel(floor: number): string {
  if (floor <= 0) return floor === 0 ? "GROUND FLOOR" : `B${-floor}`;
  const mod100 = floor % 100;
  const suffix =
    mod100 >= 11 && mod100 <= 13
      ? "th"
      : ["th", "st", "nd", "rd"][floor % 10 < 4 ? floor % 10 : 0];
  return `${floor}${suffix} FLOOR`;
}

async function embedImage(
  doc: PDFDocument,
  bytes: Uint8Array,
): Promise<PDFImage | null> {
  try {
    // PNG magic bytes, else assume JPEG (the two formats the media
    // pipeline accepts).
    return bytes[0] === 0x89 && bytes[1] === 0x50
      ? await doc.embedPng(bytes)
      : await doc.embedJpg(bytes);
  } catch {
    return null;
  }
}

export async function buildInventoryPdf(
  input: InventoryPdfInput,
): Promise<Uint8Array> {
  // Project theme: ACCENT stands in for bronze, DEEP for evergreen.
  // Settings enforce ≥4.5 contrast on white, so darkening the accent
  // (×0.6 per channel) yields a rich band color, never a pastel one.
  const hex = input.accentColor;
  const channels =
    hex && /^#[0-9a-f]{6}$/i.test(hex)
      ? ([1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [
          number,
          number,
          number,
        ])
      : null;
  const ACCENT = channels ? rgb(...channels) : BRONZE;
  const DEEP = channels
    ? rgb(channels[0] * 0.6, channels[1] * 0.6, channels[2] * 0.6)
    : EVERGREEN;

  const doc = await PDFDocument.create();
  doc.setTitle(`${input.projectName} — Inventory List`);
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const sansBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const serif = await doc.embedFont(StandardFonts.TimesRoman);

  // ── cover ──────────────────────────────────────────────────────────
  const cover = doc.addPage([PAGE.width, PAGE.height]);
  const coverImage = input.cover ? await embedImage(doc, input.cover) : null;
  if (coverImage) {
    // Cover-fit: fill the page, crop the overflow.
    const scale = Math.max(
      PAGE.width / coverImage.width,
      PAGE.height / coverImage.height,
    );
    const w = coverImage.width * scale;
    const h = coverImage.height * scale;
    cover.drawImage(coverImage, {
      x: (PAGE.width - w) / 2,
      y: (PAGE.height - h) / 2,
      width: w,
      height: h,
    });
  } else {
    cover.drawRectangle({
      x: 0,
      y: 0,
      width: PAGE.width,
      height: PAGE.height,
      color: DEEP,
    });
    cover.drawText(input.projectName, {
      x: PAGE.margin,
      y: PAGE.height / 2 + 24,
      size: 34,
      font: sansBold,
      color: WHITE,
    });
    cover.drawText("Inventory List", {
      x: PAGE.margin,
      y: PAGE.height / 2 - 16,
      size: 22,
      font: sans,
      color: WHITE,
    });
  }

  // ── table pages ────────────────────────────────────────────────────
  const left = PAGE.margin;
  const contentWidth = PAGE.width - PAGE.margin * 2;
  const COLS: Array<{
    label: string;
    width: number;
    value: (row: InventoryRow, index: number) => string;
  }> = [
    { label: "Sr", width: 30, value: (_row, index) => String(index + 1) },
    { label: "Floor", width: 72, value: (row) => floorLabel(row.floor) },
    { label: "Unit No", width: 48, value: (row) => row.unitNumber },
    { label: "Unit Type", width: 88, value: (row) => row.typeLabel },
    {
      label: "Suite",
      width: 56,
      value: (row) =>
        row.suiteSqft === null ? "—" : NUM.format(row.suiteSqft),
    },
    {
      label: "Balcony",
      width: 58,
      value: (row) =>
        row.balconySqft === null ? "—" : NUM.format(row.balconySqft),
    },
    {
      label: "Total (sqft)",
      width: 70,
      value: (row) => NUM.format(row.totalSqft),
    },
    {
      label: "Price AED",
      width: contentWidth - 30 - 72 - 48 - 88 - 56 - 58 - 70,
      value: (row) => PRICE.format(row.priceAed),
    },
  ];
  const ROW_H = 24;
  // First table page carries the full designed header (project eyebrow,
  // "Inventory List" title, filter chip, generation stamp, bronze rule);
  // continuation pages repeat a slim one so every page stays labelled.
  const HEADER_BAND = 96;
  const SLIM_BAND = 34;
  const rowsThatFit = (reserved: number) =>
    Math.floor((PAGE.height - PAGE.margin * 2 - reserved - ROW_H) / ROW_H);

  const chipText =
    input.typeFilterLabel === null
      ? "All unit types"
      : `${input.typeFilterLabel} only`;

  const drawChip = (
    page: ReturnType<typeof doc.addPage>,
    text: string,
    rightEdge: number,
    baselineY: number,
  ) => {
    const size = 9;
    const w = sansBold.widthOfTextAtSize(text, size) + 18;
    const h = 19;
    page.drawRectangle({
      x: rightEdge - w,
      y: baselineY,
      width: w,
      height: h,
      color: input.typeFilterLabel === null ? DEEP : ACCENT,
    });
    page.drawText(text, {
      x: rightEdge - w + 9,
      y: baselineY + 6,
      size,
      font: sansBold,
      color: WHITE,
    });
  };

  let start = 0;
  let firstTablePage = true;
  while (start < input.rows.length) {
    const reserved = firstTablePage ? HEADER_BAND : SLIM_BAND;
    const page = doc.addPage([PAGE.width, PAGE.height]);
    const slice = input.rows.slice(start, start + rowsThatFit(reserved));
    let y = PAGE.height - PAGE.margin - reserved - ROW_H;

    const top = PAGE.height - PAGE.margin;
    if (firstTablePage) {
      // Eyebrow: project name, spaced uppercase.
      page.drawText(input.projectName.toUpperCase().split("").join(" "), {
        x: left,
        y: top - 10,
        size: 9.5,
        font: sansBold,
        color: ACCENT,
      });
      // Title.
      page.drawText("Inventory List", {
        x: left,
        y: top - 40,
        size: 27,
        font: serif,
        color: DEEP,
      });
      // Right column: filter chip over the generation stamp.
      drawChip(page, chipText, left + contentWidth, top - 26);
      const stamp = `Generated ${input.generatedAt}`;
      page.drawText(stamp, {
        x: left + contentWidth - sans.widthOfTextAtSize(stamp, 9),
        y: top - 42,
        size: 9,
        font: sans,
        color: MUTED,
      });
      // Bronze rule closing the header block.
      page.drawLine({
        start: { x: left, y: top - 58 },
        end: { x: left + contentWidth, y: top - 58 },
        thickness: 1.4,
        color: ACCENT,
      });
      page.drawText(
        `${input.rows.length} residence${input.rows.length === 1 ? "" : "s"} for sale`,
        {
          x: left,
          y: top - 76,
          size: 9.5,
          font: sans,
          color: MUTED,
        },
      );
    } else {
      page.drawText("Inventory List", {
        x: left,
        y: top - 14,
        size: 12,
        font: serif,
        color: DEEP,
      });
      const cont = `${input.projectName} · continued`;
      page.drawText(cont, {
        x: left + contentWidth - sans.widthOfTextAtSize(cont, 9),
        y: top - 13,
        size: 9,
        font: sans,
        color: MUTED,
      });
    }

    // Header band.
    page.drawRectangle({
      x: left,
      y,
      width: contentWidth,
      height: ROW_H,
      color: DEEP,
    });
    let x = left;
    for (const col of COLS) {
      page.drawText(col.label, {
        x: x + 7,
        y: y + 8,
        size: 9.5,
        font: sansBold,
        color: WHITE,
      });
      x += col.width;
    }

    const drawCellText = (
      text: string,
      colX: number,
      rowY: number,
      font: PDFFont,
    ) =>
      page.drawText(text, {
        x: colX + 7,
        y: rowY + 8,
        size: 9.5,
        font,
        color: INK,
      });

    slice.forEach((row, sliceIndex) => {
      y -= ROW_H;
      let colX = left;
      for (const col of COLS) {
        drawCellText(col.value(row, start + sliceIndex), colX, y, sans);
        colX += col.width;
      }
      page.drawLine({
        start: { x: left, y },
        end: { x: left + contentWidth, y },
        thickness: 0.6,
        color: HAIRLINE,
      });
    });

    // Outer frame + column separators over the drawn block.
    const blockTop = PAGE.height - PAGE.margin - reserved;
    const blockBottom = y;
    page.drawRectangle({
      x: left,
      y: blockBottom,
      width: contentWidth,
      height: blockTop - blockBottom,
      borderColor: HAIRLINE,
      borderWidth: 0.8,
    });
    let sepX = left;
    for (const col of COLS.slice(0, -1)) {
      sepX += col.width;
      page.drawLine({
        start: { x: sepX, y: blockBottom },
        end: { x: sepX, y: blockTop },
        thickness: 0.6,
        color: HAIRLINE,
      });
    }

    start += slice.length;
    firstTablePage = false;
  }

  // ── one floor-plan page per unit ───────────────────────────────────
  for (let index = 0; index < input.rows.length; index += 1) {
    const bytes = input.floorPlans[index];
    if (!bytes) continue;
    const image = await embedImage(doc, bytes);
    if (!image) continue;
    const page = doc.addPage([PAGE.width, PAGE.height]);
    // Contain-fit, full bleed — the plan artwork is the whole page.
    const scale = Math.min(
      PAGE.width / image.width,
      PAGE.height / image.height,
    );
    const w = image.width * scale;
    const h = image.height * scale;
    page.drawImage(image, {
      x: (PAGE.width - w) / 2,
      y: (PAGE.height - h) / 2,
      width: w,
      height: h,
    });
    // Unit tag so identical type plans stay attributable per unit.
    const tag = `No. ${input.rows[index].unitNumber}`;
    const tagW = sansBold.widthOfTextAtSize(tag, 10) + 16;
    page.drawRectangle({
      x: PAGE.width - tagW - 20,
      y: PAGE.height - 40,
      width: tagW,
      height: 22,
      color: DEEP,
    });
    page.drawText(tag, {
      x: PAGE.width - tagW - 12,
      y: PAGE.height - 33,
      size: 10,
      font: sansBold,
      color: WHITE,
    });
  }

  return doc.save();
}
