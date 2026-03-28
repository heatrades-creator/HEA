import type { Metadata } from "next";
import Nav from "@/components/Nav";
import ModernContactForm from "@/components/Form";

export const metadata: Metadata = {
  title: "Book a Consultation | HEA",
  description:
    "Get in touch with Heffernan Electrical Automation for smart home, solar, EV charger, and general electrical services in Melbourne.",
};

export default function BookPage() {
  return (
    <>
      <Nav />
      <div
        className="w-full bg-gradient-to-b from-slate-50 to-white min-h-screen"
        style={{ paddingTop: "100px" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-slate-900 mb-3">
              Book a Consultation
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Tell us about your project and we&apos;ll get back to you within 24 hours.
            </p>
          </div>
          <div className="flex justify-center">
            <ModernContactForm />
          </div>
        </div>
      </div>
    </>
  );
}
