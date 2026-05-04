'use client';

import React, { useState, useEffect, useCallback } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface GASJob {
  jobNumber: string;
  clientName: string;
  phone?: string;
  email?: string;
  address?: string;
  systemSize?: string;
  batterySize?: string;
  annualBill?: string;
  notes?: string;
  driveUrl?: string;
  [key: string]: unknown;
}

interface OSData {
  projectId: number | null;
  shareLink: string | null;
  systemKw: number | null;
  outputKwh: number | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  roofType: string | null;
  storeys: number | null;
  occupants: string | null;
  ev: string | null;
  financeRequired: boolean | null;
  phases: number | null;
  liveProject: Record<string, unknown> | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseClientName(full: string): { first: string; last: string | null } {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: null };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

function parseFloat_(s: string | undefined | null): number | null {
  if (!s) return null;
  const n = parseFloat(String(s).replace(/[^0-9.]/g, ''));
  return isNaN(n) ? null : n;
}

function detectPackageName(
  systemKw: number | null,
  batteryKwh: number | null,
  brand: string
): string {
  const b = batteryKwh ? ` – ${brand || 'Fox'}` : '';
  if (systemKw && batteryKwh)
    return `${systemKw}kW Solar + ${batteryKwh}kWh Battery + 10kW inverter${b}`;
  if (systemKw && !batteryKwh)
    return `${systemKw}kW Solar Only`;
  if (!systemKw && batteryKwh)
    return `${batteryKwh}kWh Battery Only${b}`;
  return 'Select package above';
}

function y(v: unknown): string {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'string') return JSON.stringify(v);
  return String(v);
}

function buildPacketYaml(
  job: GASJob,
  os: OSData,
  brand: string,
  systemKw: number | null,
  batteryKwh: number | null
): string {
  const { first, last } = parseClientName(job.clientName ?? '');
  const packageName = detectPackageName(systemKw, batteryKwh, brand);
  const annualBill = parseFloat_(job.annualBill);
  const hasEv = os.ev && os.ev !== 'No';
  const goal = os.financeRequired ? 'maximize_savings' : 'self_consumption';

  return `job_meta:
  job_reference: ${y(job.jobNumber)}
  priority: null
  target_design_due_date_local: null
  timezone_offset_hours: "+10"

customer:
  first_name: ${y(first)}
  last_name: ${y(last)}
  phone: ${y(job.phone ?? null)}
  email: ${y(job.email ?? null)}

site_address:
  street_address_line1: ${y(job.address ?? null)}
  locality: ${y(os.suburb)}
  state: ${y(os.state)}
  postcode: ${y(os.postcode)}
  country_iso2: "AU"
  notes_for_access: null

utility_and_usage:
  utility_name: null
  retailer_plan_name: null
  tariff_name_or_id: null
  meter_identifier: null
  phases: ${y(os.phases)}
  supply_main_limit_amps: null
  export_limit_kw: null
  import_limit_kw: null
  annual_kwh: null
  quarterly_kwh: [null, null, null, null]
  monthly_kwh: [null, null, null, null, null, null, null, null, null, null, null, null]
  bill_type: "dollars"
  annual_bill_aud: ${y(annualBill)}
  demand_charges: null
  tou_details: null

package_selection:
  package_id: null
  package_name: ${y(packageName)}
  brand_choice: ${y(batteryKwh ? (brand || null) : null)}
  solar_kw_target: ${y(systemKw ?? 6.6)}
  battery_kwh_target: ${y(batteryKwh)}
  inverter_kw_target: ${batteryKwh ? '10' : 'null'}
  panel_brand_model: "Jinko 470W"
  panel_component_code: null
  inverter_component_code: null
  battery_component_code: null
  battery_module_count: null
  battery_coupling: null
  preferred_control_scheme: null

roof_and_structure:
  roof_type: ${y(os.roofType)}
  number_of_storeys: ${y(os.storeys)}
  roof_age_years: null
  rafter_truss_type: null
  available_roof_faces:
    - face_name: null
      tilt_deg: null
      azimuth_deg: null
      usable_area_notes: null
  obstructions: []
  setbacks_requirements:
    ridge_mm: null
    hip_valley_mm: null
    edge_mm: null
    fire_setback_mm: null
  mounting_preferences:
    roof_only_or_ground_ok: "Roof"
    mounting_system: null
    panel_orientation_preference: null

electrical_and_compliance:
  main_switchboard_location: null
  switchboard_upgrade_required: null
  earthing_notes: null
  single_line_diagram_notes: null
  ct_metering_required: null
  dnsP_requirements_notes: null
  rapid_shutdown_required: null
  as_nzs_3000_notes: null
  as_nzs_4777_notes: null

design_preferences_and_constraints:
  keep_exact_package_sizes: true
  allow_split_arrays: null
  max_panels: null
  min_panels: null
  shade_mitigation_preference: null
  aesthetic_constraints: null
  future_expansion_notes: ${hasEv ? y('EV charger planned') : 'null'}

battery_backup_requirements:
  backup_required: ${y(batteryKwh ? true : null)}
  essential_loads_list: null
  backup_hours: null
  continuous_power_kw: null
  peak_power_kw: null

attachments_provided:
  electricity_bill: ${y(annualBill ? 'yes — annual bill amount only, no PDF' : null)}
  site_photos: null
  roof_plan_or_measurements: null
  switchboard_photos: null
  dnsP_approval_docs: null

final_checks:
  confirm_customer_goal: ${y(goal)}
  confirm_export_limit_kw: null
  confirm_battery_coupling: null
  confirm_template_to_use_exact_name: ${y(packageName)}`;
}

function buildAdaCommand(
  job: GASJob,
  systemKw: number | null,
  batteryKwh: number | null,
  brand: string
): string {
  const pkg = detectPackageName(systemKw, batteryKwh, brand);
  const addr = [job.address].filter(Boolean).join(', ');
  return `Project: ${addr || job.jobNumber}. Package: ${pkg}. Constraint: keep ${systemKw ?? 6.6}kW exactly. Generate from the template and then help me tweak export limit if needed.`;
}

const ADA_SYSTEM_PROMPT = `You are "Claude Code" acting as an operations co-pilot for a solar installer using OpenSolar. You will collaborate with "Ada" (OpenSolar assistant) to automate as much as possible without using any paid/API features. The goal is rapid designs with minimal clicks by using a small set of predesigned system templates and then doing small confirmations/tweaks (not manual layout).

Our standard packages (templates) — all use Jinko 470W panels:
1) 6.6kW Solar Only
2) 28kWh Battery Only – Fox | 28kWh Battery Only – Alpha
3) 14kWh Battery Only – Fox | 14kWh Battery Only – Alpha
4) 6.6kW Solar + 28kWh Battery + 10kW inverter (Fox/Alpha)
5) 6.6kW Solar + 14kWh Battery + 10kW inverter (Fox/Alpha)

When I message Ada, I always provide: Project (address or ID), Package, Constraints, Desired outcome. Keep Ada's work template-first: generate, then confirm/tweak.`;

// ── Component ─────────────────────────────────────────────────────────────────

export default function OpenSolarPanel({ job }: { job: GASJob }) {
  const [os, setOs]           = useState<OSData | null>(null);
  const [loading, setLoading] = useState(true);

  // Package overrides (defaults come from job fields)
  const defaultSystemKw  = parseFloat_(job.systemSize);
  const defaultBatteryKwh = parseFloat_(job.batterySize as string | undefined);

  const [systemKw, setSystemKw]      = useState<number | null>(defaultSystemKw);
  const [batteryKwh, setBatteryKwh]  = useState<number | null>(defaultBatteryKwh);
  const [brand, setBrand]            = useState<'Fox' | 'Alpha'>('Fox');

  // Project link state
  const [projectIdInput, setProjectIdInput] = useState('');
  const [shareLinkInput, setShareLinkInput] = useState('');
  const [saving, setSaving]   = useState(false);
  const [saveError, setSaveError] = useState('');

  // Clipboard feedback
  const [copiedPacket, setCopiedPacket]   = useState(false);
  const [copiedCommand, setCopiedCommand] = useState(false);
  const [copiedPrompt, setCopiedPrompt]   = useState(false);

  // Tabs
  const [tab, setTab] = useState<'packet' | 'link'>('packet');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/dashboard/jobs/${job.jobNumber}/opensolar`);
      if (res.ok) {
        const data = await res.json() as OSData;
        setOs(data);
        if (data.projectId) setProjectIdInput(String(data.projectId));
        if (data.shareLink) setShareLinkInput(data.shareLink);
      }
    } finally {
      setLoading(false);
    }
  }, [job.jobNumber]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function saveProjectId() {
    const pid = parseInt(projectIdInput.trim(), 10);
    if (isNaN(pid)) { setSaveError('Enter a valid numeric project ID'); return; }
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch(`/api/dashboard/jobs/${job.jobNumber}/opensolar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: pid, shareLink: shareLinkInput.trim() || null }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { error?: string };
        setSaveError(d.error ?? 'Save failed');
        return;
      }
      await fetchData();
    } catch {
      setSaveError('Network error');
    } finally {
      setSaving(false);
    }
  }

  function copy(text: string, setter: (v: boolean) => void) {
    navigator.clipboard.writeText(text).then(() => {
      setter(true);
      setTimeout(() => setter(false), 2000);
    });
  }

  const packet  = os ? buildPacketYaml(job, os, brand, systemKw, batteryKwh) : '';
  const command = buildAdaCommand(job, systemKw, batteryKwh, brand);

  const pkgName = detectPackageName(systemKw, batteryKwh, brand);
  const isLinked = !!(os?.projectId);

  return (
    <div className="rounded-xl border border-[#e5e9f0] bg-white overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#e5e9f0] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔆</span>
          <h3 className="text-[#111827] font-semibold text-sm">OpenSolar Design</h3>
          {isLinked && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
              Linked #{os!.projectId}
            </span>
          )}
        </div>
        {isLinked && os?.shareLink && (
          <a
            href={os.shareLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-medium text-[#6b7280] hover:text-[#111827] underline"
          >
            Share link ↗
          </a>
        )}
      </div>

      {/* Package selector */}
      <div className="px-5 py-4 border-b border-[#e5e9f0] bg-[#f9fafb]">
        <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide mb-2">Package</p>
        <div className="flex flex-wrap gap-2 mb-2">
          {/* Solar size */}
          {([null, 6.6] as (number | null)[]).map((kw) => (
            <button
              key={String(kw)}
              onClick={() => setSystemKw(kw)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                systemKw === kw
                  ? 'bg-[#ffd100] border-[#ffd100] text-[#111827]'
                  : 'bg-white border-[#e5e9f0] text-[#6b7280] hover:border-[#ffd100]'
              }`}
            >
              {kw ? `${kw}kW Solar` : 'No Solar'}
            </button>
          ))}

          {/* Battery size */}
          {([null, 14, 28] as (number | null)[]).map((kwh) => (
            <button
              key={String(kwh)}
              onClick={() => setBatteryKwh(kwh)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                batteryKwh === kwh
                  ? 'bg-[#ffd100] border-[#ffd100] text-[#111827]'
                  : 'bg-white border-[#e5e9f0] text-[#6b7280] hover:border-[#ffd100]'
              }`}
            >
              {kwh ? `${kwh}kWh Battery` : 'No Battery'}
            </button>
          ))}

          {/* Brand — only when battery selected */}
          {batteryKwh && (
            <>
              {(['Fox', 'Alpha'] as const).map((b) => (
                <button
                  key={b}
                  onClick={() => setBrand(b)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                    brand === b
                      ? 'bg-[#111827] border-[#111827] text-white'
                      : 'bg-white border-[#e5e9f0] text-[#6b7280] hover:border-[#111827]'
                  }`}
                >
                  {b}
                </button>
              ))}
            </>
          )}
        </div>
        <p className="text-xs text-[#111827] font-medium">{pkgName}</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#e5e9f0]">
        {(['packet', 'link'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              tab === t
                ? 'border-[#ffd100] text-[#111827]'
                : 'border-transparent text-[#6b7280] hover:text-[#111827]'
            }`}
          >
            {t === 'packet' ? 'Ada Packet' : 'Link Project'}
          </button>
        ))}
      </div>

      {tab === 'packet' && (
        <div className="p-5 space-y-4">

          {/* Step 1 — Ada system prompt */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-semibold text-[#111827]">
                Step 1 — Paste this system prompt to Ada once per session
              </p>
              <button
                onClick={() => copy(ADA_SYSTEM_PROMPT, setCopiedPrompt)}
                className="text-[11px] font-medium text-[#6b7280] hover:text-[#111827] transition-colors"
              >
                {copiedPrompt ? '✅ Copied' : 'Copy ↗'}
              </button>
            </div>
            <div className="bg-[#f9fafb] rounded-lg border border-[#e5e9f0] px-3 py-2 text-[11px] text-[#6b7280] font-mono leading-relaxed line-clamp-3">
              {ADA_SYSTEM_PROMPT.slice(0, 180)}…
            </div>
          </div>

          {/* Step 2 — Ada command */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-semibold text-[#111827]">
                Step 2 — Send this command to Ada
              </p>
              <button
                onClick={() => copy(command, setCopiedCommand)}
                className="text-[11px] font-medium text-[#6b7280] hover:text-[#111827] transition-colors"
              >
                {copiedCommand ? '✅ Copied' : 'Copy ↗'}
              </button>
            </div>
            <div className="bg-[#fffbea] rounded-lg border border-[#ffd100]/40 px-3 py-2 text-xs text-[#111827] font-mono leading-relaxed">
              {command}
            </div>
          </div>

          {/* Step 3 — Full Zero-Guess packet */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-semibold text-[#111827]">
                Step 3 — Attach Zero-Guess Job Packet (if Ada asks for more detail)
              </p>
              <button
                onClick={() => copy(packet, setCopiedPacket)}
                className="text-[11px] font-medium text-[#6b7280] hover:text-[#111827] transition-colors"
              >
                {copiedPacket ? '✅ Copied' : 'Copy ↗'}
              </button>
            </div>
            {loading ? (
              <div className="bg-[#f9fafb] rounded-lg border border-[#e5e9f0] px-3 py-4 text-xs text-[#9ca3af] text-center">
                Loading lead data…
              </div>
            ) : (
              <pre className="bg-[#f9fafb] rounded-lg border border-[#e5e9f0] px-3 py-3 text-[10px] font-mono text-[#374151] leading-relaxed overflow-x-auto max-h-64 overflow-y-auto whitespace-pre">
                {packet}
              </pre>
            )}
          </div>

          <div className="flex gap-2">
            <a
              href="https://app.opensolar.com/220067/projects"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center text-xs font-semibold py-2.5 rounded-lg border border-[#e5e9f0] bg-white text-[#111827] hover:border-[#ffd100] hover:bg-[#fffbea] transition-colors"
            >
              Open OpenSolar ↗
            </a>
          </div>
        </div>
      )}

      {tab === 'link' && (
        <div className="p-5 space-y-4">
          <p className="text-xs text-[#6b7280] leading-relaxed">
            After Ada designs the project in OpenSolar, paste the project ID here to link it to this job.
            The project ID appears in the OpenSolar URL: <code className="bg-[#f9fafb] px-1 rounded text-[#111827]">/projects/12345/</code>
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">OpenSolar Project ID</label>
              <input
                type="number"
                value={projectIdInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProjectIdInput(e.target.value)}
                placeholder="e.g. 123456"
                className="w-full px-3 py-2 text-sm border border-[#e5e9f0] rounded-lg focus:outline-none focus:border-[#ffd100] focus:ring-1 focus:ring-[#ffd100]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">Share Link (optional)</label>
              <input
                type="url"
                value={shareLinkInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShareLinkInput(e.target.value)}
                placeholder="https://app.opensolar.com/..."
                className="w-full px-3 py-2 text-sm border border-[#e5e9f0] rounded-lg focus:outline-none focus:border-[#ffd100] focus:ring-1 focus:ring-[#ffd100]"
              />
            </div>
          </div>

          {saveError && (
            <p className="text-xs text-red-600">{saveError}</p>
          )}

          <button
            onClick={saveProjectId}
            disabled={saving || !projectIdInput}
            className="w-full py-2.5 rounded-lg bg-[#ffd100] text-[#111827] text-sm font-semibold hover:bg-[#f5c800] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving…' : 'Link Project'}
          </button>

          {/* Linked project summary */}
          {isLinked && os && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 space-y-1">
              <p className="text-xs font-semibold text-green-800">Project linked ✓</p>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-green-700">
                <span>ID: {os.projectId}</span>
                {os.systemKw   && <span>System: {os.systemKw}kW</span>}
                {os.outputKwh  && <span>Output: {os.outputKwh.toLocaleString()} kWh/yr</span>}
              </div>
              {os.shareLink && (
                <a
                  href={os.shareLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-[11px] text-green-700 underline mt-1"
                >
                  Customer proposal link ↗
                </a>
              )}
              {os.liveProject && (
                <a
                  href={`https://app.opensolar.com/220067/projects/${os.projectId}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-[11px] text-green-700 underline"
                >
                  Open in OpenSolar ↗
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
