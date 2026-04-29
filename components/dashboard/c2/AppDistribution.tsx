'use client'

import { useEffect, useRef, useState } from 'react'
import { upload } from '@vercel/blob/client'

interface ApkEntry {
  version: string
  url: string
  uploadedAt: string
}

interface ApkInfo {
  blobConfigured: boolean
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
  const [info, setInfo] = useState<ApkInfo>({ blobConfigured: true, url: null, version: null, uploadedAt: null, history: [] })
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [version, setVersion] = useState('')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function load() {
    const res = await fetch('/api/dashboard/installer/apk')
    if (res.ok) setInfo(await res.json())
  }

  useEffect(() => { load() }, [])

  async function handleUploadFile() {
    const file = fileRef.current?.files?.[0]
    if (!file || !version.trim()) return
    setUploading(true)
    setStatus('idle')
    setErrorMsg('')
    setProgress(0)
    try {
      // Step 1: upload file directly to Vercel Blob CDN
      const blob = await upload(`hea-installer-v${version.trim()}.apk`, file, {
        access: 'public',
        handleUploadUrl: '/api/dashboard/installer/apk',
        clientPayload: version.trim(),
        onUploadProgress: (p) => setProgress(Math.round(p.percentage)),
      })

      // Step 2: save the resulting URL + version to DB via PUT
      const saveRes = await fetch('/api/dashboard/installer/apk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: blob.url, version: version.trim() }),
      })
      if (!saveRes.ok) {
        const data = await saveRes.json().catch(() => ({}))
        throw new Error(`Saved to Blob but DB write failed: ${data.error ?? saveRes.status}`)
      }

      await load()
      setStatus('success')
      setShowForm(false)
      setVersion('')
      if (fileRef.current) fileRef.current.value = ''
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('APK upload failed:', e)
      setStatus('error')
      setErrorMsg(msg)
    }
    setUploading(false)
  }

  const hasFile = !!fileRef.current?.files?.length

  return (
    <div className="bg-white rounded-xl border border-[#e5e9f0] overflow-hidden mt-6">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#e5e9f0] flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[#111827]">App Distribution</p>
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
            Upload New APK
          </button>
        )}
      </div>

      {/* Blob not configured warning */}
      {!info.blobConfigured && (
        <div className="px-5 py-3 bg-amber-50 border-b border-amber-200">
          <p className="text-sm text-amber-800 font-medium">⚠️ Vercel Blob not connected</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Go to your Vercel project → Storage → connect the <strong>hea-storage</strong> Blob store to this project, then redeploy.
          </p>
        </div>
      )}

      {/* Success banner */}
      {status === 'success' && (
        <div className="px-5 py-3 bg-green-50 border-b border-green-200 flex items-center justify-between">
          <p className="text-sm text-green-800 font-medium">✓ Upload successful — download page is now live</p>
          <button onClick={() => setStatus('idle')} className="text-green-600 text-xs hover:underline">Dismiss</button>
        </div>
      )}

      {/* Error banner */}
      {status === 'error' && (
        <div className="px-5 py-3 bg-red-50 border-b border-red-200 flex items-center justify-between">
          <div>
            <p className="text-sm text-red-800 font-medium">Upload failed</p>
            <p className="text-xs text-red-600 mt-0.5">{errorMsg || 'Check that Vercel Blob is connected in your Vercel project settings.'}</p>
          </div>
          <button onClick={() => setStatus('idle')} className="text-red-500 text-xs hover:underline ml-4 shrink-0">Dismiss</button>
        </div>
      )}

      {/* Upload form */}
      {showForm && (
        <div className="px-5 py-4 border-b border-[#e5e9f0] bg-[#fafafa] space-y-3">
          <div className="flex gap-4 flex-wrap">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Version number</label>
              <input
                type="text"
                value={version}
                onChange={e => setVersion(e.target.value)}
                placeholder="1.0.0"
                disabled={uploading}
                className="w-32 border border-[#e5e9f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#ffd100] disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">APK file</label>
              <input
                ref={fileRef}
                type="file"
                accept=".apk,application/vnd.android.package-archive,application/octet-stream"
                disabled={uploading}
                onChange={() => setStatus('idle')}
                className="text-sm text-gray-600 disabled:opacity-50"
              />
            </div>
          </div>

          {uploading && (
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-[#ffd100] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-10 text-right">{progress}%</span>
              </div>
              <p className="text-xs text-gray-400">Uploading — do not close this tab…</p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => { setShowForm(false); setStatus('idle') }}
              disabled={uploading}
              className="px-4 py-2 text-sm rounded-lg border border-[#e5e9f0] text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUploadFile}
              disabled={uploading || !version.trim()}
              className="px-5 py-2 text-sm font-semibold rounded-lg bg-[#ffd100] text-[#111827] hover:bg-yellow-300 disabled:opacity-50 transition-colors"
            >
              {uploading ? `Uploading ${progress}%…` : 'Upload'}
            </button>
          </div>
        </div>
      )}

      {/* Version history */}
      {info.history.length > 0 ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e5e9f0]">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Version</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Uploaded</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e9f0]">
            {info.history.map((entry, i) => (
              <tr key={entry.uploadedAt} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3 font-mono font-semibold text-[#111827]">v{entry.version}</td>
                <td className="px-5 py-3 text-gray-500 text-xs">{fmt(entry.uploadedAt)}</td>
                <td className="px-5 py-3 text-right">
                  {i === 0 ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      Live
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                      Superseded
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-right">
                  <a
                    href={entry.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-400 hover:text-[#ffd100] transition-colors"
                  >
                    Download ↗
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="px-5 py-6 text-center text-sm text-gray-400">
          No APK uploaded yet. Upload one to activate the employee download page.
        </div>
      )}
    </div>
  )
}
