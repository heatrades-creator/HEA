import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

const STEPS = [
  {
    number: "01",
    title: "Upload your bill or we pull the data",
    body: "Send us your electricity bill, or we request your actual NEM12 interval data directly from Powercor. This is 12 months of real half-hourly consumption — not an estimate.",
  },
  {
    number: "02",
    title: "We analyse your real usage",
    body: "We model your household against actual solar generation data for Bendigo. We can see exactly when you use power and design your system around your real patterns.",
  },
  {
    number: "03",
    title: "Right-sized system, real payback numbers",
    body: "We propose the system that hits your goal — usually payback under 10 years. You see the projected savings, generation, and payback before you commit to anything.",
  },
  {
    number: "04",
    title: "Jesse installs and hands over",
    body: "No subcontractors. Jesse handles the physical installation from switchboard to panels to grid connection. He walks you through everything at handover.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-sm font-bold tracking-widest uppercase text-yellow-500 mb-2">
            The Process
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            How It Works
          </h2>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            Four steps from first contact to a solar system designed around your
            home — not a generic template.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line — desktop only */}
          <div className="hidden lg:block absolute top-9 left-0 right-0 h-px bg-slate-100 z-0 mx-24" />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 relative z-10">
            {STEPS.map((step) => (
              <div key={step.number} className="flex flex-col items-start lg:items-center text-left lg:text-center">
                {/* Number bubble */}
                <div className="w-16 h-16 rounded-2xl bg-yellow-400 flex items-center justify-center font-bold text-xl text-slate-900 mb-5 shadow-sm flex-shrink-0">
                  {step.number}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-12">
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-yellow-600 transition-colors"
          >
            See the full process <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
