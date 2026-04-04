import type { Metadata } from "next";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Solar Analyser | HEA",
  description:
    "Upload your NEM12 data for a personalised solar and battery proposal",
};

export default function SolarAnalyserPage() {
  return (
    <>
      <Nav />
      {/* Accent stripe + iframe container — fills full viewport below the fixed nav */}
      <div
        className="w-full bg-heffgray2 border-t-4 border-heffdark"
        style={{ marginTop: "80px", height: "calc(100vh - 80px)", overflow: "hidden" }}
      >
        {/* Subtle branded gradient visible briefly while the iframe loads */}
        <div className="relative w-full h-full">
          {/* Loading backdrop */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-heffblack via-slate-800 to-heffdark opacity-5 pointer-events-none"
            aria-hidden="true"
          />
          <iframe
            src="https://script.google.com/macros/s/AKfycbzI42lh28ASdcxa2F6b8_euLk9KBcfvg4VfxR-bI3Jl3dLPTxvFGDKuZJh2_tqvZiE/exec"
            title="Solar Analyser"
            allow="fullscreen"
            style={{ width: "100%", height: "100%", border: "none", display: "block" }}
          />
        </div>
      </div>
    </>
  );
}
