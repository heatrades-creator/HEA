import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import StickyMobileCTA from "@/components/StickyMobileCTA";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "HEA | Bendigo Solar & Battery Specialists",
    template: "%s | HEA Group",
  },
  description:
    "Bendigo's direct solar and battery installers. We design right-sized systems from your actual Powercor usage data — targeting payback under 10 years, every time. REC 37307.",
  keywords: [
    "solar installation Bendigo",
    "battery storage Bendigo",
    "EV charger Bendigo",
    "solar panels Bendigo Victoria",
    "home battery storage Victoria",
    "Heffernan Electrical Automation",
  ],
  openGraph: {
    type: "website",
    locale: "en_AU",
    siteName: "HEA Group",
    title: "HEA | Bendigo Solar & Battery Specialists",
    description:
      "Right-sized solar and battery systems from your actual usage data. Local installer. REC 37307.",
  },
  twitter: {
    card: "summary_large_image",
    title: "HEA | Bendigo Solar & Battery Specialists",
    description: "Right-sized solar and battery. Real payback. Bendigo, VIC.",
  },
  robots: { index: true, follow: true },
};

const LOCAL_BUSINESS_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "ElectricalContractor",
  name: "Heffernan Electrical Automation",
  alternateName: "HEA Group",
  description:
    "Bendigo-based solar and battery installation specialists. Direct installer model — no subcontractors, no salespeople. REC 37307.",
  url: "https://hea-group.com.au",
  telephone: "+61481267812",
  email: "hea.trades@gmail.com",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Bendigo",
    addressRegion: "VIC",
    addressCountry: "AU",
  },
  areaServed: [
    { "@type": "City", name: "Bendigo" },
    { "@type": "State", name: "Victoria" },
  ],
  hasCredential: {
    "@type": "EducationalOccupationalCredential",
    credentialCategory: "Electrical Contractors License",
    recognizedBy: { "@type": "Organization", name: "Energy Safe Victoria" },
    identifier: "REC 37307",
  },
  priceRange: "$$",
  openingHours: "Mo-Fr 07:00-17:00",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(LOCAL_BUSINESS_SCHEMA) }}
        />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <Providers>{children}</Providers>
        <StickyMobileCTA />
      </body>
    </html>
  );
}
