import { getToken } from './auth'
import type { GASJob, Comment, Contact } from './types'

const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'https://hea-group.com.au'

async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return fetch(`${BASE}${path}`, { ...init, headers })
}

export async function loginInstaller(name: string, pin: string) {
  const res = await fetch(`${BASE}/api/installer/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, pin }),
  })
  if (!res.ok) throw new Error('Invalid credentials')
  return res.json() as Promise<{ token: string; installer: { id: string; name: string; role: string } }>
}

export async function fetchJobs(): Promise<GASJob[]> {
  const res = await authFetch('/api/installer/jobs')
  if (!res.ok) throw new Error('Failed to load jobs')
  return res.json()
}

export async function fetchJob(jobNumber: string): Promise<GASJob> {
  const res = await authFetch(`/api/installer/jobs/${encodeURIComponent(jobNumber)}`)
  if (!res.ok) throw new Error('Job not found')
  return res.json()
}

export async function fetchPhotos(jobNumber: string): Promise<Array<{ name: string; url: string; id: string }>> {
  const res = await authFetch(`/api/installer/jobs/${encodeURIComponent(jobNumber)}/photos`)
  if (!res.ok) return []
  const data = await res.json()
  return data.photos ?? []
}

export async function clockIn(jobNumber: string): Promise<void> {
  const res = await authFetch('/api/installer/timesheets', {
    method: 'POST',
    body: JSON.stringify({ jobNumber, type: 'clock_in', timestamp: new Date().toISOString() }),
  })
  if (!res.ok) throw new Error('Clock in failed')
}

export async function clockOut(jobNumber: string): Promise<void> {
  const res = await authFetch('/api/installer/timesheets', {
    method: 'POST',
    body: JSON.stringify({ jobNumber, type: 'clock_out', timestamp: new Date().toISOString() }),
  })
  if (!res.ok) throw new Error('Clock out failed')
}

export async function fetchComments(jobNumber: string): Promise<Comment[]> {
  const res = await authFetch(`/api/installer/comments?jobNumber=${encodeURIComponent(jobNumber)}`)
  if (!res.ok) return []
  return res.json()
}

export async function postComment(jobNumber: string, body: string): Promise<Comment> {
  const res = await authFetch('/api/installer/comments', {
    method: 'POST',
    body: JSON.stringify({ jobNumber, body }),
  })
  if (!res.ok) throw new Error('Failed to post comment')
  return res.json()
}

export async function fetchContacts(): Promise<Contact[]> {
  const res = await authFetch('/api/installer/contacts')
  if (!res.ok) return []
  return res.json()
}

export async function registerPushToken(token: string): Promise<void> {
  await authFetch('/api/installer/push-token', {
    method: 'POST',
    body: JSON.stringify({ token }),
  })
}

export async function uploadJobPhoto(
  jobNumber: string,
  filename: string,
  base64: string,
  mimeType: string,
): Promise<{ fileUrl: string; fileName: string }> {
  const res = await authFetch(`/api/installer/jobs/${encodeURIComponent(jobNumber)}/photos`, {
    method: 'POST',
    body: JSON.stringify({ filename, base64, mimeType }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error((data as { error?: string }).error ?? 'Photo upload failed')
  }
  return res.json()
}

export async function uploadJobReceipt(
  jobNumber: string,
  filename: string,
  base64: string,
  mimeType: string,
): Promise<{ fileUrl: string; fileName: string }> {
  const res = await authFetch(`/api/installer/jobs/${encodeURIComponent(jobNumber)}/receipts`, {
    method: 'POST',
    body: JSON.stringify({ filename, base64, mimeType }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error((data as { error?: string }).error ?? 'Receipt upload failed')
  }
  return res.json()
}

export async function uploadGeneralReceipt(
  filename: string,
  base64: string,
  mimeType: string,
  description?: string,
): Promise<{ fileUrl: string; fileName: string }> {
  const res = await authFetch('/api/installer/receipts', {
    method: 'POST',
    body: JSON.stringify({ filename, base64, mimeType, description }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error((data as { error?: string }).error ?? 'Receipt upload failed')
  }
  return res.json()
}
