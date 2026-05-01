'use client'

import { useEffect, useState } from 'react'

interface ApkEntry {
  version: string
  url: string
  uploadedAt: string
}

interface ApkInfo {
  url: string | null
  version: string | null
  uploadedAt: string | null
  history: ApkEntry[]
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function AppDistribution() {
  const [info, setInfo] = useState<ApkInfo>({ url: null, version: null, uploadedAt: null, history: [] })
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [version, setVersion] = useState('')
  const [apkUrl, setApkUrl] = useState('')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function load() {
    const res = await fetch('/api/dashboard/installer/apk')
    if (res.ok) setInfo(await res.json())
  }

  useEffect(() => { load() }, [])

  async function handleSave() {
    if (!version.trim() || !apkUrl.trim()) return
    setSaving(true)
    setStatus('idle')
    setErrorMsg('')
    try {
      const res = await fetch('/api/dashboard/installer/apk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: apkUrl.trim(), version: version.trim() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error ?? `Save failed (${res.status})`)
      }
      await load()
      setStatus('success')
      setShowForm(false)
      setVersion('')
      setApkUrl('')
    } catch (e) {
      setStatus('error')
      setErrorMsg(e instanceof Error ? e.message : String(e))
    }
    setSaving(false)
  }

  return (
    <div className="bg-white rounded-xl border border-[#e5e9f0] overflow-hidden mt-6">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#e5e9f0] flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[#111827]">App Distribution <span className="text-xs font-normal text-gray-400 ml-1">v10</span></p>
          <p className="text-xs text-gray-500 mt-0.5">
            Employee download page:{' '}
            <a href="/installer-app" target="_blank" className="text-[#ffd100] hover:underline font-medium">
              hea-group.com.au/installer-app
            </a>
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); setStatus('idle') }}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#111827] text-white hover:bg-[#2d2d2d] transition-colors"
          >
            + New Version
          </button>
        )}
      </div>

      {/* Success banner */}
      {status === 'success' && (
        <div className="px-5 py-3 bg-green-50 border-b border-green-200 flex items-center justify-between">
          <p className="text-sm text-green-800 font-medium">✓ Saved — download page is now live</p>
          <button onClick={() => setStatus('idle')} className="text-green-600 text-xs hover:underline">Dismiss</button>
        </div>
      )}

      {/* Error banner */}
      {status === 'error' && (
        <div className="px-5 py-3 bg-red-50 border-b border-red-200 flex items-center justify-between">
          <div>
            <p className="text-sm text-red-800 font-medium">Save failed</p>
            <p className="text-xs text-red-600 mt-0.5">{errorMsg}</p>
          </div>
          <button onClick={() => setStatus('idle')} className="text-red-500 text-xs hover:underline ml-4 shrink-0">Dismiss</button>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="px-5 py-4 border-b border-[#e5e9f0] bg-[#fafafa] space-y-3">
          <p className="text-xs text-gray-500">
            Run <code className="bg-gray-100 px-1 rounded">eas build --platform android --profile preview</code> then paste the download URL below.
          </p>
          <div className="flex gap-3 flex-wrap items-end">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Version</label>
              <input
                type="text"
                value={version}
                onChange={e => setVersion(e.target.value)}
                placeholder="1.0.1"
                disabled={saving}
                className="w-28 border border-[#e5e9f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#ffd100] disabled:opacity-50"
              />
            </div>
            <div className="flex-1 min-w-60">
              <label className="block text-xs font-semibold text-gray-600 mb-1">EAS download URL</label>
              <input
                type="url"
                value={apkUrl}
                onChange={e => setApkUrl(e.target.value)}
                placeholder="https://expo.dev/artifacts/eas/…apk"
                disabled={saving}
                className="w-full border border-[#e5e9f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#ffd100] disabled:opacity-50"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowForm(false); setStatus('idle') }}
              disabled={saving}
              className="px-4 py-2 text-sm rounded-lg border border-[#e5e9f0] text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !version.trim() || !apkUrl.trim()}
              className="px-5 py-2 text-sm font-semibold rounded-lg bg-[#ffd100] text-[#111827] hover:bg-yellow-300 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Save & Publish'}
            </button>
          </div>
        </div>
      )}

      {/* Version history */}
      {info.history.length > 0 ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e5e9f0]">
              <th className="text-left px-3 sm:px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Version</th>
              <th className="hidden sm:table-cell text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Saved</th>
              <th className="px-3 sm:px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center sm:text-right">Status</th>
              <th className="px-3 sm:px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e9f0]">
            {info.history.map((entry, i) => (
              <tr key={entry.uploadedAt} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 sm:px-5 py-3 font-mono font-semibold text-[#111827]">v{entry.version}</td>
                <td className="hidden sm:table-cell px-5 py-3 text-gray-500 text-xs">{fmt(entry.uploadedAt)}</td>
                <td className="px-3 sm:px-5 py-3 text-center sm:text-right">
                  {i === 0 ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Live</span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Superseded</span>
                  )}
                </td>
                <td className="px-3 sm:px-5 py-3 text-right">
                  <a href={entry.url} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-[#ffd100] transition-colors whitespace-nowrap">
                    Download ↗
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="px-5 py-6 text-center text-sm text-gray-400">
          No version published yet. Add one to activate the employee download page.
        </div>
      )}
    </div>
  )
}
