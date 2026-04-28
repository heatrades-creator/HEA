'use client'

import { useEffect, useRef, useState } from 'react'

interface CommentAuthor {
  id: string
  name: string
}

interface CommentBase {
  id: string
  createdAt: string
  body: string
  installerId: string | null
  staffEmail: string | null
  installer: CommentAuthor | null
}

interface Comment extends CommentBase {
  replies: CommentBase[]
}

function authorLabel(c: CommentBase): string {
  if (c.installer) return c.installer.name
  if (c.staffEmail) return 'HEA Office'
  return 'Staff'
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

export function JobComments({ jobNumber }: { jobNumber: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  async function load() {
    const res = await fetch(`/api/dashboard/jobs/${jobNumber}/comments`)
    if (res.ok) setComments(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [jobNumber])

  async function sendReply(parentId: string) {
    if (!replyText.trim()) return
    setSending(true)
    const res = await fetch(`/api/dashboard/jobs/${jobNumber}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: replyText.trim(), parentId }),
    })
    if (res.ok) {
      setReplyText('')
      setReplyTo(null)
      load()
    }
    setSending(false)
  }

  if (loading) return null

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3 mb-4">
        <p className="text-[#374151] text-xs uppercase tracking-wider">Field Notes</p>
        <div className="flex-1 h-px bg-[#eef0f5]" />
        <span className="text-xs text-gray-400">{comments.length} note{comments.length !== 1 ? 's' : ''}</span>
      </div>

      {comments.length === 0 ? (
        <p className="text-sm text-gray-400 italic">No field notes yet. Installers can post notes from the mobile app.</p>
      ) : (
        <div className="space-y-4">
          {comments.map(comment => (
            <div key={comment.id} className="bg-[#f8f9fc] rounded-xl border border-[#e5e9f0] p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#ffd100] flex items-center justify-center text-[10px] font-bold text-[#111827]">
                    {authorLabel(comment).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-[#111827]">{authorLabel(comment)}</span>
                    <span className="text-xs text-gray-400 ml-2">{timeAgo(comment.createdAt)}</span>
                  </div>
                </div>
                {comment.installer && (
                  <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">Field</span>
                )}
              </div>
              <p className="text-sm text-[#374151] mt-2 leading-relaxed">{comment.body}</p>

              {comment.replies.length > 0 && (
                <div className="mt-3 ml-4 space-y-2 border-l-2 border-[#e5e9f0] pl-3">
                  {comment.replies.map(reply => (
                    <div key={reply.id}>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-[#111827]">{authorLabel(reply)}</span>
                        <span className="text-xs text-gray-400">{timeAgo(reply.createdAt)}</span>
                        {!reply.installer && (
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">Office</span>
                        )}
                      </div>
                      <p className="text-sm text-[#374151] mt-0.5">{reply.body}</p>
                    </div>
                  ))}
                </div>
              )}

              {replyTo === comment.id ? (
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendReply(comment.id)}
                    placeholder="Reply to installer…"
                    autoFocus
                    className="flex-1 bg-white border border-[#e5e9f0] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#ffd100]"
                  />
                  <button
                    onClick={() => sendReply(comment.id)}
                    disabled={sending || !replyText.trim()}
                    className="px-3 py-1.5 text-xs font-semibold bg-[#ffd100] text-[#111827] rounded-lg hover:bg-yellow-300 disabled:opacity-50"
                  >
                    Send
                  </button>
                  <button
                    onClick={() => { setReplyTo(null); setReplyText('') }}
                    className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setReplyTo(comment.id)}
                  className="mt-2 text-xs text-gray-400 hover:text-[#ffd100] transition-colors"
                >
                  ↩ Reply
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
