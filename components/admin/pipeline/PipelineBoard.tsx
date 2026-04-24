"use client"

import { useState } from "react"
import { PipelineColumn }              from "./PipelineColumn"
import { Stage1Card, type Stage1Lead } from "./Stage1Card"
import { Stage2Card, type Stage2Lead } from "./Stage2Card"
import { Stage3Card, type Stage3Lead } from "./Stage3Card"

interface Props {
  stage1Leads: Stage1Lead[]
  stage2Leads: Stage2Lead[]
  stage3Leads: Stage3Lead[]
}

export function PipelineBoard({ stage1Leads: s1, stage2Leads: s2, stage3Leads: s3 }: Props) {
  const [stage1, setStage1] = useState(s1)
  const [stage2, setStage2] = useState(s2)

  function onStageAdvance(leadId: string) {
    const lead = stage1.find(l => l.id === leadId)
    if (!lead) return
    setStage1(prev => prev.filter(l => l.id !== leadId))
    // Add minimal Stage2Lead view — full data loads on next page refresh
    setStage2(prev => [{
      id:                  lead.id,
      firstName:           lead.firstName,
      lastName:            lead.lastName,
      email:               lead.email,
      phone:               lead.phone,
      address:             lead.address,
      suburb:              lead.suburb,
      state:               lead.state,
      estimationSignedAt:  new Date().toISOString(),
      openSolarProjectId:  lead.openSolarProjectId,
      openSolarShareLink:  lead.openSolarShareLink,
      openSolarSystemKw:   null,
      openSolarPriceAud:   null,
      gasDriveUrl:         lead.gasDriveUrl,
      stockConfirmed:      null,
      buildDate:           null,
      quoteSignedAt:       null,
      depositAmountAud:    null,
      depositPaidAt:       null,
    }, ...prev])
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <PipelineColumn
        title="Stage 1 — Build the Deal"
        description="Call lead · NMI download · Solar Analyser · Sign estimation"
        count={stage1.length}
        accent="amber"
      >
        {stage1.map(lead => (
          <Stage1Card key={lead.id} lead={lead} onStageAdvance={onStageAdvance} />
        ))}
      </PipelineColumn>

      <PipelineColumn
        title="Stage 2 — Close the Deal"
        description="Confirm stock · Set build date · Sign quote · Take deposit"
        count={stage2.length}
        accent="blue"
      >
        {stage2.map(lead => (
          <Stage2Card key={lead.id} lead={lead} />
        ))}
      </PipelineColumn>

      <PipelineColumn
        title="Stage 3 — Post-Install"
        description="Request review · Confirm received · Send thank you"
        count={s3.length}
        accent="green"
      >
        {s3.map(lead => (
          <Stage3Card key={lead.id} lead={lead} />
        ))}
      </PipelineColumn>
    </div>
  )
}
