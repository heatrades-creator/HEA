import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { GAS_INTAKE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Do You Actually Need a Battery in Bendigo? | Learning Centre",
  description:
    "When does a home battery storage system make financial sense in Bendigo and Victoria? An honest breakdown of when batteries help payback — and when they don't.",
};

export default function DoYouNeedABattery() {
  return (
    <>
      <Nav />
      <main>
        <section className="pt-32 pb-12 px-4 bg-slate-900 text-white">
          <div className="max-w-3xl mx-auto">
            <Link href="/learning-centre" className="text-yellow-400 text-sm hover:text-yellow-300 transition-colors flex items-center gap-1 mb-6">
              ← Learning Centre
            </Link>
            <span className="text-xs font-bold uppercase tracking-wider text-yellow-400 bg-yellow-400/10 px-2.5 py-1 rounded-full">Battery Storage</span>
            <h1 className="text-3xl md:text-5xl font-bold mt-4 mb-4">Do You Actually Need a Battery in Bendigo?</h1>
            <p className="text-slate-400 text-sm">6 min read · HEA Group</p>
          </div>
        </section>

        <article className="py-16 px-4 bg-white">
          <div className="max-w-3xl mx-auto">
            <p className="text-xl text-slate-600 leading-relaxed mb-8">
              The honest answer: it depends. A battery isn&apos;t always the right financial decision — even if you have solar.
              Here&apos;s how to think through whether one makes sense for your household.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">What a Battery Actually Does</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Your solar panels generate electricity during the day. If you&apos;re not home — or not using much power —
              excess generation gets exported to the grid. In Victoria, you&apos;ll typically receive around 4–6 cents/kWh
              for that export.
            </p>
            <p className="text-slate-600 leading-relaxed mb-6">
              A battery stores that excess generation instead of exporting it. You then use that stored electricity
              in the evening or overnight — avoiding buying from the grid at ~28–32 cents/kWh.
              The arbitrage between the export rate and the avoided purchase rate is where the battery earns its value.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">When a Battery Makes Strong Financial Sense</h2>
            <ul className="space-y-4 mb-6">
              {[
                { title: "High evening usage", body: "If your household uses most of its electricity in the evening — cooking, appliances, entertainment — a battery means you use stored solar instead of buying from the grid at peak rates." },
                { title: "Away from home during the day", body: "If no one is home during solar generation hours, you export most of your production. A battery captures that and shifts it to when you need it." },
                { title: "An EV to charge overnight", body: "Charging an EV from stored solar rather than from the grid overnight can significantly improve the battery's financial case." },
                { title: "Power security matters to you", body: "If you want backup during grid outages, a battery provides that — independent of the pure financial calculation." },
              ].map((item) => (
                <li key={item.title} className="flex gap-4 border border-slate-100 rounded-xl p-5">
                  <div className="w-1.5 bg-yellow-400 rounded-full flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="text-slate-500 text-sm mt-1">{item.body}</p>
                  </div>
                </li>
              ))}
            </ul>

            <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">When a Battery May Not Improve Your Payback</h2>
            <ul className="space-y-4 mb-8">
              {[
                { title: "High daytime usage", body: "If someone is home all day using electricity — running appliances, working from home — you self-consume most of your solar directly. There's less excess to store, and the battery has less to do." },
                { title: "Small solar system", body: "A small system may not generate significant excess to store. The battery sits mostly empty." },
                { title: "Very low overnight usage", body: "If your household uses very little electricity overnight, a battery sized for typical coverage will be oversized for your actual needs." },
              ].map((item) => (
                <li key={item.title} className="flex gap-4 border border-slate-100 rounded-xl p-5">
                  <div className="w-1.5 bg-slate-300 rounded-full flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="text-slate-500 text-sm mt-1">{item.body}</p>
                  </div>
                </li>
              ))}
            </ul>

            <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">The HEA Approach</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              We model both scenarios using your actual interval data — solar alone, and solar plus battery.
              We show you the projected payback for each and the difference in upfront cost.
            </p>
            <p className="text-slate-600 leading-relaxed mb-8">
              Sometimes a battery meaningfully shortens payback or improves financial return. Sometimes it extends it.
              We&apos;ll tell you which is true for your household — and we won&apos;t push a battery because it increases the sale value.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 mt-10">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Get the comparison for your home</h3>
              <p className="text-slate-500 text-sm mb-5">
                We&apos;ll model solar-only vs solar-plus-battery using your actual usage data. You&apos;ll see the
                financial case clearly before you decide.
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
              <Link href="/learning-centre/solar-payback-victoria" className="text-sm text-yellow-600 hover:text-yellow-700 font-semibold">
                Solar payback in Victoria →
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
