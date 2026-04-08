import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import TrustStrip from "@/components/TrustStrip";
import { Check, ChevronRight, MapPin } from "lucide-react";
import { GAS_INTAKE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Battery Storage Installer Bendigo | HEA Group",
  description:
    "Home battery storage installation in Bendigo, VIC. HEA sizes batteries from your actual overnight usage data. Serving Bendigo and central Victoria. REC 37307.",
  alternates: { canonical: "https://hea-group.com.au/bendigo-battery-installer" },
};

export default function BendigoBatteryInstaller() {
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
              Battery Storage Installer in Bendigo
            </h1>
            <p className="text-xl text-slate-300 mb-4">
              Right-sized. Based on your real overnight usage. No oversell.
            </p>
            <p className="text-slate-400 mb-10 max-w-2xl">
              HEA installs home battery storage in Bendigo and surrounding central Victoria.
              Every battery is sized from your actual overnight consumption — not a generic recommendation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <a href={GAS_INTAKE_URL} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-yellow-400 text-slate-900 font-bold px-8 py-4 rounded-xl hover:bg-yellow-300 transition-all">
                Get My Battery Quote <ChevronRight className="w-5 h-5" />
              </a>
            </div>
            <TrustStrip dark />
          </div>
        </section>

        <section className="py-20 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Why Battery Storage in Bendigo?</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { title: "Reduce grid reliance", body: "Store excess solar generation and use it when prices are highest — evening peak." },
                { title: "Backup power", body: "Keep critical loads running during grid outages. Bendigo storms, summer demand events." },
                { title: "EV charging overnight", body: "Charge your EV from stored solar — not from the grid at peak rates." },
                { title: "VPP participation", body: "Some battery systems allow you to earn bill credits through Virtual Power Plant programs." },
              ].map((item) => (
                <div key={item.title} className="border border-slate-200 rounded-xl p-6">
                  <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <Check className="w-5 h-5 text-yellow-500" /> {item.title}
                  </h3>
                  <p className="text-slate-500 text-sm">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4 bg-slate-900 text-white text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold mb-4">Get a Battery Storage Quote</h2>
            <p className="text-slate-400 mb-8">Bendigo and central Victoria · Based on your real overnight usage</p>
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
