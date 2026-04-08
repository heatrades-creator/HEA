import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import TrustStrip from "@/components/TrustStrip";
import HowItWorks from "@/components/HowItWorks";
import FAQAccordion from "@/components/FAQAccordion";
import { Check, ChevronRight, MapPin } from "lucide-react";
import { GAS_INTAKE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Solar Installer Bendigo | HEA Group",
  description:
    "Local solar installer in Bendigo, VIC. HEA designs right-sized solar systems from your actual Powercor usage data. Serving Bendigo, Golden Square, Strathdale, Kangaroo Flat and surrounds. REC 37307.",
  alternates: { canonical: "https://hea-group.com.au/bendigo-solar-installer" },
};

const SUBURBS = [
  "Bendigo", "Golden Square", "Strathdale", "Kangaroo Flat",
  "Eaglehawk", "Epsom", "Maiden Gully", "White Hills",
  "California Gully", "Quarry Hill", "Kennington", "Flora Hill",
  "Long Gully", "Jackass Flat", "Spring Gully",
];

export default function BendigoSolarInstaller() {
  return (
    <>
      <Nav />
      <main>
        {/* Hero */}
        <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 text-yellow-400 text-sm font-semibold mb-4">
              <MapPin className="w-4 h-4" /> Bendigo, VIC
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-5">
              Solar Installer in Bendigo
            </h1>
            <p className="text-xl text-slate-300 mb-4">
              Local. Direct. Right-sized from your actual usage data.
            </p>
            <p className="text-slate-400 mb-10 max-w-2xl">
              HEA is Bendigo&apos;s direct solar installer. We design systems from your real Powercor
              interval data — not averages — targeting payback under 10 years for every home we install.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <a href={GAS_INTAKE_URL} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-yellow-400 text-slate-900 font-bold px-8 py-4 rounded-xl hover:bg-yellow-300 transition-all">
                Get My Free Solar Estimate <ChevronRight className="w-5 h-5" />
              </a>
            </div>
            <TrustStrip dark />
          </div>
        </section>

        {/* Why local matters */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-5">
                Why Choose a Bendigo-Based Installer?
              </h2>
              <ul className="space-y-4 text-slate-600">
                {[
                  "We know Bendigo's grid conditions and Powercor requirements",
                  "Same-day or next-day response for local enquiries",
                  "No travel surcharges — we're based here",
                  "We're available for post-install questions, long term",
                  "Local referrals matter to us — we rely on word of mouth",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <Check className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-5">
                Areas We Service
              </h2>
              <div className="flex flex-wrap gap-2">
                {SUBURBS.map((s) => (
                  <span key={s} className="text-sm bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-full">
                    {s}
                  </span>
                ))}
              </div>
              <p className="text-slate-400 text-sm mt-4">
                Also servicing Castlemaine, Kyneton, Heathcote, Elmore, Loddon Shire, and surrounding central Victoria. Contact us if you&apos;re outside this list.
              </p>
            </div>
          </div>
        </section>

        <HowItWorks />

        <FAQAccordion limit={5} />

        {/* CTA */}
        <section className="py-20 px-4 bg-slate-900 text-white text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold mb-4">Get a Solar Quote for Your Bendigo Home</h2>
            <p className="text-slate-400 mb-8">No obligation · Based on your actual usage data</p>
            <a href={GAS_INTAKE_URL} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-yellow-400 text-slate-900 font-bold px-10 py-4 rounded-xl text-lg hover:bg-yellow-300 hover:shadow-xl transition-all">
              Get My Free Estimate <ChevronRight className="w-5 h-5" />
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
