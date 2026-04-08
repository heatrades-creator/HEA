"use client";
import React, { useEffect, useRef, useState } from "react";
import { Sun, Zap, CarFront, Check, BatteryCharging, Package, LucideIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Service {
  title: string;
  description: string;
  icon?: string;
  bgImage?: string;
  features: string[];
  href?: string;
}

interface ServicesProps {
  data?: Service[] | null;
}

const iconMap: Record<string, LucideIcon> = {
  Sun,
  Zap,
  CarFront,
  BatteryCharging,
  Package,
};

const defaultServices: Service[] = [
  {
    icon: "Sun",
    title: "Solar Design & Installation",
    description:
      "We analyse your actual electricity consumption — not estimates — to size a system that maximises your savings without blowing your payback period.",
    features: ["NEM12 Data Analysis", "Custom System Sizing", "Professional Installation", "Grid Connection", "Monitoring Setup"],
    bgImage: "https://images.pexels.com/photos/9875423/pexels-photo-9875423.jpeg",
    href: "/solar-installation-bendigo",
  },
  {
    icon: "BatteryCharging",
    title: "Battery Storage",
    description:
      "Add a battery and keep the lights on when the grid goes down — sized to your overnight usage, not oversized to inflate the sale.",
    features: ["Backup Power", "Optimised Sizing", "Compatible with Any Solar", "VPP Ready", "Smart Scheduling"],
    bgImage: "https://images.pexels.com/photos/16423103/pexels-photo-16423103.jpeg",
    href: "/battery-storage-bendigo",
  },
  {
    icon: "CarFront",
    title: "EV Charging",
    description:
      "Charge your EV from your own roof. We integrate EV charging into your solar design from day one so your system is built for how you actually live.",
    features: ["Solar-Integrated Charging", "Load Balancing", "Home EV Charging", "Smart Scheduling"],
    bgImage: "https://images.pexels.com/photos/9800009/pexels-photo-9800009.jpeg",
    href: "/ev-charger-installation-bendigo",
  },
  {
    icon: "Package",
    title: "Solar + Battery Packages",
    description:
      "A solar and battery system designed together from the start delivers better performance and shorter payback than bolting a battery on later.",
    features: ["Combined System Design", "Optimised Together", "Single Installation", "Better Payback"],
    bgImage: "https://images.pexels.com/photos/9875423/pexels-photo-9875423.jpeg",
    href: "/solar-battery-packages",
  },
];

const Services = ({ data }: ServicesProps) => {
  const services = data
    ? data.map((s, i) => ({ ...s, href: defaultServices[i]?.href }))
    : defaultServices;

  const [visibleCards, setVisibleCards] = useState<number[]>([]);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observers = cardRefs.current.map((ref, index) => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setVisibleCards((prev) => [...new Set([...prev, index])]);
            }
          });
        },
        { threshold: 0.15 }
      );
      if (ref instanceof Element) observer.observe(ref);
      return observer;
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <section id="services" className="py-20 px-4 md:px-8 bg-white">
      <div className="max-w-8xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-sm font-bold tracking-widest uppercase text-yellow-500 mb-2">What We Install</p>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">Solar & Battery Solutions</h2>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto">
            Sized around your actual usage — nothing more, nothing less.
          </p>
        </div>

        <div className="grid md:grid-cols-2 2xl:grid-cols-4 gap-8">
          {services.map((service, idx) => (
            <div
              key={idx}
              ref={(el) => { cardRefs.current[idx] = el; }}
              className={`flex flex-col bg-white rounded-2xl hover:shadow-xl hover:-translate-y-2 transition-all duration-500 group border border-slate-200 overflow-hidden ${
                visibleCards.includes(idx) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-16"
              }`}
              style={{ transitionDelay: `${idx * 80}ms` }}
            >
              <div className="w-full h-52 relative overflow-hidden">
                <Image
                  src={service.bgImage || "https://images.pexels.com/photos/16423103/pexels-photo-16423103.jpeg"}
                  alt={service.title}
                  style={{ objectFit: "cover" }}
                  fill
                />
              </div>
              <div className="relative z-10 p-7 flex flex-col flex-1">
                <div className="absolute -top-5 bg-gradient-to-br from-yellow-500 to-yellow-400 text-slate-900 p-3 rounded-xl inline-block group-hover:scale-110 transition-transform shadow-sm">
                  {(() => {
                    const Icon = iconMap[service.icon || "Zap"];
                    return Icon ? <Icon className="w-6 h-6" /> : <Zap className="w-6 h-6" />;
                  })()}
                </div>
                <h3 className="pt-6 text-xl font-bold text-slate-900 mb-2">{service.title}</h3>
                <p className="text-slate-500 text-sm mb-5 leading-relaxed flex-1">{service.description}</p>
                <ul className="space-y-1.5 mb-6">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-center text-slate-600 text-sm">
                      <Check className="w-4 h-4 text-yellow-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                {service.href && (
                  <Link
                    href={service.href}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-yellow-600 hover:text-yellow-700 transition-colors mt-auto"
                  >
                    Learn more →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
