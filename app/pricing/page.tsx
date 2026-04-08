import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import TrustStrip from "@/components/TrustStrip";
import HEAEstimator from "@/components/HEAEstimator";
import { Check, ChevronRight } from "lucide-react";
import { GAS_INTAKE_URL } from "@/lib/constants";

const HEAAdvisor = dynamic(() => import("@/components/HEAAdvisor"), { ssr: false });

export const metadata: Metadata = {
  title: "Solar & Battery Pricing Bendigo | HEA Group",
  description:
    "Indicative solar and battery pricing for Bendigo homes. Transparent starting ranges for solar-only, battery add-on, and combined systems. REC 37307.",
};

// TODO_REAL_DATA: Jesse to confirm all prices before going live.
const SOLAR_PACKAGES = [
  {
    name: "Solar Starter",
    specs: "6.6 kW array · 5 kW inverter",
    from: "TODO_REAL_DATA",
    includes: ["6.6 kW panel array", "5 kW grid-connect inverter", "Standard roof mount", "Grid connection", "Monitoring setup"],
    note: "Ideal for smaller households wanting to reduce bills without over-capitalising.",
  },
  {
    name: "Solar Mid",
    specs: "10 kW array · 8 kW inverter",
    from: "TODO_REAL_DATA",
    includes: ["10 kW panel array", "8 kW inverter", "Standard roof mount", "Grid connection", "Monitoring setup"],
    note: "Suits medium to large households with daytime consumption.",
    popular: true,
  },
  {
    name: "Solar Max",
    specs: "13.2 kW array · 10 kW inverter",
    from: "TODO_REAL_DATA",
    includes: ["13.2 kW panel array", "10 kW inverter", "Standard roof mount", "Grid connection", "Monitoring setup"],
    note: "Large households or those planning to add EV charging and/or battery later.",
  },
];

const BATTERY_PACKAGES = [
  {
    name: "Battery Add-On — Small",
    specs: "5–7 kWh usable capacity",
    from: "TODO_REAL_DATA",
    includes: ["5–7 kWh battery", "Inverter/charger if required", "Switchboard integration", "Monitoring setup"],
    note: "Suits smaller households or those wanting partial overnight coverage.",
  },
  {
    name: "Battery Add-On — Standard",
    specs: "10–13 kWh usable capacity",
    from: "TODO_REAL_DATA",
    includes: ["10–13 kWh battery", "Inverter/charger if required", "Full overnight coverage", "VPP-ready config"],
    note: "Most common size for Bendigo family homes. Covers overnight usage for most households.",
    popular: true,
  },
];

const WHAT_CHANGES_PRICE = [
  { factor: "Switchboard condition", detail: "Older switchboards may need upgrading to safely support a solar system. We assess this during site inspection." },
  { factor: "Roof type and access", detail: "Metal roofs, steep pitches, or difficult access add installation time and cost." },
  { factor: "Shading", detail: "Trees, chimneys, or adjacent rooflines may require optimisers or affect system size." },
  { factor: "Single vs three-phase power", detail: "Three-phase homes may require a different inverter configuration." },
  { factor: "Distance from switchboard", detail: "Longer cable runs from panels to switchboard add material and labour cost." },
  { factor: "STC rebates", detail: "Federal government STC rebates reduce the final price. The rebate amount varies by system size and changes each year." },
];

export default function PricingPage() {
  return (
    <>
      <Nav />
      <main>
        {/* Hero */}
        <section className="pt-32 pb-16 px-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white text-center">
          <div className="max-w-3xl mx-auto">
            <p className="text-sm font-bold tracking-widest uppercase text-yellow-400 mb-3">Pricing</p>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">Solar & Battery Pricing</h1>
            <p className="text-slate-300 text-xl mb-3">Bendigo & Regional Victoria</p>
            <p className="text-slate-400 text-base mb-10 max-w-xl mx-auto">
              Indicative starting ranges for standard installs. Every quote is based on your
              actual usage data — so your price may differ from these guides.
            </p>
            <TrustStrip dark />
          </div>
        </section>

        {/* Solar Packages */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 mb-2 text-center">Solar-Only Systems</h2>
            <p className="text-slate-500 text-center mb-10">Grid-connect solar. No battery.</p>
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              {SOLAR_PACKAGES.map((pkg) => (
                <div key={pkg.name} className={`rounded-2xl border-2 p-8 flex flex-col ${pkg.popular ? "border-yellow-400 shadow-xl" : "border-slate-200"}`}>
                  {pkg.popular && <div className="text-xs font-bold uppercase tracking-wider text-yellow-600 mb-2">Most Common</div>}
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{pkg.name}</h3>
                  <p className="text-sm text-slate-400 mb-4">{pkg.specs}</p>
                  <div className="mb-4">
                    <p className="text-xs text-slate-400">From</p>
                    {pkg.from === "TODO_REAL_DATA"
                      ? <p className="text-xl font-bold text-slate-400 italic">Price on request</p>
                      : <p className="text-3xl font-bold text-slate-900">${pkg.from}</p>
                    }
                  </div>
                  <ul className="space-y-2 mb-6 flex-1">
                    {pkg.includes.map((i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <Check className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" /> {i}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-slate-400 italic mb-4">{pkg.note}</p>
                  <a href={GAS_INTAKE_URL} target="_blank" rel="noopener noreferrer"
                    className="text-center text-sm font-semibold border-2 border-slate-200 text-slate-700 py-2.5 rounded-xl hover:border-yellow-400 transition-colors">
                    Get a Quote
                  </a>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 text-center">
              Prices are indicative for standard installs. STC rebates applied. See &ldquo;What changes price&rdquo; below.
            </p>
          </div>
        </section>

        {/* Battery Add-Ons */}
        <section className="py-20 px-4 bg-slate-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 mb-2 text-center">Battery Add-Ons</h2>
            <p className="text-slate-500 text-center mb-10">Retrofit to existing solar, or added alongside a new system.</p>
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {BATTERY_PACKAGES.map((pkg) => (
                <div key={pkg.name} className={`rounded-2xl border-2 p-8 flex flex-col ${pkg.popular ? "border-yellow-400 shadow-xl" : "border-slate-200"} bg-white`}>
                  {pkg.popular && <div className="text-xs font-bold uppercase tracking-wider text-yellow-600 mb-2">Most Common</div>}
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{pkg.name}</h3>
                  <p className="text-sm text-slate-400 mb-4">{pkg.specs}</p>
                  <div className="mb-4">
                    <p className="text-xs text-slate-400">From</p>
                    {pkg.from === "TODO_REAL_DATA"
                      ? <p className="text-xl font-bold text-slate-400 italic">Price on request</p>
                      : <p className="text-3xl font-bold text-slate-900">${pkg.from}</p>
                    }
                  </div>
                  <ul className="space-y-2 mb-6 flex-1">
                    {pkg.includes.map((i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <Check className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" /> {i}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-slate-400 italic mb-4">{pkg.note}</p>
                  <a href={GAS_INTAKE_URL} target="_blank" rel="noopener noreferrer"
                    className="text-center text-sm font-semibold border-2 border-slate-200 text-slate-700 py-2.5 rounded-xl hover:border-yellow-400 transition-colors">
                    Get a Quote
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Interactive Estimator */}
        <section className="py-20 px-4 bg-slate-50">
          <div className="max-w-4xl mx-auto">
            <HEAEstimator />
          </div>
        </section>

        {/* EV + What changes price */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="bg-slate-50 rounded-2xl p-8 mb-12 border border-slate-200">
              <h3 className="text-xl font-bold text-slate-900 mb-2">EV Charger Add-On</h3>
              <p className="text-slate-500 text-sm mb-4">
                EV charger installation (AC Level 2 / 7 kW) is available as a standalone job or
                combined with solar and battery installation.
                {/* TODO_REAL_DATA: Add EV charger from price */}
                {" "}Contact us for pricing specific to your switchboard and site.
              </p>
              <a href={GAS_INTAKE_URL} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-yellow-400 text-slate-900 font-bold px-6 py-3 rounded-xl text-sm hover:bg-yellow-300 transition-colors">
                Get EV Charger Quote <ChevronRight className="w-4 h-4" />
              </a>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-6">What Changes the Price?</h2>
            <div className="space-y-4">
              {WHAT_CHANGES_PRICE.map((item) => (
                <div key={item.factor} className="flex gap-4">
                  <div className="w-1 bg-yellow-400 rounded-full flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-900">{item.factor}</p>
                    <p className="text-slate-500 text-sm">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Finance note — TODO_REAL_DATA */}
        <section className="py-14 px-4 bg-slate-50">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Finance Options</h2>
            <p className="text-slate-500 text-base mb-2">
              {/* TODO_REAL_DATA: Jesse to confirm if finance/payment options are available */}
              Contact us to discuss payment options available for your installation.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 bg-slate-900 text-white text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold mb-4">Get a Quote Based on Your Usage</h2>
            <p className="text-slate-400 mb-8">
              These are indicative starting ranges. Your actual quote is based on your real consumption data, site conditions, and system design.
            </p>
            <a href={GAS_INTAKE_URL} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-yellow-400 text-slate-900 font-bold px-10 py-4 rounded-xl text-lg hover:bg-yellow-300 hover:shadow-xl transition-all duration-200">
              Get My Personalised Quote <ChevronRight className="w-5 h-5" />
            </a>
          </div>
        </section>
      </main>
      <Footer />
      <HEAAdvisor pageContext="pricing" />
    </>
  );
}
