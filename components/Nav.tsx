"use client";
import React, { useState, useEffect, useRef } from "react";
import { X, Menu, Shield, LayoutDashboard, Sun, Zap, ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import logo from "@/public/Logo_transparent.png";
import { GAS_INTAKE_URL } from "@/lib/constants";

const SERVICES_LINKS = [
  { label: "Solar Installation", href: "/solar-installation-bendigo", desc: "Design & install for Bendigo homes" },
  { label: "Battery Storage", href: "/battery-storage-bendigo", desc: "Right-sized backup & savings" },
  { label: "EV Charging", href: "/ev-charger-installation-bendigo", desc: "Solar-integrated EV chargers" },
  { label: "Solar + Battery Packages", href: "/solar-battery-packages", desc: "Combined systems from day one" },
];

const Nav = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isStaffOpen, setIsStaffOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const servicesRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setIsMenuOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setIsStaffOpen(false); setServicesOpen(false); }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  // Close services dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (servicesRef.current && !servicesRef.current.contains(e.target as Node)) {
        setServicesOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const navLinkClass = "text-slate-700 text-sm font-medium hover:text-yellow-600 transition-colors";

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled ? "bg-white/95 backdrop-blur-sm shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div
            onDoubleClick={() => (window.location.href = "/dashboard")}
            className="cursor-pointer flex-shrink-0"
          >
            <Image src={logo} alt="HEA Logo" height={44} />
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-7">
            {/* Services dropdown */}
            <div ref={servicesRef} className="relative">
              <button
                onClick={() => setServicesOpen(!servicesOpen)}
                className={`${navLinkClass} flex items-center gap-1`}
              >
                Services
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${servicesOpen ? "rotate-180" : ""}`} />
              </button>
              {servicesOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50">
                  {SERVICES_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setServicesOpen(false)}
                      className="flex flex-col px-5 py-3 hover:bg-slate-50 transition-colors"
                    >
                      <span className="font-semibold text-slate-900 text-sm">{link.label}</span>
                      <span className="text-xs text-slate-400 mt-0.5">{link.desc}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link href="/pricing" className={navLinkClass}>Pricing</Link>
            <Link href="/how-it-works" className={navLinkClass}>How It Works</Link>
            <Link href="/why-hea" className={navLinkClass}>About</Link>
            <Link href="/faqs" className={navLinkClass}>FAQs</Link>

            <a
              href={GAS_INTAKE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-yellow-400 text-slate-900 font-bold px-5 py-2.5 rounded-xl text-sm transition-all duration-200 hover:bg-yellow-300 hover:shadow-lg"
            >
              Book Consultation
            </a>

            {session && (
              <button
                onClick={() => setIsStaffOpen(true)}
                className="text-slate-300 hover:text-yellow-500 transition-colors"
                aria-label="Staff tools"
              >
                <Shield className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Mobile burger */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-slate-700"
            aria-label="Menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 shadow-lg">
          <div className="px-5 py-4 space-y-1">
            {/* Services accordion */}
            <button
              onClick={() => setMobileServicesOpen(!mobileServicesOpen)}
              className="flex items-center justify-between w-full py-3 text-slate-800 font-medium text-sm"
            >
              Services
              <ChevronDown className={`w-4 h-4 transition-transform ${mobileServicesOpen ? "rotate-180" : ""}`} />
            </button>
            {mobileServicesOpen && (
              <div className="pl-4 space-y-1 pb-2">
                {SERVICES_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="block py-2 text-slate-600 text-sm hover:text-yellow-600 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}

            <Link href="/pricing" onClick={() => setIsMenuOpen(false)} className="block py-3 text-slate-800 font-medium text-sm">Pricing</Link>
            <Link href="/how-it-works" onClick={() => setIsMenuOpen(false)} className="block py-3 text-slate-800 font-medium text-sm">How It Works</Link>
            <Link href="/why-hea" onClick={() => setIsMenuOpen(false)} className="block py-3 text-slate-800 font-medium text-sm">About</Link>
            <Link href="/faqs" onClick={() => setIsMenuOpen(false)} className="block py-3 text-slate-800 font-medium text-sm">FAQs</Link>
            <button onClick={() => scrollToSection("general-enquiry")} className="block w-full text-left py-3 text-slate-800 font-medium text-sm">Contact</button>

            <a
              href={GAS_INTAKE_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMenuOpen(false)}
              className="block w-full text-center mt-2 bg-yellow-400 text-slate-900 font-bold py-3 rounded-xl text-sm"
            >
              Book a Consultation
            </a>

            {session && (
              <button
                onClick={() => { setIsMenuOpen(false); setIsStaffOpen(true); }}
                className="flex items-center gap-2 w-full text-left py-3 text-slate-400 text-sm"
              >
                <Shield className="w-4 h-4" /> Staff Tools
              </button>
            )}
          </div>
        </div>
      )}

      {/* Staff Slide-out Panel */}
      {isStaffOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={() => setIsStaffOpen(false)} />
          <div className="fixed top-0 right-0 h-full w-72 bg-[#1a1a1a] border-l border-[#2e2e2e] z-50 shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#2e2e2e]">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#ffd100]" />
                <span className="text-white font-semibold">Staff Tools</span>
              </div>
              <button onClick={() => setIsStaffOpen(false)} className="text-[#666] hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-1">
              <p className="text-[#555] text-xs uppercase tracking-wider px-3 mb-3">Backend</p>
              <Link href="/dashboard" onClick={() => setIsStaffOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-lg text-[#ccc] hover:bg-[#252525] hover:text-[#ffd100] transition-colors">
                <LayoutDashboard className="w-5 h-5" />
                <span className="text-sm font-medium">Dashboard</span>
              </Link>
              <Link href="/solar-analyser" onClick={() => setIsStaffOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-lg text-[#ccc] hover:bg-[#252525] hover:text-[#ffd100] transition-colors">
                <Sun className="w-5 h-5" />
                <span className="text-sm font-medium">Solar Analyser</span>
              </Link>
              <Link href="/admin" onClick={() => setIsStaffOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-lg text-[#ccc] hover:bg-[#252525] hover:text-[#ffd100] transition-colors">
                <Zap className="w-5 h-5" />
                <span className="text-sm font-medium">OpenSolar Admin</span>
              </Link>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#2e2e2e]">
              <p className="text-[#444] text-xs text-center">{session?.user?.email}</p>
            </div>
          </div>
        </>
      )}
    </nav>
  );
};

export default Nav;
