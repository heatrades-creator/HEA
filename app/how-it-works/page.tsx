import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { ChevronRight } from "lucide-react";
import { GAS_INTAKE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "How It Works | HEA Solar Process — Bendigo",
  description:
    "How HEA designs and installs solar in Bendigo. We use real Powercor NEM12 data to design right-sized systems. Four steps from first contact to handover.",
};

export default function HowItWorksPage() {
  return (
    <>
      <Nav />
      <main>
        <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white text-center">
          <div className="max-w-3xl mx-auto">
            <p className="text-sm font-bold tracking-widest uppercase text-yellow-400 mb-3">The Process</p>
            <h1 className="text-4xl md:text-6xl font-bold mb-5">How It Works</h1>
            <p className="text-slate-300 text-xl max-w-xl mx-auto">
              Four steps from first contact to a solar system designed around your home.
            </p>
          </div>
        </section>

        {/* Steps */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-3xl mx-auto space-y-16">

            {/* Step 1 */}
            <div className="flex gap-8">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 bg-yellow-400 rounded-2xl flex items-center justify-center font-bold text-xl text-slate-900">01</div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3">You send us your bill — or we pull the data</h2>
                <p className="text-slate-600 leading-relaxed mb-3">
                  A recent electricity bill gives us your average daily usage and your retailer. That&apos;s a starting point.
                  But it doesn&apos;t tell us <em>when</em> you use electricity — and that&apos;s what matters most for solar design.
                </p>
                <p className="text-slate-600 leading-relaxed mb-3">
                  So we request your <strong>NEM12 interval data</strong> directly from Powercor. This is 12 months of
                  half-hourly consumption readings — the same data your electricity retailer uses for billing.
                </p>
                <p className="text-slate-600 leading-relaxed">
                  You don&apos;t need to do anything technical. We make the data request and handle it from there.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-8">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 bg-yellow-400 rounded-2xl flex items-center justify-center font-bold text-xl text-slate-900">02</div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3">We analyse your real consumption patterns</h2>
                <p className="text-slate-600 leading-relaxed mb-3">
                  With your interval data, we can see exactly when your household uses electricity:
                  morning peak, midday trough, evening demand, overnight baseline.
                </p>
                <p className="text-slate-600 leading-relaxed mb-3">
                  We overlay this against <strong>actual solar generation data for Bendigo</strong> — by season, by time of day,
                  adjusted for your roof orientation and any shading constraints.
                </p>
                <p className="text-slate-600 leading-relaxed">
                  This tells us what percentage of your consumption a given system size would offset.
                  The goal is to maximise self-consumption — the electricity you use directly from your panels —
                  because that&apos;s where the real financial value lies.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-8">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 bg-yellow-400 rounded-2xl flex items-center justify-center font-bold text-xl text-slate-900">03</div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3">You receive a right-sized proposal with real payback numbers</h2>
                <p className="text-slate-600 leading-relaxed mb-3">
                  Not a template. Not a quote based on your suburb&apos;s average consumption.
                  A proposal for your specific household, with:
                </p>
                <ul className="list-disc list-inside text-slate-600 space-y-2 mb-3 ml-4">
                  <li>System size recommendation with reasoning</li>
                  <li>Projected annual solar generation</li>
                  <li>Projected self-consumption rate</li>
                  <li>Estimated annual bill reduction</li>
                  <li>Payback period estimate (our target is under 10 years)</li>
                  <li>Battery comparison if relevant</li>
                </ul>
                <p className="text-slate-600 leading-relaxed">
                  All estimates are projections, not guarantees. But they&apos;re based on your real data,
                  real Bendigo solar conditions, and honest assumptions about feed-in tariffs and future usage.
                  We tell you what the assumptions are so you can make an informed decision.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-8">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 bg-yellow-400 rounded-2xl flex items-center justify-center font-bold text-xl text-slate-900">04</div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3">Jesse installs, connects, and hands over</h2>
                <p className="text-slate-600 leading-relaxed mb-3">
                  No subcontractors. No project handover to a crew you&apos;ve never met.
                  Jesse handles the physical installation start to finish:
                </p>
                <ul className="list-disc list-inside text-slate-600 space-y-2 mb-3 ml-4">
                  <li>Roof mounting and panel installation</li>
                  <li>Inverter installation and wiring</li>
                  <li>Switchboard connection and protection devices</li>
                  <li>Grid metering and DNSP notification</li>
                  <li>Monitoring app setup</li>
                  <li>Battery installation and configuration (if applicable)</li>
                </ul>
                <p className="text-slate-600 leading-relaxed">
                  At handover, Jesse walks you through the monitoring app, how to read your generation data,
                  and what to expect in the first weeks. You leave knowing how your system works.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 bg-slate-900 text-white text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold mb-4">Start the Process</h2>
            <p className="text-slate-400 mb-8">5 min form · no obligation · we do the analysis before the call</p>
            <a href={GAS_INTAKE_URL} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-yellow-400 text-slate-900 font-bold px-10 py-4 rounded-xl text-lg hover:bg-yellow-300 hover:shadow-xl transition-all">
              Get My Free Solar Estimate <ChevronRight className="w-5 h-5" />
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
