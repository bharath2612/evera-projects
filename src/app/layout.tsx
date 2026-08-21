import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// One typeface everywhere — Plus Jakarta drives both the body and the
// `font-display` headline slot (weight does the hierarchy work now).
const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Evera Developments — Properties",
    template: "%s · Evera Developments",
  },
  description:
    "Explore Evera's developments across Dubai — live availability, floor plans and handover timelines.",
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
