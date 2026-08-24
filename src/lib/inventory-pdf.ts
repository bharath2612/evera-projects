import { PDFDocument, PDFFont, PDFImage, StandardFonts, rgb } from "pdf-lib";

/**
 * Inventory List PDF — landscape A4, modeled on the client's reference
 * export: the sales-offer cover as page one with a timestamp chip, the
 * for-sale table under an evergreen header band, then one full-bleed
 * floor-plan page per unit. Pure builder shared VERBATIM between
 * evera-one (CRM export dropdown) and evera-projects (public inventory
 * download) — keep the two copies identical; data plumbing differs on
 * each side, bytes in / bytes out here.
 */

const PAGE = { width: 841.89, height: 595.28, margin: 48 } as const; // A4 landscape
const EVERGREEN = rgb(0x2c / 255, 0x37 / 255, 0x32 / 255);
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
  /** Pre-formatted stamp, e.g. "August 24, 2026 at 11:59:58 AM". */
  generatedAt: string;
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
  const doc = await PDFDocument.create();
  doc.setTitle(`${input.projectName} — Inventory List`);
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const sansBold = await doc.embedFont(StandardFonts.HelveticaBold);

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
      color: EVERGREEN,
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
  // Timestamp chip, bottom-right (as in the reference export).
  const stampSize = 11;
  const stampWidth = sans.widthOfTextAtSize(input.generatedAt, stampSize);
  const chipW = stampWidth + 20;
  const chipH = 24;
  const chipX = PAGE.width - chipW - 28;
  const chipY = 28;
  cover.drawRectangle({
    x: chipX,
    y: chipY,
    width: chipW,
    height: chipH,
    color: EVERGREEN,
  });
  cover.drawText(input.generatedAt, {
    x: chipX + 10,
    y: chipY + (chipH - stampSize) / 2 + 1.5,
    size: stampSize,
    font: sans,
    color: WHITE,
  });

  // ── table pages ────────────────────────────────────────────────────
  const left = PAGE.margin;
  const contentWidth = PAGE.width - PAGE.margin * 2;
  const COLS: Array<{
    label: string;
    width: number;
    value: (row: InventoryRow, index: number) => string;
  }> = [
    { label: "Sr No", width: 46, value: (_row, index) => String(index + 1) },
    { label: "Floor", width: 96, value: (row) => floorLabel(row.floor) },
    { label: "Unit No", width: 70, value: (row) => row.unitNumber },
    { label: "Unit Type", width: 100, value: (row) => row.typeLabel },
    {
      label: "Suite Area",
      width: 92,
      value: (row) =>
        row.suiteSqft === null ? "—" : NUM.format(row.suiteSqft),
    },
    {
      label: "Balcony Area",
      width: 96,
      value: (row) =>
        row.balconySqft === null ? "—" : NUM.format(row.balconySqft),
    },
    {
      label: "Total Area (sqft)",
      width: 116,
      value: (row) => NUM.format(row.totalSqft),
    },
    {
      label: "Price AED",
      width: contentWidth - 46 - 96 - 70 - 100 - 92 - 96 - 116,
      value: (row) => PRICE.format(row.priceAed),
    },
  ];
  const ROW_H = 27;
  const ROWS_PER_PAGE = Math.floor(
    (PAGE.height - PAGE.margin * 2 - ROW_H) / ROW_H,
  );

  for (let start = 0; start < input.rows.length; start += ROWS_PER_PAGE) {
    const page = doc.addPage([PAGE.width, PAGE.height]);
    const slice = input.rows.slice(start, start + ROWS_PER_PAGE);
    let y = PAGE.height - PAGE.margin - ROW_H;

    // Header band.
    page.drawRectangle({
      x: left,
      y,
      width: contentWidth,
      height: ROW_H,
      color: EVERGREEN,
    });
    let x = left;
    for (const col of COLS) {
      page.drawText(col.label, {
        x: x + 8,
        y: y + 9,
        size: 10.5,
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
        x: colX + 8,
        y: rowY + 9,
        size: 10.5,
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
    const blockTop = PAGE.height - PAGE.margin;
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
      color: EVERGREEN,
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
