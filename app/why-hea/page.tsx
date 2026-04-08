import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import TrustStrip from "@/components/TrustStrip";
import { Check, ChevronRight } from "lucide-react";
import { GAS_INTAKE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Why HEA | Bendigo's Direct Solar Installers",
  description:
    "Why Bendigo homeowners choose HEA for solar and battery. Direct installers. Real usage data. Right-sized systems. Jesse and Alexis Heffernan — REC 37307.",
};

const VALUES = [
  {
    title: "Honesty over sales",
    body: "If a battery won't improve your payback, we'll tell you. If a smaller system is better for your usage profile, that's what we'll recommend. We're not trying to maximise the sale. We're trying to earn a referral.",
  },
  {
    title: "Precision over guesswork",
    body: "We use your actual NEM12 interval data from Powercor — 12 months of half-hourly readings. Every proposal is modelled against real data, not industry averages. Your payback estimate reflects your home, not someone else's.",
  },
  {
    title: "Direct over delegated",
    body: "Jesse does the consultation, the design, and the installation. You deal with one person. That person is accountable for the result.",
  },
  {
    title: "Right-sized, not biggest",
    body: "The solar industry has an oversizing problem. Bigger systems aren't always better — they cost more, have longer payback, and may not even be worth the roof space. We target payback under 10 years on every job.",
  },
];

export default function WhyHEA() {
  return (
    <>
      <Nav />
      <main>
        {/* Hero */}
        <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-sm font-bold tracking-widest uppercase text-yellow-400 mb-3">About HEA</p>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Why HEA</h1>
            <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
              We&apos;re not the biggest solar company in Bendigo. We&apos;re the most precise.
            </p>
            <TrustStrip dark />
          </div>
        </section>

        {/* Story */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            {/* TODO_REAL_DATA: Replace with real photo of Jesse and/or Alexis */}
            <div className="h-80 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300 border border-slate-200">
              <div className="text-center">
                <p className="text-sm font-medium">Photo of Jesse & Alexis</p>
                <p className="text-xs mt-1">TODO_REAL_DATA: add real photo</p>
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-5">Jesse & Alexis Heffernan</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Heffernan Electrical Automation is Jesse and Alexis Heffernan — a licensed electrical
                contracting team based in Bendigo, Victoria. We specialise exclusively in solar,
                battery storage, and EV charging for residential homeowners in central Victoria.
              </p>
              <p className="text-slate-600 leading-relaxed mb-4">
                We started HEA because we kept seeing the same problem: homeowners being sold systems
                that were sized to maximise the installer&apos;s margin, not the customer&apos;s payback.
                Oversized systems. Generic quotes. No one checking the actual bill data.
              </p>
              <p className="text-slate-600 leading-relaxed mb-6">
                So we built a different kind of process. One that starts with your real consumption
                data and ends with a system designed around how your household actually uses energy.
              </p>
              <div className="flex flex-wrap gap-3">
                {["REC 37307", "Fully Insured", "Direct Installers", "Bendigo Based"].map((b) => (
                  <span key={b} className="flex items-center gap-1.5 text-sm text-slate-700 bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-full font-medium">
                    <Check className="w-4 h-4 text-yellow-500" /> {b}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Why right-sized */}
        <section className="py-20 px-4 bg-slate-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 mb-4 text-center">
              Why &ldquo;Right-Sized, Not Biggest&rdquo; Matters
            </h2>
            <p className="text-slate-500 text-center mb-12 max-w-2xl mx-auto">
              The solar industry pushes bigger systems because bigger means higher margin.
              We push the system that pays itself off fastest for your specific household.
            </p>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-red-50 border border-red-100 rounded-2xl p-7">
                <h3 className="font-bold text-red-700 mb-3">The Oversizing Problem</h3>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="flex gap-2"><span className="text-red-400 font-bold mt-0.5">✗</span> System sized to roof capacity, not usage</li>
                  <li className="flex gap-2"><span className="text-red-400 font-bold mt-0.5">✗</span> Most generation exported at low feed-in rates</li>
                  <li className="flex gap-2"><span className="text-red-400 font-bold mt-0.5">✗</span> Payback period blows out to 12–15 years</li>
                  <li className="flex gap-2"><span className="text-red-400 font-bold mt-0.5">✗</span> Customer feels good initially, disappointed later</li>
                </ul>
              </div>
              <div className="bg-green-50 border border-green-100 rounded-2xl p-7">
                <h3 className="font-bold text-green-700 mb-3">The HEA Approach</h3>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="flex gap-2"><span className="text-green-500 font-bold mt-0.5">✓</span> System sized to your real consumption profile</li>
                  <li className="flex gap-2"><span className="text-green-500 font-bold mt-0.5">✓</span> Maximum self-consumption, minimum wasted export</li>
                  <li className="flex gap-2"><span className="text-green-500 font-bold mt-0.5">✓</span> Payback target under 10 years, every time</li>
                  <li className="flex gap-2"><span className="text-green-500 font-bold mt-0.5">✓</span> Honest if a bigger system genuinely makes sense</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">How We Operate</h2>
            <div className="space-y-8">
              {VALUES.map((v, i) => (
                <div key={v.title} className="flex gap-6">
                  <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center font-bold text-slate-900 text-sm flex-shrink-0 mt-1">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-2">{v.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{v.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 bg-slate-900 text-white text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold mb-4">Talk to Jesse Directly</h2>
            <p className="text-slate-400 mb-8">No salespeople. No middlemen. Just straight advice on what solar looks like for your home.</p>
            <a href={GAS_INTAKE_URL} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-yellow-400 text-slate-900 font-bold px-10 py-4 rounded-xl text-lg hover:bg-yellow-300 hover:shadow-xl transition-all duration-200">
              Get My Free Estimate <ChevronRight className="w-5 h-5" />
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
