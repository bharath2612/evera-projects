import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import {
  SALES,
  fetchProjects,
  fetchUnits,
  fetchUnitMedia,
  formatHandover,
  publicMediaUrl,
} from "@/lib/data";
import { DLD_FEE_PCT, OQOOD_FEE_AED, planFor } from "@/lib/offer";

export const revalidate = 60;

// Brand palette (mirrors --brand-bronze / --brand-evergreen).
const BRONZE = rgb(0x98 / 255, 0x7f / 255, 0x6a / 255);
const EVERGREEN = rgb(0x2c / 255, 0x37 / 255, 0x32 / 255);
const MUTED = rgb(0.45, 0.5, 0.47);
const HAIRLINE = rgb(0.88, 0.85, 0.82);

const AED = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const AREA = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

const PAGE = { width: 595.28, height: 841.89, margin: 56 } as const; // A4

/**
 * Generated sales offer, one page: unit identity, price, the project's
 * standard payment plan (amounts computed from the live price), DLD +
 * Oqood fees and the initial payment due on reservation. Available units
 * only — the offer disappears the moment a unit is reserved or sold.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; unitNumber: string }> },
) {
  const { slug, unitNumber } = await params;
  const projects = await fetchProjects();
  const project = projects.find((p) => p.slug === slug);
  if (!project) return new NextResponse("Not found", { status: 404 });
  const units = await fetchUnits(project.id);
  const unit = units.find(
    (u) => u.unit_number === decodeURIComponent(unitNumber),
  );
  if (!unit || unit.status !== "available" || unit.price_aed === null) {
    return new NextResponse("No active offer for this residence", { status: 404 });
  }

  const price = unit.price_aed;
  const doc = await PDFDocument.create();
  doc.setTitle(`Sales Offer — ${project.name} No.${unit.unit_number}`);
  doc.setAuthor("Evera Developments");
  const page = doc.addPage([PAGE.width, PAGE.height]);
  const serif = await doc.embedFont(StandardFonts.TimesRoman);
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const sansBold = await doc.embedFont(StandardFonts.HelveticaBold);

  let y = PAGE.height - PAGE.margin;
  const left = PAGE.margin;
  const right = PAGE.width - PAGE.margin;

  const text = (
    value: string,
    x: number,
    size: number,
    font: PDFFont,
    color = EVERGREEN,
    align: "left" | "right" = "left",
  ) => {
    const width = font.widthOfTextAtSize(value, size);
    page.drawText(value, {
      x: align === "right" ? x - width : x,
      y,
      size,
      font,
      color,
    });
  };
  const rule = (color = HAIRLINE, thickness = 0.75) =>
    page.drawLine({
      start: { x: left, y },
      end: { x: right, y },
      thickness,
      color,
    });

  // ——— Header ———
  text("EVERA DEVELOPMENTS", left, 9, sansBold, BRONZE);
  text(new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(new Date()), right, 9, sans, MUTED, "right");
  y -= 26;
  text("Sales Offer", left, 30, serif);
  y -= 12;
  rule(BRONZE, 1.2);

  // ——— Identity row ———
  y -= 24;
  const cols = [left, left + 200, left + 360];
  const identity: Array<[string, string]> = [
    ["Project", `${project.name}${project.location ? ` — ${project.location}` : ""}`],
    ["Unit number", unit.unit_number],
    ["Est. completion", formatHandover(project.handover_date) ?? "TBA"],
  ];
  for (const [i, [label]] of identity.entries()) {
    text(label.toUpperCase(), cols[i], 7.5, sansBold, MUTED);
  }
  y -= 14;
  for (const [i, [, value]] of identity.entries()) {
    text(value, cols[i], i === 0 ? 10.5 : 11, i === 0 ? sans : sansBold);
  }

  // ——— Unit details ———
  y -= 34;
  text("UNIT DETAILS", left, 8, sansBold, BRONZE);
  y -= 8;
  rule();
  const details: Array<[string, string]> = [
    ["Type", unit.type_label],
    ["Total area", `${AREA.format(unit.area_sqft)} sq.ft`],
    ["Price per sq.ft", `AED ${AREA.format(unit.price_per_sqft ?? price / unit.area_sqft)}`],
    ["Floor", String(unit.floor)],
    ...(unit.building
      ? ([["Entrance", unit.building.replace(/entrance\s*/i, "")]] as Array<[string, string]>)
      : []),
    ...(unit.finish ? ([["Finishing", unit.finish]] as Array<[string, string]>) : []),
  ];
  for (const [label, value] of details) {
    y -= 19;
    text(label, left, 10, sans, MUTED);
    text(value, left + 200, 10, sans);
  }

  // Price banner
  y -= 34;
  page.drawRectangle({
    x: left,
    y: y - 12,
    width: right - left,
    height: 36,
    color: rgb(0.976, 0.968, 0.958),
    borderColor: BRONZE,
    borderWidth: 0.75,
  });
  const bannerBaseline = y;
  y = bannerBaseline + 1;
  text("UNIT PRICE", left + 14, 8, sansBold, BRONZE);
  text(`AED ${AED.format(price)}`, right - 14, 15, sansBold, EVERGREEN, "right");
  y = bannerBaseline;

  // ——— Payment plan ———
  y -= 46;
  text("PAYMENT PLAN", left, 8, sansBold, BRONZE);
  y -= 8;
  rule();
  y -= 16;
  text("Instalment", left, 8, sansBold, MUTED);
  text("Milestone", left + 150, 8, sansBold, MUTED);
  text("%", left + 340, 8, sansBold, MUTED);
  text("Amount (AED)", right, 8, sansBold, MUTED, "right");
  for (const instalment of planFor(project.slug)) {
    y -= 18;
    text(instalment.label, left, 10, sans);
    text(instalment.milestone, left + 150, 10, sans, MUTED);
    text(`${instalment.pct}%`, left + 340, 10, sans);
    text(AED.format((price * instalment.pct) / 100), right, 10, sans, EVERGREEN, "right");
  }
  y -= 10;
  rule();
  y -= 16;
  text("Total", left, 10, sansBold);
  text(AED.format(price), right, 10, sansBold, EVERGREEN, "right");

  // ——— Fees ———
  y -= 34;
  text("GOVERNMENT FEES", left, 8, sansBold, BRONZE);
  y -= 8;
  rule();
  y -= 18;
  text(`DLD fee (${DLD_FEE_PCT}%)`, left, 10, sans);
  text("Immediate", left + 150, 10, sans, MUTED);
  text(AED.format((price * DLD_FEE_PCT) / 100), right, 10, sans, EVERGREEN, "right");
  y -= 18;
  text("Oqood fee", left, 10, sans);
  text("Immediate", left + 150, 10, sans, MUTED);
  text(AED.format(OQOOD_FEE_AED), right, 10, sans, EVERGREEN, "right");
  const totalFees = (price * DLD_FEE_PCT) / 100 + OQOOD_FEE_AED;
  y -= 18;
  text("Total fees", left, 10, sansBold);
  text(AED.format(totalFees), right, 10, sansBold, EVERGREEN, "right");

  // ——— Initial payment on reservation ———
  const booking = planFor(project.slug)[0];
  const initial = (price * booking.pct) / 100 + totalFees;
  y -= 34;
  page.drawRectangle({
    x: left,
    y: y - 30,
    width: right - left,
    height: 46,
    color: rgb(0.949, 0.937, 0.925),
  });
  y -= 4;
  text("INITIAL PAYMENT UPON UNIT RESERVATION", left + 14, 8, sansBold, BRONZE);
  y -= 17;
  text(`${booking.pct}% downpayment + DLD & Oqood fees`, left + 14, 9.5, sans, MUTED);
  text(`AED ${AED.format(initial)}`, right - 14, 13, sansBold, EVERGREEN, "right");

  // ——— Footer ———
  y = PAGE.margin + 26;
  rule();
  y -= 14;
  text(
    `Sales department · ${SALES.phoneDisplay} · ${SALES.email}`,
    left,
    8.5,
    sans,
    MUTED,
  );
  y -= 12;
  text(
    "Prices and availability are subject to change without notice. This offer is indicative and not a contractual document.",
    left,
    7.5,
    sans,
    MUTED,
  );

  // ——— Gallery pages: every published render, two per page, full width ———
  const media = (await fetchUnitMedia(project.id, unit.unit_number)).filter(
    (m) => m.kind === "gallery",
  );
  const renders = [];
  for (const item of media) {
    try {
      const res = await fetch(publicMediaUrl(item.path));
      if (!res.ok) continue;
      const data = new Uint8Array(await res.arrayBuffer());
      renders.push(
        item.path.toLowerCase().endsWith(".png")
          ? await doc.embedPng(data)
          : await doc.embedJpg(data),
      );
    } catch {
      /* the offer still ships without images */
    }
  }
  const imageWidth = right - left;
  const imageHeight = (imageWidth * 9) / 16;
  const galleryPages = Math.ceil(renders.length / 2);
  for (let i = 0; i < renders.length; i += 2) {
    const sheet = doc.addPage([PAGE.width, PAGE.height]);
    let top = PAGE.height - PAGE.margin;
    sheet.drawText("INTERIOR RENDERS", {
      x: left, y: top - 8, size: 8, font: sansBold, color: BRONZE,
    });
    const corner = `${project.name} — No.${unit.unit_number}`;
    sheet.drawText(corner, {
      x: right - sans.widthOfTextAtSize(corner, 9),
      y: top - 8, size: 9, font: sans, color: MUTED,
    });
    top -= 18;
    sheet.drawLine({
      start: { x: left, y: top }, end: { x: right, y: top },
      thickness: 0.75, color: HAIRLINE,
    });
    top -= 22;
    for (const render of renders.slice(i, i + 2)) {
      sheet.drawImage(render, {
        x: left, y: top - imageHeight, width: imageWidth, height: imageHeight,
      });
      sheet.drawRectangle({
        x: left, y: top - imageHeight, width: imageWidth, height: imageHeight,
        borderColor: HAIRLINE, borderWidth: 0.75,
      });
      top -= imageHeight + 20;
    }
    const pageNote = `${i / 2 + 2} / ${galleryPages + 1}`;
    sheet.drawText(pageNote, {
      x: right - sans.widthOfTextAtSize(pageNote, 8),
      y: PAGE.margin - 14, size: 8, font: sans, color: MUTED,
    });
    sheet.drawText("Evera Developments · Sales Offer", {
      x: left, y: PAGE.margin - 14, size: 8, font: sans, color: MUTED,
    });
  }

  const bytes = await doc.save();
  const filename = `${project.name.replace(/\s+/g, "-")}-No${unit.unit_number}-Sales-Offer.pdf`;
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
