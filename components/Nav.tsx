"use client";
import React, { useState, useEffect } from "react";
import { X, Menu, Shield, LayoutDashboard, Sun } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import logo from "@/public/Logo_transparent.png";

const Nav = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isStaffOpen, setIsStaffOpen] = useState(false);
  const { data: session } = useSession();

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setIsMenuOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close staff panel on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsStaffOpen(false);
    };
    if (isStaffOpen) {
      window.addEventListener("keydown", handleEscape);
    }
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isStaffOpen]);

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled ? "bg-white shadow-lg" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 md:grid-cols-2 justify-stretch items-center h-20 mx-4">
          <div className="md:hidden"></div>
          <div className="flex items-center">
            <div>
              <Image src={logo} alt="Logo" height={50} />
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex justify-end items-center space-x-8 px-4">
            <button
              onClick={() => scrollToSection("services")}
              className="text-slate-700 text-lg hover:text-heffdark transition-colors"
            >
              Services
            </button>
            <button
              onClick={() => scrollToSection("about")}
              className="text-slate-700 text-lg hover:text-heffdark transition-colors"
            >
              About
            </button>
            <Link
              href="/book"
              className="bg-heffdarkgray text-white px-6 py-2 rounded-lg transition-all duration-200 hover:shadow-lg hover:bg-heffdark hover:scale-105"
            >
              Book a Consultation
            </Link>
            {session && (
              <button
                onClick={() => setIsStaffOpen(true)}
                className="text-slate-400 hover:text-heffdark transition-colors"
                aria-label="Staff tools"
                title="Staff tools"
              >
                <Shield className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-slate-700 flex items-center justify-end"
            aria-label="Menu"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-4 py-4 space-y-3">
            <button
              onClick={() => scrollToSection("services")}
              className="block w-full text-left py-2 text-slate-700"
            >
              Services
            </button>
            <button
              onClick={() => scrollToSection("about")}
              className="block w-full text-left py-2 text-slate-700"
            >
              About
            </button>
            <button
              onClick={() => scrollToSection("testimonials")}
              className="block w-full text-left py-2 text-slate-700"
            >
              Reviews
            </button>
            <Link
              href="/book"
              onClick={() => setIsMenuOpen(false)}
              className="block w-full text-left py-2 text-blue-600 font-semibold"
            >
              Book a Consultation
            </Link>
            {session && (
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsStaffOpen(true);
                }}
                className="flex items-center gap-2 w-full text-left py-2 text-slate-400"
              >
                <Shield className="w-4 h-4" />
                Staff Tools
              </button>
            )}
          </div>
        </div>
      )}

      {/* Staff Slide-out Panel */}
      {isStaffOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={() => setIsStaffOpen(false)}
          />
          {/* Panel */}
          <div className="fixed top-0 right-0 h-full w-72 bg-[#1a1a1a] border-l border-[#2e2e2e] z-50 shadow-2xl animate-slide-in">
            <div className="flex items-center justify-between p-5 border-b border-[#2e2e2e]">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#ffd100]" />
                <span className="text-white font-semibold">Staff Tools</span>
              </div>
              <button
                onClick={() => setIsStaffOpen(false)}
                className="text-[#666] hover:text-white transition-colors"
                aria-label="Close staff menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-1">
              <p className="text-[#555] text-xs uppercase tracking-wider px-3 mb-3">
                Backend
              </p>
              <Link
                href="/dashboard"
                onClick={() => setIsStaffOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-[#ccc] hover:bg-[#252525] hover:text-[#ffd100] transition-colors"
              >
                <LayoutDashboard className="w-5 h-5" />
                <span className="text-sm font-medium">Dashboard</span>
              </Link>
              <Link
                href="/solar-analyser"
                onClick={() => setIsStaffOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-[#ccc] hover:bg-[#252525] hover:text-[#ffd100] transition-colors"
              >
                <Sun className="w-5 h-5" />
                <span className="text-sm font-medium">Solar Analyser</span>
              </Link>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#2e2e2e]">
              <p className="text-[#444] text-xs text-center">
                {session?.user?.email}
              </p>
            </div>
          </div>
        </>
      )}
    </nav>
  );
};

export default Nav;
