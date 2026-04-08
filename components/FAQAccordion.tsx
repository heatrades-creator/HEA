"use client";
import React, { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";

const FAQS = [
  {
    q: "Do I need a battery?",
    a: "Not necessarily. A battery makes the most sense if you're away during the day (so can't self-consume solar), have a high overnight usage, or want backup power during outages. We'll model your actual usage data and show you the payback difference between solar-only and solar-plus-battery before you decide.",
  },
  {
    q: "How do you size the system?",
    a: "We pull your NEM12 interval data from Powercor — that's 12 months of half-hourly readings showing exactly when your home uses electricity. We model your usage against actual solar generation data for your location and size the system to maximise self-consumption without overbuilding.",
  },
  {
    q: "What bill or data do you need from me?",
    a: "A recent electricity bill is a good starting point. We then request your actual interval data (NEM12) directly from Powercor, which gives us far more detail than a bill alone. You don't need to do anything technical — we handle the data request.",
  },
  {
    q: "Do you use subcontractors?",
    a: "No. Jesse and Alexis do the work themselves. No subcontractors, no salespeople, no middlemen. You deal with the same person from your first call to handover.",
  },
  {
    q: "Can you install EV chargers too?",
    a: "Yes. We install EV chargers as standalone jobs or as part of a solar and battery system. We can integrate EV charging into the solar design from day one so your system is sized to support your charging load.",
  },
  {
    q: "How long does installation take?",
    a: "A standard solar install is typically a single day. A solar and battery system may take one to two days depending on complexity. We'll give you a clear timeline before we start.",
  },
  {
    q: "Do you service areas outside Bendigo?",
    a: "Our primary service area is Bendigo and the surrounding region — including Castlemaine, Kyneton, Heathcote, Elmore, and Loddon Shire. Contact us if you're outside these areas and we'll let you know.",
  },
  {
    q: "How accurate are your payback estimates?",
    a: "More accurate than most, because we use your real consumption data rather than averages. That said, payback depends on your future usage patterns, energy prices, and feed-in tariffs — all of which can change. We're transparent about assumptions in every proposal.",
  },
];

interface FAQAccordionProps {
  limit?: number;
  showLink?: boolean;
}

const FAQAccordion = ({ limit, showLink = true }: FAQAccordionProps) => {
  const [open, setOpen] = useState<number | null>(null);
  const faqs = limit ? FAQS.slice(0, limit) : FAQS;

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-sm font-bold tracking-widest uppercase text-yellow-500 mb-2">
            FAQ
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Common Questions
          </h2>
          <p className="text-lg text-slate-500">
            Straight answers — no sales spin.
          </p>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="border border-slate-200 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-slate-50 transition-colors"
                aria-expanded={open === i}
              >
                <span className="font-semibold text-slate-900 pr-4">{faq.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
                    open === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {open === i && (
                <div className="px-6 pb-5 text-slate-600 text-sm leading-relaxed border-t border-slate-100">
                  <div className="pt-4">{faq.a}</div>
                </div>
              )}
            </div>
          ))}
        </div>

        {showLink && (
          <div className="text-center mt-8">
            <Link
              href="/faqs"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-yellow-600 transition-colors"
            >
              See all FAQs <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* FAQPage JSON-LD Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: FAQS.map((faq) => ({
                "@type": "Question",
                name: faq.q,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: faq.a,
                },
              })),
            }),
          }}
        />
      </div>
    </section>
  );
};

export default FAQAccordion;
