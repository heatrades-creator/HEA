import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import TrustStrip from "@/components/TrustStrip";
import { ChevronRight, MapPin } from "lucide-react";
import { GAS_INTAKE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "EV Charger Installer Bendigo | HEA Group",
  description:
    "EV charger installation in Bendigo, VIC. Solar-integrated home charging. Licensed electrical installer. Serving Bendigo and central Victoria. REC 37307.",
  alternates: { canonical: "https://hea-group.com.au/bendigo-ev-charger" },
};

export default function BendigoEVCharger() {
  return (
    <>
      <Nav />
      <main>
        <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 text-yellow-400 text-sm font-semibold mb-4">
              <MapPin className="w-4 h-4" /> Bendigo, VIC
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-5">
              EV Charger Installation in Bendigo
            </h1>
            <p className="text-xl text-slate-300 mb-4">
              Solar-integrated home EV charging for Bendigo homeowners.
            </p>
            <p className="text-slate-400 mb-10 max-w-2xl">
              HEA installs home EV chargers in Bendigo and central Victoria.
              If you&apos;re also installing solar, we size your system to include your EV charging load — from day one.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <a href={GAS_INTAKE_URL} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-yellow-400 text-slate-900 font-bold px-8 py-4 rounded-xl hover:bg-yellow-300 transition-all">
                Get My EV Charger Quote <ChevronRight className="w-5 h-5" />
              </a>
            </div>
            <TrustStrip dark />
          </div>
        </section>

        <section className="py-20 px-4 bg-slate-900 text-white text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold mb-4">Get an EV Charger Quote in Bendigo</h2>
            <p className="text-slate-400 mb-8">Licensed installation · Solar-integrated options available</p>
            <a href={GAS_INTAKE_URL} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-yellow-400 text-slate-900 font-bold px-10 py-4 rounded-xl text-lg hover:bg-yellow-300 hover:shadow-xl transition-all">
              Get My Free Estimate <ChevronRight className="w-5 h-5" />
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
