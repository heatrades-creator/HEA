import { prisma } from '@/lib/db'
import { getFooterData } from '@/lib/sanity'
import Footer from '@/components/Footer'

export const dynamic = 'force-dynamic'

export default async function InstallerAppPage() {
  const [urlCfg, versionCfg, footer] = await Promise.all([
    prisma.systemConfig.findUnique({ where: { key: 'installer_apk_url' } }),
    prisma.systemConfig.findUnique({ where: { key: 'installer_apk_version' } }),
    getFooterData(),
  ])

  const apkUrl = urlCfg?.value ?? null
  const version = versionCfg?.value ?? null

  // Extract last 5 chars of APK filename as a build ID hint (e.g. "7A1mE")
  const buildId = apkUrl
    ? (() => {
        const name = (apkUrl.split('/').pop() ?? '').replace(/\.apk$/i, '')
        return name.length >= 5 ? name.slice(-5) : null
      })()
    : null

  return (
    <>
      <main className="min-h-screen bg-[#111827] flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 rounded-2xl bg-[#ffd100] flex items-center justify-center mb-4">
              <span className="text-[#111827] font-black text-2xl tracking-tight">HEA</span>
            </div>
            <h1 className="text-white text-2xl font-bold">HEA Installer</h1>
            <p className="text-gray-400 text-sm mt-1">Solar &amp; Battery Field App</p>
          </div>

          {/* Download card */}
          <div className="bg-[#1f2937] rounded-2xl border border-[#374151] p-6 mb-5">
            {apkUrl ? (
              <>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-white font-semibold">Android App</p>
                    {version && (
                      <p className="text-gray-400 text-xs mt-0.5">
                        Version {version}{buildId ? ` - ${buildId}` : ''}
                      </p>
                    )}
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-green-900/40 text-green-400 font-medium border border-green-800/40">
                    Latest
                  </span>
                </div>
                <a
                  href={apkUrl}
                  download
                  className="flex items-center justify-center gap-2 w-full bg-[#ffd100] text-[#111827] font-bold py-3.5 rounded-xl hover:bg-yellow-300 transition-colors text-sm"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Download for Android
                </a>
                <p className="text-gray-500 text-xs text-center mt-3">
                  Tap Download → open the file → tap Install
                </p>
              </>
            ) : (
              <p className="text-gray-400 text-sm text-center py-4">
                No version available yet — check back soon.
              </p>
            )}
          </div>

          {/* QR code — useful when sharing the link from a desktop */}
          {apkUrl && (
            <div className="bg-white rounded-2xl p-5 flex flex-col items-center mb-5">
              <p className="text-[#6b7280] text-xs font-semibold uppercase tracking-wider mb-3">
                Scan to open on your phone
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent('https://hea-group.com.au/installer-app')}&bgcolor=ffffff&color=111827&margin=8`}
                alt="QR code — scan to open download page"
                width={180}
                height={180}
                className="rounded-lg"
              />
            </div>
          )}

          <p className="text-gray-600 text-xs text-center">
            For authorised HEA staff only
          </p>
        </div>
      </main>
      <Footer data={footer} />
    </>
  )
}
