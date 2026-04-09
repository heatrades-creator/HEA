"use client"

import { useState } from "react"
import Link from "next/link"
import SignOutButton from "@/app/dashboard/SignOutButton"

const NAV_LINKS = [
  { href: "/admin",       label: "Overview" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/jobs",  label: "Jobs" },
  { href: "/admin/audit", label: "Audit Log" },
]

const linkClass =
  "block px-3 py-2 rounded-lg text-sm text-[#d6d6d6] hover:text-[#ffd100] hover:bg-[#2a2a2a] transition-colors"

export function AdminNav({ userEmail }: { userEmail: string }) {
  const [open, setOpen] = useState(false)

  return (
    <nav className="bg-[#202020] border-b border-[#2e2e2e]">
      {/* ── Top bar ─────────────────────────────────────────── */}
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/admin" onClick={() => setOpen(false)}>
          <img src="/Logo_transparent.png" alt="HEA" className="h-9 w-auto" />
        </Link>

        {/* Desktop nav links */}
        <div className="hidden sm:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className={linkClass}>
              {label}
            </Link>
          ))}
        </div>

        {/* Desktop right side */}
        <div className="hidden sm:flex items-center gap-4">
          {userEmail && (
            <span className="text-[#555] text-sm">{userEmail}</span>
          )}
          <Link
            href="/dashboard"
            className="text-xs text-[#555] hover:text-[#aaa] transition-colors"
          >
            Job CRM →
          </Link>
          <SignOutButton />
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(o => !o)}
          className="sm:hidden p-2 rounded-lg text-[#aaa] hover:text-white hover:bg-[#2a2a2a] transition-colors"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* ── Mobile dropdown ──────────────────────────────────── */}
      {open && (
        <div className="sm:hidden border-t border-[#2e2e2e] px-3 pb-3 space-y-0.5">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={linkClass}
            >
              {label}
            </Link>
          ))}
          <div className="border-t border-[#2e2e2e] mt-2 pt-2 space-y-0.5">
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className={linkClass}
            >
              Job CRM →
            </Link>
            {userEmail && (
              <p className="px-3 py-1.5 text-xs text-[#555] truncate">{userEmail}</p>
            )}
            <div className="px-3 py-1">
              <SignOutButton />
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
