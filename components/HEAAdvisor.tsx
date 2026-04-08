"use client";
import React, { useState, useEffect, useCallback } from "react";
import { X, Zap, ChevronRight, ArrowLeft } from "lucide-react";
import { GAS_INTAKE_URL } from "@/lib/constants";

// ─── Types ────────────────────────────────────────────────────────────────────

type Goal = "reduce_bills" | "backup_power" | "ev_charging" | "exploring";
type BillRange = "under_300" | "300_600" | "600_plus";
type BlackoutFreq = "rare" | "occasional" | "frequent";
type EvOwned = "yes" | "no";
type DailyKm = "under_30" | "30_80" | "80_plus";
type ExistingSolar = "yes" | "no";

type AdvisorState =
  | "idle"
  | "init"
  | "goal"
  | "bills_range"
  | "bills_solar"
  | "backup_freq"
  | "ev_owned"
  | "ev_km"
  | "output"
  | "ai_explain"
  | "lead_capture";

interface UserData {
  goal?: Goal;
  billRange?: BillRange;
  existingSolar?: ExistingSolar;
  blackoutFreq?: BlackoutFreq;
  evOwned?: EvOwned;
  dailyKm?: DailyKm;
}

interface Recommendation {
  system: string;
  battery: string;
  reasoning: string;
  outcome: string;
  learnUrl: string;
}

// ─── Page context mapping ──────────────────────────────────────────────────

type PageContext = "homepage" | "battery" | "solar" | "ev" | "pricing" | "default";

// ─── Deterministic recommendation engine ─────────────────────────────────────

function computeRecommendation(data: UserData): Recommendation {
  if (data.goal === "reduce_bills") {
    if (data.existingSolar === "yes") {
      return {
        system: "Battery Storage Add-On",
        battery: "10–13 kWh battery system recommended",
        reasoning:
          "You already have solar — the next step is a battery to store what you generate and use it overnight, reducing your grid dependency.",
        outcome: "Estimated annual savings increase of $800–$1,500 on top of existing solar.",
        learnUrl: "/learning-centre/battery-storage-guide",
      };
    }
    if (data.billRange === "600_plus") {
      return {
        system: "6.6–10 kW Solar System",
        battery: "Battery optional — strong ROI without it",
        reasoning:
          "Your high bill means a larger solar system will make the biggest dent. With your usage level, a right-sized system targets payback under 10 years.",
        outcome: "Estimated annual savings of $2,000–$3,500 depending on usage pattern.",
        learnUrl: "/learning-centre/solar-system-sizing",
      };
    }
    return {
      system: "5–6.6 kW Solar System",
      battery: "Battery add-on worth considering",
      reasoning:
        "A 5–6.6 kW system is well-matched to typical mid-range household consumption. HEA sizes using your actual Powercor NEM12 data — not guesswork.",
      outcome: "Estimated annual savings of $1,200–$2,000 depending on your usage pattern.",
      learnUrl: "/learning-centre/solar-system-sizing",
    };
  }

  if (data.goal === "backup_power") {
    const batteryNote =
      data.blackoutFreq === "frequent"
        ? "High-capacity hybrid system (10–15 kWh) recommended for reliable backup."
        : "10 kWh hybrid battery system provides full-night coverage for most homes.";
    return {
      system: "Hybrid Inverter + Battery Storage",
      battery: batteryNote,
      reasoning:
        "Backup power requires a hybrid inverter that can island from the grid. Battery capacity is sized to cover your critical loads through an outage.",
      outcome: "Full overnight backup capability. Protection from grid outages.",
      learnUrl: "/learning-centre/battery-storage-guide",
    };
  }

  if (data.goal === "ev_charging") {
    const solarNote =
      data.dailyKm === "80_plus"
        ? "Pair with 8–10 kW solar to offset most charging costs."
        : "Pair with 6.6 kW solar to significantly reduce charging costs.";
    return {
      system: "7 kW AC EV Charger (Level 2)",
      battery: solarNote,
      reasoning:
        "A 7 kW home charger is the standard for overnight charging — adds roughly 35–40 km of range per hour. Solar integration maximises savings.",
      outcome: "Charge a full EV overnight. Significant fuel cost savings when paired with solar.",
      learnUrl: "/ev-charger-installation-bendigo",
    };
  }

  // exploring
  return {
    system: "Solar + Battery Assessment",
    battery: "Depends on your usage and goals",
    reasoning:
      "Most Bendigo homeowners start with solar and add battery storage when the economics suit. HEA analyses your actual Powercor data before recommending anything.",
    outcome: "Typical 6.6 kW system: $1,500–$2,500 annual savings. Payback under 10 years.",
    learnUrl: "/learning-centre",
  };
}

function summariseInputs(data: UserData): string {
  const lines: string[] = [];
  if (data.goal) lines.push(`Goal: ${data.goal.replace(/_/g, " ")}`);
  if (data.billRange) lines.push(`Monthly bill: ${data.billRange.replace(/_/g, " ")}`);
  if (data.existingSolar) lines.push(`Existing solar: ${data.existingSolar}`);
  if (data.blackoutFreq) lines.push(`Blackout frequency: ${data.blackoutFreq}`);
  if (data.evOwned) lines.push(`EV owned: ${data.evOwned}`);
  if (data.dailyKm) lines.push(`Daily km: ${data.dailyKm.replace(/_/g, " ")}`);
  return lines.join(", ");
}

// ─── Storage keys ─────────────────────────────────────────────────────────────

const DISMISSED_KEY = "hea_advisor_dismissed";
const SESSION_KEY = "hea_advisor_session";

// ─── Option button ────────────────────────────────────────────────────────────

function OptionBtn({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-3 rounded-xl border-2 border-slate-200 text-slate-700 text-sm font-medium
        hover:border-yellow-400 hover:bg-yellow-50 hover:text-slate-900 transition-all duration-150 focus:outline-none focus:border-yellow-400"
    >
      {label}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface HEAAdvisorProps {
  pageContext?: PageContext;
}

export default function HEAAdvisor({ pageContext = "default" }: HEAAdvisorProps) {
  const [visible, setVisible] = useState(false);
  const [state, setState] = useState<AdvisorState>("idle");
  const [userData, setUserData] = useState<UserData>({});
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [leadValue, setLeadValue] = useState("");
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [history, setHistory] = useState<AdvisorState[]>([]);

  // Determine initial state based on page context
  const getInitialBranchState = useCallback((): AdvisorState => {
    switch (pageContext) {
      case "battery": return "backup_freq";
      case "ev": return "ev_owned";
      case "solar": return "bills_range";
      default: return "init";
    }
  }, [pageContext]);

  // Trigger logic
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      if (localStorage.getItem(DISMISSED_KEY) === "1") return;
    } catch {
      return;
    }

    let triggered = false;

    const trigger = () => {
      if (triggered) return;
      triggered = true;
      setVisible(true);

      // Restore session state if available
      try {
        const saved = sessionStorage.getItem(SESSION_KEY);
        if (saved) {
          const { state: savedState, userData: savedData } = JSON.parse(saved);
          if (savedState && savedState !== "idle") {
            setState(savedState);
            setUserData(savedData || {});
            if (savedState === "output") {
              setRecommendation(computeRecommendation(savedData || {}));
            }
            return;
          }
        }
      } catch { /* ignore */ }

      setState(getInitialBranchState());
    };

    // Timer: 8 seconds
    const timer = setTimeout(trigger, 8000);

    // Scroll: >30% of page height
    const handleScroll = () => {
      const scrolled = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      if (scrolled > 0.30) trigger();
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [getInitialBranchState]);

  // Persist session state
  useEffect(() => {
    if (state === "idle" || !visible) return;
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ state, userData }));
    } catch { /* ignore */ }
  }, [state, userData, visible]);

  const dismiss = () => {
    setVisible(false);
    try { localStorage.setItem(DISMISSED_KEY, "1"); } catch { /* ignore */ }
  };

  const push = (next: AdvisorState) => {
    setHistory((h) => [...h, state]);
    setState(next);
  };

  const back = () => {
    const prev = history[history.length - 1];
    if (prev) {
      setHistory((h) => h.slice(0, -1));
      setState(prev);
      setRecommendation(null);
      setAiExplanation(null);
    }
  };

  const selectGoal = (goal: Goal) => {
    const next: UserData = { ...userData, goal };
    setUserData(next);
    if (goal === "reduce_bills") push("bills_range");
    else if (goal === "backup_power") push("backup_freq");
    else if (goal === "ev_charging") push("ev_owned");
    else {
      // exploring → direct to output
      const rec = computeRecommendation(next);
      setRecommendation(rec);
      setHistory((h) => [...h, state]);
      setState("output");
    }
  };

  const selectBillRange = (billRange: BillRange) => {
    setUserData((d) => ({ ...d, billRange }));
    push("bills_solar");
  };

  const selectExistingSolar = (existingSolar: ExistingSolar) => {
    const next = { ...userData, existingSolar };
    setUserData(next);
    const rec = computeRecommendation(next);
    setRecommendation(rec);
    setHistory((h) => [...h, state]);
    setState("output");
  };

  const selectBlackoutFreq = (blackoutFreq: BlackoutFreq) => {
    const next: UserData = { ...userData, goal: userData.goal || "backup_power", blackoutFreq };
    setUserData(next);
    const rec = computeRecommendation(next);
    setRecommendation(rec);
    setHistory((h) => [...h, state]);
    setState("output");
  };

  const selectEvOwned = (evOwned: EvOwned) => {
    setUserData((d) => ({ ...d, evOwned }));
    push("ev_km");
  };

  const selectDailyKm = (dailyKm: DailyKm) => {
    const next: UserData = { ...userData, goal: userData.goal || "ev_charging", dailyKm };
    setUserData(next);
    const rec = computeRecommendation(next);
    setRecommendation(rec);
    setHistory((h) => [...h, state]);
    setState("output");
  };

  const explainWithAI = async () => {
    if (!recommendation) return;
    setAiLoading(true);
    setAiExplanation(null);
    push("ai_explain");
    try {
      const res = await fetch("/api/advisor/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userInputs: summariseInputs(userData),
          systemOutput: `${recommendation.system}. ${recommendation.reasoning}`,
        }),
      });
      const data = await res.json();
      setAiExplanation(data.explanation || null);
    } catch {
      setAiExplanation(null);
    }
    setAiLoading(false);
  };

  const submitLead = async () => {
    if (!leadValue.trim()) return;
    const isEmail = leadValue.includes("@");
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [isEmail ? "email" : "phone"]: leadValue.trim(),
          leadSource: "advisor_widget",
          notes: `Advisor recommendation: ${recommendation?.system}. Inputs: ${summariseInputs(userData)}`,
        }),
      });
    } catch { /* non-critical */ }
    setLeadSubmitted(true);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 w-[340px] max-w-[calc(100vw-2rem)]"
      role="dialog"
      aria-label="HEA System Advisor"
      aria-live="polite"
    >
      {/* Card */}
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        style={{ animation: "hea-slide-up 0.3s ease-out" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-yellow-400 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-slate-900" />
            </div>
            <span className="text-white text-sm font-semibold">HEA System Advisor</span>
          </div>
          <button
            onClick={dismiss}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
            aria-label="Dismiss advisor"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-4 space-y-3">

          {/* Back button */}
          {history.length > 0 && state !== "output" && state !== "ai_explain" && state !== "lead_capture" && (
            <button
              onClick={back}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" /> Back
            </button>
          )}

          {/* ── STATE: init ─────────────────────────────────── */}
          {state === "init" && (
            <>
              <p className="text-slate-800 text-sm font-semibold leading-snug">
                Not sure what system you need?
              </p>
              <p className="text-slate-500 text-xs">Answer 2–3 quick questions and get a tailored recommendation — no form required.</p>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => push("goal")}
                  className="flex-1 bg-yellow-400 text-slate-900 font-bold text-sm py-2.5 rounded-xl hover:bg-yellow-300 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  Start
                </button>
                <button
                  onClick={dismiss}
                  className="flex-1 border-2 border-slate-200 text-slate-600 font-semibold text-sm py-2.5 rounded-xl hover:border-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  Dismiss
                </button>
              </div>
            </>
          )}

          {/* ── STATE: goal ─────────────────────────────────── */}
          {state === "goal" && (
            <>
              <p className="text-slate-800 text-sm font-semibold">What&apos;s your main goal?</p>
              <div className="space-y-2">
                <OptionBtn label="Reduce my electricity bills" onClick={() => selectGoal("reduce_bills")} />
                <OptionBtn label="Backup power / blackout protection" onClick={() => selectGoal("backup_power")} />
                <OptionBtn label="EV charging at home" onClick={() => selectGoal("ev_charging")} />
                <OptionBtn label="Just exploring my options" onClick={() => selectGoal("exploring")} />
              </div>
            </>
          )}

          {/* ── STATE: bills_range ──────────────────────────── */}
          {state === "bills_range" && (
            <>
              <p className="text-slate-800 text-sm font-semibold">What&apos;s your monthly electricity bill roughly?</p>
              <div className="space-y-2">
                <OptionBtn label="Under $300 / month" onClick={() => selectBillRange("under_300")} />
                <OptionBtn label="$300 – $600 / month" onClick={() => selectBillRange("300_600")} />
                <OptionBtn label="Over $600 / month" onClick={() => selectBillRange("600_plus")} />
              </div>
            </>
          )}

          {/* ── STATE: bills_solar ──────────────────────────── */}
          {state === "bills_solar" && (
            <>
              <p className="text-slate-800 text-sm font-semibold">Do you already have solar panels?</p>
              <div className="space-y-2">
                <OptionBtn label="Yes, I have solar" onClick={() => selectExistingSolar("yes")} />
                <OptionBtn label="No solar yet" onClick={() => selectExistingSolar("no")} />
              </div>
            </>
          )}

          {/* ── STATE: backup_freq ──────────────────────────── */}
          {state === "backup_freq" && (
            <>
              <p className="text-slate-800 text-sm font-semibold">How often do you experience power outages?</p>
              <div className="space-y-2">
                <OptionBtn label="Rarely (once a year or less)" onClick={() => selectBlackoutFreq("rare")} />
                <OptionBtn label="Occasionally (a few times a year)" onClick={() => selectBlackoutFreq("occasional")} />
                <OptionBtn label="Frequently (multiple times a year)" onClick={() => selectBlackoutFreq("frequent")} />
              </div>
            </>
          )}

          {/* ── STATE: ev_owned ─────────────────────────────── */}
          {state === "ev_owned" && (
            <>
              <p className="text-slate-800 text-sm font-semibold">Do you already own an EV?</p>
              <div className="space-y-2">
                <OptionBtn label="Yes, I own one" onClick={() => selectEvOwned("yes")} />
                <OptionBtn label="No — but planning to get one" onClick={() => selectEvOwned("no")} />
              </div>
            </>
          )}

          {/* ── STATE: ev_km ────────────────────────────────── */}
          {state === "ev_km" && (
            <>
              <p className="text-slate-800 text-sm font-semibold">How far do you drive on a typical day?</p>
              <div className="space-y-2">
                <OptionBtn label="Under 30 km" onClick={() => selectDailyKm("under_30")} />
                <OptionBtn label="30 – 80 km" onClick={() => selectDailyKm("30_80")} />
                <OptionBtn label="Over 80 km" onClick={() => selectDailyKm("80_plus")} />
              </div>
            </>
          )}

          {/* ── STATE: output ───────────────────────────────── */}
          {state === "output" && recommendation && (
            <>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-yellow-700 mb-1">Recommended System</p>
                <p className="text-slate-900 font-bold text-sm leading-snug">{recommendation.system}</p>
                <p className="text-slate-500 text-xs mt-1">{recommendation.battery}</p>
              </div>
              <p className="text-slate-600 text-xs leading-relaxed">{recommendation.reasoning}</p>
              <p className="text-slate-400 text-xs italic">{recommendation.outcome}</p>

              <div className="space-y-2 pt-1">
                <a
                  href={GAS_INTAKE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-yellow-400 text-slate-900 font-bold text-sm py-3 rounded-xl hover:bg-yellow-300 transition-colors"
                >
                  Get Exact Design <ChevronRight className="w-4 h-4" />
                </a>
                <div className="flex gap-2">
                  <a
                    href={GAS_INTAKE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center border-2 border-slate-200 text-slate-700 font-semibold text-xs py-2.5 rounded-xl hover:border-yellow-400 transition-colors"
                  >
                    Book a Call
                  </a>
                  <a
                    href={recommendation.learnUrl}
                    className="flex-1 text-center border-2 border-slate-200 text-slate-500 font-semibold text-xs py-2.5 rounded-xl hover:border-slate-300 transition-colors"
                  >
                    Learn More
                  </a>
                </div>
                <button
                  onClick={explainWithAI}
                  className="w-full text-xs text-slate-400 underline underline-offset-2 hover:text-slate-600 transition-colors py-1"
                >
                  Explain this recommendation
                </button>
              </div>
            </>
          )}

          {/* ── STATE: ai_explain ───────────────────────────── */}
          {state === "ai_explain" && (
            <>
              <p className="text-slate-800 text-sm font-semibold">Why this system?</p>
              {aiLoading && (
                <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
                  <span className="inline-block w-4 h-4 border-2 border-slate-200 border-t-yellow-400 rounded-full animate-spin" />
                  Analysing your inputs…
                </div>
              )}
              {!aiLoading && aiExplanation && (
                <p className="text-slate-600 text-xs leading-relaxed">{aiExplanation}</p>
              )}
              {!aiLoading && !aiExplanation && (
                <p className="text-slate-500 text-xs leading-relaxed">
                  {recommendation?.reasoning}
                </p>
              )}
              <button
                onClick={back}
                className="w-full border-2 border-slate-200 text-slate-600 font-semibold text-sm py-2.5 rounded-xl hover:border-yellow-400 transition-colors mt-1"
              >
                ← Back to recommendation
              </button>
            </>
          )}

          {/* ── STATE: lead_capture ─────────────────────────── */}
          {state === "lead_capture" && (
            <>
              {leadSubmitted ? (
                <>
                  <p className="text-slate-800 text-sm font-semibold">Done — we&apos;ll be in touch.</p>
                  <p className="text-slate-500 text-xs">Jesse will review your details and reach out within 1 business day.</p>
                </>
              ) : (
                <>
                  <p className="text-slate-800 text-sm font-semibold">Want Jesse to reach out?</p>
                  <p className="text-slate-500 text-xs">Leave your email or phone — no spam, just a short follow-up.</p>
                  <input
                    type="text"
                    placeholder="Email or phone number"
                    value={leadValue}
                    onChange={(e) => setLeadValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submitLead()}
                    className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400
                      focus:outline-none focus:border-yellow-400 transition-colors"
                  />
                  <button
                    onClick={submitLead}
                    className="w-full bg-yellow-400 text-slate-900 font-bold text-sm py-2.5 rounded-xl hover:bg-yellow-300 transition-colors"
                  >
                    Send
                  </button>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {state === "output" && (
          <div className="px-4 pb-3">
            <button
              onClick={() => push("lead_capture")}
              className="w-full text-center text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              Or leave your details for a follow-up →
            </button>
          </div>
        )}
      </div>

      {/* Slide-up animation */}
      <style>{`
        @keyframes hea-slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
