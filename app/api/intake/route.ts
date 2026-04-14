import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { Resend } from "resend"
import { generateConsentPdf, generateJobCardPdf, type IntakeData } from "@/lib/intake-pdf"
import { prisma } from "@/lib/db"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM   = process.env.EMAIL_FROM     ?? "noreply@hea-group.com.au"
const TO_HEA = process.env.EMAIL_ALERT_TO ?? "hea.trades@gmail.com"

const Schema = z.object({
  name:          z.string().min(2).max(120),
  email:         z.string().email(),
  phone:         z.string().min(8).max(20),
  address:       z.string().min(5).max(300),
  service:       z.string().max(100).default("General enquiry"),
  occupants:     z.string().max(20).optional(),
  homeDaytime:   z.string().max(60).optional(),
  hotWater:      z.string().max(60).optional(),
  gasAppliances: z.string().max(60).optional(),
  ev:            z.string().max(60).optional(),
  goals:         z.string().max(500).optional(),
  systemSize:    z.string().max(100).optional(),
  batterySize:   z.string().max(100).optional(),
  nmiConsent:    z.boolean(),
  nmiConsentAt:  z.string().datetime(),
  // Optional bill upload — base64, capped at ~6 MB encoded (~4.5 MB raw)
  billBase64:    z.string().max(8_000_000).optional(),
  billName:      z.string().max(200).optional(),
  billMime:      z.string().max(60).optional(),
})

// Parse suburb/state/postcode from a combined Australian address string
function parseAddress(address: string): { suburb: string; state: string; postcode: string } {
  const m = address.match(/,\s*([^,]+?)\s+(VIC|NSW|QLD|SA|WA|TAS|NT|ACT)\s+(\d{4})\s*$/i)
  if (m) return { suburb: m[1].trim(), state: m[2].toUpperCase(), postcode: m[3] }
  return { suburb: "Bendigo", state: "VIC", postcode: "3550" }
}

// Melbourne timestamp
function melbourneTimestamp(): string {
  return new Date().toLocaleString("en-AU", {
    timeZone: "Australia/Melbourne",
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  })
}

export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const d = parsed.data
  const timestamp = melbourneTimestamp()

  const intakeData: IntakeData = {
    name:          d.name,
    email:         d.email,
    phone:         d.phone,
    address:       d.address,
    service:       d.service,
    timestamp,
    occupants:     d.occupants,
    homeDaytime:   d.homeDaytime,
    hotWater:      d.hotWater,
    gasAppliances: d.gasAppliances,
    ev:            d.ev,
    goals:         d.goals,
    systemSize:    d.systemSize,
    batterySize:   d.batterySize,
  }

  // Generate PDFs
  let consentPdf: Uint8Array | null = null
  let jobCardPdf: Uint8Array | null = null
  try {
    ;[consentPdf, jobCardPdf] = await Promise.all([
      generateConsentPdf(intakeData),
      generateJobCardPdf(intakeData),
    ])
  } catch (err) {
    console.error("PDF generation failed:", err)
    // Continue without PDFs — still send email
  }

  const firstName = d.name.split(" ")[0]

  // ── Email to client ──────────────────────────────────────────────────────────
  const clientAttachments = consentPdf
    ? [{ filename: `${d.name} - NMI Consent - HEA.pdf`, content: Buffer.from(consentPdf).toString("base64") }]
    : []

  try {
    await resend.emails.send({
      from:        FROM,
      to:          d.email,
      subject:     "You're in the system — Heffernan Electrical Automation",
      attachments: clientAttachments,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto;color:#1a1a1a;">
          <div style="background:#1a1a1a;padding:24px 28px;border-radius:8px 8px 0 0;text-align:center;">
            <p style="color:#fbbf24;font-size:10px;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px;">Heffernan Electrical Automation</p>
            <h1 style="color:white;font-size:22px;margin:0;font-weight:700;">You're in the system, ${firstName} ⚡</h1>
          </div>
          <div style="background:white;padding:28px 32px;border:1px solid #e8e8e6;border-top:none;border-radius:0 0 8px 8px;">
            <p>Thanks for getting in touch about <strong>${d.service}</strong> for <strong>${d.address}</strong>.</p>
            <p>Jesse will review your details and be in touch shortly to book a call at a time that suits you.</p>
            <div style="background:#f5f5f3;border-left:4px solid #fbbf24;padding:16px 20px;margin:20px 0;border-radius:0 6px 6px 0;">
              <p style="font-weight:700;margin:0 0 8px;font-size:14px;">What happens on your call:</p>
              <p style="margin:0 0 4px;font-size:13px;color:#444;">✔ Jesse reviews your electricity data before the call</p>
              <p style="margin:0 0 4px;font-size:13px;color:#444;">✔ You get your exact payback period — real numbers, not estimates</p>
              <p style="margin:0 0 4px;font-size:13px;color:#444;">✔ We walk through which government rebates apply to your property</p>
              <p style="margin:0;font-size:13px;color:#444;">✔ No obligation, no pressure — just a clear picture</p>
            </div>
            <p>We're a direct installer — no salespeople, no middlemen. Jesse and Alexis do the work themselves.</p>
            ${consentPdf ? `
            <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:14px 18px;margin:20px 0;">
              <p style="margin:0;font-size:13px;color:#92400e;">
                <strong>📎 Your NMI Consent Form is attached.</strong> This confirms we have your permission
                to access your usage data via Powercore — it's how we give you accurate numbers rather than guesswork.
                Keep it for your records.
              </p>
            </div>` : ""}
            <p style="color:#888;font-size:12px;margin-top:24px;">
              Heffernan Electrical Automation &nbsp;·&nbsp; ${TO_HEA} &nbsp;·&nbsp; 0481 267 812<br>
              REC 37307 &nbsp;·&nbsp; hea-group.com.au
            </p>
          </div>
        </div>
      `,
    })
  } catch (err) {
    console.error("Client email failed:", err)
  }

  // ── Email to HEA ─────────────────────────────────────────────────────────────
  const billSection = d.billBase64 && d.billName
    ? `<p><strong>Electricity bill:</strong> Attached (${d.billName})</p>`
    : `<p><strong>Electricity bill:</strong> Not uploaded</p>`

  const hhlabel: Record<string, string> = {
    occupants:     "Occupants",
    homeDaytime:   "Home daytime",
    hotWater:      "Hot water",
    gasAppliances: "Gas appliances",
    ev:            "EV / planning",
    goals:         "Goals",
  }

  const householdRows = Object.entries(hhlabel)
    .map(([k, label]) => {
      const val = intakeData[k as keyof IntakeData]
      return val ? `<tr><td style="padding:4px 12px 4px 0;font-weight:600;">${label}</td><td style="padding:4px 0;color:#444;">${val}</td></tr>` : ""
    })
    .join("")

  const heaAttachments = [
    ...(consentPdf ? [{ filename: `${d.name} - NMI Consent - HEA.pdf`,  content: Buffer.from(consentPdf).toString("base64") }] : []),
    ...(jobCardPdf ? [{ filename: `${d.name} - Job Card - HEA.pdf`,     content: Buffer.from(jobCardPdf).toString("base64") }] : []),
    ...(d.billBase64 && d.billName
      ? [{ filename: d.billName, content: d.billBase64 }]
      : []),
  ]

  try {
    await resend.emails.send({
      from:        FROM,
      to:          TO_HEA,
      subject:     `New intake — ${d.name} — ${d.service}`,
      attachments: heaAttachments,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;color:#1a1a1a;">
          <h2 style="margin:0 0 4px;">New intake form submission</h2>
          <p style="color:#888;font-size:13px;margin:0 0 20px;">${timestamp}</p>

          <h3 style="margin:0 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#888;">Contact</h3>
          <table style="border-collapse:collapse;width:100%;margin-bottom:20px;">
            <tr><td style="padding:4px 12px 4px 0;font-weight:600;">Name</td><td style="color:#444;">${d.name}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;font-weight:600;">Email</td><td style="color:#444;"><a href="mailto:${d.email}">${d.email}</a></td></tr>
            <tr><td style="padding:4px 12px 4px 0;font-weight:600;">Phone</td><td style="color:#444;"><a href="tel:${d.phone}">${d.phone}</a></td></tr>
            <tr><td style="padding:4px 12px 4px 0;font-weight:600;">Address</td><td style="color:#444;">${d.address}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;font-weight:600;">Service</td><td style="color:#444;">${d.service}</td></tr>
          </table>

          <h3 style="margin:0 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#888;">Household</h3>
          <table style="border-collapse:collapse;width:100%;margin-bottom:20px;">${householdRows}</table>

          ${billSection}

          <p style="font-size:13px;color:#888;margin-top:24px;border-top:1px solid #eee;padding-top:12px;">
            NMI consent: ${d.nmiConsent ? "✅ YES — " + d.nmiConsentAt : "❌ Not given"}<br>
            PDFs: ${consentPdf ? "✅ Consent" : "❌ Consent failed"} &nbsp;|&nbsp; ${jobCardPdf ? "✅ Job card" : "❌ Job card failed"}
          </p>
        </div>
      `,
    })
  } catch (err) {
    console.error("HEA email failed:", err)
  }

  // ── Notify Jobs API (GAS) ────────────────────────────────────────────────────
  if (process.env.JOBS_GAS_URL) {
    try {
      await fetch(process.env.JOBS_GAS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action:     "createJob",
          clientName: d.name,
          phone:      d.phone,
          email:      d.email,
          address:    d.address,
          notes:      `📋 ${d.service} enquiry\n${d.goals ? "Goals: " + d.goals : ""}`,
        }),
      })
    } catch { /* non-fatal */ }
  }

  // ── Save lead to Prisma ──────────────────────────────────────────────────────
  try {
    const [firstName, ...rest] = d.name.trim().split(" ")
    const lastName = rest.join(" ") || "-"
    const { suburb, state, postcode } = parseAddress(d.address)

    await prisma.lead.create({
      data: {
        firstName,
        lastName,
        email:   d.email,
        phone:   d.phone,
        address: d.address,
        suburb,
        state,
        postcode,
        notes:      d.goals,
        leadSource: "website",
        status:     "pending_review",
        nmiConsentAt: d.nmiConsent ? new Date(d.nmiConsentAt) : null,
        auditLog: {
          create: {
            action: "lead_received",
            actor:  "system",
            detail: JSON.stringify({ source: "intake_form", service: d.service }),
          },
        },
      },
    })
  } catch (dbErr) {
    console.error("Intake lead DB save failed:", dbErr)
    // non-fatal — emails already sent
  }

  return NextResponse.json({ success: true }, { status: 201 })
}
