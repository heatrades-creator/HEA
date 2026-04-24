"use client";
import React, { useState } from "react";
import { ChevronRight, ArrowLeft, Battery, Zap, Sun } from "lucide-react";
import { INTAKE_URL_BATTERY } from "@/lib/constants";

// ─── Types ────────────────────────────────────────────────────────────────────

type UsagePattern = "evenings" | "daytime" | "mixed";
type BackupImportance = "critical" | "nice" | "not_important";
type SolarStatus = "has_solar" | "getting_solar" | "no_solar";
type EVStatus = "yes" | "no";
type Verdict = "YES" | "MAYBE" | "NOT_YET";

interface Answers {
  usage: UsagePattern | null;
  backup: BackupImportance | null;
  solar: SolarStatus | null;
  ev: EVStatus | null;
}

// ─── Scoring engine ───────────────────────────────────────────────────────────

function computeVerdict(a: Answers): { verdict: Verdict; rationale: string; financialNote: string; recommendedKwh: string } {
  let score = 0;
  if (a.usage === "evenings") score += 2;
  if (a.usage === "mixed") score += 1;
  if (a.backup === "critical") score += 3;
  if (a.backup === "nice") score += 1;
  if (a.solar === "has_solar") score += 2;
  if (a.solar === "getting_solar") score += 1;
  if (a.ev === "yes") score += 1;

  if (score >= 5) {
    const rationale =
      a.backup === "critical"
        ? "Backup power is your priority — a hybrid battery system covers both protection and savings."
        : a.solar === "has_solar"
        ? "You're already generating solar but exporting it. A battery captures that and covers your evenings."
        : "Your usage pattern and goals line up strongly with battery payback.";
    return {
      verdict: "YES",
      rationale,
      financialNote: "Typical addition to savings: $800–$1,500/yr. Most setups add 2–4 years to total payback.",
      recommendedKwh: a.ev === "yes" ? "13–15 kWh" : "10–13 kWh",
    };
  }

  if (score >= 3) {
    const rationale =
      a.solar === "getting_solar"
        ? "Once your solar is live, adding a battery often makes sense — worth modelling at quote time."
        : a.usage === "mixed"
        ? "Mixed usage means some battery benefit, but the payback depends heavily on your tariff structure."
        : "There's a case for a battery here, but it hinges on your feed-in vs usage rates.";
    return {
      verdict: "MAYBE",
      rationale,
      financialNote: "Payback varies significantly by tariff. We'll model it with your actual data at quote time.",
      recommendedKwh: "10 kWh (starter size)",
    };
  }

  return {
    verdict: "NOT_YET",
    rationale:
      a.solar === "no_solar"
        ? "Get solar installed first — the battery's job is to store solar you'd otherwise export, so it needs solar to make sense financially."
        : "Your daytime-heavy usage and low backup priority mean a battery is unlikely to pay back in a reasonable timeframe right now.",
    financialNote: "Adding a battery before solar (or with mostly daytime usage) typically stretches payback past 12 years.",
    recommendedKwh: "N/A — revisit after solar installation",
  };
}

// ─── Step option button ───────────────────────────────────────────────────────

function OptionBtn({ label, sublabel, onClick, selected }: { label: string; sublabel?: string; onClick: () => void; selected: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-yellow-400
        ${selected
          ? "border-yellow-400 bg-yellow-50"
          : "border-slate-200 hover:border-yellow-300 hover:bg-yellow-50/40"
        }`}
    >
      <span className="font-semibold text-slate-900 text-sm">{label}</span>
      {sublabel && <span className="block text-xs text-slate-500 mt-0.5">{sublabel}</span>}
    </button>
  );
}

// ─── Verdict badge ────────────────────────────────────────────────────────────

const VERDICT_CONFIG = {
  YES: { bg: "bg-emerald-50", border: "border-emerald-300", badge: "bg-emerald-500", text: "Battery is a strong fit" },
  MAYBE: { bg: "bg-yellow-50", border: "border-yellow-300", badge: "bg-yellow-400", text: "Worth modelling" },
  NOT_YET: { bg: "bg-slate-50", border: "border-slate-300", badge: "bg-slate-500", text: "Not yet — add solar first" },
};

// ─── Steps config ─────────────────────────────────────────────────────────────

const STEPS = [
  { label: "When do you mainly use power at home?", icon: <Zap className="w-5 h-5" /> },
  { label: "How important is backup power to you?", icon: <Battery className="w-5 h-5" /> },
  { label: "Do you have solar, or are you getting it?", icon: <Sun className="w-5 h-5" /> },
  { label: "Do you have an EV or plan to get one?", icon: <ChevronRight className="w-5 h-5" /> },
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function BatteryDecisionEngine() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({ usage: null, backup: null, solar: null, ev: null });
  const [done, setDone] = useState(false);

  const totalSteps = STEPS.length;

  const answer = <K extends keyof Answers>(key: K, value: Answers[K]) => {
    const next = { ...answers, [key]: value };
    setAnswers(next);
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      setDone(true);
    }
  };

  const back = () => {
    if (done) { setDone(false); return; }
    if (step > 0) setStep(step - 1);
  };

  const reset = () => {
    setStep(0);
    setAnswers({ usage: null, backup: null, solar: null, ev: null });
    setDone(false);
  };

  const result = done ? computeVerdict(answers) : null;
  const cfg = result ? VERDICT_CONFIG[result.verdict] : null;

  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 px-6 py-5">
        <p className="text-xs font-bold uppercase tracking-widest text-yellow-400 mb-1">Decision Tool</p>
        <h2 className="text-xl font-bold text-white">Should I Get a Battery?</h2>
        <p className="text-slate-400 text-sm mt-1">
          Answer 4 quick questions — get a straight yes, maybe, or not yet.
        </p>
      </div>

      <div className="p-6">
        {/* Progress bar */}
        {!done && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Question {step + 1} of {totalSteps}</span>
              {step > 0 && (
                <button onClick={back} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors">
                  <ArrowLeft className="w-3 h-3" /> Back
                </button>
              )}
            </div>
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-400 rounded-full transition-all duration-300"
                style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Step 1 — Usage pattern */}
        {!done && step === 0 && (
          <div className="space-y-3">
            <p className="font-bold text-slate-900 mb-4">{STEPS[0].label}</p>
            <OptionBtn label="Evenings and overnight" sublabel="Home in the evenings, cooking, watching TV, overnight loads" onClick={() => answer("usage", "evenings")} selected={answers.usage === "evenings"} />
            <OptionBtn label="During the day" sublabel="Home during daylight hours — retired, WFH, stay-at-home" onClick={() => answer("usage", "daytime")} selected={answers.usage === "daytime"} />
            <OptionBtn label="Mixed — all day and night" sublabel="High usage morning to night" onClick={() => answer("usage", "mixed")} selected={answers.usage === "mixed"} />
          </div>
        )}

        {/* Step 2 — Backup */}
        {!done && step === 1 && (
          <div className="space-y-3">
            <p className="font-bold text-slate-900 mb-4">{STEPS[1].label}</p>
            <OptionBtn label="Critical — I need backup power" sublabel="Medical equipment, frequent outages, rural area" onClick={() => answer("backup", "critical")} selected={answers.backup === "critical"} />
            <OptionBtn label="Nice to have" sublabel="Power outages are inconvenient but not dangerous" onClick={() => answer("backup", "nice")} selected={answers.backup === "nice"} />
            <OptionBtn label="Not important to me" sublabel="I mainly care about the financial return" onClick={() => answer("backup", "not_important")} selected={answers.backup === "not_important"} />
          </div>
        )}

        {/* Step 3 — Solar status */}
        {!done && step === 2 && (
          <div className="space-y-3">
            <p className="font-bold text-slate-900 mb-4">{STEPS[2].label}</p>
            <OptionBtn label="Yes — solar already installed" sublabel="I export excess to the grid" onClick={() => answer("solar", "has_solar")} selected={answers.solar === "has_solar"} />
            <OptionBtn label="Getting solar very soon" sublabel="Quote accepted or install booked" onClick={() => answer("solar", "getting_solar")} selected={answers.solar === "getting_solar"} />
            <OptionBtn label="No solar yet" sublabel="Still considering or haven't started" onClick={() => answer("solar", "no_solar")} selected={answers.solar === "no_solar"} />
          </div>
        )}

        {/* Step 4 — EV */}
        {!done && step === 3 && (
          <div className="space-y-3">
            <p className="font-bold text-slate-900 mb-4">{STEPS[3].label}</p>
            <OptionBtn label="Yes — I own or am getting an EV" sublabel="Overnight charging from battery means big fuel savings" onClick={() => answer("ev", "yes")} selected={answers.ev === "yes"} />
            <OptionBtn label="No EV, not planning one" sublabel="Straight savings focus" onClick={() => answer("ev", "no")} selected={answers.ev === "no"} />
          </div>
        )}

        {/* Verdict */}
        {done && result && cfg && (
          <div>
            <div className={`rounded-xl border-2 ${cfg.border} ${cfg.bg} p-5 mb-5`}>
              <div className="flex items-start gap-4">
                <div className={`${cfg.badge} text-white text-sm font-bold px-3 py-1 rounded-lg flex-shrink-0 mt-0.5`}>
                  {result.verdict === "NOT_YET" ? "NOT YET" : result.verdict}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-base mb-1">{cfg.text}</p>
                  <p className="text-slate-600 text-sm leading-relaxed">{result.rationale}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-xs text-slate-400 mb-1">Recommended Size</p>
                <p className="font-bold text-slate-900 text-sm">{result.recommendedKwh}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-xs text-slate-400 mb-1">Financial Impact</p>
                <p className="font-bold text-slate-900 text-sm leading-tight">{result.financialNote.split(".")[0]}.</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 italic mb-5">
              Based on real Powercor NEM12 usage data at quote time — this is indicative only.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={INTAKE_URL_BATTERY}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-yellow-400 text-slate-900 font-bold px-5 py-3 rounded-xl hover:bg-yellow-300 hover:shadow-lg transition-all duration-200 text-sm"
              >
                Get My Battery Quote
                <ChevronRight className="w-4 h-4" />
              </a>
              <button
                onClick={reset}
                className="flex-1 border-2 border-slate-200 text-slate-600 font-semibold px-5 py-3 rounded-xl hover:border-slate-300 transition-colors text-sm"
              >
                Start Over
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
