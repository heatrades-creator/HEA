"use client";
import React from "react";
import { Phone, Mail, ChevronRight } from "lucide-react";
import { GAS_INTAKE_URL, HEA_PHONE, HEA_EMAIL } from "@/lib/constants";

const Contact = () => {
  return (
    <section
      id="contact"
      className="relative -mt-16 z-10 rounded-t-2xl overflow-auto shadow-lg"
    >
      <div className="py-20 px-4 bg-gradient-to-br from-slate-50 via-yellow-50/40 to-amber-50/30">
        <div className="max-w-4xl mx-auto">
          {/* Primary CTA block */}
          <div className="bg-slate-900 rounded-3xl p-10 md:p-14 text-center text-white mb-10 shadow-2xl">
            <div className="text-yellow-400 text-sm font-bold tracking-widest uppercase mb-3">
              Ready to see your numbers?
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Get a Free Solar Estimate
            </h2>
            <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
              Fill in a short form and we&apos;ll pull your actual usage data from Powercor,
              then walk you through exactly what solar and battery looks like for
              your home — with real payback numbers.
            </p>
            <a
              href={GAS_INTAKE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-yellow-400 text-slate-900 font-bold px-10 py-4 rounded-xl text-lg
                hover:bg-yellow-300 hover:shadow-xl transition-all duration-200 group"
            >
              Get My Solar Estimate
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <p className="text-slate-600 text-sm mt-5">
              No obligation · 5 min form · We do the analysis before your call
            </p>
          </div>

          {/* Secondary — direct contact */}
          <div className="text-center">
            <p className="text-slate-500 text-base mb-6">
              Prefer to call, or have a quick question for Jesse?
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a
                href={`tel:${HEA_PHONE.replace(/\s/g, "")}`}
                className="inline-flex items-center justify-center gap-2 bg-white border-2 border-slate-200 text-slate-800
                  font-semibold px-7 py-3 rounded-xl hover:border-yellow-400 hover:shadow-md transition-all duration-200"
              >
                <Phone className="w-5 h-5 text-slate-400" />
                {HEA_PHONE}
              </a>
              <a
                href={`mailto:${HEA_EMAIL}`}
                className="inline-flex items-center justify-center gap-2 bg-white border-2 border-slate-200 text-slate-800
                  font-semibold px-7 py-3 rounded-xl hover:border-yellow-400 hover:shadow-md transition-all duration-200"
              >
                <Mail className="w-5 h-5 text-slate-400" />
                {HEA_EMAIL}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
