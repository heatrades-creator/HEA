import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getFooterData } from "@/lib/sanity";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { GAS_INTAKE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "What Affects Solar Payback in Victoria? | Learning Centre",
  description:
    "Feed-in tariffs, self-consumption, system size, orientation — the real variables that determine solar payback in Victoria. Explained plainly by HEA.",
};

const FACTORS = [
  {
    factor: "Self-consumption rate",
    impact: "High",
    body: "The most important variable. Electricity you use directly from your solar replaces grid purchases at ~30 cents/kWh. Electricity you export earns ~5 cents/kWh. A 10% improvement in self-consumption can reduce payback by 1–2 years.",
  },
  {
    factor: "System size vs your usage",
    impact: "High",
    body: "An oversized system generates more electricity than you can self-consume, pushing more to the grid at low export rates. A right-sized system maximises self-consumption and improves payback. This is why sizing from your real data matters.",
  },
  {
    factor: "Feed-in tariff rate",
    impact: "Medium",
    body: "Victoria's minimum feed-in tariff varies year to year. As of 2025, rates are generally 4–6 cents/kWh. Export earnings are significant if you have a large system and low self-consumption, but they'll never match the value of self-consumed solar.",
  },
  {
    factor: "Electricity purchase price",
    impact: "High",
    body: "Higher electricity prices mean solar saves more money per kWh self-consumed. Electricity prices have risen significantly in Victoria over the last few years — this generally improves solar payback.",
  },
  {
    factor: "Roof orientation",
    impact: "Medium",
    body: "North-facing is optimal in Australia. East/west orientations generate less total energy but spread generation more evenly across the day — which can actually improve self-consumption for households with morning and afternoon peaks.",
  },
  {
    factor: "Shading",
    impact: "Variable",
    body: "Even partial shading on one panel can significantly reduce system output depending on your inverter/panel technology. A site assessment identifies shading issues before they affect your payback.",
  },
  {
    factor: "Solar resource (location)",
    impact: "Low-medium",
    body: "Bendigo receives more solar irradiance than Melbourne. Regional Victoria generally performs well for solar. This is factored into our modelling using specific local data.",
  },
];

export default async function SolarPaybackVictoria() {
  const footer = await getFooterData()
  return (
    <>
      <Nav />
      <main>
        <section className="pt-32 pb-12 px-4 bg-slate-900 text-white">
          <div className="max-w-3xl mx-auto">
            <Link href="/learning-centre" className="text-yellow-400 text-sm hover:text-yellow-300 transition-colors flex items-center gap-1 mb-6">
              ← Learning Centre
            </Link>
            <span className="text-xs font-bold uppercase tracking-wider text-yellow-400 bg-yellow-400/10 px-2.5 py-1 rounded-full">Solar Savings</span>
            <h1 className="text-3xl md:text-5xl font-bold mt-4 mb-4">What Actually Affects Solar Payback in Victoria?</h1>
            <p className="text-slate-400 text-sm">7 min read · HEA Group</p>
          </div>
        </section>

        <article className="py-16 px-4 bg-white">
          <div className="max-w-3xl mx-auto">
            <p className="text-xl text-slate-600 leading-relaxed mb-8">
              Solar payback estimates range from &ldquo;5 years&rdquo; to &ldquo;15 years&rdquo; depending on who you ask.
              Most of that variance comes from assumptions about the variables below.
              Here&apos;s what actually moves the needle — and what doesn&apos;t.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mb-6">The Key Variables</h2>
            <div className="space-y-6 mb-12">
              {FACTORS.map((f) => (
                <div key={f.factor} className="border border-slate-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-slate-900">{f.factor}</h3>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      f.impact === "High" ? "bg-yellow-100 text-yellow-700" :
                      f.impact === "Medium" ? "bg-slate-100 text-slate-600" :
                      "bg-slate-50 text-slate-400"
                    }`}>
                      {f.impact} impact
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm leading-relaxed">{f.body}</p>
                </div>
              ))}
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">What HEA Targets</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Our target on every installation is a payback period under 10 years. For many Bendigo households
              — especially those with significant daytime usage — payback in the 6–8 year range is achievable
              with a well-sized system.
            </p>
            <p className="text-slate-600 leading-relaxed mb-8">
              We don&apos;t use industry average assumptions for our proposals. We use your real interval data,
              current Victoria feed-in tariffs, and your actual electricity plan rates. We tell you what
              the assumptions are — so if prices change, you can update the estimate yourself.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 mt-10">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Get a payback estimate for your home</h3>
              <p className="text-slate-500 text-sm mb-5">
                We build our proposals from your actual Powercor data and current Victorian rates.
                No generic averages. No assumptions you can&apos;t check.
              </p>
              <a href={GAS_INTAKE_URL} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-yellow-400 text-slate-900 font-bold px-6 py-3 rounded-xl text-sm hover:bg-yellow-300 transition-colors">
                Get My Solar Estimate <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </article>

        <section className="py-12 px-4 bg-slate-50 border-t border-slate-200">
          <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-600 font-medium">More from the Learning Centre</p>
            <div className="flex gap-4">
              <Link href="/learning-centre/how-we-size-systems" className="text-sm text-yellow-600 hover:text-yellow-700 font-semibold">
                How we size systems →
              </Link>
              <Link href="/learning-centre/do-you-need-a-battery" className="text-sm text-yellow-600 hover:text-yellow-700 font-semibold">
                Do you need a battery? →
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer data={footer} />
    </>
  );
}
