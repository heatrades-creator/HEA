import type { Metadata } from "next";
import ServicePageLayout from "@/components/ServicePageLayout";

export const metadata: Metadata = {
  title: "EV Charger Installation Bendigo | HEA Group",
  description:
    "EV charger installation in Bendigo, VIC. Solar-integrated EV charging designed with your system from day one. Licensed electrical installer. REC 37307.",
  alternates: { canonical: "https://hea-group.com.au/ev-charger-installation-bendigo" },
};

const BREADCRUMB = [{ label: "EV Charger Installation Bendigo", href: "/ev-charger-installation-bendigo" }];

const INCLUDED = [
  "Site assessment for charging load and switchboard capacity",
  "EV charger supply and installation (AC Level 2)",
  "Dedicated circuit installation from switchboard",
  "Solar integration configuration (solar-first charging where supported)",
  "Load balancing setup if required",
  "Smart scheduling setup",
  "Full handover and walkthrough",
];

const WHO_FOR = [
  "EV owners wanting to charge from their own solar",
  "Homeowners buying an EV and planning solar at the same time",
  "Anyone who wants their solar sized to include EV charging load",
  "Homeowners in Bendigo and surrounding areas",
  "Businesses wanting a workplace EV charger (contact for scope)",
];

const PROCESS = [
  {
    step: "01",
    title: "We assess your charging needs and current setup",
    body: "We look at your EV model, expected charging frequency, current switchboard, and whether you have existing solar. This determines what charger and installation is right for you.",
  },
  {
    step: "02",
    title: "We integrate EV load into your solar design",
    body: "If you're getting solar at the same time, your EV charging load is included in the system sizing. That means your solar is built for how you actually live — including your car.",
  },
  {
    step: "03",
    title: "We install and configure the charger",
    body: "Professional installation of the charging unit, dedicated circuit, and any load management hardware required. We configure solar-first charging where supported by your equipment.",
  },
  {
    step: "04",
    title: "Handover — you know exactly how it works",
    body: "Jesse walks you through scheduling, monitoring, and getting the most out of solar charging. No mystery black boxes.",
  },
];

const FAQS = [
  {
    q: "What type of EV charger do you install?",
    a: "We install AC Level 2 home chargers (7kW), which are the standard for home EV charging in Australia. These charge a typical EV overnight from empty or top up during the day from solar.",
  },
  {
    q: "Can I charge my EV from solar?",
    a: "Yes, with the right charger and configuration. Solar-integrated EV charging works best when you size your solar to include your EV load from the start. We can set this up for new or existing solar systems.",
  },
  {
    q: "Do I need a switchboard upgrade?",
    a: "Sometimes. An EV charger adds a significant load, and older switchboards may need upgrading. We assess this during site inspection and include it in your quote if needed.",
  },
  {
    q: "Can I install an EV charger without solar?",
    a: "Yes. An EV charger installation is a standalone electrical job. You'll be charging from the grid, but at a much better rate per km than petrol — and future solar-ready.",
  },
  {
    q: "Which EV charger brands do you recommend?",
    a: "We install proven, reliable equipment. Contact us to discuss what suits your EV model and home setup.",
  },
  {
    q: "How long does installation take?",
    a: "A standard EV charger installation is typically half a day to a full day, depending on switchboard work required.",
  },
];

export default function EVChargerInstallationBendigo() {
  return (
    <ServicePageLayout
      badge="EV Charger Installation · Bendigo, VIC"
      headline="EV Charger Installation in Bendigo"
      subheadline="Solar-integrated charging, designed with your system from day one."
      intro="The best time to size your solar is when you're also planning EV charging. We integrate your vehicle's charging load into the system design — so you're not undersized when you plug in."
      included={INCLUDED}
      whoFor={WHO_FOR}
      process={PROCESS}
      pricingNote="EV charger installation pricing depends on the charger unit, cable run length, and whether switchboard work is required. If combined with a solar installation, the charger work can often be completed in the same visit. See our pricing page or contact us for a quote."
      faqs={FAQS}
      breadcrumb={BREADCRUMB}
    />
  );
}
