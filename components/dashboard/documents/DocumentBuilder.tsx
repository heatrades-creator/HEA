'use client'

import { useState } from 'react'
import {
  ANNEX_REGISTRY,
  resolveDocumentConfig,
  type DocumentDef,
  type DocumentConfig,
  type DocSlug,
  type AnnexSlug,
} from '@/lib/document-config'

type Props = {
  documents: DocumentDef[]
  initialConfig: DocumentConfig
}

export function DocumentBuilder({ documents, initialConfig }: Props) {
  const [config, setConfig] = useState<DocumentConfig>(initialConfig)
  const [saving, setSaving] = useState<DocSlug | null>(null)
  const [saved, setSaved] = useState<DocSlug | null>(null)
  const [error, setError] = useState<string | null>(null)

  function toggle(docSlug: DocSlug, annexSlug: AnnexSlug, current: boolean) {
    setConfig((prev: DocumentConfig) => ({
      ...prev,
      [docSlug]: {
        ...prev[docSlug],
        [annexSlug]: !current,
      },
    }))
  }

  async function save(docSlug: DocSlug) {
    setSaving(docSlug)
    setError(null)
    try {
      const res = await fetch('/api/dashboard/documents/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (!res.ok) throw new Error('Failed to save')
      setSaved(docSlug)
      setTimeout(() => setSaved(null), 2500)
    } catch {
      setError('Save failed — please try again.')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-xs text-red-700">
          {error}
        </div>
      )}

      {documents.map((doc) => {
        const resolved = resolveDocumentConfig(doc.slug, config)
        const enabledCount = Object.values(resolved).filter(Boolean).length

        return (
          <div
            key={doc.slug}
            className="bg-white border border-[#e5e9f0] rounded-xl overflow-hidden"
          >
            {/* Document header */}
            <div className="px-6 py-4 border-b border-[#e5e9f0] flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="text-[#111827] font-semibold text-sm">{doc.name}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f5f7fb] border border-[#e5e9f0] text-[#6b7280] font-medium whitespace-nowrap">
                    {doc.audience}
                  </span>
                </div>
                <p className="text-[#6b7280] text-xs leading-relaxed">{doc.description}</p>
                <p className="text-[10px] font-mono text-[#bbb] mt-1.5">{doc.filePattern}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <button
                  onClick={() => save(doc.slug)}
                  disabled={saving === doc.slug}
                  className="text-xs px-3 py-1.5 rounded-lg bg-[#ffd100] text-[#111827] font-semibold hover:bg-[#e6bc00] transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {saving === doc.slug ? 'Saving…' : saved === doc.slug ? 'Saved ✓' : 'Save'}
                </button>
                <span className="text-[10px] text-[#aaa]">
                  {enabledCount} annex{enabledCount !== 1 ? 'es' : ''} enabled
                </span>
              </div>
            </div>

            {/* Annex list */}
            <div className="px-6 py-4">
              <p className="text-[10px] text-[#aaa] uppercase tracking-wider mb-3 font-medium">
                Annexes — toggle to include or exclude from this document
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {doc.annexes.map(({ slug }) => {
                  const annexDef = ANNEX_REGISTRY.find((a) => a.slug === slug)
                  if (!annexDef) return null
                  const enabled = resolved[slug] ?? false

                  return (
                    <label
                      key={slug}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors select-none ${
                        enabled
                          ? 'border-[#ffd100] bg-[#fffef0]'
                          : 'border-[#e5e9f0] bg-[#f9fafb] hover:border-[#d0d5dd]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={() => toggle(doc.slug, slug, enabled)}
                        className="mt-0.5 accent-[#ffd100] shrink-0"
                      />
                      <div className="min-w-0">
                        <p
                          className={`text-xs font-medium leading-snug ${
                            enabled ? 'text-[#111827]' : 'text-[#6b7280]'
                          }`}
                        >
                          {annexDef.name}
                          {annexDef.status === 'planned' && (
                            <span className="ml-1.5 text-[9px] px-1 py-0.5 rounded bg-[#f0f0f0] text-[#bbb] uppercase tracking-wide align-middle">
                              soon
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-[#aaa] mt-0.5 leading-tight">
                          {annexDef.source}
                        </p>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Drive folder callout */}
            <div className="px-6 pb-4">
              <p className="text-[10px] text-[#bbb] font-mono">
                Saved to: <span className="text-[#aaa]">{doc.driveSubfolder}</span>
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
