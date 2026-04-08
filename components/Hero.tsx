"use client";
import React, { useState, useEffect } from "react";
import { ChevronRight, ShieldCheck, MapPin, UserCheck, Wrench } from "lucide-react";
import Image from "next/image";
import { GAS_INTAKE_URL } from "@/lib/constants";

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

const TRUST_BADGES = [
  { icon: ShieldCheck, label: "REC 37307 Licensed" },
  { icon: ShieldCheck, label: "Fully Insured" },
  { icon: MapPin, label: "Bendigo, VIC" },
  { icon: UserCheck, label: "No Salespeople" },
  { icon: Wrench, label: "Direct Installer" },
];

const Hero = ({ data }: HeroProps) => {
  const defaultData = {
    tagline: "Bendigo's Solar & Battery Specialists",
    heading: "The Right Solar System. Not the Biggest.",
    description:
      "We download your actual usage data from Powercor and design a system built around your real consumption — with a payback period under 10 years, every time.",
    ctaText: "Get My Solar Estimate",
    secondaryCtaText: "Book Free Consultation",
    stats: [
      { value: "< 10yr", label: "Target Payback" },
      { value: "NEM12", label: "Real Usage Analysis" },
      { value: "REC 37307", label: "Licensed & Insured" },
      { value: "Bendigo VIC", label: "Local Installer" },
    ],
  };

  const heroData = data || defaultData;

  const statsConfig = (heroData.stats || defaultData.stats).map((stat) => {
    const isStatic = stat.value.includes("/") || !/^\d/.test(stat.value);
    const match = stat.value.match(/\d+/);
    const numericValue = match ? parseInt(match[0]) : 0;
    return { isStatic, targetValue: numericValue, originalValue: stat.value };
  });

  const [counters, setCounters] = useState([0, 0, 0, 0]);

  useEffect(() => {
    const duration = 2500;
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
    <section className="relative pt-32 pb-24 px-4 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-50/40 via-amber-50/75 to-slate-50/50" />
      <div className="absolute inset-0 opacity-8">
        <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-400 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-500 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>
      <Image
        src="https://images.pexels.com/photos/16423103/pexels-photo-16423103.jpeg"
        alt="Solar panels installed on Bendigo home"
        fill
        style={{ objectFit: "cover" }}
        className="absolute top-0 left-0 w-full h-full opacity-8"
        priority
      />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col justify-center text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-block mb-5 px-4 py-2 mx-auto bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-full text-sm font-semibold">
            ⚡ {heroData.tagline}
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold leading-tight text-slate-900 mb-6">
            {heroData.heading}
          </h1>

          {/* Description */}
          <p className="text-xl md:text-2xl text-slate-600 mb-8 leading-relaxed max-w-2xl mx-auto">
            {heroData.description}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mx-auto mb-4">
            <a
              href={GAS_INTAKE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-yellow-400 text-slate-900 px-8 py-4 font-bold text-lg rounded-xl
                hover:bg-yellow-300 hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
            >
              {heroData.ctaText}
              <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href={GAS_INTAKE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-slate-900 border-2 border-slate-200 px-8 py-4 rounded-xl text-lg font-semibold
                hover:border-yellow-400 hover:shadow-lg transition-all duration-200 flex items-center justify-center"
            >
              {heroData.secondaryCtaText}
            </a>
          </div>

          {/* Microcopy */}
          <p className="text-sm text-slate-400 mb-10">
            5 min form · no obligation · real bill analysis
          </p>

          {/* Trust Strip */}
          <div className="flex flex-wrap justify-center items-center gap-x-5 gap-y-2">
            {TRUST_BADGES.map((badge, i) => (
              <React.Fragment key={badge.label}>
                <span className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
                  <badge.icon className="w-4 h-4 text-yellow-500" />
                  {badge.label}
                </span>
                {i < TRUST_BADGES.length - 1 && (
                  <span className="hidden sm:block w-px h-4 bg-slate-200" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-20 max-w-4xl mx-auto">
          {(heroData.stats || defaultData.stats).map((stat, idx) => {
            const config = statsConfig[idx];
            const displayValue = config.isStatic
              ? stat.value
              : `${counters[idx]}${stat.value.replace(/\d+/g, "")}`;

            return (
              <div
                key={idx}
                className="flex justify-center items-center flex-col bg-white/80 backdrop-blur-sm border border-white/60 p-6 rounded-2xl shadow-sm text-center hover:shadow-md transition-shadow"
              >
                <div className="text-3xl font-bold text-slate-900 mb-1">{displayValue}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Hero;
