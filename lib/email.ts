// lib/email.ts
// Resend email helpers for staff alerts.
// All emails go to internal staff — never to customers directly from here.
// Customer-facing share links are included in the email body.

import { Resend } from "resend"
import type { Lead } from "@prisma/client"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM   = process.env.EMAIL_FROM     ?? "alerts@hea-group.com.au"
const TO     = process.env.EMAIL_ALERT_TO ?? "owner@hea-group.com.au"

function leadName(lead: Pick<Lead, "firstName" | "lastName">) {
  return `${lead.firstName} ${lead.lastName}`
}

/** Alert staff when a new lead arrives from the public quote form */
export async function sendNewLeadAlert(
  lead: Pick<Lead, "firstName" | "lastName" | "email" | "phone" | "address" | "suburb" | "state" | "postcode" | "annualBillAud" | "roofType" | "id">
) {
  await resend.emails.send({
    from: FROM,
    to:   TO,
    subject: `New solar quote request — ${leadName(lead)}`,
    html: `
      <h2>New lead received</h2>
      <p><strong>Name:</strong> ${leadName(lead)}</p>
      <p><strong>Email:</strong> ${lead.email}</p>
      <p><strong>Phone:</strong> ${lead.phone}</p>
      <p><strong>Address:</strong> ${lead.address}, ${lead.suburb} ${lead.state} ${lead.postcode}</p>
      ${lead.annualBillAud ? `<p><strong>Annual bill:</strong> $${lead.annualBillAud}</p>` : ""}
      ${lead.roofType ? `<p><strong>Roof type:</strong> ${lead.roofType}</p>` : ""}
      <hr>
      <p><a href="${process.env.NEXTAUTH_URL ?? ""}/admin/leads">Review in admin dashboard →</a></p>
    `,
  })
}

/** Alert staff when a lead is confirmed and the OpenSolar project is created */
export async function sendJobConfirmedAlert(
  lead: Pick<Lead, "firstName" | "lastName" | "email" | "phone" | "address" | "suburb" | "state">,
  shareLink: string
) {
  await resend.emails.send({
    from: FROM,
    to:   TO,
    subject: `Project created in OpenSolar — ${leadName(lead)}`,
    html: `
      <h2>OpenSolar project created</h2>
      <p><strong>Customer:</strong> ${leadName(lead)}</p>
      <p><strong>Email:</strong> ${lead.email}</p>
      <p><strong>Address:</strong> ${lead.address}, ${lead.suburb} ${lead.state}</p>
      <hr>
      ${shareLink ? `<p><strong>Proposal link (send to customer):</strong><br><a href="${shareLink}">${shareLink}</a></p>` : ""}
      <p><a href="${process.env.NEXTAUTH_URL ?? ""}/admin/jobs">View job pipeline →</a></p>
    `,
  })
}

/** Alert staff when a significant milestone is reached (sold, installed, etc.) */
export async function sendMilestoneAlert(
  lead: Pick<Lead, "firstName" | "lastName" | "id">,
  action: string
) {
  const labels: Record<string, string> = {
    job_sold:        "Job marked as SOLD",
    job_installed:   "Installation complete",
    contract_signed: "Contract signed by customer",
    deposit_paid:    "Deposit payment received",
    finance_approved:"Finance application approved",
    proposal_sent:   "Proposal sent to customer",
  }

  const label = labels[action] ?? action.replace(/_/g, " ")

  await resend.emails.send({
    from: FROM,
    to:   TO,
    subject: `${label} — ${leadName(lead)}`,
    html: `
      <h2>${label}</h2>
      <p><strong>Customer:</strong> ${leadName(lead)}</p>
      <p><a href="${process.env.NEXTAUTH_URL ?? ""}/admin/jobs">View job pipeline →</a></p>
    `,
  })
}
