import { ANNEX_REGISTRY, type AnnexDef } from '@/lib/document-config'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Templates | HEA' }

type AnnexTemplateInfo = {
  slug: string
  editUrl: string | null
  configured: boolean
}

async function fetchAnnexTemplateInfo(): Promise<AnnexTemplateInfo[]> {
  try {
    const h = await headers()
    const host = h.get('host') ?? 'localhost:3000'
    const proto = host.startsWith('localhost') ? 'http' : 'https'
    const res = await fetch(`${proto}://${host}/api/dashboard/annex-templates`, {
      cache: 'no-store',
    })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export default async function TemplatesPage() {
  const session = await getServerSession(authOptions)
  const templateInfoList: AnnexTemplateInfo[] = session ? await fetchAnnexTemplateInfo() : []
  const templateMap = Object.fromEntries(templateInfoList.map((t) => [t.slug, t]))

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-[#111827] text-xl font-semibold">Annex Templates</h1>
        <p className="text-[#6b7280] text-sm mt-0.5">
          {ANNEX_REGISTRY.length} reusable building blocks · Each annex is a self-contained PDF
          module that plugs into any document via the Documents page.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ANNEX_REGISTRY.map((annex) => (
          <AnnexCard
            key={annex.slug}
            annex={annex}
            templateInfo={templateMap[annex.slug] ?? null}
          />
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
            Annexes are modular PDF chunks that attach to a base document. Each annex has a fixed
            slug, data source, and naming convention. Annexes are generated independently and merged
            into the final document using{' '}
            <code className="text-[#aaa]">pdf-lib</code> at generation time.
          </p>
          <div>
            <p className="text-[10px] text-[#aaa] uppercase tracking-wider mb-1.5 font-medium">
              Two generation engines
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <span className="font-medium text-[#374151]">Engine A — Google Slides</span>
                {' '}· Site Assessment, Financial Outcomes, System Spec, NMI Data. Master template
                lives in Drive. Each job gets its own editable Slides copy.
              </li>
              <li>
                <span className="font-medium text-[#374151]">Engine B — pdf-lib</span>
                {' '}· Client Photos (intake / follow-up), Installer Photos. Live Drive photos
                embedded directly into a PDF contact sheet.
              </li>
            </ul>
          </div>
          <div>
            <p className="text-[10px] text-[#aaa] uppercase tracking-wider mb-1.5 font-medium">
              Annex naming convention
            </p>
            <p className="font-mono text-[#111827] text-[11px]">
              {'{JOB-ID}-annex-{slug}-{Client-Name}-{YYYY-MM-DD}.pdf'}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-[#aaa] uppercase tracking-wider mb-1.5 font-medium">
              Document build process
            </p>
            <ol className="list-decimal list-inside space-y-1 text-xs text-[#6b7280]">
              <li>Base document PDF is generated with job data</li>
              <li>Each enabled annex PDF is generated from its data source</li>
              <li>Base + enabled annexes are merged in order using pdf-lib</li>
              <li>Merged PDF is stored in the client Drive folder</li>
            </ol>
          </div>
          <p>
            Enable or disable individual annexes per document type on the{' '}
            <a
              href="/dashboard/documents"
              className="text-[#ffd100] hover:text-[#e6bc00] transition-colors"
            >
              Documents page
            </a>
            .
          </p>
        </div>
      </details>
    </div>
  )
}

function AnnexCard({
  annex,
  templateInfo,
}: {
  annex: AnnexDef
  templateInfo: AnnexTemplateInfo | null
}) {
  const slidesEditUrl = templateInfo?.editUrl ?? null
  const isSlidesAnnex = ['site-assessment', 'financial-outcomes', 'system-spec', 'nmi-data'].includes(
    annex.slug
  )
  const isPhotoAnnex = ['client-photos-intake', 'client-photos-followup', 'installer-photos'].includes(
    annex.slug
  )

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
          <p className="text-[10px] font-mono text-[#aaa] break-all leading-relaxed">
            {annex.filePattern}
          </p>
        </div>

        {/* Edit link */}
        {isSlidesAnnex && (
          <div className="pt-1">
            {slidesEditUrl ? (
              <a
                href={slidesEditUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg bg-[#111827] text-[#ffd100] text-[11px] font-semibold hover:bg-[#1f2937] transition-colors"
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit master template
              </a>
            ) : (
              <span className="text-[10px] text-[#bbb]">Run setupAnnexTemplates in GAS to enable</span>
            )}
          </div>
        )}

        {isPhotoAnnex && (
          <div className="pt-1">
            <span className="text-[11px] text-[#6b7280]">
              Edit via Drive <code className="font-mono text-[#aaa]">05-photos/</code> folder on
              each job
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
