"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import logo from "@/public/Logo_transparent.png";
import { FaInstagram } from "react-icons/fa";
import { FiFacebook } from "react-icons/fi";
import { ExternalLink, Phone, Mail } from "lucide-react";
import { GAS_INTAKE_URL, HEA_PHONE, HEA_EMAIL, HEA_GOOGLE_REVIEWS_URL } from "@/lib/constants";

interface FooterData {
  tagline?: string;
  phone?: string;
  email?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  copyrightText?: string;
}

interface FooterProps {
  data?: FooterData | null;
}

const Footer = ({ data }: FooterProps) => {
  const defaultData = {
    tagline: "Right-sized solar. Real payback. Bendigo's direct installers.",
    phone: HEA_PHONE,
    email: HEA_EMAIL,
    facebookUrl: "#", // TODO_REAL_DATA: add Facebook URL
    instagramUrl: "#", // TODO_REAL_DATA: add Instagram URL
    copyrightText: `© ${new Date().getFullYear()} Heffernan Electrical Automation. All rights reserved. REC 37307 · Licensed & Insured.`,
  };

  const d = data || defaultData;

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer className="bg-slate-900 text-white pt-16 pb-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="mb-4">
              <Image src={logo} alt="HEA Logo" height={48} />
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-5 max-w-xs">{d.tagline}</p>
            <div className="space-y-2">
              <a href={`tel:${(d.phone || HEA_PHONE).replace(/\s/g, "")}`} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
                <Phone className="w-4 h-4 text-yellow-400" /> {d.phone || HEA_PHONE}
              </a>
              <a href={`mailto:${d.email || HEA_EMAIL}`} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
                <Mail className="w-4 h-4 text-yellow-400" /> {d.email || HEA_EMAIL}
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-bold mb-4 text-white text-sm uppercase tracking-wider">Services</h4>
            <ul className="space-y-2.5 text-slate-400 text-sm">
              <li><Link href="/solar-installation-bendigo" className="hover:text-white transition-colors">Solar Installation</Link></li>
              <li><Link href="/battery-storage-bendigo" className="hover:text-white transition-colors">Battery Storage</Link></li>
              <li><Link href="/ev-charger-installation-bendigo" className="hover:text-white transition-colors">EV Charging</Link></li>
              <li><Link href="/solar-battery-packages" className="hover:text-white transition-colors">Solar + Battery Packages</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold mb-4 text-white text-sm uppercase tracking-wider">Company</h4>
            <ul className="space-y-2.5 text-slate-400 text-sm">
              <li><Link href="/why-hea" className="hover:text-white transition-colors">Why HEA</Link></li>
              <li><Link href="/how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
              <li><Link href="/faqs" className="hover:text-white transition-colors">FAQs</Link></li>
              <li><Link href="/learning-centre" className="hover:text-white transition-colors">Learning Centre</Link></li>
              <li><button onClick={() => scrollToSection("general-enquiry")} className="hover:text-white transition-colors">Contact</button></li>
            </ul>
          </div>

          {/* Locations + Social */}
          <div>
            <h4 className="font-bold mb-4 text-white text-sm uppercase tracking-wider">Service Areas</h4>
            <ul className="space-y-2.5 text-slate-400 text-sm mb-6">
              <li><Link href="/bendigo-solar-installer" className="hover:text-white transition-colors">Bendigo Solar</Link></li>
              <li><Link href="/bendigo-battery-installer" className="hover:text-white transition-colors">Bendigo Battery</Link></li>
              <li><Link href="/bendigo-ev-charger" className="hover:text-white transition-colors">Bendigo EV Charger</Link></li>
            </ul>
            <a href={HEA_GOOGLE_REVIEWS_URL} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-yellow-400 hover:text-yellow-300 transition-colors text-sm mb-4">
              Google Reviews <ExternalLink className="w-3 h-3" />
            </a>
            <div className="flex gap-5 text-slate-400 mt-2">
              <a href={d.facebookUrl} target="_blank" rel="noopener noreferrer"><FiFacebook size={20} className="hover:text-white transition-colors" /></a>
              <a href={d.instagramUrl} target="_blank" rel="noopener noreferrer"><FaInstagram size={20} className="hover:text-pink-400 transition-colors" /></a>
            </div>
          </div>
        </div>

        {/* Bottom CTA strip */}
        <div className="border-t border-slate-800 pt-8 pb-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-xs text-center sm:text-left">
            {d.copyrightText}
            <span className="mx-2">·</span>
            <Link href="/dashboard/login" className="text-slate-700 hover:text-slate-500 transition-colors">Staff</Link>
          </p>
          <a
            href={GAS_INTAKE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-yellow-400 text-slate-900 font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-yellow-300 transition-colors whitespace-nowrap flex-shrink-0"
          >
            Get My Solar Estimate
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
