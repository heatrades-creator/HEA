import type { Metadata } from "next";
import React from "react";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import SocialProofBar from "@/components/SocialProofBar";
import HEARoutingBar from "@/components/HEARoutingBar";
import HEAAdvisor from "@/components/HEAAdvisor";
import Services from "@/components/Services";
import WhyChooseUs from "@/components/WhyChooseUs";
import HowItWorks from "@/components/HowItWorks";
import PricingPreview from "@/components/PricingPreview";
import CaseStudies from "@/components/CaseStudies";
import LearningHub from "@/components/LearningHub";
import FAQAccordion from "@/components/FAQAccordion";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import { getSiteContent } from "@/lib/sanity";
import { GAS_INTAKE_URL } from "@/lib/constants";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "HEA | Bendigo Solar & Battery Specialists",
  description:
    "Bendigo's direct solar and battery installers. We design right-sized systems from your actual Powercor NEM12 usage data — targeting payback under 10 years, every time. REC 37307.",
  alternates: { canonical: "https://hea-group.com.au" },
};

export default async function Home() {
  const content = await getSiteContent();

  return (
    <>
      <Nav />

      {/* 1. Hero */}
      <Hero data={content?.hero} />

      {/* 2. Social Proof */}
      <SocialProofBar />

      {/* 2b. Routing — "What are you here for?" */}
      <HEARoutingBar />

      {/* 3. Why HEA */}
      <WhyChooseUs data={content?.whyChooseUs} />

      {/* 4. Services */}
      <Services data={content?.services?.length ? content.services : null} />

      {/* 5. How It Works */}
      <HowItWorks />

      {/* 6. Pricing Preview */}
      <PricingPreview packages={content?.pricingPackages} />

      {/* 7. Case Studies */}
      <CaseStudies caseStudies={content?.caseStudies} />

      {/* 8. Learning Hub */}
      <LearningHub articles={content?.articles} />

      {/* 9. FAQ */}
      <FAQAccordion limit={6} faqItems={content?.faqItems} />

      {/* 10. Final CTA */}
      <Contact />

      {/* General Enquiries */}
      <section id="general-enquiry" className="py-20 px-4 bg-white">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-sm font-bold tracking-widest uppercase text-slate-400 mb-2">
            General Enquiries
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            Got other electrical needs?
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto mb-8">
            EV chargers, general electrical, smart home, or anything else — use our enquiry form and Jesse will be in touch.
          </p>
          <a
            href={GAS_INTAKE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-yellow-400 text-slate-900 font-bold px-10 py-4 rounded-xl text-lg hover:bg-yellow-300 hover:shadow-xl transition-all duration-200"
          >
            Open Enquiry Form
          </a>
          <p className="text-slate-400 text-sm mt-4">No obligation · opens in a new tab</p>
        </div>
      </section>

      <Footer data={content?.footer} />

      {/* Interactive advisor widget — lazy loaded, triggers after 8s or 30% scroll */}
      <HEAAdvisor pageContext="homepage" />
    </>
  );
}
