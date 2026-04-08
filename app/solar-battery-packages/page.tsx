import type { Metadata } from "next";
import ServicePageLayout from "@/components/ServicePageLayout";

export const metadata: Metadata = {
  title: "Solar + Battery Packages Bendigo | HEA Group",
  description:
    "Combined solar and battery packages for Bendigo homes. Designed together from day one for better performance and faster payback. REC 37307.",
};

const BREADCRUMB = [{ label: "Solar + Battery Packages", href: "/solar-battery-packages" }];

const INCLUDED = [
  "NEM12 usage analysis — solar and battery sized together",
  "Solar panel array (size based on your usage)",
  "Battery storage system (sized to your overnight usage)",
  "Hybrid inverter — optimised for combined operation",
  "Backup power configuration",
  "VPP-ready setup",
  "Grid connection and metering",
  "Monitoring setup with battery state-of-charge visibility",
  "Full handover by Jesse",
];

const WHO_FOR = [
  "Homeowners wanting maximum bill reduction in one installation",
  "Households with high evening and overnight usage",
  "Anyone wanting backup power during grid outages",
  "EV owners wanting solar, battery, and charging in one system",
  "Buyers wanting to avoid the cost of a second install visit for battery",
];

const PROCESS = [
  {
    step: "01",
    title: "We analyse both your daytime and overnight usage",
    body: "A combined system needs to address two things: generating enough solar to cover your daytime consumption and self-consume maximally, plus storing enough for evening and overnight needs. We model both from your real NEM12 data.",
  },
  {
    step: "02",
    title: "We design solar and battery as a single system",
    body: "Solar and battery designed together means the inverter, panel array, and battery capacity are optimised as a unit — not bolted together from mismatched parts. This is the right way to do it.",
  },
  {
    step: "03",
    title: "You see real payback comparison: solar alone vs. combined",
    body: "We show you the financial difference between solar-only and solar-plus-battery for your specific usage profile. Sometimes the battery accelerates payback. Sometimes it doesn't add up. We'll be honest.",
  },
  {
    step: "04",
    title: "Single installation — done in one or two days",
    body: "Jesse installs everything in one visit. Panels, battery, inverter, switchboard, monitoring. No return visit for a battery retrofit. Cleaner install, single project, one point of accountability.",
  },
];

const FAQS = [
  {
    q: "Why design solar and battery together rather than adding battery later?",
    a: "A solar-only system often uses a standard string inverter that isn't battery-compatible. Adding a battery later usually means replacing the inverter — a significant extra cost. Designing together uses a hybrid inverter from day one, which is cheaper overall and better optimised.",
  },
  {
    q: "How is the battery sized in a combined system?",
    a: "We size the battery to cover your consumption from sunset to when your solar starts producing the next morning. Based on your real overnight interval data — not a rule of thumb.",
  },
  {
    q: "Will I have power during a grid outage?",
    a: "Yes, with appropriate backup configuration. The battery can power critical loads (fridge, lights, essential circuits) during an outage. Full home backup depends on battery size and your consumption during the outage.",
  },
  {
    q: "Can I add EV charging to a combined system?",
    a: "Yes. If you're getting an EV charger, tell us upfront and we'll size the solar to account for your charging load. This is the most efficient way to set up a solar + battery + EV system.",
  },
  {
    q: "What does a combined system cost compared to solar alone?",
    a: "A combined system costs more upfront but less than solar-only plus a battery retrofit later. The exact difference depends on system size and products. See our pricing page for indicative ranges.",
  },
  {
    q: "Does HEA recommend everyone get a battery?",
    a: "No. We only recommend a battery when the payback makes sense for your usage profile. We show you the numbers and let you decide.",
  },
];

export default function SolarBatteryPackages() {
  return (
    <ServicePageLayout
      badge="Solar + Battery Packages · Bendigo, VIC"
      headline="Solar + Battery Packages"
      subheadline="Designed together. Better performance. Faster payback."
      intro="Adding a battery as an afterthought costs more and performs worse. We design your solar and battery as a single integrated system from day one — optimised together, installed in one visit."
      included={INCLUDED}
      whoFor={WHO_FOR}
      process={PROCESS}
      pricingNote="Combined system pricing depends on solar array size, battery capacity, and inverter selection. See our pricing page for indicative starting ranges for common package sizes. Your quote will be specific to your usage data and site conditions."
      faqs={FAQS}
      breadcrumb={BREADCRUMB}
    />
  );
}
