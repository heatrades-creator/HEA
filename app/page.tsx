import type { Metadata } from "next";
import React from "react";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import SocialProofBar from "@/components/SocialProofBar";
import Services from "@/components/Services";
import WhyChooseUs from "@/components/WhyChooseUs";
import HowItWorks from "@/components/HowItWorks";
import PricingPreview from "@/components/PricingPreview";
import CaseStudies from "@/components/CaseStudies";
import LearningHub from "@/components/LearningHub";
import FAQAccordion from "@/components/FAQAccordion";
import Contact from "@/components/Contact";
import ModernContactForm from "@/components/Form";
import Footer from "@/components/Footer";
import { getSiteContent } from "@/lib/sanity";

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

      {/* General Enquiries (non-solar) */}
      <section id="general-enquiry" className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-sm font-bold tracking-widest uppercase text-slate-400 mb-2">
              General Enquiries
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
              Got other electrical needs?
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Not looking for solar? Send Jesse a message about EV chargers,
              general electrical, smart home, or anything else.
            </p>
          </div>
          <div className="flex justify-center">
            <ModernContactForm />
          </div>
        </div>
      </section>

      <Footer data={content?.footer} />
    </>
  );
}
