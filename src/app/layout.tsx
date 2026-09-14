import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// One typeface everywhere — Plus Jakarta drives both the body and the
// `font-display` headline slot (weight does the hierarchy work now).
const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

/**
 * metadataBase is what makes og:image absolute. WhatsApp, iMessage and
 * Slack all refuse a relative one — which is why a shared link used to
 * arrive as a bare URL with no card.
 */
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://project.evera.dev",
  ),
  title: {
    default: "Evera Developments — Properties",
    template: "%s · Evera Developments",
  },
  description:
    "Explore Evera's developments across Dubai — live availability, floor plans and handover timelines.",
  openGraph: {
    type: "website",
    siteName: "Evera Developments",
    title: "Evera Developments — Properties",
    description:
      "Live availability, floor plans and handover dates across Dubai.",
    url: "/",
    images: [
      {
        url: "/og-projects.png",
        width: 1200,
        height: 630,
        alt: "Evera Developments",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Evera Developments — Properties",
    description:
      "Live availability, floor plans and handover dates across Dubai.",
    images: ["/og-projects.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${plusJakarta.variable} h-full`}>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
