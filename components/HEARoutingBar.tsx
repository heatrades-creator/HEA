"use client";
import React from "react";
import Link from "next/link";

const ROUTES = [
  {
    label: "Save Money",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    description: "Reduce electricity bills with solar",
    href: null,
    scrollTo: "services",
    color: "yellow",
  },
  {
    label: "Backup Power",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="1" y="6" width="22" height="12" rx="2" />
        <path d="M23 13v-2" />
        <path d="M11 6V4" />
        <path d="M13 6V4" />
      </svg>
    ),
    description: "Battery storage for blackout protection",
    href: "/battery-storage-bendigo",
    scrollTo: null,
    color: "slate",
  },
  {
    label: "EV Charging",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    description: "Home EV charger installation",
    href: "/ev-charger-installation-bendigo",
    scrollTo: null,
    color: "slate",
  },
  {
    label: "Learn",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
    description: "Solar & battery education hub",
    href: "/learning-centre",
    scrollTo: null,
    color: "slate",
  },
];

export default function HEARoutingBar() {
  const handleScrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="py-10 px-4 bg-white border-b border-slate-100">
      <div className="max-w-5xl mx-auto">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">
          What are you here for?
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {ROUTES.map((route) => {
            const isYellow = route.color === "yellow";
            const inner = (
              <>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${isYellow ? "bg-yellow-400 text-slate-900" : "bg-slate-100 text-slate-600"}`}>
                  {route.icon}
                </div>
                <p className="font-bold text-slate-900 text-sm mb-0.5">{route.label}</p>
                <p className="text-slate-500 text-xs leading-snug hidden sm:block">{route.description}</p>
              </>
            );

            const cardClass = `flex flex-col items-center text-center p-5 rounded-2xl border-2 transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-yellow-400
              ${isYellow ? "border-yellow-400 bg-yellow-50 hover:bg-yellow-100" : "border-slate-200 bg-white hover:border-yellow-300 hover:bg-yellow-50/50"}`;

            if (route.scrollTo) {
              return (
                <button
                  key={route.label}
                  onClick={() => handleScrollTo(route.scrollTo!)}
                  className={cardClass}
                >
                  {inner}
                </button>
              );
            }

            return (
              <Link key={route.label} href={route.href!} className={cardClass}>
                {inner}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
