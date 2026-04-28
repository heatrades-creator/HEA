'use client'

import { useEffect, useRef, useState } from 'react'
import { upload } from '@vercel/blob/client'

interface ApkInfo {
  url: string | null
  version: string | null
  uploadedAt: string | null
}

export function AppDistribution() {
  const [info, setInfo] = useState<ApkInfo>({ url: null, version: null, uploadedAt: null })
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [version, setVersion] = useState('')
  const [error, setError] = useState('')
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
    setError('')
    setProgress(0)
    try {
      await upload(`hea-installer-v${version.trim()}.apk`, file, {
        access: 'public',
        handleUploadUrl: '/api/dashboard/installer/apk',
        clientPayload: version.trim(),
        onUploadProgress: (p) => setProgress(Math.round(p.percentage)),
      })
      await load()
      setShowForm(false)
      setVersion('')
      if (fileRef.current) fileRef.current.value = ''
    } catch {
      setError('Upload failed. Make sure Vercel Blob is configured — see CLAUDE.md for setup.')
    }
    setUploading(false)
  }

  return (
    <div className="bg-white rounded-xl border border-[#e5e9f0] overflow-hidden mt-6">
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
        <button
          onClick={() => { setShowForm(v => !v); setError('') }}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#111827] text-white hover:bg-[#2d2d2d] transition-colors"
        >
          Upload New APK
        </button>
      </div>

      <div className="px-5 py-4">
        {info.url ? (
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-[#111827]">
                Version {info.version ?? '—'} — live
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Uploaded{' '}
                {info.uploadedAt
                  ? new Date(info.uploadedAt).toLocaleDateString('en-AU', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })
                  : '—'}
              </p>
            </div>
            <a
              href={info.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-[#ffd100] transition-colors"
            >
              Direct APK ↗
            </a>
          </div>
        ) : (
          <p className="text-sm text-gray-400">
            No APK uploaded yet. Upload one to activate the employee download page.
          </p>
        )}
      </div>

      {showForm && (
        <div className="px-5 pb-5 border-t border-[#e5e9f0] pt-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Version number
            </label>
            <input
              type="text"
              value={version}
              onChange={e => setVersion(e.target.value)}
              placeholder="1.0.0"
              className="w-36 border border-[#e5e9f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#ffd100]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              APK file
            </label>
            <input
              ref={fileRef}
              type="file"
              accept=".apk,application/vnd.android.package-archive,application/octet-stream"
              className="text-sm text-gray-600"
            />
          </div>
          {uploading && (
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                <div
                  className="bg-[#ffd100] h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 w-10 text-right">{progress}%</span>
            </div>
          )}
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => { setShowForm(false); setError('') }}
              className="px-4 py-2 text-sm rounded-lg border border-[#e5e9f0] text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUploadFile}
              disabled={uploading || !version.trim() || !fileRef.current?.files?.length}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-[#ffd100] text-[#111827] hover:bg-yellow-300 disabled:opacity-50"
            >
              {uploading ? `Uploading ${progress}%…` : 'Upload'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
