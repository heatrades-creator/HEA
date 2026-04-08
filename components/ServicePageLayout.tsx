"use client";
import React from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import TrustStrip from "@/components/TrustStrip";
import FAQAccordion from "@/components/FAQAccordion";
import HEAComparison from "@/components/HEAComparison";
import HEAAdvisor from "@/components/HEAAdvisor";
import Link from "next/link";
import { ChevronRight, Check } from "lucide-react";
import { GAS_INTAKE_URL, HEA_PHONE } from "@/lib/constants";

interface FAQ {
  q: string;
  a: string;
}

interface ServicePageProps {
  badge: string;
  headline: string;
  subheadline: string;
  intro: string;
  included: string[];
  whoFor: string[];
  process: { step: string; title: string; body: string }[];
  pricingNote: string;
  faqs: FAQ[];
  breadcrumb: { label: string; href: string }[];
}

const ServicePageLayout = ({
  badge,
  headline,
  subheadline,
  intro,
  included,
  whoFor,
  process,
  pricingNote,
  faqs,
  breadcrumb,
}: ServicePageProps) => {
  return (
    <>
      <Nav />
      <main>
        {/* Hero */}
        <section className="relative pt-32 pb-20 px-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-10 right-10 w-96 h-96 bg-yellow-400 rounded-full blur-3xl" />
          </div>
          <div className="max-w-4xl mx-auto relative z-10">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs text-slate-400 mb-6">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              {breadcrumb.map((crumb) => (
                <React.Fragment key={crumb.href}>
                  <ChevronRight className="w-3 h-3" />
                  <Link href={crumb.href} className="hover:text-white transition-colors">
                    {crumb.label}
                  </Link>
                </React.Fragment>
              ))}
            </nav>

            <div className="inline-block mb-4 px-3 py-1 bg-yellow-400/20 text-yellow-300 rounded-full text-sm font-semibold">
              {badge}
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">{headline}</h1>
            <p className="text-xl text-slate-300 mb-3">{subheadline}</p>
            <p className="text-slate-400 mb-10 max-w-2xl">{intro}</p>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={GAS_INTAKE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-yellow-400 text-slate-900 font-bold px-8 py-4 rounded-xl hover:bg-yellow-300 hover:shadow-xl transition-all duration-200"
              >
                Get My Free Estimate
                <ChevronRight className="w-5 h-5" />
              </a>
              <a
                href={`tel:${HEA_PHONE.replace(/\s/g, "")}`}
                className="inline-flex items-center justify-center gap-2 border-2 border-slate-600 text-white font-semibold px-8 py-4 rounded-xl hover:border-white transition-colors"
              >
                Call {HEA_PHONE}
              </a>
            </div>

            <div className="mt-10">
              <TrustStrip dark />
            </div>
          </div>
        </section>

        {/* What's Included */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-6">What&apos;s Included</h2>
              <ul className="space-y-3">
                {included.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-slate-700">
                    <Check className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-6">Who It&apos;s For</h2>
              <ul className="space-y-3">
                {whoFor.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-slate-700">
                    <Check className="w-5 h-5 text-slate-300 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Process */}
        <section className="py-20 px-4 bg-slate-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 mb-10 text-center">The Process</h2>
            <div className="space-y-8">
              {process.map((p) => (
                <div key={p.step} className="flex gap-6 items-start">
                  <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center font-bold text-slate-900 flex-shrink-0">
                    {p.step}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">{p.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{p.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Note */}
        <section className="py-14 px-4 bg-white">
          <div className="max-w-3xl mx-auto bg-slate-50 rounded-2xl border border-slate-200 p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Pricing</h2>
            <p className="text-slate-600 leading-relaxed mb-6">{pricingNote}</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={GAS_INTAKE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-yellow-400 text-slate-900 font-bold px-6 py-3 rounded-xl hover:bg-yellow-300 transition-colors text-sm"
              >
                Get a personalised quote
              </a>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 border border-slate-200 text-slate-700 font-semibold px-6 py-3 rounded-xl hover:border-yellow-400 transition-colors text-sm"
              >
                See indicative pricing
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 px-4 bg-slate-50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 mb-10 text-center">Questions</h2>
            <div className="space-y-2">
              {faqs.map((faq, i) => (
                <ServiceFAQItem key={i} faq={faq} />
              ))}
            </div>
          </div>
        </section>

        {/* How HEA Compares */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 text-center">Comparison</p>
            <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">How HEA Compares</h2>
            <HEAComparison />
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-4 bg-slate-900 text-white text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-slate-400 mb-8">
              No obligation · 5-min form · We do the analysis before your call
            </p>
            <a
              href={GAS_INTAKE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-yellow-400 text-slate-900 font-bold px-10 py-4 rounded-xl text-lg hover:bg-yellow-300 hover:shadow-xl transition-all duration-200"
            >
              Get My Free Solar Estimate
              <ChevronRight className="w-5 h-5" />
            </a>
          </div>
        </section>
      </main>
      <Footer />
      <HEAAdvisor pageContext="default" />
    </>
  );
};

// Inline accordion for service page FAQs (client-side not needed — simple show/hide)
function ServiceFAQItem({ faq }: { faq: FAQ }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-slate-50 transition-colors"
      >
        <span className="font-semibold text-slate-900 pr-4">{faq.q}</span>
        <span className={`text-slate-400 text-lg leading-none transition-transform duration-200 ${open ? "rotate-45" : ""}`}>+</span>
      </button>
      {open && (
        <div className="px-6 pb-5 text-slate-600 text-sm leading-relaxed border-t border-slate-100">
          <div className="pt-4">{faq.a}</div>
        </div>
      )}
    </div>
  );
}

export default ServicePageLayout;
