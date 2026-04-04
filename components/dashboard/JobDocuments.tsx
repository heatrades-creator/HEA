'use client';

import { useState, useEffect, useCallback } from 'react';

type Template = {
  doc_class: string;
  template_id: string;
  display_name: string;
};

type GeneratedDoc = {
  job_number: string;
  doc_job_id: string;
  doc_class: string;
  template_display_name: string;
  status: string;
  output_link: string;
  pdf_link: string;
  generated_at: string;
};

export default function JobDocuments({ jobNumber }: { jobNumber: string }) {
  const [templates, setTemplates]   = useState<Template[]>([]);
  const [docs, setDocs]             = useState<GeneratedDoc[]>([]);
  const [generating, setGenerating] = useState<string | null>(null); // doc_class being generated
  const [error, setError]           = useState<string | null>(null);

  const loadDocs = useCallback(async () => {
    try {
      const res = await fetch(`/api/jobs/${jobNumber}/documents`, { cache: 'no-store' });
      if (res.ok) setDocs(await res.json());
    } catch { /* silent — list just stays empty */ }
  }, [jobNumber]);

  // Fetch available templates from GAS on mount
  useEffect(() => {
    fetch(`/api/jobs/${jobNumber}/templates`)
      .then(r => r.ok ? r.json() : [])
      .then(setTemplates)
      .catch(() => setTemplates([]));
    loadDocs();
  }, [jobNumber, loadDocs]);

  async function generate(docClass: string, displayName: string) {
    setError(null);
    setGenerating(docClass);
    try {
      const res = await fetch(`/api/jobs/${jobNumber}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docClass }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || `Failed to generate ${displayName}`);
      } else {
        await loadDocs();
      }
    } catch {
      setError(`Network error while generating ${displayName}. Please try again.`);
    } finally {
      setGenerating(null);
    }
  }

  return (
    <div className="border-t border-[#e5e9f0] pt-6">
      <label className="block text-[#6b7280] text-xs uppercase tracking-wider mb-3">
        Documents
      </label>

      {/* Generate buttons */}
      {templates.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {templates.map((t) => {
            const isThis = generating === t.doc_class;
            return (
              <button
                key={t.doc_class}
                onClick={() => generate(t.doc_class, t.display_name)}
                disabled={generating !== null}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all
                  ${generating !== null
                    ? 'border-[#e5e9f0] text-[#9ca3af] cursor-not-allowed'
                    : 'border-[#ffd100]/40 text-[#ffd100] hover:bg-[#ffd100]/10 hover:border-[#ffd100]'
                  }`}
              >
                {isThis ? (
                  <>
                    <span className="inline-block w-3 h-3 border-2 border-[#ffd100] border-t-transparent rounded-full animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <span className="text-xs">+</span>
                    {t.display_name}
                  </>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-red-400 text-xs bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      {/* Generating notice */}
      {generating && (
        <p className="text-[#6b7280] text-xs mb-4 animate-pulse">
          Generating document — this takes about 40 seconds…
        </p>
      )}

      {/* Document list */}
      {docs.length === 0 && !generating ? (
        <p className="text-[#9ca3af] text-sm">No documents generated yet.</p>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => (
            <div
              key={doc.doc_job_id}
              className="flex items-center justify-between bg-[#eef0f5] border border-[#e5e9f0] rounded-lg px-4 py-3"
            >
              <div>
                <p className="text-[#111827] text-sm font-medium">{doc.template_display_name}</p>
                <p className="text-[#9ca3af] text-xs mt-0.5">
                  {doc.status === 'SUCCESS'
                    ? formatDate(doc.generated_at)
                    : doc.status === 'GENERATING'
                    ? 'Generating…'
                    : 'Failed'}
                </p>
              </div>
              {doc.status === 'SUCCESS' && (
                <div className="flex items-center gap-2">
                  {doc.output_link && (
                    <a
                      href={doc.output_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-2.5 py-1.5 border border-[#444] text-[#aaa] rounded-lg hover:border-[#ffd100] hover:text-[#ffd100] transition-colors"
                    >
                      Open Draft ↗
                    </a>
                  )}
                  {doc.pdf_link && (
                    <a
                      href={doc.pdf_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-2.5 py-1.5 bg-[#ffd100]/10 border border-[#ffd100]/40 text-[#ffd100] rounded-lg hover:bg-[#ffd100]/20 transition-colors"
                    >
                      PDF ↗
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('en-AU', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch {
    return iso;
  }
}
