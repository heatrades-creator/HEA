import type { Metadata } from "next";
import Nav from "@/components/Nav";
import { GAS_INTAKE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Book a Consultation | HEA",
  description:
    "Get in touch with Heffernan Electrical Automation for solar, battery, EV charger, and electrical services in Bendigo.",
};

export default function BookPage() {
  return (
    <>
      <Nav />
      <div
        className="w-full bg-gradient-to-b from-slate-50 to-white min-h-screen flex items-center justify-center"
        style={{ paddingTop: "100px" }}
      >
        <div className="max-w-xl mx-auto px-4 pb-20 text-center">
          <p className="text-sm font-bold tracking-widest uppercase text-yellow-500 mb-3">
            Book a Consultation
          </p>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Let&apos;s talk about your project
          </h1>
          <p className="text-lg text-slate-500 mb-8 max-w-sm mx-auto">
            Fill in our short intake form — solar, battery, EV charger, or general electrical — and Jesse will be in touch within 1 business day.
          </p>
          <a
            href={GAS_INTAKE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-yellow-400 text-slate-900 font-bold px-10 py-4 rounded-xl text-lg hover:bg-yellow-300 hover:shadow-xl transition-all duration-200"
          >
            Open Enquiry Form
          </a>
          <p className="text-slate-400 text-sm mt-4">No obligation · opens in a new tab</p>
        </div>
      </div>
    </>
  );
}
