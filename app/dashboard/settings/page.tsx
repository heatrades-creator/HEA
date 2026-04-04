export const metadata = { title: 'Settings | HEA' };

const SECTIONS = [
  {
    title: 'Authorised Users',
    description: 'Google accounts permitted to access the staff dashboard.',
    status: 'hardcoded' as const,
    note: 'Currently hardcoded in /app/api/auth/[...nextauth]/route.ts. Edit the ALLOWED_EMAILS array to add or remove users.',
  },
  {
    title: 'GAS Web App URL',
    description: 'The Google Apps Script endpoint used for all job and document data.',
    status: 'env' as const,
    note: 'Set via JOBS_GAS_URL environment variable in Vercel. Update in Project Settings → Environment Variables after redeploying GAS.',
  },
  {
    title: 'Proposal Daily Limit',
    description: 'Maximum AI proposals that can be generated per day.',
    status: 'gas' as const,
    note: 'Currently hardcoded to 500 in Code.gs → getProposalStats_(). Change the daily_limit value and redeploy.',
  },
  {
    title: 'Google OAuth',
    description: 'OAuth credentials for staff login.',
    status: 'env' as const,
    note: 'Set via GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Vercel environment variables.',
  },
  {
    title: 'Proposal Templates',
    description: 'Google Slides templates used for PDF generation.',
    status: 'sheet' as const,
    note: 'Managed in the TEMPLATE_CONFIG tab of the Google Sheet. Add rows with active = TRUE to enable templates.',
    link: '/dashboard/templates',
    linkLabel: 'View Templates →',
  },
] as const;

const STATUS_STYLES = {
  hardcoded: { label: 'Code', color: 'bg-orange-900/30 text-orange-300 border-orange-800/40' },
  env:       { label: 'Env Var', color: 'bg-blue-900/30 text-blue-300 border-blue-800/40' },
  gas:       { label: 'GAS', color: 'bg-yellow-900/30 text-yellow-300 border-yellow-800/40' },
  sheet:     { label: 'Sheet', color: 'bg-green-900/30 text-green-300 border-green-800/40' },
};

export default function SettingsPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-[#111827] text-xl font-semibold">Settings</h1>
        <p className="text-[#9ca3af] text-sm mt-0.5">
          Configuration reference for the HEA dashboard system
        </p>
      </div>

      <div className="space-y-3">
        {SECTIONS.map((section) => {
          const style = STATUS_STYLES[section.status];
          return (
            <div
              key={section.title}
              className="bg-white border border-[#e5e9f0] rounded-xl p-5"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h2 className="text-[#111827] text-sm font-semibold">{section.title}</h2>
                  <p className="text-[#6b7280] text-xs mt-0.5">{section.description}</p>
                </div>
                <span className={`text-[10px] px-2 py-1 rounded-full border font-medium whitespace-nowrap ${style.color}`}>
                  {style.label}
                </span>
              </div>
              <p className="text-[#9ca3af] text-xs leading-relaxed border-t border-[#e5e9f0] pt-2 mt-2">
                {section.note}
              </p>
              {'link' in section && section.link && (
                <a
                  href={section.link}
                  className="text-[#ffd100] text-xs hover:text-[#e6bc00] transition-colors mt-2 block"
                >
                  {section.linkLabel}
                </a>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 bg-[#f5f7fb] border border-[#e5e9f0] rounded-xl p-5">
        <p className="text-[#ffd100] text-xs font-semibold uppercase tracking-wider mb-3">System Info</p>
        <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-xs">
          <div>
            <p className="text-[#9ca3af] uppercase tracking-wider text-[10px] mb-0.5">Stack</p>
            <p className="text-[#6b7280]">Next.js · TypeScript · Tailwind · NextAuth</p>
          </div>
          <div>
            <p className="text-[#9ca3af] uppercase tracking-wider text-[10px] mb-0.5">Backend</p>
            <p className="text-[#6b7280]">Google Apps Script + Google Sheets</p>
          </div>
          <div>
            <p className="text-[#9ca3af] uppercase tracking-wider text-[10px] mb-0.5">AI Engine</p>
            <p className="text-[#6b7280]">Gemini (via GAS pipeline)</p>
          </div>
          <div>
            <p className="text-[#9ca3af] uppercase tracking-wider text-[10px] mb-0.5">Hosting</p>
            <p className="text-[#6b7280]">Vercel · hea-group.com.au</p>
          </div>
          <div>
            <p className="text-[#9ca3af] uppercase tracking-wider text-[10px] mb-0.5">Output Format</p>
            <p className="text-[#6b7280]">Google Slides → PDF via Drive API</p>
          </div>
          <div>
            <p className="text-[#9ca3af] uppercase tracking-wider text-[10px] mb-0.5">Auth</p>
            <p className="text-[#6b7280]">Google OAuth · 3 whitelisted emails</p>
          </div>
        </div>
      </div>
    </div>
  );
}
