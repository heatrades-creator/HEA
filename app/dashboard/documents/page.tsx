import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { DOCUMENT_REGISTRY, type DocumentConfig } from '@/lib/document-config'
import { DocumentBuilder } from '@/components/dashboard/documents/DocumentBuilder'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Documents | HEA' }

const CONFIG_KEY = 'document_annex_config'

export default async function DocumentsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const row = await prisma.systemConfig.findUnique({ where: { key: CONFIG_KEY } })
  const savedConfig: DocumentConfig = row ? (JSON.parse(row.value) as DocumentConfig) : {}

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-[#111827] text-xl font-semibold">Documents</h1>
        <p className="text-[#6b7280] text-sm mt-0.5">
          {DOCUMENT_REGISTRY.length} document types · Configure which annexes are merged into each one. Toggle off to exclude from a document globally.
        </p>
      </div>

      <DocumentBuilder documents={DOCUMENT_REGISTRY} initialConfig={savedConfig} />

      {/* Naming convention reference */}
      <details className="mt-8 group">
        <summary className="text-[#6b7280] text-xs cursor-pointer select-none hover:text-[#6b7280] transition-colors">
          Naming convention —{' '}
          <span className="group-open:hidden">show</span>
          <span className="hidden group-open:inline">hide</span>
        </summary>
        <div className="mt-3 bg-[#f5f7fb] border border-[#e5e9f0] rounded-xl p-5 space-y-4">
          <div>
            <p className="text-[#ffd100] text-xs font-semibold uppercase tracking-wider mb-2">
              File naming — base documents + annexes
            </p>
            <div className="space-y-1.5 text-xs font-mono">
              <p>
                <span className="text-[#aaa]">Base: </span>
                <span className="text-[#111827]">{'{JOB-ID}-{descriptor}-{Client-Name}-{YYYY-MM-DD}.pdf'}</span>
              </p>
              <p>
                <span className="text-[#aaa]">Annex: </span>
                <span className="text-[#111827]">{'{JOB-ID}-annex-{slug}-{Client-Name}-{YYYY-MM-DD}.pdf'}</span>
              </p>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-[#aaa] uppercase tracking-wider mb-1.5 font-medium">Examples</p>
            <div className="space-y-0.5 text-[10px] font-mono text-[#aaa]">
              <p>TS00001-job-card-John-Smith-2026-05-03.pdf</p>
              <p>TS00001-annex-hea-sa-John-Smith-2026-05-03.pdf</p>
              <p>TS00001-annex-system-spec-John-Smith-2026-05-03.pdf</p>
              <p>TS00001-annex-installer-photos-John-Smith-2026-05-03.pdf</p>
              <p>TS00001-electrical-works-proposal-John-Smith-2026-05-03.pdf</p>
            </div>
          </div>
          <p className="text-[#6b7280] text-xs leading-relaxed">
            When a document is generated for a job, the base PDF is merged with all enabled annexes (in order)
            using <code className="text-[#aaa]">pdf-lib</code>. The merged output is stored in the client&apos;s
            Drive folder under the subdirectory shown on each document card.
          </p>
        </div>
      </details>
    </div>
  )
}
