import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import HEAEstimator from "@/components/HEAEstimator";
import BatteryDecisionEngine from "@/components/BatteryDecisionEngine";
import { getFooterData } from "@/lib/sanity";
import {
  CheckCircle, Zap, Battery, Bot, Code2, Globe, ArrowRight,
  Star, ShieldCheck, RefreshCw, Layers,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Solar Website Plugins | HEA Group",
  description:
    "Drop professional solar lead tools onto your Wix, Squarespace or WordPress site in minutes. One-time purchase. No developers needed.",
};

// ─── Pricing ──────────────────────────────────────────────────────────────────

const PLUGINS = [
  {
    id: "estimator",
    icon: <Zap className="w-6 h-6" />,
    iconBg: "bg-yellow-400",
    name: "Solar Savings Estimator",
    tagline: "Turn bill shock into quote requests",
    description:
      "An interactive 4-question calculator that instantly shows visitors their estimated system size, price range, annual savings, and a 15-year payback chart. No backend needed — runs entirely in the browser.",
    features: [
      "Live 15-year savings chart",
      "Instant indicative pricing",
      "Customise your CTA URL & button label",
      "Works in any iframe-capable site builder",
      "Zero hosting or backend required",
    ],
    price: 97,
    embedPath: "/embed/estimator",
    badge: "Most Popular",
    badgeColor: "bg-yellow-400 text-slate-900",
  },
  {
    id: "battery-quiz",
    icon: <Battery className="w-6 h-6" />,
    iconBg: "bg-emerald-500",
    name: "Battery Decision Quiz",
    tagline: "Help visitors decide before they call",
    description:
      "A 4-step guided quiz that scores usage patterns, backup needs, solar status, and EV ownership — then delivers a personalised YES / MAYBE / NOT YET verdict with a recommended battery size and financial note.",
    features: [
      "Smart scoring engine (no AI costs)",
      "3 possible outcomes with reasoning",
      "Recommended kWh size per profile",
      "Customise your CTA URL & button label",
      "Mobile-first, instant load",
    ],
    price: 67,
    embedPath: "/embed/battery-quiz",
    badge: null,
    badgeColor: "",
  },
  {
    id: "advisor",
    icon: <Bot className="w-6 h-6" />,
    iconBg: "bg-blue-500",
    name: "AI Solar Advisor",
    tagline: "Qualify leads before they even call",
    description:
      "A conversational lead qualification widget that branches through goal, bill range, and usage questions — then delivers a tailored system recommendation. Optional AI explanation via Gemini API (bring your own key).",
    features: [
      "Goal-based branching logic",
      "Tailored system recommendation",
      "Optional Gemini AI explanation",
      "Auto-triggers on scroll or time delay",
      "Remembers dismissed state (localStorage)",
    ],
    price: 97,
    embedPath: null,
    badge: "Coming Soon",
    badgeColor: "bg-slate-700 text-white",
  },
] as const;

const BUNDLE_PRICE = 197;

// ─── How it works steps ───────────────────────────────────────────────────────

const HOW_STEPS = [
  {
    num: "01",
    title: "Purchase",
    body: "One-time payment. You'll receive an email with your embed code within minutes.",
  },
  {
    num: "02",
    title: "Customise",
    body: "Set your CTA URL (your contact page, quote form, or phone number) and button label.",
  },
  {
    num: "03",
    title: "Paste & go",
    body: "Drop one line of HTML into any Wix, Squarespace, Webflow, or WordPress page. Done.",
  },
];

// ─── Builders ─────────────────────────────────────────────────────────────────

const BUILDERS = ["Wix", "Squarespace", "Webflow", "WordPress", "Framer", "Shopify"];

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: "Do I need a developer?",
    a: "No. You paste one line of HTML into any HTML embed block or custom code section. Every major site builder supports this.",
  },
  {
    q: "Is this a subscription?",
    a: "No. One-time purchase, unlimited use on your site. There are no ongoing fees — we host the widget for you.",
  },
  {
    q: "Can I change the button colour or text?",
    a: "Yes. You set the CTA button label and destination URL when you receive your embed code. Further design customisation (colours, fonts) is available on request.",
  },
  {
    q: "Will it slow down my website?",
    a: "No. The widget loads asynchronously inside an iframe — it has zero impact on your page load score.",
  },
  {
    q: "Can I use it on multiple pages or sites?",
    a: "Each purchase covers one domain. Contact us if you need multi-site licensing.",
  },
  {
    q: "What if I need something custom?",
    a: "We build bespoke lead tools for solar and electrical businesses. Email us and we'll scope it.",
  },
];

// ─── Embed code snippet ───────────────────────────────────────────────────────

function EmbedCodeBlock({ path, label }: { path: string; label: string }) {
  const snippet = `<iframe\n  src="https://hea-group.com.au${path}?cta=YOUR_URL&label=${encodeURIComponent(label)}"\n  width="100%"\n  height="680"\n  frameborder="0"\n  style="border-radius:16px;"\n></iframe>`;
  return (
    <pre className="bg-slate-950 text-slate-300 text-xs rounded-xl p-4 overflow-x-auto leading-relaxed font-mono border border-slate-800">
      {snippet}
    </pre>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PluginsPage() {
  const footerData = await getFooterData();

  return (
    <>
      <Nav />

      {/* ── HERO ── */}
      <section className="bg-slate-900 text-white pt-28 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 rounded-full px-4 py-1.5 mb-6">
            <Layers className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-yellow-400 text-xs font-bold uppercase tracking-wider">Solar Website Plugins</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6">
            Turn your website into a{" "}
            <span className="text-yellow-400">lead machine</span>
          </h1>
          <p className="text-slate-300 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Professional interactive tools — built for solar installers, electricians, and energy retailers.
            Embed in Wix, Squarespace or any site builder in under 5 minutes. No developers needed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#plugins"
              className="inline-flex items-center justify-center gap-2 bg-yellow-400 text-slate-900 font-bold px-8 py-4 rounded-xl hover:bg-yellow-300 transition-all text-base"
            >
              Browse Plugins
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="mailto:hea.trades@gmail.com?subject=Plugin%20enquiry"
              className="inline-flex items-center justify-center gap-2 border-2 border-slate-600 text-white font-semibold px-8 py-4 rounded-xl hover:border-yellow-400 hover:text-yellow-400 transition-all text-base"
            >
              Ask a question
            </a>
          </div>
        </div>

        {/* Trust strip */}
        <div className="max-w-3xl mx-auto mt-16 grid grid-cols-3 gap-6 text-center border-t border-slate-800 pt-10">
          {[
            { icon: <ShieldCheck className="w-5 h-5 text-yellow-400 mx-auto mb-2" />, label: "One-time price", sub: "No subscriptions" },
            { icon: <RefreshCw className="w-5 h-5 text-yellow-400 mx-auto mb-2" />, label: "We host it", sub: "Zero backend needed" },
            { icon: <Globe className="w-5 h-5 text-yellow-400 mx-auto mb-2" />, label: "Any site builder", sub: "Wix · Squarespace · Webflow" },
          ].map((item) => (
            <div key={item.label}>
              {item.icon}
              <p className="text-white font-bold text-sm">{item.label}</p>
              <p className="text-slate-400 text-xs mt-0.5">{item.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PLUGINS ── */}
      <section id="plugins" className="bg-white py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">The Plugins</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Pick your tool</h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">
              Each plugin is a proven conversion tool built and battle-tested on a real solar business website.
            </p>
          </div>

          <div className="space-y-24">
            {PLUGINS.map((plugin) => (
              <div key={plugin.id} className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
                {/* Info */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className={`${plugin.iconBg} p-2.5 rounded-xl text-slate-900`}>{plugin.icon}</div>
                    {plugin.badge && (
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${plugin.badgeColor}`}>
                        {plugin.badge}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">{plugin.name}</h3>
                    <p className="text-yellow-600 font-semibold text-sm mb-4">{plugin.tagline}</p>
                    <p className="text-slate-600 leading-relaxed">{plugin.description}</p>
                  </div>
                  <ul className="space-y-2.5">
                    {plugin.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-slate-700">
                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex items-baseline gap-2 mb-5">
                      <span className="text-4xl font-extrabold text-slate-900">${plugin.price}</span>
                      <span className="text-slate-400 text-sm">AUD · one-time</span>
                    </div>
                    {plugin.id !== "advisor" ? (
                      <div className="flex flex-col sm:flex-row gap-3">
                        <a
                          href={`mailto:hea.trades@gmail.com?subject=Purchase: ${encodeURIComponent(plugin.name)}&body=Hi, I'd like to purchase the ${plugin.name} plugin for $${plugin.price} AUD. My website URL is: `}
                          className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white font-bold px-6 py-3.5 rounded-xl hover:bg-slate-700 transition-all text-sm"
                        >
                          Buy Now — ${plugin.price} AUD
                          <ArrowRight className="w-4 h-4" />
                        </a>
                        {plugin.embedPath && (
                          <Link
                            href={plugin.embedPath}
                            target="_blank"
                            className="inline-flex items-center justify-center gap-2 border-2 border-slate-200 text-slate-700 font-semibold px-6 py-3.5 rounded-xl hover:border-yellow-400 hover:text-slate-900 transition-all text-sm"
                          >
                            Try Live Demo →
                          </Link>
                        )}
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 border-2 border-slate-200 text-slate-500 font-semibold px-6 py-3.5 rounded-xl text-sm">
                        Coming soon — <a href="mailto:hea.trades@gmail.com?subject=Notify me: AI Advisor plugin" className="text-yellow-600 hover:underline">notify me</a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Live demo */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-1">
                  <div className="bg-slate-200 rounded-t-xl px-4 py-2 flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <div className="flex-1 bg-white rounded-md px-3 py-1 text-xs text-slate-400 font-mono truncate">
                      yoursite.com.au · Live preview
                    </div>
                  </div>
                  <div className="p-3">
                    {plugin.id === "estimator" && <HEAEstimator />}
                    {plugin.id === "battery-quiz" && <BatteryDecisionEngine />}
                    {plugin.id === "advisor" && (
                      <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center">
                        <Bot className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm font-medium">AI Advisor preview coming soon</p>
                        <p className="text-slate-300 text-xs mt-1">Sign up to be notified when it launches</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BUNDLE ── */}
      <section className="bg-yellow-400 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-slate-900/10 rounded-full px-4 py-1.5 mb-4">
            <Star className="w-3.5 h-3.5 text-slate-900" />
            <span className="text-slate-900 text-xs font-bold uppercase tracking-wider">Best Value</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">
            Get all 3 plugins for ${BUNDLE_PRICE}
          </h2>
          <p className="text-slate-800 mb-2">
            Solar Estimator + Battery Quiz + AI Advisor (when released)
          </p>
          <p className="text-slate-700 text-sm mb-8">
            Save ${(PLUGINS[0].price + PLUGINS[1].price + PLUGINS[2].price) - BUNDLE_PRICE} vs buying separately · AI Advisor included at no extra cost when it launches
          </p>
          <a
            href={`mailto:hea.trades@gmail.com?subject=Purchase: All Plugins Bundle $${BUNDLE_PRICE}&body=Hi, I'd like to purchase the full plugin bundle for $${BUNDLE_PRICE} AUD. My website URL is: `}
            className="inline-flex items-center gap-2 bg-slate-900 text-white font-bold px-10 py-4 rounded-xl hover:bg-slate-700 transition-all text-base"
          >
            Buy the Bundle — ${BUNDLE_PRICE} AUD
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-slate-50 py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Simple Setup</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Up and running in 5 minutes</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_STEPS.map((step) => (
              <div key={step.num} className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="text-4xl font-extrabold text-yellow-400 mb-4 font-mono">{step.num}</div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EMBED CODE PREVIEW ── */}
      <section className="bg-slate-900 py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <Code2 className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">This is your entire embed code</h2>
            <p className="text-slate-400 text-sm">One line. Paste it anywhere that accepts HTML.</p>
          </div>
          <EmbedCodeBlock path="/embed/estimator" label="Get My Accurate Quote" />
          <p className="text-slate-500 text-xs text-center mt-4">
            Replace <code className="text-yellow-400">YOUR_URL</code> with your contact page or intake form URL.
          </p>

          {/* Builder logos */}
          <div className="mt-12 border-t border-slate-800 pt-10 text-center">
            <p className="text-slate-500 text-xs uppercase tracking-widest font-bold mb-5">Works with every major site builder</p>
            <div className="flex flex-wrap gap-3 justify-center">
              {BUILDERS.map((b) => (
                <span
                  key={b}
                  className="bg-slate-800 border border-slate-700 text-slate-300 text-sm font-semibold px-4 py-2 rounded-lg"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">FAQ</p>
            <h2 className="text-3xl font-extrabold text-slate-900">Common questions</h2>
          </div>
          <div className="space-y-6">
            {FAQS.map((faq) => (
              <div key={faq.q} className="border-b border-slate-100 pb-6">
                <h3 className="font-bold text-slate-900 mb-2">{faq.q}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="bg-slate-900 py-20 px-4 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Ready to get more leads from your website?
          </h2>
          <p className="text-slate-400 mb-8">
            One-time purchase. We handle hosting. You keep every lead.
          </p>
          <a
            href="#plugins"
            className="inline-flex items-center gap-2 bg-yellow-400 text-slate-900 font-bold px-10 py-4 rounded-xl hover:bg-yellow-300 transition-all text-base"
          >
            Choose a Plugin
            <ArrowRight className="w-4 h-4" />
          </a>
          <p className="text-slate-600 text-sm mt-4">
            Questions? <a href="mailto:hea.trades@gmail.com" className="text-yellow-400 hover:underline">hea.trades@gmail.com</a>
          </p>
        </div>
      </section>

      <Footer data={footerData} />
    </>
  );
}
