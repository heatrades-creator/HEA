export const dynamic = 'force-dynamic';
export const metadata = { title: 'Templates | HEA' };

type Template = {
  doc_class: string;
  template_id: string;
  display_name: string;
  active?: boolean;
  [key: string]: unknown;
};

async function getTemplates(): Promise<Template[]> {
  const gasUrl = process.env.JOBS_GAS_URL;
  if (!gasUrl) return [];
  try {
    const res = await fetch(`${gasUrl}?action=getAvailableTemplates`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

const DOC_CLASS_COLORS: Record<string, string> = {
  solar_battery_proposal: 'bg-yellow-900/30 text-yellow-300 border-yellow-800/40',
  solar_proposal:         'bg-blue-900/30 text-blue-300 border-blue-800/40',
  battery_proposal:       'bg-purple-900/30 text-purple-300 border-purple-800/40',
  ev_charger_proposal:    'bg-green-900/30 text-green-300 border-green-800/40',
};

function docClassColor(docClass: string): string {
  return DOC_CLASS_COLORS[docClass] ?? 'bg-[#2a2a2a] text-[#aaa] border-[#333]';
}

function formatDocClass(s: string): string {
  return s.split(/[_\s]+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export default async function TemplatesPage() {
  const templates = await getTemplates();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-white text-xl font-semibold">Proposal Templates</h1>
        <p className="text-[#555] text-sm mt-0.5">
          {templates.length > 0
            ? `${templates.length} active template${templates.length !== 1 ? 's' : ''} configured`
            : 'Templates are configured in the TEMPLATE_CONFIG sheet in Google Sheets'}
        </p>
      </div>

      {templates.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {templates.map((t) => (
            <TemplateCard key={t.doc_class} template={t} />
          ))}
        </div>
      )}

      {/* How templates work */}
      <details className="mt-8 group">
        <summary className="text-[#444] text-xs cursor-pointer hover:text-[#666] transition-colors select-none">
          How templates work —{' '}
          <span className="group-open:hidden">show details</span>
          <span className="hidden group-open:inline">hide</span>
        </summary>
        <div className="mt-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 space-y-3">
          <div>
            <p className="text-[#ffd100] text-xs font-semibold uppercase tracking-wider mb-2">
              TEMPLATE_CONFIG sheet columns
            </p>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#2a2a2a]">
                  {['doc_class', 'template_id', 'active', 'display_name'].map((h) => (
                    <th key={h} className="pb-2 text-left text-[#444] font-mono">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2 text-[#888] font-mono">solar_battery_proposal</td>
                  <td className="py-2 text-[#888] font-mono">1INXF_5V9…</td>
                  <td className="py-2 text-green-400 font-mono">TRUE</td>
                  <td className="py-2 text-[#888]">Solar + Battery</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[#555] text-xs leading-relaxed">
            To add a new template: create a Google Slides presentation, copy its file ID, and add a new row
            to the <span className="text-[#888]">TEMPLATE_CONFIG</span> sheet with <span className="text-green-400 font-mono">active = TRUE</span>.
            The template will appear here and be selectable from a job&apos;s detail page.
          </p>
        </div>
      </details>
    </div>
  );
}

function TemplateCard({ template }: { template: Template }) {
  const colorClass = docClassColor(String(template.doc_class));
  const displayName = template.display_name || formatDocClass(String(template.doc_class));

  return (
    <div className="bg-[#202020] border border-[#2e2e2e] rounded-xl p-5 flex flex-col gap-3 hover:border-[#3a3a3a] transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-white font-semibold text-sm">{displayName}</h3>
          <p className="text-[#555] text-xs font-mono mt-0.5">{template.doc_class}</p>
        </div>
        <span className={`text-[10px] px-2 py-1 rounded-full border font-medium whitespace-nowrap ${colorClass}`}>
          Active
        </span>
      </div>

      <div className="border-t border-[#2a2a2a] pt-3">
        <p className="text-[#444] text-[10px] uppercase tracking-wider mb-1">Template ID</p>
        <p className="text-[#666] text-xs font-mono truncate">{template.template_id}</p>
      </div>

      <a
        href={`https://docs.google.com/presentation/d/${template.template_id}/edit`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto text-xs text-[#ffd100] hover:text-[#e6bc00] transition-colors flex items-center gap-1"
      >
        Open in Slides
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-[#202020] border border-[#2e2e2e] rounded-xl p-12 text-center">
      <div className="w-12 h-12 bg-[#2a2a2a] rounded-xl flex items-center justify-center mx-auto mb-4">
        <svg className="w-6 h-6 text-[#444]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      </div>
      <p className="text-white text-sm font-medium mb-1">No templates configured</p>
      <p className="text-[#555] text-xs max-w-xs mx-auto leading-relaxed">
        Add rows to the <span className="text-[#888]">TEMPLATE_CONFIG</span> sheet in Google Sheets
        with <span className="text-green-400 font-mono text-[10px]">active = TRUE</span> to see templates here.
      </p>
    </div>
  );
}
