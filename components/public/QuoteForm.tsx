"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const schema = z.object({
  firstName:     z.string().min(1, "Required").max(100),
  lastName:      z.string().min(1, "Required").max(100),
  email:         z.string().email("Enter a valid email"),
  phone:         z.string().min(8, "Enter a valid phone number").max(20),
  address:       z.string().min(5, "Enter your street address").max(300),
  suburb:        z.string().min(2, "Required").max(100),
  state:         z.enum(["NSW", "VIC", "QLD", "SA", "WA", "TAS", "ACT", "NT"], {
    message: "Select a state",
  }),
  postcode:      z.string().regex(/^\d{4}$/, "Enter a 4-digit postcode"),
  annualBillAud: z.number().min(0).max(50000).optional(),
  roofType:      z.enum(["tile", "metal", "flat", "other"]).optional(),
  storeys:       z.number().min(1).max(10).optional(),
  notes:         z.string().max(2000).optional(),
})

type FormData = z.infer<typeof schema>

export function QuoteForm() {
  const [submitted, setSubmitted] = useState(false)
  const [submittedName, setSubmittedName] = useState("")
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setServerError(null)
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          annualBillAud: data.annualBillAud ?? undefined,
          storeys:       data.storeys ?? undefined,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setServerError(body?.error?.formErrors?.[0] ?? "Something went wrong. Please try again.")
        return
      }
      setSubmittedName(data.firstName)
      setSubmitted(true)
    } catch {
      setServerError("Network error. Please check your connection and try again.")
    }
  }

  if (submitted) {
    return (
      <div className="rounded-xl bg-green-950 border border-green-800 p-8 text-center">
        <div className="text-4xl mb-4">☀️</div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Thanks {submittedName}!
        </h3>
        <p className="text-[#aaa]">
          We&apos;ve received your request and will review your details. We&apos;ll be in touch shortly.
        </p>
      </div>
    )
  }

  const inputClass =
    "w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg px-4 py-3 text-white placeholder-[#555] focus:outline-none focus:border-[#ffd100] transition-colors"
  const labelClass = "block text-sm font-medium text-[#aaa] mb-1.5"
  const errorClass = "text-red-400 text-xs mt-1"

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Row 1: Name */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>First name</label>
          <input {...register("firstName")} placeholder="Jane" className={inputClass} />
          {errors.firstName && <p className={errorClass}>{errors.firstName.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Last name</label>
          <input {...register("lastName")} placeholder="Smith" className={inputClass} />
          {errors.lastName && <p className={errorClass}>{errors.lastName.message}</p>}
        </div>
      </div>

      {/* Row 2: Contact */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Email</label>
          <input {...register("email")} type="email" placeholder="jane@example.com" className={inputClass} />
          {errors.email && <p className={errorClass}>{errors.email.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Phone</label>
          <input {...register("phone")} type="tel" placeholder="04xx xxx xxx" className={inputClass} />
          {errors.phone && <p className={errorClass}>{errors.phone.message}</p>}
        </div>
      </div>

      {/* Row 3: Address */}
      <div>
        <label className={labelClass}>Street address</label>
        <input {...register("address")} placeholder="123 Smith Street" className={inputClass} />
        {errors.address && <p className={errorClass}>{errors.address.message}</p>}
      </div>

      {/* Row 4: Suburb / State / Postcode */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1">
          <label className={labelClass}>Suburb</label>
          <input {...register("suburb")} placeholder="Bendigo" className={inputClass} />
          {errors.suburb && <p className={errorClass}>{errors.suburb.message}</p>}
        </div>
        <div>
          <label className={labelClass}>State</label>
          <select {...register("state")} className={inputClass}>
            <option value="">Select…</option>
            {["NSW","VIC","QLD","SA","WA","TAS","ACT","NT"].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {errors.state && <p className={errorClass}>{errors.state.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Postcode</label>
          <input {...register("postcode")} placeholder="3550" maxLength={4} className={inputClass} />
          {errors.postcode && <p className={errorClass}>{errors.postcode.message}</p>}
        </div>
      </div>

      {/* Powercor NMI lookup helper */}
      <p className="text-xs text-[#888]">
        Need your NMI number?{" "}
        <a
          href="https://myenergy.powercor.com.au/s/nmi-register"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#ffd100] hover:underline"
        >
          Look it up on Powercor →
        </a>
      </p>

      {/* Row 5: Annual power bill */}
      <div>
        <label className={labelClass}>
          Roughly how much is your power bill per year?{" "}
          <span className="text-[#555] font-normal">(optional)</span>
        </label>
        <input
          {...register("annualBillAud", { setValueAs: v => v === "" ? undefined : Number(v) })}
          type="number"
          min={0}
          placeholder="$2,500"
          className={inputClass}
        />
      </div>

      {/* Row 6: Roof type & storeys */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>
            Roof type <span className="text-[#555] font-normal">(optional)</span>
          </label>
          <select {...register("roofType")} className={inputClass}>
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
          <select {...register("storeys", { setValueAs: v => v === "" ? undefined : Number(v) })} className={inputClass}>
            <option value="">Select…</option>
            <option value="1">1 storey</option>
            <option value="2">2 storeys</option>
            <option value="3">3+ storeys</option>
          </select>
        </div>
      </div>

      {/* Row 7: Notes */}
      <div>
        <label className={labelClass}>
          Anything else we should know? <span className="text-[#555] font-normal">(optional)</span>
        </label>
        <textarea
          {...register("notes")}
          rows={3}
          placeholder="e.g. We have a pool, EV charger, or specific budget in mind…"
          className={`${inputClass} resize-none`}
        />
      </div>

      {serverError && (
        <p className="text-red-400 text-sm bg-red-950/50 border border-red-800 rounded-lg px-4 py-3">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-[#ffd100] text-black font-semibold py-3.5 rounded-lg hover:bg-[#e6bc00] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Sending…" : "Get My Free Solar Quote"}
      </button>

      <p className="text-center text-[#555] text-xs">
        No spam. No automated calls. We&apos;ll review your details personally and get back to you.
      </p>
    </form>
  )
}
