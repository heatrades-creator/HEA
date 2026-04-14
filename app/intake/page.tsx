"use client"

import { useState, useRef, useEffect, Suspense } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useSearchParams } from "next/navigation"
import { Check, ChevronRight, Upload, X, Loader2 } from "lucide-react"

// ── Schema ────────────────────────────────────────────────────────────────────
const Schema = z.object({
  name:          z.string().min(2, "Please enter your name"),
  email:         z.string().email("Please enter a valid email"),
  phone:         z.string().min(8, "Please enter your phone number"),
  address:       z.string().min(5, "Please enter your property address"),
  service:       z.string().min(1, "Please select a service"),
  occupants:     z.string().min(1, "Please select"),
  homeDaytime:   z.string().min(1, "Please select"),
  hotWater:      z.string().min(1, "Please select"),
  gasAppliances: z.string().min(1, "Please select"),
  ev:            z.string().min(1, "Please select"),
  goals:         z.string().optional(),
  systemSize:    z.string().optional(),
  batterySize:   z.string().optional(),
  nmiConsent:    z.literal(true, { error: "Consent is required to proceed" }),
})
type FormData = z.infer<typeof Schema>

const SERVICE_OPTIONS = [
  { value: "Solar system",           label: "Solar System",       desc: "Grid-connect solar panels" },
  { value: "Battery add-on",         label: "Battery Add-On",     desc: "Add storage to existing or new solar" },
  { value: "EV charger",             label: "EV Charger",         desc: "Level 2 home EV charging" },
  { value: "Solar + battery combo",  label: "Solar + Battery",    desc: "Full system together" },
  { value: "Not sure yet",           label: "Not Sure Yet",       desc: "Happy for Jesse to recommend" },
]

const URL_TO_SERVICE: Record<string, string> = {
  solar:   "Solar system",
  battery: "Battery add-on",
  ev:      "EV charger",
  combo:   "Solar + battery combo",
}

const STEPS = ["Contact", "Service", "Household", "Goals & Bill", "Consent & Submit"]

// ── Helpers ───────────────────────────────────────────────────────────────────
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve((reader.result as string).split(",")[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="text-red-500 text-xs mt-1">{msg}</p>
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{children}</label>
}

function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full border border-slate-200 rounded-xl px-4 py-3.5 text-base text-slate-900 focus:outline-none focus:border-slate-800 transition-colors ${className}`}
      {...props}
    />
  )
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function Progress({ step, total }: { step: number; total: number }) {
  return (
    <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
      <div
        className="bg-slate-900 h-full rounded-full transition-all duration-500"
        style={{ width: `${((step) / total) * 100}%` }}
      />
    </div>
  )
}

// ── Step shells ───────────────────────────────────────────────────────────────
function StepHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-slate-900 mb-1">{title}</h2>
      <p className="text-slate-500 text-sm">{sub}</p>
    </div>
  )
}

// ── SelectCard ────────────────────────────────────────────────────────────────
function SelectCard({
  value, label, desc, selected, onClick,
}: { value: string; label: string; desc: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
        selected ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-slate-900 text-sm">{label}</p>
          <p className="text-slate-400 text-xs mt-0.5">{desc}</p>
        </div>
        {selected && <Check className="w-5 h-5 text-slate-900 flex-shrink-0" />}
      </div>
    </button>
  )
}

// ── Radio row ─────────────────────────────────────────────────────────────────
function RadioRow({
  name, value, label, checked, onChange,
}: { name: string; value: string; label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
      checked ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:border-slate-300"
    }`}>
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="sr-only" />
      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${
        checked ? "border-slate-900 bg-slate-900" : "border-slate-300"
      }`} />
      <span className="text-sm text-slate-800">{label}</span>
    </label>
  )
}

// ── Main form (inner — needs useSearchParams) ─────────────────────────────────
function IntakeFormInner() {
  const params = useSearchParams()
  const serviceParam = params.get("service") ?? ""
  const defaultService = URL_TO_SERVICE[serviceParam.toLowerCase()] ?? ""

  const [step, setStep]         = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [billFile, setBillFile]     = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const {
    register, handleSubmit, watch, setValue, trigger,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(Schema),
    defaultValues: { service: defaultService, nmiConsent: undefined as unknown as true },
  })

  const watchedService = watch("service")

  // Pre-select service from URL param
  useEffect(() => {
    if (defaultService && !watchedService) {
      setValue("service", defaultService)
    }
  }, [defaultService, watchedService, setValue])

  // Validate current step fields before advancing
  const stepFields: Record<number, (keyof FormData)[]> = {
    1: ["name", "email", "phone", "address"],
    2: ["service"],
    3: ["occupants", "homeDaytime", "hotWater", "gasAppliances", "ev"],
    4: [],
    5: ["nmiConsent"],
  }

  async function nextStep() {
    const valid = await trigger(stepFields[step])
    if (valid) setStep(s => s + 1)
  }

  function prevStep() { setStep(s => Math.max(1, s - 1)) }

  const onSubmit = handleSubmit(async (data) => {
    setSubmitting(true)
    setSubmitError("")

    let billBase64: string | undefined
    let billName:   string | undefined
    let billMime:   string | undefined

    if (billFile) {
      try {
        billBase64 = await fileToBase64(billFile)
        billName   = billFile.name
        billMime   = billFile.type
      } catch { /* skip if conversion fails */ }
    }

    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          nmiConsent:   true,
          nmiConsentAt: new Date().toISOString(),
          billBase64,
          billName,
          billMime,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      setSubmitted(true)
    } catch (err) {
      setSubmitError("Something went wrong. Please call us on 0481 267 812.")
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  })

  // ── Success screen ────────────────────────────────────────────────────────
  if (submitted) {
    const firstName = watch("name").split(" ")[0]
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <header className="border-b border-slate-100 px-5 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-900 rounded-md flex items-center justify-center">
            <span className="text-yellow-400 text-xs font-black">H</span>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-none">HEA</p>
            <p className="text-xs text-slate-400">Heffernan Electrical Automation</p>
          </div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">You&apos;re in the system, {firstName}!</h1>
          <p className="text-slate-500 mb-8 max-w-sm">
            Jesse will review your details and be in touch to book a call.
            Check your inbox — your NMI consent form is on its way.
          </p>
          <div className="bg-slate-50 rounded-2xl p-6 max-w-sm w-full text-left space-y-3 mb-8">
            <p className="font-semibold text-slate-900 text-sm">What happens next:</p>
            {["Jesse reviews your electricity data", "You get your exact payback period", "Walk-through of applicable rebates", "No obligation — just clear answers"].map(item => (
              <div key={item} className="flex items-start gap-2">
                <Check className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-slate-600">{item}</p>
              </div>
            ))}
          </div>
          <a href="https://hea-group.com.au" className="text-sm text-slate-400 underline">Back to hea-group.com.au</a>
        </div>
      </div>
    )
  }

  // ── Form layout ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-100 px-5 py-4 flex items-center gap-3 flex-shrink-0">
        <div className="w-8 h-8 bg-slate-900 rounded-md flex items-center justify-center">
          <span className="text-yellow-400 text-xs font-black">H</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 leading-none">HEA — Solar &amp; Battery Quote</p>
          <p className="text-xs text-slate-400">Heffernan Electrical Automation · REC 37307</p>
        </div>
        <span className="text-xs text-slate-400 flex-shrink-0">Step {step}/{STEPS.length}</span>
      </header>

      {/* Progress */}
      <div className="px-5 pt-3 flex-shrink-0">
        <Progress step={step} total={STEPS.length} />
        <p className="text-xs text-slate-400 mt-1">{STEPS[step - 1]}</p>
      </div>

      {/* Form body */}
      <form onSubmit={onSubmit} className="flex-1 flex flex-col">
        <div className="flex-1 px-5 py-6 overflow-y-auto">

          {/* ── Step 1: Contact ────────────────────────────────────────────── */}
          {step === 1 && (
            <div>
              <StepHeader title="Let's get started" sub="A few details about you and your property. Takes about 60 seconds." />
              <div className="space-y-4">
                <div>
                  <Label>Full name</Label>
                  <Input placeholder="Jane Smith" autoComplete="name" {...register("name")} />
                  <FieldError msg={errors.name?.message} />
                </div>
                <div>
                  <Label>Email address</Label>
                  <Input type="email" placeholder="jane@example.com" autoComplete="email" {...register("email")} />
                  <FieldError msg={errors.email?.message} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input type="tel" placeholder="04xx xxx xxx" autoComplete="tel" {...register("phone")} />
                  <FieldError msg={errors.phone?.message} />
                </div>
                <div>
                  <Label>Property address</Label>
                  <Input placeholder="123 Main St, Bendigo VIC 3550" autoComplete="street-address" {...register("address")} />
                  <FieldError msg={errors.address?.message} />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Service ────────────────────────────────────────────── */}
          {step === 2 && (
            <div>
              <StepHeader title="What are you interested in?" sub="We'll tailor the quote to your specific needs." />
              <div className="space-y-3">
                {SERVICE_OPTIONS.map(opt => (
                  <SelectCard
                    key={opt.value}
                    value={opt.value}
                    label={opt.label}
                    desc={opt.desc}
                    selected={watchedService === opt.value}
                    onClick={() => setValue("service", opt.value, { shouldValidate: true })}
                  />
                ))}
              </div>
              <FieldError msg={errors.service?.message} />
            </div>
          )}

          {/* ── Step 3: Household ──────────────────────────────────────────── */}
          {step === 3 && (
            <div>
              <StepHeader title="Tell us about your household" sub="This helps us right-size the system for your actual usage." />
              <div className="space-y-5">
                <div>
                  <Label>How many people live at the property?</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {["1–2", "3–4", "5–6", "7+"].map(v => (
                      <button key={v} type="button"
                        onClick={() => setValue("occupants", v, { shouldValidate: true })}
                        className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                          watch("occupants") === v ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-700 hover:border-slate-400"
                        }`}
                      >{v}</button>
                    ))}
                  </div>
                  <FieldError msg={errors.occupants?.message} />
                </div>

                <div>
                  <Label>Is someone home during the day?</Label>
                  <div className="space-y-2">
                    {["Yes, most days", "Sometimes", "Rarely / no"].map(v => (
                      <RadioRow key={v} name="homeDaytime" value={v} label={v}
                        checked={watch("homeDaytime") === v}
                        onChange={() => setValue("homeDaytime", v, { shouldValidate: true })}
                      />
                    ))}
                  </div>
                  <FieldError msg={errors.homeDaytime?.message} />
                </div>

                <div>
                  <Label>Hot water system type</Label>
                  <div className="space-y-2">
                    {["Gas", "Electric", "Heat pump / other"].map(v => (
                      <RadioRow key={v} name="hotWater" value={v} label={v}
                        checked={watch("hotWater") === v}
                        onChange={() => setValue("hotWater", v, { shouldValidate: true })}
                      />
                    ))}
                  </div>
                  <FieldError msg={errors.hotWater?.message} />
                </div>

                <div>
                  <Label>Gas cooking or heating appliances?</Label>
                  <div className="space-y-2">
                    {["Yes", "No"].map(v => (
                      <RadioRow key={v} name="gasAppliances" value={v} label={v}
                        checked={watch("gasAppliances") === v}
                        onChange={() => setValue("gasAppliances", v, { shouldValidate: true })}
                      />
                    ))}
                  </div>
                  <FieldError msg={errors.gasAppliances?.message} />
                </div>

                <div>
                  <Label>Electric vehicle or planning to get one?</Label>
                  <div className="space-y-2">
                    {["No", "Yes — I have one", "Yes — planning to buy"].map(v => (
                      <RadioRow key={v} name="ev" value={v} label={v}
                        checked={watch("ev") === v}
                        onChange={() => setValue("ev", v, { shouldValidate: true })}
                      />
                    ))}
                  </div>
                  <FieldError msg={errors.ev?.message} />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 4: Goals + Bill ───────────────────────────────────────── */}
          {step === 4 && (
            <div>
              <StepHeader title="Goals & electricity bill" sub="Optional but helpful — upload your bill and we can use real data." />
              <div className="space-y-5">
                <div>
                  <Label>What are your main goals? (optional)</Label>
                  <textarea
                    placeholder="e.g. Lower bills, battery backup for blackouts, environmental reasons..."
                    rows={3}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-900 focus:outline-none focus:border-slate-800 transition-colors resize-none"
                    {...register("goals")}
                  />
                </div>

                <div>
                  <Label>Electricity bill (optional — strongly recommended)</Label>
                  <p className="text-xs text-slate-400 mb-3">
                    Uploading your bill lets Jesse access your NMI data via Powercore for accurate modelling.
                    PDF, JPG or PNG · Max 5 MB
                  </p>
                  {billFile ? (
                    <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{billFile.name}</p>
                        <p className="text-xs text-slate-400">{(billFile.size / 1024 / 1024).toFixed(1)} MB</p>
                      </div>
                      <button type="button" onClick={() => { setBillFile(null); if (fileRef.current) fileRef.current.value = "" }}>
                        <X className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="w-full border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center gap-2 hover:border-slate-400 transition-colors"
                    >
                      <Upload className="w-6 h-6 text-slate-400" />
                      <p className="text-sm text-slate-500">Tap to upload bill</p>
                    </button>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="application/pdf,image/jpeg,image/png"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0]
                      if (f && f.size <= 5 * 1024 * 1024) setBillFile(f)
                      else if (f) alert("File must be under 5 MB")
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 5: Consent + Submit ───────────────────────────────────── */}
          {step === 5 && (
            <div>
              <StepHeader title="Almost done" sub="Your information is handled under the Australian Privacy Principles." />
              <div className="bg-slate-50 rounded-2xl p-5 mb-6">
                <p className="font-semibold text-slate-900 text-sm mb-1">You&apos;re submitting a quote request for:</p>
                <p className="text-slate-600 text-sm">{watch("service")} at {watch("address")}</p>
              </div>

              <div className="mb-6">
                <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  watch("nmiConsent") ? "border-slate-900 bg-slate-50" : "border-slate-200"
                }`}>
                  <input
                    type="checkbox"
                    className="sr-only"
                    {...register("nmiConsent")}
                  />
                  <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center mt-0.5 transition-all ${
                    watch("nmiConsent") ? "bg-slate-900 border-slate-900" : "border-slate-300"
                  }`}>
                    {watch("nmiConsent") && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">I authorise HEA to access my NMI data</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      I authorise Heffernan Electrical Automation to access my electricity consumption data
                      via Powercore, for the purpose of designing a solar/battery system for my property.
                      I can withdraw this consent at any time by contacting HEA in writing.
                    </p>
                  </div>
                </label>
                <FieldError msg={errors.nmiConsent?.message} />
              </div>

              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                  <p className="text-red-700 text-sm">{submitError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-slate-900 text-white font-semibold py-4 rounded-xl text-base flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors disabled:opacity-60"
              >
                {submitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Submitting…</>
                ) : (
                  <>Submit My Quote Request <ChevronRight className="w-5 h-5" /></>
                )}
              </button>
              <p className="text-xs text-slate-400 text-center mt-3">
                Your NMI consent form will be emailed to you immediately.
              </p>
            </div>
          )}
        </div>

        {/* Footer nav */}
        {step < 5 && (
          <div className="flex-shrink-0 px-5 py-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={prevStep}
              className={`text-sm font-medium text-slate-500 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-400 transition-colors ${step === 1 ? "invisible" : ""}`}
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={nextStep}
              className="flex-1 sm:flex-none sm:ml-auto bg-slate-900 text-white font-semibold px-6 py-3 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </form>
    </div>
  )
}

// ── Exported page (Suspense boundary for useSearchParams) ─────────────────────
export default function IntakePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    }>
      <IntakeFormInner />
    </Suspense>
  )
}
