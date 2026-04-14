"use client";
import React from "react";
import { Shield, Award, TrendingUp, CheckCircle, Users, LucideIcon } from "lucide-react";
import Link from "next/link";

interface WhyChooseUsItem {
  title: string;
  description: string;
  icon?: string;
}

interface WhyChooseUsProps {
  data?: WhyChooseUsItem[] | null;
}

const iconMap: Record<string, LucideIcon> = { Shield, Award, TrendingUp, CheckCircle, Users };

const defaultItems: WhyChooseUsItem[] = [
  {
    icon: "TrendingUp",
    title: "Real Usage Analysis",
    description:
      "We pull your actual NEM12 interval data from Powercor before designing anything. No guesswork — your system is built on 12 months of real half-hourly consumption.",
  },
  {
    icon: "Award",
    title: "Right-Sized, Not Oversized",
    description:
      "Our goal is the system that pays itself off fastest for you — always targeting under 10 years. We don't push the biggest sale. We push the best fit.",
  },
  {
    icon: "CheckCircle",
    title: "Direct Installer",
    description:
      "Jesse and Alexis do the work themselves. You deal with the installer from day one — not a salesperson who hands you off to a subcontractor.",
  },
  {
    icon: "Shield",
    title: "Licensed in Victoria",
    description:
      "REC 37307. Fully licensed and insured for solar and battery installations across Bendigo and surrounds.",
  },
  {
    icon: "Users",
    title: "No Subcontractors",
    description:
      "We never farm out jobs. The same people who quote the job install it. That's what accountability looks like.",
  },
];

const gradients = [
  "from-yellow-400 to-yellow-500",
  "from-slate-700 to-slate-800",
  "from-yellow-500 to-yellow-400",
  "from-slate-800 to-slate-700",
  "from-yellow-400 to-slate-700",
];

const WhyChooseUs = ({ data }: WhyChooseUsProps) => {
  const items = data || defaultItems;

  return (
    <section className="py-20 px-4 bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-sm font-bold tracking-widest uppercase text-yellow-400 mb-2">
            Why HEA
          </p>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Built Different
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            We&apos;re not here to sell you the biggest system. We&apos;re here to design the right one.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {items.map((item, idx) => {
            const Icon = iconMap[item.icon || "CheckCircle"] || CheckCircle;
            return (
              <div key={idx} className="flex flex-col items-center text-center group">
                <div
                  className={`p-5 rounded-2xl inline-block mb-4 bg-gradient-to-br ${gradients[idx % gradients.length]} group-hover:scale-110 transition-transform shadow-lg`}
                >
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-white">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>

        {/* Results banner */}
        <div className="mt-12 bg-yellow-400 rounded-2xl px-8 py-7 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-slate-900 font-black text-xl md:text-2xl leading-tight">
              Most Bendigo households save <span className="underline decoration-wavy decoration-slate-900/30">$1,800+ per year</span>
            </p>
            <p className="text-slate-800 text-sm mt-1 opacity-80">
              Based on a right-sized solar system designed from your actual usage data.
            </p>
          </div>
          <a
            href="/intake"
            className="flex-shrink-0 bg-slate-900 text-white font-bold px-7 py-3.5 rounded-xl hover:bg-slate-800 transition-colors text-sm whitespace-nowrap"
          >
            See My Numbers →
          </a>
        </div>

        <div className="text-center mt-8">
          <Link
            href="/why-hea"
            className="inline-flex items-center gap-2 text-sm font-semibold text-yellow-400 hover:text-yellow-300 transition-colors border border-yellow-400/30 hover:border-yellow-400/60 rounded-lg px-5 py-2.5"
          >
            Learn more about how we work →
          </Link>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
