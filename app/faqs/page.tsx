import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getFooterData } from "@/lib/sanity";
import FAQAccordion from "@/components/FAQAccordion";
import { ChevronRight } from "lucide-react";
import { GAS_INTAKE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Solar FAQs Bendigo | HEA Group",
  description:
    "Common questions about solar, battery storage, and EV charging in Bendigo. Straight answers from HEA — no sales spin. REC 37307.",
};

export default async function FAQsPage() {
  const footer = await getFooterData()
  return (
    <>
      <Nav />
      <main>
        <section className="pt-32 pb-16 px-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white text-center">
          <div className="max-w-3xl mx-auto">
            <p className="text-sm font-bold tracking-widest uppercase text-yellow-400 mb-3">FAQs</p>
            <h1 className="text-4xl md:text-6xl font-bold mb-5">Common Questions</h1>
            <p className="text-slate-300 text-xl max-w-xl mx-auto">
              Straight answers about solar, battery, and EV charging — no sales spin.
            </p>
          </div>
        </section>

        <FAQAccordion showLink={false} />

        <section className="py-20 px-4 bg-slate-900 text-white text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold mb-4">Still have a question?</h2>
            <p className="text-slate-400 mb-8">Fill in the form and Jesse will get back to you directly.</p>
            <a href={GAS_INTAKE_URL} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-yellow-400 text-slate-900 font-bold px-10 py-4 rounded-xl text-lg hover:bg-yellow-300 hover:shadow-xl transition-all">
              Get in Touch <ChevronRight className="w-5 h-5" />
            </a>
          </div>
        </section>
      </main>
      <Footer data={footer} />
    </>
  );
}
