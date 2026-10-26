import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { BRAND } from "@stayshay/core";
import "./globals.css";
import { AnnouncementBar } from "@/components/announcement-bar";
import { ShayChat } from "@/components/shay-chat";
import { ActivityToasts } from "@/components/activity-toasts";
import { Analytics } from "@/components/analytics";
import { JsonLd } from "@/components/json-ld";
import { activeAnnouncement } from "@/lib/store";
import { GA_ID, SITE, organizationLd, websiteLd } from "@/lib/seo";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-jakarta", display: "swap" });

const title = `${BRAND.name} — Rooms, Bed Spaces & Studios for Monthly Rent in UAE`;
const description =
  "Find verified monthly rooms, bed spaces, partitions and studios in Dubai and across the UAE. See landlord consent and permit status, filter by budget and metro, and WhatsApp the lister directly.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: title, template: `%s | ${BRAND.name}` },
  description,
  applicationName: BRAND.name,
  keywords: [
    "bed space Dubai", "partition Dubai", "room for rent Dubai", "monthly room rent Dubai", "cheap apartment Dubai",
    "studio for rent monthly Dubai", "sharing room Dubai", "bed space Sharjah", "roommate Dubai", "cheap rooms UAE",
  ],
  alternates: {
    types: { "application/rss+xml": `${SITE}/blog/rss.xml` },
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  openGraph: { title, description, siteName: BRAND.name, type: "website", locale: "en_AE", url: SITE, images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: BRAND.name }] },
  twitter: { card: "summary_large_image", title, description },
  icons: { icon: "/brand/stayshay-mark.svg", apple: "/brand/stayshay-mark.svg" },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION } : undefined,
  },
  category: "real estate",
};

export const viewport: Viewport = { themeColor: "#145C46", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const a = await activeAnnouncement();
  return (
    <html lang="en" className={jakarta.variable}>
      <body>
        <JsonLd data={[organizationLd(), websiteLd()]} />
        <Analytics id={GA_ID} />
        <AnnouncementBar a={a && { id: a.id, title: a.title, message: a.message, link: a.link ?? null }} />
        {children}
        <ShayChat />
        <ActivityToasts />
      </body>
    </html>
  );
}
