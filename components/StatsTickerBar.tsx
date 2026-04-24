"use client";
import React, { useEffect, useRef, useState } from "react";

// Update these numbers as installs grow
const STATS = [
  { value: 47,   prefix: "",  suffix: "+",   label: "Systems Installed" },
  { value: 312,  prefix: "",  suffix: " kW",  label: "Total Capacity Deployed" },
  { value: 1400, prefix: "$", suffix: "k+",   label: "Est. Customer Savings" },
];

// ─── Count-up hook — IntersectionObserver + rAF, no library needed ────────────

function useCountUp(target: number, duration = 1800) {
  const ref = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = performance.now();

          const tick = (now: number) => {
            const progress = Math.min((now - startTime) / duration, 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
          };

          requestAnimationFrame(tick);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return { count, ref };
}

// ─── Single stat ──────────────────────────────────────────────────────────────

function Stat({ value, prefix, suffix, label }: { value: number; prefix: string; suffix: string; label: string }) {
  const { count, ref } = useCountUp(value);

  return (
    <div ref={ref} className="flex flex-col items-center">
      <span className="text-4xl sm:text-5xl font-bold text-white tabular-nums">
        {prefix}{count.toLocaleString("en-AU")}{suffix}
      </span>
      <span className="text-slate-400 text-sm mt-2 font-medium">{label}</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function StatsTickerBar() {
  return (
    <section className="py-14 px-4 bg-slate-900">
      <div className="max-w-4xl mx-auto">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-500 mb-10">
          HEA by the numbers
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 text-center">
          {STATS.map((stat) => (
            <Stat key={stat.label} {...stat} />
          ))}
        </div>
      </div>
    </section>
  );
}
