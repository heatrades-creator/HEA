import React from "react";
import Link from "next/link";
import { ChevronRight, Clock } from "lucide-react";

type Article = {
  slug: string;
  title: string;
  excerpt: string;
  readTime: string;
  category: string;
};

// Fallback articles pointing at the pre-built static pages
const FALLBACK_ARTICLES: Article[] = [
  {
    slug: "how-we-size-systems",
    title: "How HEA Sizes Solar Systems Using Real Usage Data",
    excerpt:
      "Most installers guess. We pull your actual half-hourly consumption from Powercor and model your system against real Bendigo solar data. Here's what that means for your payback.",
    readTime: "5 min read",
    category: "System Design",
  },
  {
    slug: "do-you-need-a-battery",
    title: "Do You Actually Need a Battery in Bendigo?",
    excerpt:
      "Batteries aren't right for everyone. This guide walks through when a battery makes financial sense, when it doesn't, and what the payback difference looks like in Victoria.",
    readTime: "6 min read",
    category: "Battery Storage",
  },
  {
    slug: "solar-payback-victoria",
    title: "What Actually Affects Solar Payback in Victoria?",
    excerpt:
      "Feed-in tariffs, self-consumption rates, system sizing, orientation — the variables that determine whether your solar pays off in 7 years or 14. Explained plainly.",
    readTime: "7 min read",
    category: "Solar Savings",
  },
];

interface LearningHubProps {
  /** Sanity-sourced articles — falls back to hardcoded set if empty */
  articles?: Article[];
}

const LearningHub = ({ articles }: LearningHubProps) => {
  const ARTICLES =
    articles && articles.length > 0 ? articles : FALLBACK_ARTICLES;
  return (
    <section className="py-20 px-4 bg-slate-900">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <p className="text-sm font-bold tracking-widest uppercase text-yellow-400 mb-2">
              Learning Centre
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Understand Before You Buy
            </h2>
          </div>
          <Link
            href="/learning-centre"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors whitespace-nowrap"
          >
            All articles <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {ARTICLES.map((article) => (
            <Link
              key={article.slug}
              href={`/learning-centre/${article.slug}`}
              className="group bg-slate-800 rounded-2xl p-8 border border-slate-700 hover:border-yellow-400/50 hover:shadow-xl hover:shadow-yellow-400/5 transition-all duration-300 flex flex-col"
            >
              <div className="flex items-center gap-2 mb-5">
                <span className="text-xs font-bold uppercase tracking-wider text-yellow-400 bg-yellow-400/10 px-2.5 py-1 rounded-full">
                  {article.category}
                </span>
              </div>

              <h3 className="text-lg font-bold text-white mb-3 group-hover:text-yellow-300 transition-colors leading-snug">
                {article.title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed flex-1 mb-5">
                {article.excerpt}
              </p>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock className="w-3.5 h-3.5" />
                  {article.readTime}
                </span>
                <span className="flex items-center gap-1 text-xs font-semibold text-yellow-400 group-hover:gap-2 transition-all">
                  Read article <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LearningHub;
