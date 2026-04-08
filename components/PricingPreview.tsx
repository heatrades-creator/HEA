import React from "react";
import Link from "next/link";
import { ChevronRight, Check } from "lucide-react";
import { GAS_INTAKE_URL } from "@/lib/constants";

// TODO_REAL_DATA: Jesse must confirm "from" price ranges before going live.
// These are structural placeholders only.
const PACKAGES = [
  {
    name: "Solar Starter",
    tagline: "Minimise your bill",
    specs: "6.6 kW solar · grid-connect",
    fromPrice: "TODO_REAL_DATA",
    features: [
      "6.6 kW panel array",
      "5 kW hybrid inverter",
      "Grid-connect & metering",
      "Monitoring app setup",
      "NEM12 usage analysis",
    ],
    highlight: false,
  },
  {
    name: "Solar + Battery",
    tagline: "Replace your bill",
    specs: "10 kW solar · 10 kWh battery",
    fromPrice: "TODO_REAL_DATA",
    features: [
      "10 kW panel array",
      "Battery storage system",
      "Backup power capability",
      "VPP-ready",
      "Full usage analysis",
    ],
    highlight: true,
  },
  {
    name: "Full System",
    tagline: "Build an energy asset",
    specs: "13.2 kW solar · 13.5 kWh+ battery",
    fromPrice: "TODO_REAL_DATA",
    features: [
      "Maximum panel array",
      "Large battery system",
      "EV-charger ready",
      "Premium monitoring",
      "Full usage analysis",
    ],
    highlight: false,
  },
];

const PricingPreview = () => {
  return (
    <section className="py-20 px-4 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-sm font-bold tracking-widest uppercase text-yellow-500 mb-2">
            Pricing
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            What Does Solar Cost in Bendigo?
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Indicative pricing for standard Bendigo installs. Every system is
            sized from your actual usage data — so your quote may vary.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-10">
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.name}
              className={`rounded-2xl border-2 p-8 flex flex-col ${
                pkg.highlight
                  ? "border-yellow-400 bg-white shadow-xl shadow-yellow-50 relative"
                  : "border-slate-200 bg-white"
              }`}
            >
              {pkg.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-yellow-400 text-slate-900 text-xs font-bold px-4 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
                  {pkg.tagline}
                </p>
                <h3 className="text-2xl font-bold text-slate-900 mb-1">{pkg.name}</h3>
                <p className="text-sm text-slate-500">{pkg.specs}</p>
              </div>

              <div className="mb-6">
                <p className="text-sm text-slate-400 mb-0.5">From</p>
                {pkg.fromPrice === "TODO_REAL_DATA" ? (
                  <p className="text-2xl font-bold text-slate-400 italic">
                    Price on request
                  </p>
                ) : (
                  <p className="text-3xl font-bold text-slate-900">${pkg.fromPrice}</p>
                )}
              </div>

              <ul className="space-y-2.5 mb-8 flex-1">
                {pkg.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                    <Check className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href={GAS_INTAKE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full text-center py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  pkg.highlight
                    ? "bg-yellow-400 text-slate-900 hover:bg-yellow-300 hover:shadow-lg"
                    : "border-2 border-slate-200 text-slate-700 hover:border-yellow-400 hover:text-slate-900"
                }`}
              >
                Get a Quote for This System
              </a>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-slate-400 mb-8 max-w-2xl mx-auto">
          Indicative pricing for standard installs. Final price depends on
          switchboard condition, roof type and access, shading, and system
          complexity. STC rebates applied where applicable.
        </p>

        <div className="text-center">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-yellow-600 transition-colors"
          >
            See full pricing breakdown <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PricingPreview;
