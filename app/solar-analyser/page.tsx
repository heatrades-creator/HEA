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
      <div
        className="w-full bg-heffgray2 border-t-4 border-heffdark flex items-center justify-center"
        style={{ marginTop: "80px", height: "calc(100vh - 80px)" }}
      >
        <div className="text-center px-6">
          <div className="mb-6">
            <svg className="w-16 h-16 mx-auto text-[#ffd100]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-heffblack mb-2">HEA Solar Analyser</h1>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Upload your NEM12 interval data for a personalised solar and battery proposal from the HEA team.
          </p>
          <a
            href="https://script.google.com/macros/s/AKfycbzI42lh28ASdcxa2F6b8_euLk9KBcfvg4VfxR-bI3Jl3dLPTxvFGDKuZJh2_tqvZiE/exec"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-heffdark text-white font-semibold px-8 py-4 rounded-xl hover:bg-heffblack transition-colors text-lg shadow-md"
          >
            Open Solar Analyser →
          </a>
          <p className="text-gray-400 text-sm mt-4">Opens in a new tab</p>
        </div>
      </div>
    </>
  );
}
