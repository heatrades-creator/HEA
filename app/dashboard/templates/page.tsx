import { ANNEX_REGISTRY, type AnnexDef } from '@/lib/document-config'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Templates | HEA' }

export default function TemplatesPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-[#111827] text-xl font-semibold">Annex Templates</h1>
        <p className="text-[#6b7280] text-sm mt-0.5">
          {ANNEX_REGISTRY.length} reusable building blocks · Each annex is a self-contained PDF module that
          plugs into any document via the Documents page.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ANNEX_REGISTRY.map((annex) => (
          <AnnexCard key={annex.slug} annex={annex} />
        ))}
      </div>

      {/* How annexes work */}
      <details className="mt-8 group">
        <summary className="text-[#6b7280] text-xs cursor-pointer select-none hover:text-[#6b7280] transition-colors">
          How annexes work —{' '}
          <span className="group-open:hidden">show</span>
          <span className="hidden group-open:inline">hide</span>
        </summary>
        <div className="mt-3 bg-[#f5f7fb] border border-[#e5e9f0] rounded-xl p-5 space-y-4 text-xs text-[#6b7280] leading-relaxed">
          <p>
            Annexes are modular PDF chunks that attach to a base document. Each annex has a fixed slug,
            data source, and naming convention. Annexes are generated independently and merged into
            the final document using <code className="text-[#aaa]">pdf-lib</code> at generation time.
          </p>
          <div>
            <p className="text-[10px] text-[#aaa] uppercase tracking-wider mb-1.5 font-medium">Annex naming convention</p>
            <p className="font-mono text-[#111827] text-[11px]">
              {'{JOB-ID}-annex-{slug}-{Client-Name}-{YYYY-MM-DD}.pdf'}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-[#aaa] uppercase tracking-wider mb-1.5 font-medium">Document build process</p>
            <ol className="list-decimal list-inside space-y-1 text-xs text-[#6b7280]">
              <li>Base document PDF is generated with job data</li>
              <li>Each enabled annex PDF is generated from its data source</li>
              <li>Base + enabled annexes are merged in order using pdf-lib</li>
              <li>Merged PDF is stored in the client Drive folder</li>
            </ol>
          </div>
          <p>
            Enable or disable individual annexes per document type on the{' '}
            <a href="/dashboard/documents" className="text-[#ffd100] hover:text-[#e6bc00] transition-colors">
              Documents page
            </a>
            .
          </p>
        </div>
      </details>
    </div>
  )
}

function AnnexCard({ annex }: { annex: AnnexDef }) {
  return (
    <div className="bg-white border border-[#e5e9f0] rounded-xl p-5 flex flex-col gap-3 hover:border-[#d0d5dd] transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-[#111827] font-semibold text-sm leading-snug">{annex.name}</h3>
          <p className="text-[10px] font-mono text-[#bbb] mt-0.5 truncate">{annex.slug}</p>
        </div>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full border font-medium whitespace-nowrap shrink-0 ${
            annex.status === 'available'
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-[#f5f7fb] text-[#bbb] border-[#e5e9f0]'
          }`}
        >
          {annex.status === 'available' ? 'Available' : 'Planned'}
        </span>
      </div>

      {/* Description */}
      <p className="text-[#6b7280] text-xs leading-relaxed flex-1">{annex.description}</p>

      {/* Metadata */}
      <div className="border-t border-[#e5e9f0] pt-3 space-y-2">
        <div>
          <p className="text-[10px] text-[#bbb] uppercase tracking-wider mb-0.5">Source</p>
          <p className="text-xs text-[#6b7280]">{annex.source}</p>
        </div>
        <div>
          <p className="text-[10px] text-[#bbb] uppercase tracking-wider mb-0.5">Drive folder</p>
          <p className="text-xs font-mono text-[#6b7280]">{annex.driveSubfolder}</p>
        </div>
        <div>
          <p className="text-[10px] text-[#bbb] uppercase tracking-wider mb-0.5">File naming</p>
          <p className="text-[10px] font-mono text-[#aaa] break-all leading-relaxed">{annex.filePattern}</p>
        </div>
      </div>
    </div>
  )
}
