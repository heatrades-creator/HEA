import type { QRPayload } from './types'

const MAX_AGE_MS = 60 * 60 * 1000 // 1 hour

export function encodeQRPayload(jobNumber: string, installerName: string): string {
  const payload: QRPayload = {
    action: 'join_job',
    jobNumber,
    installerName,
    ts: Date.now(),
  }
  return JSON.stringify(payload)
}

export function decodeQRPayload(raw: string): QRPayload | null {
  try {
    const payload = JSON.parse(raw) as QRPayload
    if (payload.action !== 'join_job') return null
    if (!payload.jobNumber || !payload.installerName) return null
    if (Date.now() - payload.ts > MAX_AGE_MS) return null
    return payload
  } catch {
    return null
  }
}
