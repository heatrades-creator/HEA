"use client";
import React, { useEffect, useState } from "react";
import { Phone } from "lucide-react";
import { usePathname } from "next/navigation";
import { GAS_INTAKE_URL, HEA_PHONE } from "@/lib/constants";

const StickyMobileCTA = () => {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Don't show on intake (blocks Continue button) or embed pages (they're iframed)
  if (pathname === "/intake" || pathname.startsWith("/embed")) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="bg-white border-t border-slate-200 shadow-2xl px-4 py-3 flex gap-3">
        <a
          href={`tel:${HEA_PHONE.replace(/\s/g, "")}`}
          className="flex-1 flex items-center justify-center gap-2 border-2 border-slate-200 text-slate-800 font-semibold py-3 rounded-xl text-sm hover:border-yellow-400 transition-colors"
        >
          <Phone className="w-4 h-4" />
          Call Jesse
        </a>
        <a
          href={GAS_INTAKE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 bg-yellow-400 text-slate-900 font-bold py-3 rounded-xl text-sm hover:bg-yellow-300 transition-colors"
        >
          Get Estimate
        </a>
      </div>
    </div>
  );
};

export default StickyMobileCTA;
