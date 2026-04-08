"use client";
import React, { useState } from "react";
import { ChevronRight } from "lucide-react";
import { GAS_INTAKE_URL } from "@/lib/constants";

// ─── Types ────────────────────────────────────────────────────────────────────

type BillRange = "under_300" | "300_600" | "600_plus";
type HomeSize = "small" | "medium" | "large";

interface EstimatorInputs {
  bill: BillRange | null;
  homeSize: HomeSize | null;
  ev: boolean | null;
  battery: boolean | null;
}

interface EstimateOutput {
  systemKw: number;
  priceMin: number;
  priceMax: number;
  savingsMin: number;
  savingsMax: number;
  paybackYears: string;
}

// ─── Deterministic estimate engine ───────────────────────────────────────────

function computeEstimate(inputs: EstimatorInputs): EstimateOutput {
  let systemKw = 6.6;
  let priceMin = 8000;
  let priceMax = 12000;
  let savingsMin = 1200;
  let savingsMax = 2000;

  // Bill range
  if (inputs.bill === "600_plus") { systemKw = 10; priceMin = 11000; priceMax = 16000; savingsMin = 2000; savingsMax = 3500; }
  if (inputs.bill === "under_300") { systemKw = 5; priceMin = 6500; priceMax = 10000; savingsMin = 800; savingsMax = 1400; }

  // Home size modifier
  if (inputs.homeSize === "large") { systemKw += 1.5; priceMin += 1500; priceMax += 2500; savingsMin += 300; savingsMax += 600; }
  if (inputs.homeSize === "small") { systemKw = Math.max(systemKw - 1, 3.3); priceMin -= 500; savingsMin -= 200; }

  // EV modifier
  if (inputs.ev) { systemKw += 1.5; priceMin += 1000; priceMax += 1500; savingsMin += 500; savingsMax += 900; }

  // Battery add-on
  if (inputs.battery) { priceMin += 8000; priceMax += 14000; savingsMin += 800; savingsMax += 1500; }

  // Round system kw to 1dp
  systemKw = Math.round(systemKw * 10) / 10;

  // Rough payback calc (midpoint savings / midpoint price)
  const midSavings = (savingsMin + savingsMax) / 2;
  const midPrice = (priceMin + priceMax) / 2;
  const paybackRaw = midPrice / midSavings;
  const paybackYears = paybackRaw < 10
    ? `~${Math.round(paybackRaw * 2) / 2} years`
    : "Under 10 years (indicative)";

  return { systemKw, priceMin, priceMax, savingsMin, savingsMax, paybackYears };
}

function fmt(n: number) {
  return n.toLocaleString("en-AU");
}

// ─── Toggle button group ──────────────────────────────────────────────────────

function BtnGroup<T extends string | boolean>({
  legend,
  options,
  value,
  onSelect,
}: {
  legend: string;
  options: { label: string; value: T }[];
  value: T | null;
  onSelect: (v: T) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-slate-700 mb-2">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onSelect(opt.value)}
            className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-yellow-400
              ${value === opt.value
                ? "border-yellow-400 bg-yellow-50 text-slate-900"
                : "border-slate-200 text-slate-600 hover:border-yellow-300 hover:bg-yellow-50/50"
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function HEAEstimator() {
  const [inputs, setInputs] = useState<EstimatorInputs>({
    bill: null,
    homeSize: null,
    ev: null,
    battery: null,
  });

  const ready =
    inputs.bill !== null &&
    inputs.homeSize !== null &&
    inputs.ev !== null &&
    inputs.battery !== null;

  const estimate = ready ? computeEstimate(inputs) : null;

  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8">
      <div className="mb-2">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Interactive Tool</p>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Estimate Your System</h2>
        <p className="text-slate-500 text-sm mt-1">
          Select your situation below for an indicative system size and price range.
        </p>
      </div>

      <div className="mt-6 space-y-6">
        <BtnGroup
          legend="Monthly electricity bill"
          options={[
            { label: "Under $300", value: "under_300" as BillRange },
            { label: "$300 – $600", value: "300_600" as BillRange },
            { label: "Over $600", value: "600_plus" as BillRange },
          ]}
          value={inputs.bill}
          onSelect={(v) => setInputs((i) => ({ ...i, bill: v }))}
        />

        <BtnGroup
          legend="Home size"
          options={[
            { label: "Small (1–2 bed)", value: "small" as HomeSize },
            { label: "Medium (3 bed)", value: "medium" as HomeSize },
            { label: "Large (4+ bed)", value: "large" as HomeSize },
          ]}
          value={inputs.homeSize}
          onSelect={(v) => setInputs((i) => ({ ...i, homeSize: v }))}
        />

        <BtnGroup
          legend="EV or planning to get one?"
          options={[
            { label: "Yes", value: true },
            { label: "No", value: false },
          ]}
          value={inputs.ev}
          onSelect={(v) => setInputs((i) => ({ ...i, ev: v }))}
        />

        <BtnGroup
          legend="Interested in battery storage?"
          options={[
            { label: "Yes", value: true },
            { label: "Not right now", value: false },
          ]}
          value={inputs.battery}
          onSelect={(v) => setInputs((i) => ({ ...i, battery: v }))}
        />
      </div>

      {/* Output */}
      {estimate && (
        <div className="mt-8 bg-white rounded-2xl border-2 border-yellow-400 p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-yellow-600 mb-4">
            Indicative Estimate
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-xs text-slate-400 mb-1">System Size</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900">~{estimate.systemKw} kW</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Est. Payback</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900">{estimate.paybackYears}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Price Range</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900">
                ${fmt(estimate.priceMin)}–${fmt(estimate.priceMax)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Est. Annual Savings</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900">
                ${fmt(estimate.savingsMin)}–${fmt(estimate.savingsMax)}
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-400 italic mb-5">
            * Indicative only. Actual quote is based on your Powercor NEM12 usage data and site conditions.
            STC rebates applied. Prices may vary.
          </p>

          <a
            href={GAS_INTAKE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-yellow-400 text-slate-900 font-bold px-6 py-3 rounded-xl
              hover:bg-yellow-300 hover:shadow-lg transition-all duration-200 text-sm"
          >
            Get My Accurate Quote
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      )}

      {!ready && (
        <div className="mt-8 bg-white rounded-2xl border border-dashed border-slate-300 p-6 text-center">
          <p className="text-slate-400 text-sm">
            Select all options above to see your indicative estimate.
          </p>
        </div>
      )}
    </div>
  );
}
