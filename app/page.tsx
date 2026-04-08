import React from "react";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import WhyChooseUs from "@/components/WhyChooseUs";
import About from "@/components/About";
import GoogleReviews from "@/components/GoogleReviews";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import ModernContactForm from "@/components/Form";
import { getSiteContent } from "@/lib/sanity";

export const revalidate = 60; // Revalidate every 60 seconds

export default async function Home() {
  // Fetch content from Google Sheets
  const content = await getSiteContent();

  return (
    <>
      <Nav />
      <Hero data={content?.hero} />
      <Services data={content?.services} />
      <WhyChooseUs data={content?.whyChooseUs} />
      <GoogleReviews />
      <About data={content?.about} />
      <Contact />
      <section id="general-enquiry" className="py-20 px-4 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-sm font-bold tracking-widest uppercase text-slate-400 mb-2">General Enquiries</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">Got other electrical needs?</h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Not looking for solar? Send Jesse a message about EV chargers, general electrical, smart home, or anything else.
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
