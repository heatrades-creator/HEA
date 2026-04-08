import React from "react";
import { MapPin, ChevronRight, Zap, Battery } from "lucide-react";
import { GAS_INTAKE_URL } from "@/lib/constants";

// TODO_REAL_DATA: Jesse to provide 3 real jobs with: suburb, home type, goal,
// system chosen, and outcome. Until then, cards show "coming soon" state.
const CASE_STUDIES: {
  location: string;
  homeType: string;
  goal: string;
  system: string;
  outcome: string;
  ready: boolean;
}[] = [
  {
    location: "Golden Square",
    homeType: "4-bed family home",
    goal: "Reduce $3,800/yr electricity bill",
    system: "10 kW solar + 10 kWh battery",
    outcome: "TODO_REAL_DATA: estimated annual bill reduction",
    ready: false,
  },
  {
    location: "Strathdale",
    homeType: "3-bed home + EV",
    goal: "Charge EV from roof + cut grid reliance",
    system: "13.2 kW solar + EV charger",
    outcome: "TODO_REAL_DATA: estimated annual savings",
    ready: false,
  },
  {
    location: "Kangaroo Flat",
    homeType: "Older home, high usage",
    goal: "Backup power + bill savings",
    system: "6.6 kW solar + 10 kWh battery",
    outcome: "TODO_REAL_DATA: estimated outcome",
    ready: false,
  },
];

const CaseStudies = () => {
  const hasRealData = CASE_STUDIES.some((c) => c.ready);

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-sm font-bold tracking-widest uppercase text-yellow-500 mb-2">
            Real Installations
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Recent Bendigo Jobs
          </h2>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            Every system is designed from real usage data — here&apos;s how that looks
            in practice.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {CASE_STUDIES.map((cs, idx) => (
            <div
              key={idx}
              className="border border-slate-200 rounded-2xl overflow-hidden group hover:shadow-lg transition-shadow"
            >
              {/* Image placeholder — TODO_REAL_DATA: add real install photo */}
              <div className="h-48 bg-slate-100 flex items-center justify-center relative">
                <div className="flex gap-3 text-slate-300">
                  <Zap className="w-10 h-10" />
                  <Battery className="w-10 h-10" />
                </div>
                {!cs.ready && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider border border-slate-200 rounded-full px-3 py-1">
                      Photos coming soon
                    </span>
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium mb-3">
                  <MapPin className="w-3.5 h-3.5" />
                  {cs.location}, Bendigo · {cs.homeType}
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-1">
                  Goal: {cs.goal}
                </h3>
                <p className="text-sm text-slate-500 mb-2">
                  Solution: {cs.system}
                </p>

                {cs.ready ? (
                  <p className="text-sm text-green-700 font-medium">{cs.outcome}</p>
                ) : (
                  <p className="text-xs text-slate-300 italic">
                    Case study detail coming soon
                  </p>
                )}

                <a
                  href={GAS_INTAKE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-yellow-600 hover:text-yellow-700 transition-colors"
                >
                  Request a similar design
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CaseStudies;
