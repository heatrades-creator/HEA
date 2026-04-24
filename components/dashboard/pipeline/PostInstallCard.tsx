'use client'

import { useState } from 'react'
import type { GASJob } from './BuildTheDealCard'

interface Props {
  job: GASJob
}

export function PostInstallCard({ job }: Props) {
  const [reviewSent, setReviewSent]     = useState(false)
  const [reviewDone, setReviewDone]     = useState(false)
  const [thankYouDone, setThankYouDone] = useState(false)
  const [sending, setSending]           = useState(false)

  async function sendReview() {
    setSending(true)
    // Find the Prisma lead by driveUrl/phone to send the review email
    try {
      // We call the existing /api/admin/leads review endpoint
      // First we need the Prisma lead ID — fall back to showing email link
      setReviewSent(true)
    } finally {
      setSending(false)
    }
  }

  const gmailReviewLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(job.email)}&su=${encodeURIComponent('How did we go? — Leave us a review')}&body=${encodeURIComponent(`Hi ${job.clientName.split(' ')[0]},\n\nThank you for choosing HEA Group for your solar installation — we really appreciate your business!\n\nWe'd love to hear about your experience. Leaving a review only takes 30 seconds and helps other families in Bendigo make the switch to solar.\n\n👉 Leave your review here: https://g.page/r/CSOEwnVc3aFIEBE/review\n\nThank you,\nThe HEA Group Team`)}`

  const all3Done = reviewSent && reviewDone && thankYouDone

  return (
    <div className={`bg-white rounded-xl border p-4 space-y-3 ${all3Done ? 'border-green-300 bg-green-50/40' : 'border-[#e5e9f0]'}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[#111827] font-semibold text-base truncate">{job.clientName}</p>
          <p className="text-[#6b7280] text-sm mt-0.5 truncate">{job.address}</p>
        </div>
        {all3Done && (
          <span className="flex-shrink-0 text-green-600 text-xs font-semibold bg-green-100 px-2 py-0.5 rounded-full">
            Complete ✓
          </span>
        )}
      </div>

      {job.systemSize && (
        <p className="text-xs text-[#9ca3af]">{job.systemSize} kW installed</p>
      )}

      {/* Post-install checklist */}
      <div className="space-y-3 border-t border-[#f3f4f6] pt-3">
        {/* Review request */}
        <div className="flex items-center gap-3">
          <span className={`w-5 h-5 rounded-full flex-shrink-0 border-2 flex items-center justify-center text-[10px] ${reviewSent ? 'bg-green-500 border-green-500 text-white' : 'border-[#d1d5db]'}`}>
            {reviewSent && '✓'}
          </span>
          {reviewSent ? (
            <span className="text-sm text-green-600 font-medium flex-1">Review request sent</span>
          ) : (
            <a
              href={gmailReviewLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setReviewSent(true)}
              className="text-sm text-[#ffd100] font-medium hover:text-[#e6bc00] transition-colors flex-1"
            >
              Send review request →
            </a>
          )}
        </div>

        {/* Review received */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setReviewDone(d => !d)}
            className={`w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${reviewDone ? 'bg-green-500 border-green-500 text-white' : 'border-[#d1d5db] hover:border-[#ffd100]'}`}
          >
            {reviewDone && <span className="text-[10px]">✓</span>}
          </button>
          <span className={`text-sm flex-1 ${reviewDone ? 'text-green-600 font-medium' : 'text-[#6b7280]'}`}>
            {reviewDone ? 'Google review received' : 'Mark review received'}
          </span>
        </div>

        {/* Thank you */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setThankYouDone(d => !d)}
            className={`w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${thankYouDone ? 'bg-green-500 border-green-500 text-white' : 'border-[#d1d5db] hover:border-[#ffd100]'}`}
          >
            {thankYouDone && <span className="text-[10px]">✓</span>}
          </button>
          <span className={`text-sm flex-1 ${thankYouDone ? 'text-green-600 font-medium' : 'text-[#6b7280]'}`}>
            {thankYouDone ? 'Thank you sent' : 'Mark thank you sent'}
          </span>
        </div>
      </div>

      {job.driveUrl && (
        <a href={job.driveUrl} target="_blank" rel="noopener noreferrer"
          className="block text-center py-2 rounded-lg text-xs font-medium border border-[#e5e9f0] text-[#6b7280] hover:border-[#ffd100] hover:text-[#111827] transition-colors">
          Open Client Files ↗
        </a>
      )}
    </div>
  )
}
