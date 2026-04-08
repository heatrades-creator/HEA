import React from "react";
import { ShieldCheck, MapPin, UserCheck, Wrench, Star } from "lucide-react";

const badges = [
  { icon: ShieldCheck, label: "REC 37307 Licensed" },
  { icon: ShieldCheck, label: "Fully Insured" },
  { icon: MapPin, label: "Bendigo, VIC" },
  { icon: UserCheck, label: "No Salespeople" },
  { icon: Wrench, label: "Direct Installer" },
  { icon: Star, label: "5★ Google Rated" },
];

interface TrustStripProps {
  className?: string;
  dark?: boolean;
}

const TrustStrip = ({ className = "", dark = false }: TrustStripProps) => {
  const text = dark ? "text-slate-300" : "text-slate-600";
  const icon = dark ? "text-yellow-400" : "text-yellow-500";
  const divider = dark ? "border-slate-700" : "border-slate-200";

  return (
    <div className={`flex flex-wrap justify-center items-center gap-x-6 gap-y-2 ${className}`}>
      {badges.map((badge, i) => (
        <React.Fragment key={badge.label}>
          <span className={`flex items-center gap-1.5 text-sm font-medium ${text}`}>
            <badge.icon className={`w-4 h-4 ${icon}`} />
            {badge.label}
          </span>
          {i < badges.length - 1 && (
            <span className={`hidden sm:block w-px h-4 ${divider}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default TrustStrip;
