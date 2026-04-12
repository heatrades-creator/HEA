import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getFooterData } from "@/lib/sanity";
import Link from "next/link";
import { BookOpen, Clock, ChevronRight } from "lucide-react";
import { GAS_INTAKE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Solar Learning Centre | HEA Group",
  description:
    "Practical guides on solar, battery storage, and payback in Bendigo and Victoria. Written by HEA — no fluff, no sales spin.",
};

const ARTICLES = [
  {
    slug: "how-we-size-systems",
    title: "How HEA Sizes Solar Systems Using Real Usage Data",
    excerpt: "Most installers guess. We pull your actual half-hourly consumption from Powercor and model your system against real Bendigo solar data. Here's what that means for your payback.",
    readTime: "5 min read",
    category: "System Design",
  },
  {
    slug: "do-you-need-a-battery",
    title: "Do You Actually Need a Battery in Bendigo?",
    excerpt: "Batteries aren't right for everyone. This guide walks through when a battery makes financial sense, when it doesn't, and what the payback difference looks like in Victoria.",
    readTime: "6 min read",
    category: "Battery Storage",
  },
  {
    slug: "solar-payback-victoria",
    title: "What Actually Affects Solar Payback in Victoria?",
    excerpt: "Feed-in tariffs, self-consumption rates, system sizing, orientation — the variables that determine whether your solar pays off in 7 years or 14. Explained plainly.",
    readTime: "7 min read",
    category: "Solar Savings",
  },
];

export default async function LearningCentre() {
  const footer = await getFooterData()
  return (
    <>
      <Nav />
      <main>
        <section className="pt-32 pb-16 px-4 bg-slate-900 text-white text-center">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 text-yellow-400 text-sm font-semibold mb-4">
              <BookOpen className="w-4 h-4" /> Learning Centre
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-5">Understand Before You Buy</h1>
            <p className="text-slate-300 text-xl max-w-xl mx-auto">
              Practical guides on solar, battery, and payback. No fluff. No sales spin.
            </p>
          </div>
        </section>

        <section className="py-20 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-1 gap-8">
              {ARTICLES.map((article) => (
                <Link
                  key={article.slug}
                  href={`/learning-centre/${article.slug}`}
                  className="group flex flex-col md:flex-row gap-6 border border-slate-200 rounded-2xl p-8 hover:border-yellow-400 hover:shadow-lg transition-all"
                >
                  <div className="flex-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-yellow-600 bg-yellow-50 px-2.5 py-1 rounded-full">
                      {article.category}
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 mt-3 mb-2 group-hover:text-yellow-700 transition-colors">
                      {article.title}
                    </h2>
                    <p className="text-slate-500 text-sm leading-relaxed mb-3">{article.excerpt}</p>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Clock className="w-3.5 h-3.5" /> {article.readTime}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-semibold text-yellow-600">
                        Read article <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-slate-50 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Ready to see your numbers?</h2>
            <p className="text-slate-500 mb-6">Get a proposal based on your actual usage data.</p>
            <a href={GAS_INTAKE_URL} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-yellow-400 text-slate-900 font-bold px-8 py-3.5 rounded-xl hover:bg-yellow-300 transition-colors">
              Get My Free Solar Estimate <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </section>
      </main>
      <Footer data={footer} />
    </>
  );
}
