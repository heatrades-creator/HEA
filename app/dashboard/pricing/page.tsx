import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import QuoteBuilder, { type Bundle, type Extra, type PricingSettings } from '@/components/dashboard/pricing/QuoteBuilder'

type SearchParams = Promise<{ job?: string }>

async function fetchGAS<T>(action: string, params: Record<string, string> = {}): Promise<T | null> {
  const gasUrl = process.env.PRICING_GAS_URL
  if (!gasUrl) return null
  try {
    const q = new URLSearchParams({ action, ...params })
    const text = await fetch(`${gasUrl}?${q}`, { cache: 'no-store' }).then(r => r.text())
    const data = JSON.parse(text)
    if (data.error) return null
    return data as T
  } catch {
    return null
  }
}

export default async function PricingPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const { job: jobNumber } = await searchParams

  // Fetch job info if in quote mode
  let clientName: string | undefined
  if (jobNumber) {
    const gasUrl = process.env.JOBS_GAS_URL
    if (gasUrl) {
      try {
        const text = await fetch(`${gasUrl}?id=${jobNumber}`, { cache: 'no-store' }).then(r => r.text())
        const jobData = JSON.parse(text)
        if (!jobData.error) clientName = jobData.clientName
      } catch { /* non-fatal */ }
    }
  }

  const [bundles1P, bundles3P, extras, settings, sheetUrlData] = await Promise.all([
    fetchGAS<Bundle[]>('getBundles', { phase: '1P' }),
    fetchGAS<Bundle[]>('getBundles', { phase: '3P' }),
    fetchGAS<Extra[]>('getExtras'),
    fetchGAS<PricingSettings>('getSettings'),
    fetchGAS<{ url: string }>('getSheetUrl'),
  ])

  const sheetUrl = sheetUrlData?.url ?? process.env.PRICING_SHEET_URL ?? ''

  const defaultSettings: PricingSettings = {
    salesCommission: 1000,
    installCommission: 2000,
    solarVictoriaRebate: 1400,
    lastUpdated: '',
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Pricing</h1>
          <p className="text-sm text-[#6b7280] mt-0.5">
            {jobNumber ? `Building quote for ${jobNumber}${clientName ? ` — ${clientName}` : ''}` : 'Browse packages and build quotes'}
          </p>
        </div>
        {sheetUrl && (
          <a href={sheetUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#ffd100] text-[#111827] font-bold px-4 py-2 rounded-xl text-sm hover:bg-yellow-300 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Edit in Sheets
          </a>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-[#e5e9f0] p-6">
        <QuoteBuilder
          bundles1P={bundles1P ?? []}
          bundles3P={bundles3P ?? []}
          extras={extras ?? []}
          settings={settings ?? defaultSettings}
          sheetUrl={sheetUrl}
          jobNumber={jobNumber}
          clientName={clientName}
        />
      </div>

      {settings?.lastUpdated && (
        <p className="text-xs text-[#9ca3af] text-center mt-4">Prices last updated: {settings.lastUpdated}</p>
      )}
    </div>
  )
}
