import type { Metadata } from "next";
import ServicePageLayout from "@/components/ServicePageLayout";

export const metadata: Metadata = {
  title: "Battery Storage Bendigo | HEA Group",
  description:
    "Home battery storage installation in Bendigo, VIC. HEA sizes batteries from your actual overnight usage — not oversized to inflate the sale. REC 37307.",
  alternates: { canonical: "https://hea-group.com.au/battery-storage-bendigo" },
};

const BREADCRUMB = [{ label: "Battery Storage Bendigo", href: "/battery-storage-bendigo" }];

const INCLUDED = [
  "Overnight usage analysis — battery sized to your real needs",
  "Battery system supply and installation",
  "Inverter/charger configuration and integration",
  "Backup power setup (critical loads where applicable)",
  "VPP-ready configuration",
  "Smart energy management setup",
  "Monitoring app and schedule configuration",
  "Full handover and walkthrough with Jesse",
];

const WHO_FOR = [
  "Households with existing solar wanting to capture unused export",
  "Homeowners who want backup power during outages",
  "People away from home during the day with high evening usage",
  "Anyone wanting to reduce reliance on the grid",
  "EV owners wanting overnight charging from stored solar",
  "Homeowners in Bendigo and surrounding central Victoria",
];

const PROCESS = [
  {
    step: "01",
    title: "We analyse your overnight and evening usage",
    body: "The battery only needs to cover your usage from sunset to the next morning (or until your solar kicks in). We size it exactly for that — no more, no less.",
  },
  {
    step: "02",
    title: "We model the real payback difference",
    body: "We show you the projected payback for solar alone vs solar plus battery, using your actual consumption data. Sometimes a battery accelerates payback. Sometimes it doesn't. We'll be honest either way.",
  },
  {
    step: "03",
    title: "We recommend the right battery for your situation",
    body: "Chemistry, capacity, and backup capability vary significantly between products. We recommend based on your usage profile, budget, and goals — not on which product has the highest margin.",
  },
  {
    step: "04",
    title: "Jesse installs and configures everything",
    body: "Battery, inverter, switchboard integration, monitoring, and VPP connection if applicable. Full configuration at handover so you understand how your system works.",
  },
];

const FAQS = [
  {
    q: "Do I actually need a battery?",
    a: "Not always. A battery makes the most financial sense when you have high overnight usage and significant unused solar export. We'll show you the payback comparison with and without a battery based on your real data.",
  },
  {
    q: "How big a battery do I need?",
    a: "Typically sized to cover your consumption from sunset until your solar starts producing the next morning. We calculate this from your actual interval data — not a rule of thumb.",
  },
  {
    q: "Can I add a battery to my existing solar system?",
    a: "Often yes, depending on your existing inverter. Some inverters are battery-ready; others require replacement. We'll assess your current setup before recommending.",
  },
  {
    q: "What happens during a grid outage?",
    a: "With appropriate backup configuration, your battery can keep critical loads running during an outage. The scope of backup depends on battery size and how your system is wired.",
  },
  {
    q: "What is a VPP?",
    a: "A Virtual Power Plant (VPP) allows your battery to participate in grid services in exchange for bill credits or payments. VPP eligibility depends on your battery, retailer, and enrollment. We'll set up your system to be VPP-ready.",
  },
  {
    q: "What brands do you install?",
    a: "We install quality battery systems from reputable manufacturers. Contact us to discuss current product availability and what suits your specific setup.",
  },
];

export default function BatteryStorageBendigo() {
  return (
    <ServicePageLayout
      badge="Battery Storage · Bendigo, VIC"
      headline="Home Battery Storage in Bendigo"
      subheadline="Sized to your overnight usage. Not oversized to inflate the sale."
      intro="A battery that's too big costs more and doesn't pay back faster. We size your battery system to your actual overnight consumption — using 12 months of real data from Powercor."
      included={INCLUDED}
      whoFor={WHO_FOR}
      process={PROCESS}
      pricingNote="Battery pricing depends on capacity, chemistry, and whether a new inverter is required. Retrofit installations onto existing solar may also require switchboard work. Contact us for a quote based on your specific setup — or see our pricing page for indicative starting ranges."
      faqs={FAQS}
      breadcrumb={BREADCRUMB}
    />
  );
}
