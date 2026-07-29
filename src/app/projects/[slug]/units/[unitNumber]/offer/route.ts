import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import {
  SALES,
  fetchPaymentPlan,
  fetchProjectMedia,
  fetchProjects,
  fetchUnits,
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
 * Public sales offer: the project's cover artwork as page one (when
 * configured in Offer Settings), then the offer sheet titled with the
 * project name — unit details (suite/balcony/total areas, bedrooms,
 * bathrooms), price, the unit type's configured payment plan, fees and
 * the initial payment. Available units only.
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
  const plan =
    (await fetchPaymentPlan(project.id, unit.type_code)) ?? planFor(project.slug);

  const doc = await PDFDocument.create();
  doc.setTitle(`Sales Offer — ${project.name} No.${unit.unit_number}`);
  doc.setAuthor("Evera Developments");
  const serif = await doc.embedFont(StandardFonts.TimesRoman);
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const sansBold = await doc.embedFont(StandardFonts.HelveticaBold);

  // ——— Cover page: the project's offer artwork, contain-fit ———
  const media = await fetchProjectMedia(project.id);
  const coverPath = media.find((m) => m.kind === "offer_cover")?.path;
  if (coverPath) {
    try {
      const res = await fetch(publicMediaUrl(coverPath));
      if (res.ok) {
        const bytes = new Uint8Array(await res.arrayBuffer());
        const image = coverPath.toLowerCase().endsWith(".png")
          ? await doc.embedPng(bytes)
          : await doc.embedJpg(bytes);
        const cover = doc.addPage([PAGE.width, PAGE.height]);
        const scale = Math.min(
          PAGE.width / image.width,
          PAGE.height / image.height,
        );
        cover.drawImage(image, {
          x: (PAGE.width - image.width * scale) / 2,
          y: (PAGE.height - image.height * scale) / 2,
          width: image.width * scale,
          height: image.height * scale,
        });
      }
    } catch {
      /* the offer still ships without a cover */
    }
  }

  const page = doc.addPage([PAGE.width, PAGE.height]);
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

  // ——— Header: the project speaks, Evera signs the footer ———
  text(project.name.toUpperCase(), left, 10, sansBold, BRONZE);
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
    ...(unit.suite_area_sqft !== null
      ? ([["Suite area", `${AREA.format(unit.suite_area_sqft)} sq.ft`]] as Array<[string, string]>)
      : []),
    ...(unit.balcony_area_sqft !== null
      ? ([["Balcony area", `${AREA.format(unit.balcony_area_sqft)} sq.ft`]] as Array<[string, string]>)
      : []),
    ["Total area", `${AREA.format(unit.area_sqft)} sq.ft`],
    ...(unit.bedrooms !== null
      ? ([["Bedrooms", AREA.format(unit.bedrooms)]] as Array<[string, string]>)
      : []),
    ...(unit.bathrooms !== null
      ? ([["Bathrooms", AREA.format(unit.bathrooms)]] as Array<[string, string]>)
      : []),
    ["Price per sq.ft", `AED ${AREA.format(unit.price_per_sqft ?? price / unit.area_sqft)}`],
    ["Floor", String(unit.floor)],
    ...(unit.building
      ? ([["Entrance", unit.building.replace(/entrance\s*/i, "")]] as Array<[string, string]>)
      : []),
    ...(unit.finish ? ([["Finishing", unit.finish]] as Array<[string, string]>) : []),
  ];
  for (const [label, value] of details) {
    y -= 17;
    text(label, left, 10, sans, MUTED);
    text(value, left + 200, 10, sans);
  }

  // Price banner
  y -= 30;
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

  // ——— Payment plan (configured per unit type in Offer Settings) ———
  y -= 40;
  text("PAYMENT PLAN", left, 8, sansBold, BRONZE);
  y -= 8;
  rule();
  y -= 16;
  text("Instalment", left, 8, sansBold, MUTED);
  text("Milestone", left + 150, 8, sansBold, MUTED);
  text("%", left + 340, 8, sansBold, MUTED);
  text("Amount (AED)", right, 8, sansBold, MUTED, "right");
  for (const instalment of plan) {
    y -= 17;
    text(instalment.label, left, 10, sans);
    text(instalment.milestone, left + 150, 10, sans, MUTED);
    text(`${AREA.format(instalment.pct)}%`, left + 340, 10, sans);
    text(AED.format((price * instalment.pct) / 100), right, 10, sans, EVERGREEN, "right");
  }
  y -= 10;
  rule();
  y -= 16;
  text("Total", left, 10, sansBold);
  text(AED.format(price), right, 10, sansBold, EVERGREEN, "right");

  // ——— Fees ———
  y -= 30;
  text("GOVERNMENT FEES", left, 8, sansBold, BRONZE);
  y -= 8;
  rule();
  y -= 16;
  text(`DLD fee (${DLD_FEE_PCT}%)`, left, 10, sans);
  text("Immediate", left + 150, 10, sans, MUTED);
  text(AED.format((price * DLD_FEE_PCT) / 100), right, 10, sans, EVERGREEN, "right");
  y -= 17;
  text("Oqood fee", left, 10, sans);
  text("Immediate", left + 150, 10, sans, MUTED);
  text(AED.format(OQOOD_FEE_AED), right, 10, sans, EVERGREEN, "right");
  const totalFees = (price * DLD_FEE_PCT) / 100 + OQOOD_FEE_AED;
  y -= 17;
  text("Total fees", left, 10, sansBold);
  text(AED.format(totalFees), right, 10, sansBold, EVERGREEN, "right");

  // ——— Initial payment on reservation ———
  const booking = plan[0];
  const initial = (price * booking.pct) / 100 + totalFees;
  y -= 30;
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
  text(`${AREA.format(booking.pct)}% downpayment + DLD & Oqood fees`, left + 14, 9.5, sans, MUTED);
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
