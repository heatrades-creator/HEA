"use client";

import React, { useState } from "react";
import { User, Mail, Phone, Briefcase, MessageSquare, Send, ChevronRight } from "lucide-react";

const SERVICE_OPTIONS = [
  { value: "solar", label: "Solar System" },
  { value: "battery", label: "Battery Storage" },
  { value: "ev", label: "EV Charger" },
  { value: "electrical", label: "General Electrical" },
  { value: "other", label: "Other / Not Sure" },
];

interface FormState {
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
}

export default function ConsultationForm() {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    service: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function set(field: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.name || !form.email || !form.phone || !form.service || !form.message) {
      setError("Please fill in all fields.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong.");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send. Please call us on 0481 267 812.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-sm">
        <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <ChevronRight className="w-7 h-7 text-yellow-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">You&apos;re all set!</h3>
        <p className="text-slate-500 mb-1">Jesse will be in touch within 24 hours.</p>
        <p className="text-slate-400 text-sm">Check your inbox for a confirmation.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-5">
      {/* Name */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          Full Name
        </label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={form.name}
            onChange={e => set("name", e.target.value)}
            placeholder="Jane Smith"
            autoComplete="name"
            className="w-full pl-11 pr-4 py-3.5 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 transition-colors text-sm"
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="email"
            value={form.email}
            onChange={e => set("email", e.target.value)}
            placeholder="jane@example.com"
            autoComplete="email"
            className="w-full pl-11 pr-4 py-3.5 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 transition-colors text-sm"
          />
        </div>
      </div>

      {/* Phone */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          Phone
        </label>
        <div className="relative">
          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="tel"
            value={form.phone}
            onChange={e => set("phone", e.target.value)}
            placeholder="04xx xxx xxx"
            autoComplete="tel"
            className="w-full pl-11 pr-4 py-3.5 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 transition-colors text-sm"
          />
        </div>
      </div>

      {/* Service */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          What are you interested in?
        </label>
        <div className="relative">
          <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select
            value={form.service}
            onChange={e => set("service", e.target.value)}
            className={`w-full pl-11 pr-4 py-3.5 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 transition-colors appearance-none cursor-pointer text-sm ${
              form.service ? "text-slate-900" : "text-slate-400"
            }`}
          >
            <option value="">Select a service…</option>
            {SERVICE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Message */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          Message
        </label>
        <div className="relative">
          <MessageSquare className="absolute left-4 top-4 w-4 h-4 text-slate-400 pointer-events-none" />
          <textarea
            value={form.message}
            onChange={e => set("message", e.target.value)}
            placeholder="Tell us a bit about your property and what you're looking to achieve…"
            rows={4}
            className="w-full pl-11 pr-4 py-3.5 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 transition-colors resize-none text-sm"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-yellow-400 text-slate-900 font-bold py-4 rounded-xl text-base flex items-center justify-center gap-2 hover:bg-yellow-300 transition-colors disabled:opacity-60"
      >
        <span>{submitting ? "Sending…" : "Send Message"}</span>
        <Send className="w-4 h-4" />
      </button>

      <p className="text-center text-xs text-slate-400">
        No obligation · Jesse responds within 24 hours · REC 37307
      </p>
    </form>
  );
}
