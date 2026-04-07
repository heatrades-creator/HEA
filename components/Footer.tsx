"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import logo from "@/public/Logo_transparent.png";
import { FaInstagram } from "react-icons/fa";
import { FiFacebook } from "react-icons/fi";
import { ExternalLink } from "lucide-react";

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
    phone: "0481 267 812",
    email: "hea.trades@gmail.com",
    facebookUrl: "#",
    instagramUrl: "#",
    copyrightText:
      "\u00a9 2025 Heffernan Electrical Automation. All rights reserved. REC 37307 \u00b7 Licensed & Insured.",
  };

  const footerData = data || defaultData;
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer className="bg-slate-900 text-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center mb-4 w-full">
              <Image src={logo} alt="Logo" height={50} />
            </div>
            <p className="text-white">{footerData.tagline}</p>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-heff">Quick Links</h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <button
                  onClick={() => scrollToSection("services")}
                  className="hover:text-white transition-colors"
                >
                  Services
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("about")}
                  className="hover:text-white transition-colors"
                >
                  About
                </button>
              </li>
              <li>
                <Link href="/book" className="hover:text-white transition-colors">
                  Book a Consultation
                </Link>
              </li>
              <li>
                <Link href="/quote" className="hover:text-white transition-colors">
                  Solar Quote
                </Link>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("contact")}
                  className="hover:text-white transition-colors"
                >
                  Contact
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-heff">Services</h4>
            <ul className="space-y-2 text-slate-400">
              <li className="hover:text-white transition-colors">
                Solar Design &amp; Install
              </li>
              <li className="hover:text-white transition-colors">
                Battery Storage
              </li>
              <li className="hover:text-white transition-colors">
                EV Charging
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-heff">Contact</h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <a href={`tel:${footerData.phone?.replace(/\s/g, "")}`} className="hover:text-white transition-colors">
                  {footerData.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${footerData.email}`} className="hover:text-white transition-colors">
                  {footerData.email}
                </a>
              </li>
              <li className="pt-2">
                <a
                  href="https://g.page/r/CSOEwnVc3aFIEBE/review"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-heffdark hover:text-white transition-colors text-sm"
                >
                  Google Reviews <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li className="pt-4 px-4">
                <div className="flex gap-8 text-white">
                  <a
                    href={footerData.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FiFacebook
                      size={24}
                      className="hover:text-blue-500 cursor-pointer"
                    />
                  </a>
                  <a
                    href={footerData.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaInstagram
                      size={24}
                      className="hover:text-pink-500 cursor-pointer"
                    />
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 text-center text-slate-400">
          <p>
            {footerData.copyrightText}
            <span className="mx-2">\u00b7</span>
            <Link
              href="/dashboard/login"
              className="text-slate-600 hover:text-slate-400 transition-colors"
            >
              Staff
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
