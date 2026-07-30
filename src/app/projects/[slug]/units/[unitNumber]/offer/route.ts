import { NextResponse } from "next/server";
import { LineCapStyle, PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { DETAIL_ICONS } from "@/lib/offer-icons";
import {
  SALES,
  fetchPaymentPlan,
  fetchProjectMedia,
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
  const logoPath = media.find((m) => m.kind === "logo")?.path;
  let logo: Awaited<ReturnType<typeof doc.embedPng>> | null = null;
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
  if (logoPath) {
    try {
      const res = await fetch(publicMediaUrl(logoPath));
      if (res.ok) {
        const bytes = new Uint8Array(await res.arrayBuffer());
        logo = logoPath.toLowerCase().endsWith(".png")
          ? await doc.embedPng(bytes)
          : await doc.embedJpg(bytes);
      }
    } catch {
      /* text fallback below */
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
    ["Unit number", `${unit.unit_number} — ${unit.type_label}`],
    ["Est. completion", formatHandover(project.handover_date) ?? "TBA"],
  ];
  for (const [i, [label]] of identity.entries()) {
    text(label.toUpperCase(), cols[i], 7.5, sansBold, MUTED);
  }
  y -= 16;
  for (const [i, [, value]] of identity.entries()) {
    if (i === 0 && logo) {
      const logoHeight = 28;
      const logoWidth = (logo.width / logo.height) * logoHeight;
      page.drawImage(logo, {
        x: cols[0],
        y: y - 17,
        width: logoWidth,
        height: logoHeight,
      });
      continue;
    }
    text(value, cols[i], i === 0 ? 10.5 : i === 1 ? 15 : 11, i === 0 ? sans : sansBold);
  }

  // ——— Unit details ———
  y -= 34;
  text("UNIT DETAILS", left, 8, sansBold, BRONZE);
  y -= 8;
  rule();
  const leftDetails: Array<[string, string]> = [
    ...(unit.suite_area_sqft !== null
      ? ([["Suite area", `${AREA.format(unit.suite_area_sqft)} sq.ft`]] as Array<[string, string]>)
      : []),
    ...(unit.balcony_area_sqft !== null
      ? ([["Balcony area", `${AREA.format(unit.balcony_area_sqft)} sq.ft`]] as Array<[string, string]>)
      : []),
    ["Total area", `${AREA.format(unit.area_sqft)} sq.ft`],
    ["Price per sq.ft", `AED ${AREA.format(price / unit.area_sqft)}`],
  ];
  const rightDetails: Array<[string, string]> = [
    ...(unit.bathrooms !== null
      ? ([["Bathrooms", AREA.format(unit.bathrooms)]] as Array<[string, string]>)
      : []),
    ...(unit.bedrooms !== null
      ? ([["Bedrooms", AREA.format(unit.bedrooms)]] as Array<[string, string]>)
      : []),
    ["Floor", String(unit.floor)],
    ...(unit.building
      ? ([["Entrance", unit.building.replace(/entrance\s*/i, "")]] as Array<[string, string]>)
      : []),
    ...(unit.finish ? ([["Finishing", unit.finish]] as Array<[string, string]>) : []),
  ];
  const detailIcon = (label: string, x: number) => {
    for (const d of DETAIL_ICONS[label] ?? []) {
      page.drawSvgPath(d, {
        x,
        y: y + 8.5,
        scale: 10 / 24,
        borderColor: MUTED,
        borderWidth: 0.85,
        borderLineCap: LineCapStyle.Round,
      });
    }
  };
  const detailRows = Math.max(leftDetails.length, rightDetails.length);
  const detailTop = y;
  for (let i = 0; i < detailRows; i++) {
    y = detailTop - 17 * (i + 1);
    const l = leftDetails[i];
    if (l) {
      detailIcon(l[0], left);
      text(l[0], left + 16, 10, sans, MUTED);
      text(l[1], left + 110, 10, sans);
    }
    const r = rightDetails[i];
    if (r) {
      detailIcon(r[0], left + 260);
      text(r[0], left + 276, 10, sans, MUTED);
      text(r[1], left + 360, 10, sans);
    }
  }
  y = detailTop - 17 * detailRows;

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
  rule(BRONZE, 1);
  y -= 19;
  text("TOTAL", left, 10, sansBold, BRONZE);
  text(`AED ${AED.format(price)}`, right, 14, sansBold, EVERGREEN, "right");

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

  // ——— Initial payment on reservation (kept quiet by design) ———
  const booking = plan[0];
  const initial = (price * booking.pct) / 100 + totalFees;
  y -= 24;
  text(
    `Initial payment upon unit reservation (${AREA.format(booking.pct)}% downpayment + DLD & Oqood fees)`,
    left,
    8.5,
    sans,
    MUTED,
  );
  text(`AED ${AED.format(initial)}`, right, 9.5, sansBold, MUTED, "right");

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

  // ——— Page 3: floor plan (blank until artwork lands) + signatures ———
  const unitMedia = await fetchUnitMedia(project.id, unit.unit_number);
  const planPath = unitMedia.find((m) => m.kind === "floor_plan")?.path;
  let planImage: Awaited<ReturnType<typeof doc.embedJpg>> | null = null;
  if (planPath) {
    try {
      const res = await fetch(publicMediaUrl(planPath));
      if (res.ok) {
        const planBytes = new Uint8Array(await res.arrayBuffer());
        planImage = planPath.toLowerCase().endsWith(".png")
          ? await doc.embedPng(planBytes)
          : await doc.embedJpg(planBytes);
      }
    } catch {
      /* page still renders, plan area stays blank */
    }
  }
  {
    {
      {
        const p3 = doc.addPage([PAGE.width, PAGE.height]);
        let y3 = PAGE.height - PAGE.margin;
        const t3 = (
          value: string,
          x: number,
          size: number,
          font: PDFFont,
          color = EVERGREEN,
          align: "left" | "right" = "left",
        ) => {
          const width = font.widthOfTextAtSize(value, size);
          p3.drawText(value, {
            x: align === "right" ? x - width : x,
            y: y3,
            size,
            font,
            color,
          });
        };

        // header
        t3("FLOOR PLAN", left, 10, sansBold, BRONZE);
        t3(`No.${unit.unit_number} — ${unit.type_label}`, right, 10, sansBold, MUTED, "right");
        y3 -= 10;
        p3.drawLine({
          start: { x: left, y: y3 },
          end: { x: right, y: y3 },
          thickness: 1.2,
          color: BRONZE,
        });

        // the plan card, full content width — blank slot when no artwork
        y3 -= 16;
        const planWidth = right - left;
        const planHeight = planImage
          ? (planImage.height / planImage.width) * planWidth
          : planWidth * 0.637; // standard card ratio, keeps the layout steady
        if (planImage) {
          p3.drawImage(planImage, {
            x: left,
            y: y3 - planHeight,
            width: planWidth,
            height: planHeight,
          });
        }
        y3 -= planHeight + 36;

        // sellable-area table (sq.m computed from stored sq.ft)
        const toSqm = (sqft: number) => AREA.format(sqft / 10.7639);
        const suite = unit.suite_area_sqft;
        const balcony = unit.balcony_area_sqft;
        const tableRows: Array<[string, string, string, boolean]> = [
          ["Sellable area", "sq.m", "sq.ft", true],
          ...(suite !== null
            ? ([["Suite area", toSqm(suite), AREA.format(suite), false]] as Array<
                [string, string, string, boolean]
              >)
            : []),
          ...(balcony !== null
            ? ([["Balcony", toSqm(balcony), AREA.format(balcony), false]] as Array<
                [string, string, string, boolean]
              >)
            : []),
          ["Total area", toSqm(unit.area_sqft), AREA.format(unit.area_sqft), true],
        ];
        const tableWidth = 330;
        const colWidths = [150, 90, 90];
        const rowHeight = 22;
        const tableX = left + (planWidth - tableWidth) / 2;
        const tableTop = y3;
        for (const [i, [label, sqm, sqft, bold]] of tableRows.entries()) {
          const rowY = tableTop - rowHeight * (i + 1);
          p3.drawRectangle({
            x: tableX,
            y: rowY,
            width: tableWidth,
            height: rowHeight,
            borderColor: HAIRLINE,
            borderWidth: 0.75,
          });
          const font = bold ? sansBold : sans;
          let colX = tableX;
          for (const [c, value] of [label, sqm, sqft].entries()) {
            const width = font.widthOfTextAtSize(value, 10);
            p3.drawText(value, {
              x: colX + (colWidths[c] - width) / 2,
              y: rowY + 7,
              size: 10,
              font,
              color: EVERGREEN,
            });
            colX += colWidths[c];
          }
        }
        y3 = tableTop - rowHeight * tableRows.length - 70;

        // initials
        for (const [x1, x2] of [
          [left, left + 190],
          [right - 190, right],
        ]) {
          p3.drawLine({
            start: { x: x1, y: y3 },
            end: { x: x2, y: y3 },
            thickness: 0.75,
            color: MUTED,
          });
        }
        y3 -= 16;
        t3("Purchaser’s Initials:", left, 11, sans);
        t3("Seller’s Initials:", right - 190, 11, sans);

        // disclaimer paragraph, wrapped + centered
        const paragraph =
          "All drawings and dimensions are approximate. Drawings not to scale are subject to change without notice. " +
          "The Developer reserves the right to make revisions. The units are taken from the typical floor of the building " +
          "and columns may vary in size depending on the floor level. The furnishings and accessories shown are " +
          "representation only. The length and width of the unit and balcony varies depending on which floor and which " +
          "orientation the unit is located within the building to comply with the building authority regulations.";
        const words = paragraph.split(" ");
        const lines: string[] = [];
        let line = "";
        for (const word of words) {
          const candidate = line ? `${line} ${word}` : word;
          if (sans.widthOfTextAtSize(candidate, 9) > planWidth - 40 && line) {
            lines.push(line);
            line = word;
          } else {
            line = candidate;
          }
        }
        if (line) lines.push(line);
        y3 -= 60;
        for (const entry of lines) {
          const width = sans.widthOfTextAtSize(entry, 9);
          p3.drawText(entry, {
            x: left + (planWidth - width) / 2,
            y: y3,
            size: 9,
            font: sans,
            color: MUTED,
          });
          y3 -= 13;
        }
      }
    }
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
