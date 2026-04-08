"use client";
import React, { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import Image from "next/image";

interface HeroData {
  tagline?: string;
  heading?: string;
  description?: string;
  ctaText?: string;
  secondaryCtaText?: string;
  stats?: Array<{ value: string; label: string }>;
}

interface HeroProps {
  data?: HeroData | null;
}

const Hero = ({ data }: HeroProps) => {
  // Default values
  const defaultData = {
    tagline: "Bendigo's Solar & Battery Specialists",
    heading: "The Right Solar System. Not the Biggest.",
    description:
      "We download your actual usage data from Powercor and design a system built around your life — with a payback period under 10 years, every time.",
    ctaText: "Book a Free Consultation",
    secondaryCtaText: "How It Works",
    stats: [
      { value: "< 10yr", label: "Target Payback Period" },
      { value: "NEM12", label: "Real Usage Analysis" },
      { value: "REC 37307", label: "Licensed & Insured" },
      { value: "Bendigo VIC", label: "Local Installer" },
    ],
  };

  const heroData = data || defaultData;

  // Determine which stats should animate vs be static
  const statsConfig = (heroData.stats || defaultData.stats).map((stat) => {
    // Check if the value contains "/" (like 24/7) - these should be static
    const isStatic = stat.value.includes("/") || !/^\d/.test(stat.value);
    const match = stat.value.match(/\d+/);
    const numericValue = match ? parseInt(match[0]) : 0;

    return {
      isStatic,
      targetValue: numericValue,
      originalValue: stat.value,
    };
  });

  const [counters, setCounters] = useState([0, 0, 0, 0]);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const duration = 3000; // 3 seconds
    const steps = 40;
    const interval = duration / steps;

    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      setCounters(
        statsConfig.map((config) =>
          config.isStatic ? 0 : Math.floor(config.targetValue * progress)
        )
      );

      if (currentStep >= steps) {
        setCounters(
          statsConfig.map((config) =>
            config.isStatic ? 0 : config.targetValue
          )
        );
        clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className={`relative pt-32 pb-20 px-4 overflow-hidden`}>
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-50/40 via-amber-50/75 to-slate-50/50"></div>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-400 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-heff rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>
      <Image
        src="https://images.pexels.com/photos/16423103/pexels-photo-16423103.jpeg"
        alt="background image"
        fill
        style={{ objectFit: "cover" }}
        className="absolute top-0 left-0 w-full h-full rounded-2xl opacity-10 group-hover:opacity-20 transition-opacity"
      />
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col justify-center text-center max-w-4xl mx-auto">
          <div className="inline-block mb-4 px-4 py-2 mx-auto bg-green-50 text-green-500 rounded-full text-sm font-semibold">
            ⚡ {heroData.tagline}
          </div>
          <div
            className="flex flex-col justify-center bg-gradient-to-b from-gray-600/15 to-white/30 backdrop-blur-[0.5px] border-3 border-white/40 shadow-lg
          rounded-[55px] px-4 py-8 my-4 mx-auto space-y-2 text-4xl md:text-7xl font-bold leading-tight items-center animate-breathe-subtle"
          >
            <h1 className=" text-black">{heroData.heading}</h1>
          </div>
          <p className="text-xl md:text-2xl text-black mb-8 mt-8 leading-relaxed">
            {heroData.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mx-auto ">
            <a
              href="https://script.google.com/macros/s/AKfycbyU_ACYess2XPKmBkuMAyZkNiMjym0B4hqCOmkugDxbUs0B8hZoRXraPornmOiR9Kg/exec"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-heff px-8 py-4 font-semibold hover:shadow-xl
                transition-all ease-in-out duration-200 flex items-center justify-center group rounded-2xl text-lg md:px-4
                border-2 border-transparent hover:border-black/75 hover:scale-105 hover:-translate-y-1 text-black cursor-pointer"
            >
              {heroData.ctaText}
              <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-4xl mx-auto">
          {(heroData.stats || defaultData.stats).map((stat, idx) => {
            const config = statsConfig[idx];
            const displayValue = config.isStatic
              ? stat.value // Show static value as-is (e.g., "24/7")
              : `${counters[idx]}${stat.value.replace(/\d+/g, "")}`; // Show counter with suffix

            return (
              <div
                key={idx}
                className="flex justify-center items-center flex-col bg-white p-6 rounded-xl shadow-lg text-center transform hover:scale-105 transition-transform"
              >
                <div className="text-3xl font-bold text-black mb-2">
                  {displayValue}
                </div>
                <div className="text-sm text-slate-600">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Hero;
