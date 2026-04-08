import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { GAS_INTAKE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "How HEA Sizes Solar Systems Using Real Usage Data | Learning Centre",
  description:
    "Most installers size solar systems from your average bill. HEA uses your actual NEM12 interval data from Powercor. Here's why it matters for your payback.",
};

export default function HowWeSizeSystemsArticle() {
  return (
    <>
      <Nav />
      <main>
        <section className="pt-32 pb-12 px-4 bg-slate-900 text-white">
          <div className="max-w-3xl mx-auto">
            <Link href="/learning-centre" className="text-yellow-400 text-sm hover:text-yellow-300 transition-colors flex items-center gap-1 mb-6">
              ← Learning Centre
            </Link>
            <span className="text-xs font-bold uppercase tracking-wider text-yellow-400 bg-yellow-400/10 px-2.5 py-1 rounded-full">System Design</span>
            <h1 className="text-3xl md:text-5xl font-bold mt-4 mb-4">How HEA Sizes Solar Systems Using Real Usage Data</h1>
            <p className="text-slate-400 text-sm">5 min read · HEA Group</p>
          </div>
        </section>

        <article className="py-16 px-4 bg-white">
          <div className="max-w-3xl mx-auto prose prose-slate prose-lg">
            <p className="text-xl text-slate-600 leading-relaxed mb-8">
              Most solar installers size your system from your electricity bill — specifically your average daily
              usage in kilowatt-hours. This is fast. But it&apos;s not particularly accurate. Here&apos;s what HEA
              does differently and why it produces a better result.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">The Problem with Average Usage</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Your electricity bill tells you roughly how much electricity you used in a quarter. Divide it
              by the number of days, and you get an average daily consumption — say, 18 kWh/day.
            </p>
            <p className="text-slate-600 leading-relaxed mb-4">
              An installer using this number might recommend a system that generates around 18 kWh/day.
              Sounds logical. But there&apos;s a significant flaw: <strong>solar generates electricity in the middle of the day,
              and your household may not use much electricity in the middle of the day.</strong>
            </p>
            <p className="text-slate-600 leading-relaxed mb-6">
              If most of your usage happens in the morning before 8am, and then again in the evening after 5pm,
              a large solar system mostly generates electricity you&apos;ll export to the grid at a low feed-in rate —
              not electricity you actually use. The self-consumption rate is low. The payback is poor.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">What NEM12 Data Actually Shows</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              NEM12 is the standard file format for electricity interval data in Australia. Your smart meter
              records your consumption every 30 minutes. Powercor stores this data, and with your consent,
              we can request it on your behalf.
            </p>
            <p className="text-slate-600 leading-relaxed mb-4">
              What we get: 12 months of half-hourly readings. 17,520 data points that show us exactly when
              your household uses electricity, how much it uses at each time of day, how that varies by season,
              and what your overnight baseline looks like.
            </p>
            <p className="text-slate-600 leading-relaxed mb-6">
              This is far more useful than an average. It lets us answer the question that actually matters:
              <strong> what percentage of a given system&apos;s generation will this household actually self-consume?</strong>
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">How We Model Your System</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Once we have your interval data, we overlay it against actual solar generation data for Bendigo —
              by season and time of day — adjusted for your roof&apos;s orientation and any shading.
            </p>
            <p className="text-slate-600 leading-relaxed mb-4">
              We can model different system sizes and see the self-consumption rate for each. A well-sized
              system for a household with high daytime usage might achieve 60–70% self-consumption.
              An oversized system for the same household might achieve 40%.
            </p>
            <p className="text-slate-600 leading-relaxed mb-6">
              The financial difference is significant. Self-consumed solar replaces electricity you&apos;d otherwise
              buy at ~30 cents/kWh. Exported solar earns you a feed-in tariff of around 4–6 cents/kWh in Victoria.
              The ratio determines your payback period.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">The Practical Result</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              For most Bendigo households, this process means we recommend a system that&apos;s
              smaller — or differently sized — than what a generic installer might quote.
            </p>
            <p className="text-slate-600 leading-relaxed mb-4">
              Sometimes a larger system genuinely makes sense — if you have high daytime usage, an EV
              to charge, or you&apos;re planning a battery. We&apos;ll model those scenarios and show you the numbers.
            </p>
            <p className="text-slate-600 leading-relaxed mb-8">
              The goal is simple: the system that pays itself off fastest for your specific household.
              That&apos;s usually under 10 years. That&apos;s what we target on every job.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 mt-10">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Get an analysis based on your actual data</h3>
              <p className="text-slate-500 text-sm mb-5">
                Fill in your details and we&apos;ll request your NEM12 data from Powercor and build a
                proposal specific to your home.
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
              <Link href="/learning-centre/do-you-need-a-battery" className="text-sm text-yellow-600 hover:text-yellow-700 font-semibold">
                Do you need a battery? →
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
