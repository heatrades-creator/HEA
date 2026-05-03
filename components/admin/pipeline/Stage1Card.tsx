"use client"

import { useState } from "react"
import { formatHEADate, formatHEADateOnly } from "@/lib/format"
import { AppointmentModal }     from "./modals/AppointmentModal"
import { SolarVicModal }        from "./modals/SolarVicModal"
import { FinanceModal }         from "./modals/FinanceModal"
import { EstimationSignedModal } from "./modals/EstimationSignedModal"

export interface Stage1Lead {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  suburb: string
  state: string
  postcode: string
  status: string
  createdAt: string
  nmiNumber: string | null
  annualBillAud: number | null
  roofType: string | null
  gasDriveUrl: string | null
  openSolarProjectId: number | null
  openSolarShareLink: string | null
  // Stage 1 fields
  appointmentAt:    string | null
  appointmentNotes: string | null
  solarVicEligible: boolean | null
  solarVicAppliedAt: string | null
  financeRequired:  boolean | null
  financeProvider:  string | null
}

interface Props {
  lead: Stage1Lead
  onStageAdvance: (leadId: string) => void
}

const fmtDate = formatHEADateOnly
const fmtDateTime = formatHEADate

type Modal = "appointment" | "solarvic" | "finance" | "estimation"

export function Stage1Card({ lead: initial, onStageAdvance }: Props) {
  const [lead, setLead]   = useState(initial)
  const [modal, setModal] = useState<Modal | null>(null)

  const analyserUrl = `/solar-analyser?address=${encodeURIComponent(`${lead.address}, ${lead.suburb} ${lead.state} ${lead.postcode}`)}`

  return (
    <>
      <div className="bg-[#202020] border border-[#2e2e2e] rounded-xl p-4 space-y-3 hover:border-[#3a3a3a] transition-colors">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-white font-semibold truncate">{lead.firstName} {lead.lastName}</p>
            <p className="text-[#aaa] text-xs mt-0.5">{lead.address}, {lead.suburb}</p>
          </div>
          <div className="flex-shrink-0 text-right">
            <span className="text-[#555] text-xs">{fmtDate(lead.createdAt)}</span>
            {lead.annualBillAud && (
              <p className="text-[#aaa] text-xs mt-0.5">${lead.annualBillAud}/yr</p>
            )}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <a href={`tel:${lead.phone}`} className="text-[#aaa] text-xs hover:text-[#ffd100] transition-colors">{lead.phone}</a>
          <span className="text-[#333]">·</span>
          <a href={`mailto:${lead.email}`} className="text-[#aaa] text-xs hover:text-[#ffd100] transition-colors truncate">{lead.email}</a>
        </div>

        {/* Progress checklist */}
        <div className="space-y-1.5 py-1">
          <CheckItem
            done={!!lead.appointmentAt}
            label={lead.appointmentAt ? `Appointment — ${fmtDateTime(lead.appointmentAt)}` : "Appointment — not set"}
          />
          <CheckItem
            done={!!lead.nmiNumber}
            label={lead.nmiNumber ? `NMI ${lead.nmiNumber}` : "Powercor NMI — not downloaded"}
          />
          <CheckItem
            done={lead.solarVicEligible !== null}
            label={
              lead.solarVicEligible === true  ? "Solar Vic — eligible" :
              lead.solarVicEligible === false ? "Solar Vic — not eligible" :
              "Solar Vic — not checked"
            }
          />
          <CheckItem
            done={lead.financeRequired !== null}
            label={
              lead.financeRequired === true  ? `Finance — ${lead.financeProvider ?? "required"}` :
              lead.financeRequired === false ? "Finance — not required" :
              "Finance — not checked"
            }
          />
        </div>

        {/* Action buttons row 1 */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setModal("appointment")}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#2a2a2a] text-[#aaa] hover:text-white hover:bg-[#333] transition-colors border border-[#3a3a3a]"
          >
            {lead.appointmentAt ? "Reschedule" : "Set Appointment"}
          </button>

          {lead.gasDriveUrl ? (
            <a
              href={lead.gasDriveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#2a2a2a] text-[#aaa] hover:text-white hover:bg-[#333] transition-colors border border-[#3a3a3a]"
            >
              Client Files ↗
            </a>
          ) : null}

          <a
            href="https://myenergy.powercor.com.au/s/nmi-register"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#2a2a2a] text-[#aaa] hover:text-white hover:bg-[#333] transition-colors border border-[#3a3a3a]"
          >
            Powercor ↗
          </a>

          <a
            href={analyserUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#2a2a2a] text-[#aaa] hover:text-white hover:bg-[#333] transition-colors border border-[#3a3a3a]"
          >
            Solar Analyser ↗
          </a>
        </div>

        {/* Action buttons row 2 */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setModal("solarvic")}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#2a2a2a] text-[#aaa] hover:text-white hover:bg-[#333] transition-colors border border-[#3a3a3a]"
          >
            Solar Vic
          </button>
          <button
            onClick={() => setModal("finance")}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#2a2a2a] text-[#aaa] hover:text-white hover:bg-[#333] transition-colors border border-[#3a3a3a]"
          >
            Finance
          </button>
          {lead.openSolarShareLink && (
            <a
              href={lead.openSolarShareLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#2a2a2a] text-[#aaa] hover:text-white hover:bg-[#333] transition-colors border border-[#3a3a3a]"
            >
              OpenSolar ↗
            </a>
          )}
        </div>

        {/* Primary CTA */}
        <button
          onClick={() => setModal("estimation")}
          className="w-full py-2.5 rounded-lg text-sm font-semibold bg-[#ffd100] text-black hover:bg-[#e6bc00] transition-colors"
        >
          Mark Estimation Signed →
        </button>
      </div>

      {modal === "appointment" && (
        <AppointmentModal
          lead={lead}
          current={{ appointmentAt: lead.appointmentAt, appointmentNotes: lead.appointmentNotes }}
          onClose={() => setModal(null)}
          onSaved={(appointmentAt, appointmentNotes) => {
            setLead(l => ({ ...l, appointmentAt, appointmentNotes }))
            setModal(null)
          }}
        />
      )}
      {modal === "solarvic" && (
        <SolarVicModal
          lead={lead}
          current={{ solarVicEligible: lead.solarVicEligible, solarVicAppliedAt: lead.solarVicAppliedAt }}
          onClose={() => setModal(null)}
          onSaved={(eligible, appliedAt) => {
            setLead(l => ({ ...l, solarVicEligible: eligible, solarVicAppliedAt: appliedAt }))
            setModal(null)
          }}
        />
      )}
      {modal === "finance" && (
        <FinanceModal
          lead={lead}
          current={{ financeRequired: lead.financeRequired, financeProvider: lead.financeProvider }}
          onClose={() => setModal(null)}
          onSaved={(required, provider) => {
            setLead(l => ({ ...l, financeRequired: required, financeProvider: provider }))
            setModal(null)
          }}
        />
      )}
      {modal === "estimation" && (
        <EstimationSignedModal
          lead={{ ...lead, address: `${lead.address}, ${lead.suburb} ${lead.state}` }}
          onClose={() => setModal(null)}
          onSigned={() => {
            setModal(null)
            onStageAdvance(lead.id)
          }}
        />
      )}
    </>
  )
}

function CheckItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-xs ${
        done ? "bg-green-600 text-white" : "border border-[#444]"
      }`}>
        {done && "✓"}
      </span>
      <span className={`text-xs ${done ? "text-[#aaa]" : "text-[#555]"}`}>{label}</span>
    </div>
  )
}
