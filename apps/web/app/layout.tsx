import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { BRAND } from "@stayshay/core";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-jakarta", display: "swap" });

const title = `${BRAND.name} — Rooms, Bed Spaces & Studios for Monthly Rent in UAE`;
const description =
  "Find verified monthly rooms, bed spaces, partitions and studios in Dubai and across the UAE. See landlord consent and permit status, filter by budget and metro, and WhatsApp the lister directly.";

export const metadata: Metadata = {
  metadataBase: new URL(`https://${BRAND.domain}`),
  title,
  description,
  alternates: { canonical: "/" },
  // Private testing on imported homebook data: keep every page out of search engines.
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  openGraph: { title, description, siteName: BRAND.name, type: "website", locale: "en_AE" },
  twitter: { card: "summary_large_image", title, description },
  icons: { icon: "/brand/stayshay-mark.svg", apple: "/brand/stayshay-mark.svg" },
};

export const viewport: Viewport = { themeColor: "#145C46", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body>{children}</body>
    </html>
  );
}
