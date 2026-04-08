import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import { QuoteForm, QuoteFormPrefill } from "@/components/public/QuoteForm"

export const metadata = {
  title: "Free Solar Quote | HEA Group",
  description:
    "Get a free, no-obligation solar quote from HEA Group. " +
    "Solar & battery installation in Bendigo and regional Victoria.",
}

// bill range → approximate annual $ midpoint
const BILL_MAP: Record<string, number> = {
  under_300: 2400,
  "300_600":  4800,
  "600_plus": 9000,
}

export default async function QuotePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params = await searchParams

  const prefill: QuoteFormPrefill = {
    goal:          params.goal          || undefined,
    advisorAnswers: params.advisorAnswers || undefined,
  }

  if (params.bill && BILL_MAP[params.bill]) {
    prefill.annualBillAud = BILL_MAP[params.bill]
  } else if (params.annualBill) {
    const n = Number(params.annualBill)
    if (!isNaN(n) && n > 0) prefill.annualBillAud = n
  }

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-[#181818] pt-32 pb-16 px-4">
        <div className="max-w-xl mx-auto">

          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-white mb-3">
              Get Your Free Solar Quote
            </h1>
            <p className="text-[#aaa] text-base">
              Fill in your details and our team will review your property and get back to you with a
              personalised quote — including NEM12 data analysis if you provide consent.
            </p>
          </div>

          {/* Form card */}
          <div className="bg-[#202020] rounded-2xl border border-[#2e2e2e] p-8">
            <QuoteForm prefill={prefill} />
          </div>

          {/* Trust signals */}
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            {[
              { label: "Licensed & Insured", sub: "REC 37307" },
              { label: "Local Team",         sub: "Bendigo, VIC" },
              { label: "No Obligation",      sub: "Free assessment" },
            ].map(({ label, sub }) => (
              <div
                key={label}
                className="bg-[#202020] rounded-xl border border-[#2e2e2e] py-4 px-3"
              >
                <p className="text-white text-sm font-medium">{label}</p>
                <p className="text-[#555] text-xs mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

        </div>
      </main>
      <Footer />
    </>
  )
}
