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

// Icons mapped by position — shown regardless of CMS stat values
const STAT_ICONS = ["💰", "📅", "🏅", "🔨"];

const Hero = ({ data }: HeroProps) => {
  const defaultData = {
    tagline: "Bendigo's Solar & Battery Specialists",
    heading: "The Right Solar System. Not the Biggest.",
    description:
      "We download your actual usage data from Powercor and design a system built around your real consumption — with a payback period under 10 years, every time.",
    ctaText: "Get My Solar Estimate",
    secondaryCtaText: "Book Free Consultation",
    stats: [
      { value: "$1,800+", label: "Avg annual savings for Bendigo homes" },
      { value: "< 10yr", label: "Payback target — every system, every time" },
      { value: "REC 37307", label: "Licensed & fully insured in Victoria" },
      { value: "No middlemen", label: "Jesse & Alexis do your install" },
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
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 via-amber-50 to-slate-100" />

      {/* Subtle background image — solar panels */}
      <Image
        src="https://images.pexels.com/photos/16423103/pexels-photo-16423103.jpeg"
        alt="Solar panels installed on Bendigo home"
        fill
        style={{ objectFit: "cover", opacity: 0.07 }}
        priority
      />

      {/* Soft glow orbs */}
      <div className="absolute top-20 left-10 w-80 h-80 bg-yellow-300 rounded-full blur-3xl opacity-20 animate-pulse" />
      <div
        className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-400 rounded-full blur-3xl opacity-15 animate-pulse"
        style={{ animationDelay: "1.2s" }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col justify-center text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-block mb-5 px-4 py-2 mx-auto bg-yellow-400/20 border border-yellow-400/40 text-yellow-800 rounded-full text-sm font-semibold">
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
              href="#consultation"
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-4xl mx-auto">
          {(heroData.stats || defaultData.stats).map((stat, idx) => {
            const config = statsConfig[idx];
            const displayValue = config.isStatic
              ? stat.value
              : `${counters[idx]}${stat.value.replace(/\d+/g, "")}`;

            return (
              <div
                key={idx}
                className="relative flex flex-col items-center bg-white/90 backdrop-blur-sm border border-white/80 p-5 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center overflow-hidden group"
              >
                {/* Yellow top accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-t-2xl" />
                <div className="text-xl mb-2 mt-1">{STAT_ICONS[idx]}</div>
                <div className="text-2xl font-black text-slate-900 mb-1 leading-none">{displayValue}</div>
                <div className="text-xs text-slate-500 leading-snug">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Hero;
