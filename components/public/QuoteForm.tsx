"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { z } from "zod"

const DRAFT_KEY = "hea_quote_draft"

// ─── Per-step validation ───────────────────────────────────────────────────

const step1 = z.object({
  firstName: z.string().min(1, "Required"),
  lastName:  z.string().min(1, "Required"),
  email:     z.string().email("Enter a valid email"),
  phone:     z.string().min(8, "Enter a valid phone number"),
})

const step2 = z.object({
  address:  z.string().min(5, "Enter your street address"),
  suburb:   z.string().min(2, "Required"),
  state:    z.string().min(2, "Select a state"),
  postcode: z.string().regex(/^\d{4}$/, "Enter a 4-digit postcode"),
})

// ─── Types ─────────────────────────────────────────────────────────────────

interface Draft {
  step:          number
  firstName:     string
  lastName:      string
  email:         string
  phone:         string
  address:       string
  suburb:        string
  state:         string
  postcode:      string
  roofType:      string
  storeys:       string
  annualBillAud: string
  notes:         string
  nmiNumber:     string
}

export interface QuoteFormPrefill {
  annualBillAud?: number
  goal?:          string
  advisorAnswers?: string
}

// ─── Signature canvas ──────────────────────────────────────────────────────

function SignatureCanvas({
  onSign,
  onClear,
}: {
  onSign: (dataUrl: string) => void
  onClear: () => void
}) {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const isDrawing  = useRef(false)

  const getPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * (canvas.width / rect.width),
        y: (e.touches[0].clientY - rect.top) * (canvas.height / rect.height),
      }
    }
    return {
      x: ((e as MouseEvent).clientX - rect.left) * (canvas.width / rect.width),
      y: ((e as MouseEvent).clientY - rect.top) * (canvas.height / rect.height),
    }
  }

  const startDraw = useCallback((e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    e.preventDefault()
    isDrawing.current = true
    const { x, y } = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }, [])

  const draw = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDrawing.current) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    e.preventDefault()
    const { x, y } = getPos(e, canvas)
    ctx.lineWidth   = 2.5
    ctx.lineCap     = "round"
    ctx.lineJoin    = "round"
    ctx.strokeStyle = "#1e293b"
    ctx.lineTo(x, y)
    ctx.stroke()
  }, [])

  const endDraw = useCallback(() => {
    if (!isDrawing.current) return
    isDrawing.current = false
    const canvas = canvasRef.current
    if (!canvas) return
    onSign(canvas.toDataURL("image/png"))
  }, [onSign])

  const clear = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    onClear()
  }, [onClear])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.addEventListener("mousedown",  startDraw)
    canvas.addEventListener("mousemove",  draw)
    canvas.addEventListener("mouseup",    endDraw)
    canvas.addEventListener("mouseleave", endDraw)
    canvas.addEventListener("touchstart", startDraw, { passive: false })
    canvas.addEventListener("touchmove",  draw,      { passive: false })
    canvas.addEventListener("touchend",   endDraw)
    return () => {
      canvas.removeEventListener("mousedown",  startDraw)
      canvas.removeEventListener("mousemove",  draw)
      canvas.removeEventListener("mouseup",    endDraw)
      canvas.removeEventListener("mouseleave", endDraw)
      canvas.removeEventListener("touchstart", startDraw)
      canvas.removeEventListener("touchmove",  draw)
      canvas.removeEventListener("touchend",   endDraw)
    }
  }, [startDraw, draw, endDraw])

  return (
    <div className="space-y-2">
      <div className="relative border-2 border-[#3a3a3a] rounded-xl overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          width={560}
          height={130}
          className="w-full touch-none cursor-crosshair"
        />
        <p className="absolute bottom-2 left-0 right-0 text-center text-[#bbb] text-xs pointer-events-none select-none">
          Sign here
        </p>
      </div>
      <button
        type="button"
        onClick={clear}
        className="text-xs text-[#888] hover:text-[#ffd100] transition-colors underline underline-offset-2"
      >
        Clear signature
      </button>
    </div>
  )
}

// ─── Step indicator ────────────────────────────────────────────────────────

const STEP_LABELS = ["Contact", "Property", "Usage", "Consent"]

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-between mb-8">
      {STEP_LABELS.map((label, i) => (
        <div key={label} className="flex-1 flex flex-col items-center">
          <div className="flex items-center w-full">
            {i > 0 && (
              <div
                className={`flex-1 h-0.5 ${i <= current ? "bg-[#ffd100]" : "bg-[#2e2e2e]"}`}
              />
            )}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all
                ${i < current
                  ? "bg-[#ffd100] text-black"
                  : i === current
                    ? "bg-[#ffd100] text-black ring-4 ring-[#ffd100]/20"
                    : "bg-[#2e2e2e] text-[#555]"}`}
            >
              {i < current ? "✓" : i + 1}
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                className={`flex-1 h-0.5 ${i < current ? "bg-[#ffd100]" : "bg-[#2e2e2e]"}`}
              />
            )}
          </div>
          <span className={`text-xs mt-1.5 ${i === current ? "text-white font-medium" : "text-[#555]"}`}>
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────

const defaultDraft: Draft = {
  step: 0,
  firstName: "", lastName: "", email: "", phone: "",
  address: "", suburb: "", state: "", postcode: "", roofType: "", storeys: "",
  annualBillAud: "", notes: "", nmiNumber: "",
}

export function QuoteForm({ prefill }: { prefill?: QuoteFormPrefill }) {
  const [step,           setStep]           = useState(0)
  const [form,           setForm]           = useState<Draft>(defaultDraft)
  const [errors,         setErrors]         = useState<Record<string, string>>({})
  const [consentChecked, setConsentChecked] = useState(false)
  const [signatureB64,   setSignatureB64]   = useState<string | null>(null)
  const [submitted,      setSubmitted]      = useState(false)
  const [submittedName,  setSubmittedName]  = useState("")
  const [serverError,    setServerError]    = useState<string | null>(null)
  const [isSubmitting,   setIsSubmitting]   = useState(false)

  // Load localStorage draft once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) {
        const saved = JSON.parse(raw) as Draft
        setForm(prev => ({ ...prev, ...saved }))
        setStep(saved.step ?? 0)
      } else if (prefill?.annualBillAud) {
        setForm(prev => ({ ...prev, annualBillAud: String(prefill.annualBillAud) }))
      }
    } catch {}
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Persist draft on every change
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...form, step }))
    } catch {}
  }, [form, step])

  const set = (field: keyof Draft, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => { const e = { ...prev }; delete e[field]; return e })
  }

  // ─── Per-step validation ─────────────────────────────────────────────────

  const validate = (): boolean => {
    if (step === 0) {
      const r = step1.safeParse({
        firstName: form.firstName,
        lastName:  form.lastName,
        email:     form.email,
        phone:     form.phone,
      })
      if (!r.success) {
        const e: Record<string, string> = {}
        r.error.errors.forEach(err => { e[err.path[0] as string] = err.message })
        setErrors(e)
        return false
      }
    }

    if (step === 1) {
      const r = step2.safeParse({
        address:  form.address,
        suburb:   form.suburb,
        state:    form.state,
        postcode: form.postcode,
      })
      if (!r.success) {
        const e: Record<string, string> = {}
        r.error.errors.forEach(err => { e[err.path[0] as string] = err.message })
        setErrors(e)
        return false
      }
    }

    if (step === 3) {
      const e: Record<string, string> = {}
      if (form.nmiNumber && !/^\d{10,11}$/.test(form.nmiNumber)) {
        e.nmiNumber = "NMI must be 10–11 digits"
      }
      if (!signatureB64) {
        e.signature = "Please sign above to authorise"
      }
      if (!consentChecked) {
        e.consentChecked = "You must agree to continue"
      }
      if (Object.keys(e).length > 0) {
        setErrors(e)
        return false
      }
    }

    setErrors({})
    return true
  }

  const next = () => {
    if (!validate()) return
    setStep(s => s + 1)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const back = () => {
    setErrors({})
    setStep(s => s - 1)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // ─── Submit ──────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!validate()) return
    setIsSubmitting(true)
    setServerError(null)

    const payload: Record<string, unknown> = {
      firstName:       form.firstName,
      lastName:        form.lastName,
      email:           form.email,
      phone:           form.phone,
      address:         form.address,
      suburb:          form.suburb,
      state:           form.state,
      postcode:        form.postcode,
      roofType:        form.roofType       || undefined,
      storeys:         form.storeys        ? Number(form.storeys)        : undefined,
      annualBillAud:   form.annualBillAud  ? Number(form.annualBillAud)  : undefined,
      notes:           form.notes          || undefined,
      nmiNumber:       form.nmiNumber      || undefined,
      nmiConsentAt:    consentChecked && signatureB64 ? new Date().toISOString() : undefined,
      nmiSignatureB64: signatureB64        || undefined,
      advisorAnswers:  prefill?.advisorAnswers || undefined,
    }

    try {
      const res = await fetch("/api/leads", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setServerError(body?.error?.formErrors?.[0] ?? "Something went wrong. Please try again.")
        setIsSubmitting(false)
        return
      }

      localStorage.removeItem(DRAFT_KEY)
      setSubmittedName(form.firstName)
      setSubmitted(true)
    } catch {
      setServerError("Network error. Please check your connection and try again.")
    }

    setIsSubmitting(false)
  }

  // ─── Styles ──────────────────────────────────────────────────────────────

  const inputClass =
    "w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg px-4 py-3 text-white placeholder-[#555] focus:outline-none focus:border-[#ffd100] transition-colors"
  const labelClass = "block text-sm font-medium text-[#aaa] mb-1.5"
  const errClass   = "text-red-400 text-xs mt-1"

  // ─── Success ─────────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="rounded-xl bg-green-950 border border-green-800 p-8 text-center">
        <div className="text-4xl mb-4">☀️</div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Thanks {submittedName}!
        </h3>
        <p className="text-[#aaa]">
          We&apos;ve received your request and will review your details.
          {signatureB64 &&
            " Your NMI consent has been recorded — we&apos;ll request your Powercor interval data shortly."}
          {" "}We&apos;ll be in touch within 1 business day.
        </p>
      </div>
    )
  }

  const fullName    = [form.firstName, form.lastName].filter(Boolean).join(" ")
  const fullAddress = [form.address, form.suburb, form.state, form.postcode].filter(Boolean).join(", ")

  return (
    <div>
      <StepIndicator current={step} />

      {/* ── Step 1: Contact ────────────────────────────────────────── */}
      {step === 0 && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>First name</label>
              <input
                value={form.firstName}
                onChange={e => set("firstName", e.target.value)}
                placeholder="Jane"
                className={inputClass}
              />
              {errors.firstName && <p className={errClass}>{errors.firstName}</p>}
            </div>
            <div>
              <label className={labelClass}>Last name</label>
              <input
                value={form.lastName}
                onChange={e => set("lastName", e.target.value)}
                placeholder="Smith"
                className={inputClass}
              />
              {errors.lastName && <p className={errClass}>{errors.lastName}</p>}
            </div>
          </div>

          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => set("email", e.target.value)}
              placeholder="jane@example.com"
              className={inputClass}
            />
            {errors.email && <p className={errClass}>{errors.email}</p>}
          </div>

          <div>
            <label className={labelClass}>Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => set("phone", e.target.value)}
              placeholder="04xx xxx xxx"
              className={inputClass}
            />
            {errors.phone && <p className={errClass}>{errors.phone}</p>}
          </div>
        </div>
      )}

      {/* ── Step 2: Property ───────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <label className={labelClass}>Street address</label>
            <input
              value={form.address}
              onChange={e => set("address", e.target.value)}
              placeholder="123 Smith Street"
              className={inputClass}
            />
            {errors.address && <p className={errClass}>{errors.address}</p>}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className={labelClass}>Suburb</label>
              <input
                value={form.suburb}
                onChange={e => set("suburb", e.target.value)}
                placeholder="Bendigo"
                className={inputClass}
              />
              {errors.suburb && <p className={errClass}>{errors.suburb}</p>}
            </div>
            <div>
              <label className={labelClass}>State</label>
              <select
                value={form.state}
                onChange={e => set("state", e.target.value)}
                className={inputClass}
              >
                <option value="">Select…</option>
                {["NSW", "VIC", "QLD", "SA", "WA", "TAS", "ACT", "NT"].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {errors.state && <p className={errClass}>{errors.state}</p>}
            </div>
            <div>
              <label className={labelClass}>Postcode</label>
              <input
                value={form.postcode}
                onChange={e => set("postcode", e.target.value)}
                placeholder="3550"
                maxLength={4}
                className={inputClass}
              />
              {errors.postcode && <p className={errClass}>{errors.postcode}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Roof type <span className="text-[#555] font-normal">(optional)</span>
              </label>
              <select
                value={form.roofType}
                onChange={e => set("roofType", e.target.value)}
                className={inputClass}
              >
                <option value="">Select…</option>
                <option value="tile">Tile</option>
                <option value="metal">Metal / Colorbond</option>
                <option value="flat">Flat</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>
                Storeys <span className="text-[#555] font-normal">(optional)</span>
              </label>
              <select
                value={form.storeys}
                onChange={e => set("storeys", e.target.value)}
                className={inputClass}
              >
                <option value="">Select…</option>
                <option value="1">1 storey</option>
                <option value="2">2 storeys</option>
                <option value="3">3+ storeys</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 3: Usage ──────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <label className={labelClass}>
              Roughly how much is your power bill per year?{" "}
              <span className="text-[#555] font-normal">(optional)</span>
            </label>
            <input
              type="number"
              min={0}
              value={form.annualBillAud}
              onChange={e => set("annualBillAud", e.target.value)}
              placeholder="e.g. 2500"
              className={inputClass}
            />
            {prefill?.annualBillAud && (
              <p className="text-[#ffd100] text-xs mt-1.5">
                Pre-filled from your advisor session
              </p>
            )}
          </div>

          <div>
            <label className={labelClass}>
              Anything else we should know?{" "}
              <span className="text-[#555] font-normal">(optional)</span>
            </label>
            <textarea
              rows={4}
              value={form.notes}
              onChange={e => set("notes", e.target.value)}
              placeholder="e.g. We have a pool, EV charger, or a specific budget in mind…"
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] p-4">
            <p className="text-white text-sm font-semibold mb-1">Next: NMI Consent (optional)</p>
            <p className="text-[#888] text-xs leading-relaxed">
              To access your actual electricity usage data from Powercor (NEM12 interval data), we
              need your written consent. This lets us size your system precisely — no guesswork.
              You can skip this step if you prefer.
            </p>
          </div>
        </div>
      )}

      {/* ── Step 4: NMI Consent ────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-5">
          <div>
            <label className={labelClass}>
              NMI number <span className="text-[#555] font-normal">(optional)</span>
            </label>
            <input
              value={form.nmiNumber}
              onChange={e => set("nmiNumber", e.target.value.replace(/\D/g, ""))}
              placeholder="10–11 digit number (from your electricity bill)"
              maxLength={11}
              inputMode="numeric"
              className={inputClass}
            />
            {errors.nmiNumber && <p className={errClass}>{errors.nmiNumber}</p>}
            <p className="text-xs text-[#555] mt-1.5">
              Find it on your electricity bill, or{" "}
              <a
                href="https://myenergy.powercor.com.au/s/nmi-register"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#ffd100] hover:underline"
              >
                look it up on Powercor →
              </a>
            </p>
          </div>

          {/* Consent declaration */}
          <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-4 space-y-3">
            <p className="text-white text-sm font-semibold">
              Authorisation to Access NEM12 Interval Data
            </p>
            <div className="text-[#888] text-xs leading-relaxed space-y-2">
              <p>
                I, <strong className="text-white">{fullName || "[your name]"}</strong>, of{" "}
                <strong className="text-white">{fullAddress || "[your address]"}</strong>, authorise{" "}
                <strong className="text-white">Heffernan Electrical Automation (HEA)</strong> to
                obtain my NEM12 interval data from Powercor Australia for the purpose of sizing
                and designing an appropriate solar and/or battery storage system.
              </p>
              <p>
                I understand that this authorisation may be withdrawn at any time by contacting HEA
                directly. This consent does not grant HEA any rights beyond the retrieval of NEM12
                interval data for system design purposes.
              </p>
            </div>
          </div>

          {/* Canvas signature */}
          <div>
            <label className={labelClass}>Your signature</label>
            <SignatureCanvas
              onSign={dataUrl => {
                setSignatureB64(dataUrl)
                setErrors(prev => {
                  const e = { ...prev }
                  delete e.signature
                  return e
                })
              }}
              onClear={() => setSignatureB64(null)}
            />
            {errors.signature && <p className={errClass}>{errors.signature}</p>}
          </div>

          {/* Consent checkbox */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={e => {
                setConsentChecked(e.target.checked)
                setErrors(prev => {
                  const er = { ...prev }
                  delete er.consentChecked
                  return er
                })
              }}
              className="mt-0.5 w-4 h-4 accent-[#ffd100] shrink-0"
            />
            <span className="text-[#aaa] text-sm group-hover:text-white transition-colors">
              I agree to the above authorisation and consent to HEA accessing my NEM12 interval
              data from Powercor Australia.
            </span>
          </label>
          {errors.consentChecked && <p className={errClass}>{errors.consentChecked}</p>}

          <p className="text-[#555] text-xs">
            NMI consent is optional — we can still quote without it. However, interval data lets
            us design the most accurate system for your household.
          </p>
        </div>
      )}

      {/* ── Server error ────────────────────────────────────────────── */}
      {serverError && (
        <p className="text-red-400 text-sm bg-red-950/50 border border-red-800 rounded-lg px-4 py-3 mt-4">
          {serverError}
        </p>
      )}

      {/* ── Navigation ──────────────────────────────────────────────── */}
      <div className={`mt-6 flex gap-3 ${step > 0 ? "justify-between" : "justify-end"}`}>
        {step > 0 && (
          <button
            type="button"
            onClick={back}
            className="px-5 py-3 rounded-lg border border-[#3a3a3a] text-[#aaa] text-sm font-medium hover:border-[#555] hover:text-white transition-colors"
          >
            ← Back
          </button>
        )}
        {step < 3 ? (
          <button
            type="button"
            onClick={next}
            className="flex-1 bg-[#ffd100] text-black font-semibold py-3 rounded-lg hover:bg-[#e6bc00] transition-colors text-sm"
          >
            Continue →
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 bg-[#ffd100] text-black font-semibold py-3 rounded-lg hover:bg-[#e6bc00] transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm"
          >
            {isSubmitting ? "Submitting…" : "Submit Quote Request"}
          </button>
        )}
      </div>

      <p className="text-center text-[#555] text-xs mt-3">
        {step === 3
          ? "Your data is stored securely and only used to design your system."
          : "No spam. No automated calls. We review every submission personally."}
      </p>
    </div>
  )
}
