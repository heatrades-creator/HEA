"use client";
import React from "react";
import { Phone, Mail, ChevronRight } from "lucide-react";

const Contact = () => {
  return (
    <section
      id="contact"
      className="relative -mt-16 z-10 rounded-t-2xl overflow-auto shadow-lg"
    >
      <div className="py-20 px-4 bg-gradient-to-br from-slate-50 via-yellow-50/40 to-amber-50/30">
        <div className="max-w-4xl mx-auto">
          {/* Primary — book a consultation */}
          <div className="bg-heffblack rounded-3xl p-10 md:p-14 text-center text-white mb-10 shadow-2xl">
            <div className="text-heffdark text-sm font-bold tracking-widest uppercase mb-3">
              Ready to see your numbers?
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Book a Free Solar Consultation
            </h2>
            <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
              Fill in a short form and upload your electricity bill. We&apos;ll pull
              your actual usage data from Powercor, then walk you through exactly
              what solar and battery looks like for your home — with real payback numbers.
            </p>
            <a
              href="https://script.google.com/macros/s/AKfycbyU_ACYess2XPKmBkuMAyZkNiMjym0B4hqCOmkugDxbUs0B8hZoRXraPornmOiR9Kg/exec"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-heffdark text-heffblack font-bold px-10 py-4 rounded-xl text-lg
                hover:scale-105 hover:shadow-xl transition-all duration-200 group"
            >
              Start Your Consultation
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <p className="text-slate-600 text-sm mt-5">
              No obligation · Takes about 5 minutes · We do the analysis before your call
            </p>
          </div>

          {/* Secondary — general enquiries */}
          <div className="text-center">
            <p className="text-slate-500 text-base mb-6">
              Got other electrical needs or just want to talk to Jesse directly?
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a
                href="tel:+61481267812"
                className="inline-flex items-center justify-center gap-2 bg-white border-2 border-slate-200 text-slate-800
                  font-semibold px-7 py-3 rounded-xl hover:border-heffdark hover:shadow-md transition-all duration-200"
              >
                <Phone className="w-5 h-5 text-slate-500" />
                0481 267 812
              </a>
              <a
                href="mailto:hea.trades@gmail.com"
                className="inline-flex items-center justify-center gap-2 bg-white border-2 border-slate-200 text-slate-800
                  font-semibold px-7 py-3 rounded-xl hover:border-heffdark hover:shadow-md transition-all duration-200"
              >
                <Mail className="w-5 h-5 text-slate-500" />
                hea.trades@gmail.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
