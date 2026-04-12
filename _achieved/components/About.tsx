"use client";
import React from "react";
import { Check } from "lucide-react";
import Image from "next/image";

interface AboutData {
  heading?: string;
  paragraph1?: string;
  paragraph2?: string;
  paragraph3?: string;
  certifications?: string[];
}

interface AboutProps {
  data?: AboutData | null;
}

const About = ({ data }: AboutProps) => {
  const defaultData = {
    heading: "Bendigo's Solar Specialists",
    paragraph1:
      "Heffernan Electrical Automation is Jesse and Alexis Heffernan — a licensed electrical contracting team based in Bendigo, Victoria. We specialise exclusively in solar and battery design and installation.",
    paragraph2:
      "Before we design anything, we download your actual electricity consumption data directly from Powercor. That means every system we quote is sized for how your household actually uses energy — not a rough estimate. Our goal on every job is a payback period under 10 years.",
    paragraph3:
      "We're direct installers. No salespeople, no subcontractors, no middlemen. You deal with Jesse from your first consultation through to handover.",
    certifications: ["REC 37307", "Fully Insured", "Bendigo VIC"],
  };

  const aboutData = data || defaultData;
  return (
    <section id="about" className="relative py-20 px-4 bg-white z-5">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              {aboutData.heading}
            </h2>
            <p className="text-lg text-slate-600 mb-4">
              {aboutData.paragraph1}
            </p>
            <p className="text-lg text-slate-600 mb-4">
              {aboutData.paragraph2}
            </p>
            <p className="text-lg text-slate-600 mb-6">
              {aboutData.paragraph3}
            </p>
            <div className="flex flex-wrap gap-4">
              {(aboutData.certifications || defaultData.certifications).map((cert, idx) => (
                <div key={idx} className="flex items-center space-x-2 bg-yellow-50 px-4 py-2 rounded-full border border-yellow-200">
                  <Check className="w-5 h-5 text-yellow-600" />
                  <span className="text-slate-700 font-semibold">
                    {cert}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-lg">
            <Image
              src="https://images.pexels.com/photos/18186205/pexels-photo-18186205.jpeg"
              alt="Heffernan Electrical"
              fill
              style={{ objectFit: "cover" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
