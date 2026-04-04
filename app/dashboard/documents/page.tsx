import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Documents | HEA' };

type DocRecord = {
  jobNumber?: string;
  clientName?: string;
  docClass?: string;
  status?: string;
  generatedAt?: string;
  outputLink?: string;
  pdfLink?: string;
  [key: string]: unknown;
};

async function getAllDocuments(): Promise<DocRecord[]> {
  const gasUrl = process.env.JOBS_GAS_URL;
  if (!gasUrl) return [];
  try {
    const res = await fetch(`${gasUrl}?action=getAllDocuments`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export default async function DocumentsPage() {
  const docs = await getAllDocuments();

  // Normalise field names — matches actual EXPORT_LOG columns:
  // timestamp, job_id, doc_class, template_id, output_file_id,
  // output_file_link, pdf_file_id, pdf_link, status, run_duration_ms, triggered_by, total_tokens
  const normalised: DocRecord[] = docs.map((row) => ({
    jobNumber:   String(row.job_id   ?? row.job_number ?? row.jobNumber ?? ''),
    clientName:  String(row.client_name ?? row.clientName ?? ''),
    docClass:    String(row.doc_class ?? row.docClass ?? ''),
    status:      String(row.status ?? ''),
    generatedAt: String(row.timestamp ?? row.generated_at ?? row.generatedAt ?? ''),
    outputLink:  String(row.output_file_link ?? row.output_link ?? row.outputLink ?? ''),
    pdfLink:     String(row.pdf_link ?? row.pdfLink ?? ''),
  }));

  // Most recent first
  const sorted = [...normalised].reverse();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-white text-xl font-semibold">Documents</h1>
        <p className="text-[#555] text-sm mt-0.5">
          {sorted.length > 0 ? `${sorted.length} generated document${sorted.length !== 1 ? 's' : ''}` : 'All AI-generated proposals and documents'}
        </p>
      </div>

      {sorted.length === 0 ? (
        <div className="bg-[#202020] border border-[#2e2e2e] rounded-xl p-12 text-center">
          <p className="text-[#555] text-sm mb-2">No documents yet.</p>
          <p className="text-[#444] text-xs">
            Generate a proposal from a job detail page. Documents will appear here once the GAS{' '}
            <code className="bg-[#2a2a2a] px-1 py-0.5 rounded text-[#888]">getAllDocuments</code> action is deployed.
          </p>
          <div className="mt-6 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 text-left max-w-lg mx-auto">
            <p className="text-[#ffd100] text-xs font-semibold uppercase tracking-wider mb-2">GAS Setup Required</p>
            <p className="text-[#666] text-xs leading-relaxed">
              Add the <code className="text-[#aaa]">getAllDocuments</code> case to your{' '}
              <code className="text-[#aaa]">HEAJobsAPI.gs</code> doGet handler, then re-deploy the web app.
              See the GAS snippet in the codebase comments.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-[#202020] border border-[#2e2e2e] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a2a] bg-[#1a1a1a]">
                <th className="px-5 py-3 text-left text-[10px] text-[#444] uppercase tracking-widest font-medium">Job #</th>
                <th className="px-5 py-3 text-left text-[10px] text-[#444] uppercase tracking-widest font-medium hidden sm:table-cell">Client</th>
                <th className="px-5 py-3 text-left text-[10px] text-[#444] uppercase tracking-widest font-medium">Doc Type</th>
                <th className="px-5 py-3 text-left text-[10px] text-[#444] uppercase tracking-widest font-medium hidden md:table-cell">Generated</th>
                <th className="px-5 py-3 text-left text-[10px] text-[#444] uppercase tracking-widest font-medium">Links</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((doc, i) => (
                <tr
                  key={i}
                  className={`border-b border-[#252525] hover:bg-[#252525] transition-colors ${i % 2 === 0 ? '' : 'bg-[#1e1e1e]'}`}
                >
                  <td className="px-5 py-3">
                    {doc.jobNumber ? (
                      <Link
                        href={`/dashboard/jobs/${doc.jobNumber}`}
                        className="font-mono text-[#ffd100] text-xs font-bold hover:underline"
                      >
                        {doc.jobNumber}
                      </Link>
                    ) : (
                      <span className="text-[#444] text-xs">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-white hidden sm:table-cell">{doc.clientName || '—'}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#2a2a2a] text-[#aaa] font-medium">
                      {doc.docClass || 'Proposal'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[#555] text-xs hidden md:table-cell whitespace-nowrap">
                    {doc.generatedAt || '—'}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {doc.outputLink && doc.outputLink !== 'undefined' && (
                        <a
                          href={doc.outputLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#888] hover:text-[#ffd100] transition-colors"
                        >
                          Draft ↗
                        </a>
                      )}
                      {doc.pdfLink && doc.pdfLink !== 'undefined' && (
                        <a
                          href={doc.pdfLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#ffd100] hover:text-[#e6bc00] transition-colors font-medium"
                        >
                          PDF ↗
                        </a>
                      )}
                      {!doc.outputLink && !doc.pdfLink && (
                        <span className="text-[#333] text-xs">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* GAS snippet callout for Jesse */}
      <details className="mt-8 group">
        <summary className="text-[#444] text-xs cursor-pointer hover:text-[#666] transition-colors select-none">
          GAS setup — <span className="group-open:hidden">show snippet</span><span className="hidden group-open:inline">hide snippet</span>
        </summary>
        <div className="mt-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
          <p className="text-[#ffd100] text-xs font-semibold uppercase tracking-wider mb-3">
            Add to HEAJobsAPI.gs — doGet switch statement
          </p>
          <pre className="text-[#aaa] text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap">{`case 'getAllDocuments': {
  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName('EXPORT_LOG');
  if (!sheet) {
    return ContentService
      .createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) {
    return ContentService
      .createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }
  const headers = rows[0];
  const docs = rows.slice(1).map(r =>
    Object.fromEntries(headers.map((h, i) => [h, r[i]]))
  );
  return ContentService
    .createTextOutput(JSON.stringify(docs))
    .setMimeType(ContentService.MimeType.JSON);
}`}</pre>
          <p className="text-[#444] text-xs mt-3">
            After adding this, go to <strong className="text-[#888]">Deploy → Manage Deployments → New Version → Deploy</strong>.
          </p>
        </div>
      </details>
    </div>
  );
}
