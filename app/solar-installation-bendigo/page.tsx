import type { Metadata } from "next";
import ServicePageLayout from "@/components/ServicePageLayout";

export const metadata: Metadata = {
  title: "Solar Installation Bendigo | HEA Group",
  description:
    "Professional solar panel installation in Bendigo, VIC. HEA designs right-sized systems using your actual Powercor usage data — targeting payback under 10 years. REC 37307.",
  alternates: { canonical: "https://hea-group.com.au/solar-installation-bendigo" },
};

const BREADCRUMB = [{ label: "Solar Installation Bendigo", href: "/solar-installation-bendigo" }];

const INCLUDED = [
  "NEM12 interval data analysis from Powercor",
  "Custom system sizing based on your real consumption",
  "High-quality solar panel array (size based on your usage)",
  "Grid-connect inverter — sized correctly for your system",
  "Professional roof and switchboard installation",
  "Grid connection and metering setup",
  "Monitoring app setup and walkthrough",
  "Post-install support from Jesse directly",
];

const WHO_FOR = [
  "Homeowners with high electricity bills wanting real payback clarity",
  "Buyers comparing solar quotes and wanting honest sizing",
  "Households where someone is home during the day (high self-consumption)",
  "Anyone tired of generic quotes that don't reflect real usage",
  "Homeowners in Bendigo, Golden Square, Strathdale, Kangaroo Flat, Eaglehawk and surrounds",
];

const PROCESS = [
  {
    step: "01",
    title: "Send us your bill — or we pull the data",
    body: "A recent electricity bill is a starting point. We then request your NEM12 interval data from Powercor — 12 months of real half-hourly consumption. You don't need to do anything technical.",
  },
  {
    step: "02",
    title: "We model your usage against Bendigo solar data",
    body: "We overlay your real consumption against actual solar generation data for your location and roof orientation. This tells us exactly what system size maximises your self-consumption without overbuilding.",
  },
  {
    step: "03",
    title: "You receive a right-sized proposal with real payback numbers",
    body: "Not a template quote. A proposal specific to your home, with projected annual savings, generation, and payback period. Usually under 10 years — that's our target on every job.",
  },
  {
    step: "04",
    title: "Jesse installs, connects, and hands over",
    body: "No subcontractors. Jesse handles the full installation — panels, inverter, switchboard connection, grid metering, and monitoring setup. He walks you through everything at handover.",
  },
];

const FAQS = [
  {
    q: "How big a system do I need?",
    a: "It depends on your actual consumption patterns — not a rough average. We pull your real interval data from Powercor and model your specific usage profile. This is more accurate than any rule-of-thumb system sizing.",
  },
  {
    q: "What solar panels do you install?",
    a: "We install quality panels from reputable manufacturers. Contact us to discuss current product availability — we'll recommend based on your roof and budget, not on margin.",
  },
  {
    q: "How long does installation take?",
    a: "A standard grid-connect solar system is typically a single day installation. We'll confirm the timeline in your proposal.",
  },
  {
    q: "Can I add a battery later?",
    a: "Yes, though designing solar and battery together from the start gives better results. If you're considering a battery within 3–5 years, tell us upfront and we'll size the inverter to accommodate it.",
  },
  {
    q: "Do you handle the grid connection paperwork?",
    a: "Yes. We manage all Distributed Network Service Provider (DNSP) notifications and metering setup with your energy retailer.",
  },
  {
    q: "Do you offer any warranty?",
    a: "All work carries a workmanship warranty. Panel and inverter manufacturer warranties apply as per product specs. We'll detail these in your proposal.",
  },
];

export default function SolarInstallationBendigo() {
  return (
    <ServicePageLayout
      badge="Solar Installation · Bendigo, VIC"
      headline="Solar Installation in Bendigo"
      subheadline="Right-sized. Real data. Under 10 years payback."
      intro="We don't guess your system size. We pull your actual electricity consumption from Powercor and design a solar installation around how your household really uses energy — in Bendigo's specific conditions."
      included={INCLUDED}
      whoFor={WHO_FOR}
      process={PROCESS}
      pricingNote="Solar installation pricing depends on system size, roof complexity, switchboard condition, and the products selected. We provide indicative package pricing as a guide, but your final quote is based on your actual usage data and site conditions. See our pricing page for starting ranges."
      faqs={FAQS}
      breadcrumb={BREADCRUMB}
    />
  );
}
