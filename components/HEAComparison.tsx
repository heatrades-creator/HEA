import React from "react";
import { Check, X } from "lucide-react";

const COMPARISON_DATA = [
  {
    category: "System Sizing Method",
    typical: "Salesperson estimate or standard package",
    hea: "NEM12 real usage data from Powercor — designed around your actual consumption",
  },
  {
    category: "Data Used",
    typical: "Industry averages and rough assumptions",
    hea: "12 months of your actual interval data — not guesswork",
  },
  {
    category: "Installation Model",
    typical: "Subcontracted crew, sales-commission driven",
    hea: "Direct installer — Jesse does the work, no salespeople",
  },
  {
    category: "Payback Focus",
    typical: "Largest possible system (maximises margins)",
    hea: "Right-sized for under 10-year payback — not oversized",
  },
  {
    category: "Battery Recommendation",
    typical: "Bundle upsell regardless of whether you need it",
    hea: "Recommended only when the economics support it for your usage",
  },
  {
    category: "Post-Install Support",
    typical: "Referred to manufacturer; installer moves on",
    hea: "Single point of contact — Jesse is reachable directly",
  },
];

export default function HEAComparison() {
  return (
    <>
      {/* Mobile: stacked cards */}
      <div className="md:hidden space-y-3">
        {COMPARISON_DATA.map((row) => (
          <div key={row.category} className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{row.category}</p>
            </div>
            <div className="divide-y divide-slate-100">
              <div className="px-4 py-3 flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <X className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Typical Installer</p>
                  <p className="text-sm text-slate-600">{row.typical}</p>
                </div>
              </div>
              <div className="px-4 py-3 flex items-start gap-3 bg-yellow-50/50">
                <div className="flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-yellow-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-yellow-600 uppercase tracking-wide mb-0.5">HEA</p>
                  <p className="text-sm text-slate-800 font-medium">{row.hea}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 w-[30%]">
                Factor
              </th>
              <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 w-[35%]">
                Typical Installer
              </th>
              <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-wider text-yellow-600 w-[35%]">
                HEA
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON_DATA.map((row, i) => (
              <tr
                key={row.category}
                className={`border-b border-slate-100 ${i % 2 === 1 ? "bg-slate-50/50" : "bg-white"}`}
              >
                <td className="px-5 py-4 font-semibold text-slate-700 align-top">
                  {row.category}
                </td>
                <td className="px-5 py-4 text-slate-500 align-top">
                  <span className="flex items-start gap-2">
                    <X className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    {row.typical}
                  </span>
                </td>
                <td className="px-5 py-4 text-slate-800 font-medium align-top">
                  <span className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    {row.hea}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
