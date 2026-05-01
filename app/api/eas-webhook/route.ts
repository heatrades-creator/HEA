import { createHmac } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// EAS sends a sha1=<hmac> signature in the expo-signature header.
// We verify it against EXPO_WEBHOOK_SECRET to confirm the request is genuine.
function verifySignature(body: string, signature: string, secret: string): boolean {
  const expected = 'sha1=' + createHmac('sha1', secret).update(body).digest('hex')
  return expected === signature
}

interface EASBuildPayload {
  status: string
  platform: string
  artifacts?: {
    applicationArchiveUrl?: string
  }
  metadata?: {
    appVersion?: string
  }
}

export async function POST(req: NextRequest) {
  const secret = process.env.EXPO_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })

  const rawBody = await req.text()
  const signature = req.headers.get('expo-signature') ?? ''

  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const payload = JSON.parse(rawBody) as EASBuildPayload

  // Only process successful Android builds
  if (payload.status !== 'finished' || payload.platform !== 'android') {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const apkUrl = payload.artifacts?.applicationArchiveUrl
  const version = payload.metadata?.appVersion

  if (!apkUrl || !version) {
    return NextResponse.json({ error: 'Missing URL or version in payload' }, { status: 400 })
  }

  const newEntry = { version, url: apkUrl, uploadedAt: new Date().toISOString() }
  const historyCfg = await prisma.systemConfig.findUnique({ where: { key: 'installer_apk_history' } })
  const history: typeof newEntry[] = historyCfg ? JSON.parse(historyCfg.value) : []
  history.unshift(newEntry)

  await Promise.all([
    prisma.systemConfig.upsert({
      where: { key: 'installer_apk_url' },
      update: { value: apkUrl },
      create: { key: 'installer_apk_url', value: apkUrl },
    }),
    prisma.systemConfig.upsert({
      where: { key: 'installer_apk_version' },
      update: { value: version },
      create: { key: 'installer_apk_version', value: version },
    }),
    prisma.systemConfig.upsert({
      where: { key: 'installer_apk_uploaded_at' },
      update: { value: newEntry.uploadedAt },
      create: { key: 'installer_apk_uploaded_at', value: newEntry.uploadedAt },
    }),
    prisma.systemConfig.upsert({
      where: { key: 'installer_apk_history' },
      update: { value: JSON.stringify(history.slice(0, 10)) },
      create: { key: 'installer_apk_history', value: JSON.stringify(history.slice(0, 10)) },
    }),
  ])

  return NextResponse.json({ ok: true, version, url: apkUrl })
}
